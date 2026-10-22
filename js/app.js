let mapInstance = null;
let currentMarker = null;
let currentWeatherData = null;
let currentUnit = 'C';
let savedFavorites = [];

function initMap() {
  const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  });
  const satelliteLayer = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri'
    }
  );
  mapInstance = L.map('map', {
    center: [CONFIG.DEFAULT_LOCATION.lat, CONFIG.DEFAULT_LOCATION.lon],
    zoom: CONFIG.DEFAULT_LOCATION.zoom,
    layers: [streetLayer]
  });
  L.control.layers(
    { 'Map': streetLayer, 'Satellite': satelliteLayer },
    null,
    { position: 'topleft' }
  ).addTo(mapInstance);
  mapInstance.on('click', (event) => {
    const { lat, lng } = event.latlng;
    loadWeatherForCoordinates(lat, lng, null);
  });
}

function loadFavorites() {
  try {
    const raw = localStorage.getItem(CONFIG.STORAGE_KEY_FAVORITES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        savedFavorites = parsed;
        return;
      }
    }
  } catch (_) {
    // Fallback to defaults if LocalStorage is unavailable or corrupted
  }
  savedFavorites = [...CONFIG.DEFAULT_FAVORITES];
  saveFavorites();
}

function saveFavorites() {
  try {
    localStorage.setItem(CONFIG.STORAGE_KEY_FAVORITES, JSON.stringify(savedFavorites));
  } catch (_) {
    // Ignore storage quota errors
  }
}

function isCityFavorite(cityName) {
  if (!cityName) return false;
  return savedFavorites.some((item) => item.name.toLowerCase() === cityName.toLowerCase());
}

function toggleFavorite(weather) {
  const cityName = weather.city;
  const exists = isCityFavorite(cityName);
  if (exists) {
    savedFavorites = savedFavorites.filter(
      (item) => item.name.toLowerCase() !== cityName.toLowerCase()
    );
    UI.showAlert('Favorites Updated', `Removed "${cityName}" from saved locations.`, 'success');
  } else {
    savedFavorites.push({ name: cityName, lat: weather.lat, lon: weather.lon });
    UI.showAlert('Favorites Updated', `Saved "${cityName}" to quick-access locations.`, 'success');
  }
  saveFavorites();
  refreshFavoritesBar();
  renderMarkerAndPopup(weather, false);
}

function removeFavoriteByName(cityName) {
  savedFavorites = savedFavorites.filter(
    (item) => item.name.toLowerCase() !== cityName.toLowerCase()
  );
  saveFavorites();
  refreshFavoritesBar();
  if (currentWeatherData && currentWeatherData.city.toLowerCase() === cityName.toLowerCase()) {
    renderMarkerAndPopup(currentWeatherData, false);
  }
}

function refreshFavoritesBar() {
  UI.renderFavorites(
    savedFavorites,
    (fav) => {
      UI.elements.input.value = fav.name;
      loadWeatherForCoordinates(fav.lat, fav.lon, fav.name);
    },
    (name) => {
      removeFavoriteByName(name);
    }
  );
}

function formatShareMessage(weather, unit) {
  const tempStr = UI.formatTemperature(weather.tempC, unit);
  const place = weather.country ? `${weather.city}, ${weather.country}` : weather.city;
  return `Current weather in ${place}: ${tempStr} (${weather.description}) | Humidity: ${weather.humidity}% | Wind: ${weather.windSpeed} m/s | Clouds: ${weather.clouds}%`;
}

