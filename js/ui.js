const UI = {
  elements: {
    form: document.getElementById('weather-form'),
    input: document.getElementById('location-input'),
    searchBtn: document.getElementById('search-btn'),
    locateBtn: document.getElementById('locate-btn'),
    unitToggleBtn: document.getElementById('unit-toggle-btn'),
    loadingBanner: document.getElementById('loading-indicator'),
    loadingText: document.getElementById('loading-text'),
    alertBox: document.getElementById('alert-box'),
    alertTitle: document.getElementById('alert-title'),
    alertMessage: document.getElementById('alert-message'),
    alertCloseBtn: document.getElementById('alert-close-btn'),
    favoritesList: document.getElementById('favorites-list')
  },

  setLoading(isLoading, message) {
    if (message) {
      this.elements.loadingText.textContent = message;
    }
    if (isLoading) {
      this.elements.loadingBanner.classList.remove('hidden');
      this.elements.searchBtn.disabled = true;
      this.elements.locateBtn.disabled = true;
    } else {
      this.elements.loadingBanner.classList.add('hidden');
      this.elements.searchBtn.disabled = false;
      this.elements.locateBtn.disabled = false;
    }
  },

  showAlert(title, message, type = 'error') {
    this.elements.alertTitle.textContent = title;
    this.elements.alertMessage.textContent = message;
    if (type === 'success') {
      this.elements.alertBox.classList.add('alert-success');
    } else {
      this.elements.alertBox.classList.remove('alert-success');
    }
    this.elements.alertBox.classList.remove('hidden');
  },

  hideAlert() {
    this.elements.alertBox.classList.add('hidden');
  },

  formatTemperature(tempC, unit) {
    if (unit === 'F') {
      const tempF = (tempC * 9) / 5 + 32;
      return `${Math.round(tempF)}°F`;
    }
    return `${Math.round(tempC)}°C`;
  },

  buildPopupElement(weather, options) {
    const { unit, isFavorite, onToggleFavorite, onFacebookShare, onNativeShare } = options;
    const container = document.createElement('div');
    container.className = 'weather-popup';

    const header = document.createElement('div');
    header.className = 'weather-popup-header';

    const titleWrap = document.createElement('div');
    const cityHeading = document.createElement('div');
    cityHeading.className = 'weather-city-name';
    cityHeading.textContent = weather.country ? `${weather.city}, ${weather.country}` : weather.city;
    const coordsSpan = document.createElement('span');
    coordsSpan.className = 'weather-coords';
    coordsSpan.textContent = `Lat: ${Number(weather.lat).toFixed(4)}, Lon: ${Number(weather.lon).toFixed(4)}`;
    titleWrap.appendChild(cityHeading);
    titleWrap.appendChild(coordsSpan);

    const favBtn = document.createElement('button');
    favBtn.type = 'button';
    favBtn.className = `popup-btn popup-btn-fav ${isFavorite ? 'is-favorite' : ''}`;
    favBtn.textContent = isFavorite ? '★ Saved' : '☆ Save';
    favBtn.title = 'Save or remove from favorite locations';
    favBtn.addEventListener('click', () => {
      onToggleFavorite(weather);
    });

    header.appendChild(titleWrap);
    header.appendChild(favBtn);

    const mainRow = document.createElement('div');
    mainRow.className = 'weather-main-row';
    const iconImg = document.createElement('img');
    iconImg.className = 'weather-icon';
    iconImg.src = weather.iconUrl;
    iconImg.alt = weather.description;
    const tempBlock = document.createElement('div');
    tempBlock.className = 'weather-temp-block';
    const tempValue = document.createElement('span');
    tempValue.className = 'weather-temp';
    tempValue.textContent = this.formatTemperature(weather.tempC, unit);
    const descValue = document.createElement('span');
    descValue.className = 'weather-desc';
    descValue.textContent = weather.description;
    tempBlock.appendChild(tempValue);
    tempBlock.appendChild(descValue);
    mainRow.appendChild(iconImg);
    mainRow.appendChild(tempBlock);

    const metricsGrid = document.createElement('div');
    metricsGrid.className = 'weather-metrics';
    const metricsData = [
      { label: 'Clouds', value: `${weather.clouds}%` },
      { label: 'Humidity', value: `${weather.humidity}%` },
      { label: 'Wind Speed', value: `${weather.windSpeed} m/s` },
      { label: 'Feels Like', value: this.formatTemperature(weather.feelsLikeC, unit) }
    ];
    metricsData.forEach((metric) => {
      const cell = document.createElement('div');
      cell.className = 'metric-item';
      const labelEl = document.createElement('span');
      labelEl.className = 'metric-label';
      labelEl.textContent = metric.label;
      const valueEl = document.createElement('span');
      valueEl.className = 'metric-value';
      valueEl.textContent = metric.value;
      cell.appendChild(labelEl);
      cell.appendChild(valueEl);
      metricsGrid.appendChild(cell);
    });

    const actionsRow = document.createElement('div');
    actionsRow.className = 'weather-popup-actions';
    const fbBtn = document.createElement('button');
    fbBtn.type = 'button';
    fbBtn.className = 'popup-btn popup-btn-facebook';
    fbBtn.textContent = 'Facebook';
    fbBtn.addEventListener('click', () => {
      onFacebookShare(weather, unit);
    });
    const shareBtn = document.createElement('button');
    shareBtn.type = 'button';
    shareBtn.className = 'popup-btn popup-btn-share';
    shareBtn.textContent = 'Share / Copy';
    shareBtn.addEventListener('click', () => {
      onNativeShare(weather, unit);
    });
    actionsRow.appendChild(fbBtn);
    actionsRow.appendChild(shareBtn);

    container.appendChild(header);
    container.appendChild(mainRow);
    container.appendChild(metricsGrid);
    container.appendChild(actionsRow);
    return container;
  },

  renderFavorites(favorites, onSelectFavorite, onRemoveFavorite) {
    const listEl = this.elements.favoritesList;
    listEl.innerHTML = '';
    if (!Array.isArray(favorites) || favorites.length === 0) {
      const emptySpan = document.createElement('span');
      emptySpan.className = 'fav-empty';
      emptySpan.textContent = 'No saved cities yet.';
      listEl.appendChild(emptySpan);
      return;
    }
    favorites.forEach((fav) => {
      const chip = document.createElement('div');
      chip.className = 'fav-chip';
      const selectBtn = document.createElement('button');
      selectBtn.type = 'button';
      selectBtn.className = 'fav-select-btn';
      selectBtn.textContent = fav.name;
      selectBtn.addEventListener('click', () => {
        onSelectFavorite(fav);
      });
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'fav-remove-btn';
      removeBtn.setAttribute('aria-label', `Remove ${fav.name}`);
      removeBtn.textContent = '×';
      removeBtn.addEventListener('click', () => {
        onRemoveFavorite(fav.name);
      });
      chip.appendChild(selectBtn);
      chip.appendChild(removeBtn);
      listEl.appendChild(chip);
    });
  }
};
