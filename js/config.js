const CONFIG = {
  OWM_API_KEY: '4a37d4bf73fecc03180582f9f4ff9feb',
  OWM_WEATHER_URL: 'https://api.openweathermap.org/data/2.5/weather',
  OWM_GEO_URL: 'https://api.openweathermap.org/geo/1.0/direct',
  NOMINATIM_URL: 'https://nominatim.openstreetmap.org/search',
  OWM_ICON_URL: 'https://openweathermap.org/img/wn/',
  DEFAULT_LOCATION: { name: 'Khartoum, Sudan', lat: 15.5007, lon: 32.5599, zoom: 6 },
  ACTIVE_ZOOM: 11,
  STORAGE_KEY_FAVORITES: 'weathermap_favorites_v1',
  DEFAULT_FAVORITES: [
    { name: 'Khartoum', lat: 15.5007, lon: 32.5599 },
    { name: 'Omdurman', lat: 15.6445, lon: 32.4777 },
    { name: 'Port Sudan', lat: 19.6158, lon: 37.2164 }
  ]
};
