async function geocodeLocation(query) {
  const cleanQuery = query.trim();
  if (!cleanQuery) {
    throw new Error('Please enter a city, address, or point of interest.');
  }
  try {
    const nominatimUrl = `${CONFIG.NOMINATIM_URL}?format=json&q=${encodeURIComponent(cleanQuery)}&limit=1&addressdetails=1`;
    const response = await fetch(nominatimUrl, { headers: { 'Accept': 'application/json' } });
    if (response.ok) {
      const results = await response.json();
      if (Array.isArray(results) && results.length > 0) {
        const top = results[0];
        return {
          lat: parseFloat(top.lat),
          lon: parseFloat(top.lon),
          displayName: top.display_name || cleanQuery
        };
      }
    }
  } catch (_) {
    // Fall through to OpenWeatherMap Geocoding API if Nominatim is blocked or unreachable
  }
  const owmGeoUrl = `${CONFIG.OWM_GEO_URL}?q=${encodeURIComponent(cleanQuery)}&limit=1&appid=${CONFIG.OWM_API_KEY}`;
  const fallbackResponse = await fetch(owmGeoUrl);
  if (!fallbackResponse.ok) {
    throw new Error(`Geocoding service error (HTTP ${fallbackResponse.status}). Please try again.`);
  }
  const fallbackResults = await fallbackResponse.json();
  if (!Array.isArray(fallbackResults) || fallbackResults.length === 0) {
    throw new Error(`Could not find coordinates for "${cleanQuery}". Please check the spelling and try again.`);
  }
  const item = fallbackResults[0];
  const labelParts = [item.name, item.state, item.country].filter(Boolean);
  return {
    lat: parseFloat(item.lat),
    lon: parseFloat(item.lon),
    displayName: labelParts.join(', ')
  };
}

async function fetchWeatherByCoords(lat, lon) {
  const url = `${CONFIG.OWM_WEATHER_URL}?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&appid=${CONFIG.OWM_API_KEY}&units=metric`;
  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Weather data was not found for these coordinates (404).');
    }
    if (response.status === 401) {
      throw new Error('Invalid or inactive OpenWeatherMap API key (401).');
    }
    if (response.status === 429) {
      throw new Error('OpenWeatherMap API rate limit exceeded (429). Please wait a moment and try again.');
    }
    throw new Error(`Failed to retrieve weather data (HTTP ${response.status}).`);
  }
  const data = await response.json();
  const weatherEntry = Array.isArray(data.weather) && data.weather.length > 0
    ? data.weather[0]
    : { main: 'Unknown', description: 'No description available', icon: '01d' };
  return {
    city: data.name || 'Selected Location',
    country: data.sys && data.sys.country ? data.sys.country : '',
    lat: Number(lat),
    lon: Number(lon),
    tempC: data.main ? data.main.temp : 0,
    feelsLikeC: data.main ? data.main.feels_like : 0,
    humidity: data.main ? data.main.humidity : 0,
    pressure: data.main ? data.main.pressure : 0,
    windSpeed: data.wind ? data.wind.speed : 0,
    clouds: data.clouds && typeof data.clouds.all === 'number' ? data.clouds.all : 0,
    statusMain: weatherEntry.main,
    description: weatherEntry.description,
    iconCode: weatherEntry.icon,
    iconUrl: `${CONFIG.OWM_ICON_URL}${weatherEntry.icon}@2x.png`
  };
}