function handleFacebookShare(weather, unit) {
  const quote = formatShareMessage(weather, unit);
  const mapUrl = `https://www.openstreetmap.org/?mlat=${encodeURIComponent(weather.lat)}&mlon=${encodeURIComponent(weather.lon)}#map=11/${encodeURIComponent(weather.lat)}/${encodeURIComponent(weather.lon)}`;
  const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(mapUrl)}&quote=${encodeURIComponent(quote)}`;
  window.open(fbShareUrl, '_blank', 'noopener,noreferrer,width=620,height=480');
}

async function handleNativeOrClipboardShare(weather, unit) {
  const shareText = formatShareMessage(weather, unit);
  if (navigator.share) {
    try {
      await navigator.share({
        title: `Weather in ${weather.city}`,
        text: shareText,
        url: window.location.href
      });
      return;
    } catch (err) {
      if (err && err.name === 'AbortError') {
        return;
      }
    }
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(shareText);
      UI.showAlert('Copied to Clipboard', shareText, 'success');
      return;
    } catch (_) {
      // Fall through to alert display
    }
  }
  UI.showAlert('Weather Report', shareText, 'success');
}

function renderMarkerAndPopup(weather, animateMap = true) {
  currentWeatherData = weather;
  if (currentMarker) {
    mapInstance.removeLayer(currentMarker);
    currentMarker = null;
  }
  if (animateMap) {
    mapInstance.flyTo([weather.lat, weather.lon], CONFIG.ACTIVE_ZOOM, {
      animate: true,
      duration: 1.35
    });
  }
  currentMarker = L.marker([weather.lat, weather.lon]).addTo(mapInstance);
  const popupNode = UI.buildPopupElement(weather, {
    unit: currentUnit,
    isFavorite: isCityFavorite(weather.city),
    onToggleFavorite: toggleFavorite,
    onFacebookShare: handleFacebookShare,
    onNativeShare: handleNativeOrClipboardShare
  });
  currentMarker.bindPopup(popupNode, { maxWidth: 320, minWidth: 270 }).openPopup();
}

async function handleLocationSearch(query) {
  UI.hideAlert();
  UI.setLoading(true, `Geocoding "${query}"...`);
  try {
    const geo = await geocodeLocation(query);
    UI.setLoading(true, 'Fetching real-time meteorological data from OpenWeatherMap...');
    const weather = await fetchWeatherByCoords(geo.lat, geo.lon);
    if (!weather.city || weather.city === 'Selected Location') {
      weather.city = query.trim();
    }
    renderMarkerAndPopup(weather, true);
  } catch (error) {
    UI.showAlert('Weather Lookup Failed', error.message || 'An unexpected network error occurred.', 'error');
  } finally {
    UI.setLoading(false);
  }
}

async function loadWeatherForCoordinates(lat, lon, overrideCityName = null, animateMap = true) {
  UI.hideAlert();
  UI.setLoading(true, 'Fetching weather data for selected coordinates...');
  try {
    const weather = await fetchWeatherByCoords(lat, lon);
    if (overrideCityName && (!weather.city || weather.city === 'Selected Location')) {
      weather.city = overrideCityName;
    }
    renderMarkerAndPopup(weather, animateMap);
  } catch (error) {
    UI.showAlert('Weather Lookup Failed', error.message || 'Could not retrieve weather for this location.', 'error');
  } finally {
    UI.setLoading(false);
  }
}

function handleGeolocationRequest() {
  if (!navigator.geolocation) {
    UI.showAlert('Geolocation Unavailable', 'Your browser does not support Geolocation.', 'error');
    return;
  }
  UI.hideAlert();
  UI.setLoading(true, 'Detecting your current geographic coordinates...');
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      loadWeatherForCoordinates(latitude, longitude, null);
    },
    (err) => {
      UI.setLoading(false);
      UI.showAlert(
        'Location Access Denied',
        err.message || 'Unable to retrieve your current location. Please search by city name instead.',
        'error'
      );
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

function handleUnitToggle() {
  currentUnit = currentUnit === 'C' ? 'F' : 'C';
  UI.elements.unitToggleBtn.textContent = `°${currentUnit}`;
  if (currentWeatherData) {
    renderMarkerAndPopup(currentWeatherData, false);
  }
}

function registerEventListeners() {
  UI.elements.form.addEventListener('submit', (event) => {
    event.preventDefault();
    const query = UI.elements.input.value.trim();
    if (!query) {
      UI.showAlert('Validation Error', 'Please enter a valid city or location name before searching.', 'error');
      UI.elements.input.focus();
      return;
    }
    handleLocationSearch(query);
  });
  UI.elements.locateBtn.addEventListener('click', () => {
    handleGeolocationRequest();
  });
  UI.elements.unitToggleBtn.addEventListener('click', () => {
    handleUnitToggle();
  });
  UI.elements.alertCloseBtn.addEventListener('click', () => {
    UI.hideAlert();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initMap();
  loadFavorites();
  refreshFavoritesBar();
  registerEventListeners();
  loadWeatherForCoordinates(
    CONFIG.DEFAULT_LOCATION.lat,
    CONFIG.DEFAULT_LOCATION.lon,
    'Khartoum',
    false
  );
});
