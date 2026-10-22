# WeatherMap — Asynchronous Client-Side Weather & Geolocation SPA

Course Project 2 implementation for **Advanced Web Technologies** at **Sudan University of Science & Technology (SUST)**.

## Live Demo

- Live application: `https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/`
- GitHub repository: `https://github.com/YOUR-USERNAME/YOUR-REPO-NAME`

> Replace the two links above with your own after enabling GitHub Pages.

## Overview

**WeatherMap** is a responsive Single Page Application (SPA) built with semantic HTML5, modern CSS3, and pure asynchronous Vanilla JavaScript (ES6+). It resolves user-entered locations into geographic coordinates, animates an interactive Leaflet/OpenStreetMap view, queries real-time meteorological conditions from the OpenWeatherMap API, and renders an interactive InfoWindow popup without any full-page redraws.

## APIs Used

| API | Purpose | Key required |
|---|---|---|
| [OpenWeatherMap Current Weather API](https://openweathermap.org/current) | Real-time weather for a latitude/longitude (`/data/2.5/weather`, `units=metric`) | Yes |
| [OpenStreetMap Nominatim](https://nominatim.org/release-docs/latest/api/Search/) | Primary geocoding (city / address to lat/lon) | No |
| [OpenWeatherMap Geocoding API](https://openweathermap.org/api/geocoding-api) | Automatic fallback geocoding if Nominatim fails | Yes (same key) |
| [Leaflet.js](https://leafletjs.com/) + OpenStreetMap tiles | Interactive map (Option B in the specification) | No |
| Esri World Imagery tiles | Satellite layer in the Map / Satellite switcher | No |
| Browser APIs: Geolocation, Web Share, Clipboard, localStorage | My Location, sharing, saved favorites | No |

## Features

- **5-Phase Asynchronous Workflow**:
  1. **DOM & Map Initialization**: Initializes an interactive world map centered on **Khartoum, Sudan (`15.5007, 32.5599`, zoom `6`)** with Street (`Map`) and `Satellite` layer switching.
  2. **Asynchronous Geocoding**: Resolves city names, addresses, or points of interest using the OpenStreetMap Nominatim API with automatic fallback to the OpenWeatherMap Direct Geocoding API.
  3. **OpenWeatherMap Current Weather Fetch**: Queries real-time metric weather data (`temp`, `feels_like`, `humidity`, `clouds`, `wind.speed`, weather description, and official condition icon).
  4. **Smooth Map Animation & Marker Management**: Flies smoothly to the resolved coordinates and clears previous markers from memory before placing a new marker on the exact coordinates.
  5. **Interactive InfoWindow Popup**: Displays meteorological metrics alongside **Facebook Share**, **Native Web Share / Clipboard Copy**, and **Save to Favorites** actions.
- **Novelty & Bonus Features**:
  - **Facebook & Clipboard Sharing**: Post formatted weather updates to Facebook or copy/share via the Web Share & Clipboard APIs.
  - **Saved Favorites (`localStorage`)**: Quick-access location chips persisted in browser storage.
  - **Click-to-Inspect & Browser Geolocation**: Click any point on the map or use the **My Location** button to inspect local weather immediately.
  - **Live Unit Conversion (`°C` / `°F`)**: Toggle temperature units dynamically without re-fetching or reloading.

## Error Handling

All network calls run inside `try/catch` blocks. A loading spinner is shown while requests are in progress, and failures (city not found, HTTP 401 / 404 / 429, network errors, denied geolocation) are shown as alert cards instead of console errors.

## Architectural Compliance

- **Strict Separation of Concerns**: HTML (`index.html`), CSS (`css/app.css`), and JavaScript (`js/*.js`) reside in dedicated files with zero inline styles (`style="..."`) and zero inline event handlers (`onclick="..."`). All listeners are registered with `addEventListener()`.
- **Pure Vanilla JavaScript**: Built exclusively with native DOM APIs, ES6+ `fetch()`, `Promise`, and `async`/`await`. The only library is Leaflet (the map).

## Project Structure

```text
weathermap/
├── index.html        # Semantic HTML5 layout
├── README.md         # Project documentation and setup instructions
├── .gitignore        # Git ignore rules
├── css/
│   └── app.css       # Responsive styling, 70vh map container, spinner & popup cards
└── js/
    ├── config.js     # API endpoints, OpenWeatherMap key, and default constants
    ├── api.js        # Asynchronous geocoding and OpenWeatherMap Fetch functions
    ├── ui.js         # DOM manipulation, InfoWindow builder, alerts, and spinner state
    └── app.js        # Map initialization, event listeners, LocalStorage favorites, and flow control
```

## Setup & Running Locally

1. Clone or extract the project folder:

   ```bash
   cd weathermap
   ```

2. Serve the directory with any static HTTP server (or open `index.html` directly in a modern browser):

   ```bash
   python3 -m http.server 8080
   ```

3. Open `http://localhost:8080` in your browser.

## API Key Instructions

1. Create a free account at [openweathermap.org](https://openweathermap.org/) and copy your key from **My API keys**.
2. Open `js/config.js` and set your key:

   ```js
   OWM_API_KEY: 'YOUR_API_KEY_HERE',
   ```

3. New keys can take a short while to activate. A `401` error in the app means the key is invalid or not active yet.

## Known Limitations

- The Facebook share dialog may ignore the pre-filled text and show only the map link, because Facebook controls what its share dialog displays.
- The API key is visible in client-side code because the project is purely front-end.
