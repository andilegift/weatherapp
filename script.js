// DOM Elements
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');
const cityName = document.getElementById('city-name');
const dateElement = document.getElementById('date');
const weatherIcon = document.getElementById('weather-icon');
const temperature = document.getElementById('temperature');
const weatherDescription = document.getElementById('weather-description');
const feelsLike = document.getElementById('feels-like');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('wind-speed');
const pressure = document.getElementById('pressure');
const visibility = document.getElementById('visibility');
const uvIndex = document.getElementById('uv-index');
const errorMessage = document.getElementById('error-message');
const errorText = document.getElementById('error-text');
const loading = document.getElementById('loading');
const weatherInfo = document.getElementById('weather-info');
const forecastContainer = document.getElementById('forecast-container');
const unitToggle = document.getElementById('unit-toggle');
const themeToggle = document.getElementById('theme-toggle');
const recentSearches = document.getElementById('recent-searches');
const recentItems = document.getElementById('recent-items');
const weatherAlerts = document.getElementById('weather-alerts');
const alertContent = document.getElementById('alert-content');
const airQuality = document.getElementById('air-quality');
const aqiValue = document.getElementById('aqi-value');
const aqiStatus = document.getElementById('aqi-status');
const tipsContent = document.getElementById('tips-content');
const weatherMap = document.getElementById('weather-map');
const mapBtns = document.querySelectorAll('.map-btn');

// API Key and settings
const apiKey = '58bd1a9ec552a4359de475ec6796771b';
let isMetric = true;
let isDarkTheme = false;
let recentCities = JSON.parse(localStorage.getItem('recentCities')) || [];

// Map variables
let weatherMapInstance = null;
let currentMapLayer = 'temp';
let markers = [];

// Initialize app
function init() {
    setCurrentDate();
    updateRecentSearches();
    loadTheme();
    
    // Update date every minute
    setInterval(setCurrentDate, 60000);
}

// Set current date
function setCurrentDate() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    dateElement.textContent = now.toLocaleDateString('en-US', options);
}

// Initialize weather map
function initWeatherMap(lat, lon, cityName) {
    // Remove existing map if it exists
    if (weatherMapInstance) {
        weatherMapInstance.remove();
    }
    
    // Initialize the map
    weatherMapInstance = L.map('weather-map').setView([lat, lon], 8);
    
    // Add different tile layers based on current selection
    updateMapLayer();
    
    // Add marker for the current city
    addCityMarker(lat, lon, cityName);
    
    // Add click event to map to get weather for clicked location
    weatherMapInstance.on('click', async function(e) {
        const { lat, lng } = e.latlng;
        try {
            await getWeatherByCoords(lat, lng);
        } catch (error) {
            console.error('Error getting weather for clicked location:', error);
        }
    });
}

// Update map layers
function updateMapLayer() {
    if (!weatherMapInstance) return;
    
    // Remove existing tile layers
    weatherMapInstance.eachLayer((layer) => {
        if (layer instanceof L.TileLayer) {
            weatherMapInstance.removeLayer(layer);
        }
    });
    
    // Define tile layers for different weather data
    const tileLayers = {
        temp: L.tileLayer(`https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${apiKey}`, {
            attribution: 'Temperature Map &copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>',
            opacity: 0.7
        }),
        precipitation: L.tileLayer(`https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${apiKey}`, {
            attribution: 'Precipitation Map &copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>',
            opacity: 0.7
        }),
        clouds: L.tileLayer(`https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${apiKey}`, {
            attribution: 'Clouds Map &copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>',
            opacity: 0.7
        }),
        wind: L.tileLayer(`https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${apiKey}`, {
            attribution: 'Wind Map &copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>',
            opacity: 0.7
        })
    };
    
    // Add the selected layer
    if (tileLayers[currentMapLayer]) {
        tileLayers[currentMapLayer].addTo(weatherMapInstance);
    }
    
    // Add base map layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(weatherMapInstance);
}

// Add city marker to map
function addCityMarker(lat, lon, cityName) {
    // Clear existing markers
    markers.forEach(marker => {
        if (weatherMapInstance) {
            weatherMapInstance.removeLayer(marker);
        }
    });
    markers = [];
    
    // Get weather data for popup
    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${isMetric ? 'metric' : 'imperial'}&appid=${apiKey}`)
        .then(response => response.json())
        .then(data => {
            const temp = Math.round(data.main.temp);
            const desc = data.weather[0].description;
            
            // Create custom icon based on weather condition
            const customIcon = L.divIcon({
                className: 'weather-marker',
                html: `<div style="background: rgba(33, 147, 176, 0.9); color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.2);">${temp}°</div>`,
                iconSize: [40, 40],
                iconAnchor: [20, 20]
            });
            
            // Add marker to map
            const marker = L.marker([lat, lon], { icon: customIcon }).addTo(weatherMapInstance);
            
            // Add popup with weather info
            marker.bindPopup(`
                <div class="weather-popup">
                    <i class="${getWeatherIconClass(data.weather[0].main)}"></i>
                    <div class="temp">${temp}°${isMetric ? 'C' : 'F'}</div>
                    <div class="desc">${desc}</div>
                    <div><strong>${cityName}</strong></div>
                </div>
            `);
            
            markers.push(marker);
        })
        .catch(error => {
            console.error('Error fetching weather for marker:', error);
        });
}

// Change map layer
function changeMapLayer(layer) {
    currentMapLayer = layer;
    updateMapLayer();
    
    // Update active button state
    mapBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.layer === layer);
    });
}

// Get user's location
function getCurrentLocation() {
    if (navigator.geolocation) {
        loading.style.display = 'block';
        errorMessage.style.display = 'none';
        weatherInfo.style.display = 'none';
        
        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
        };
        
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                const accuracy = position.coords.accuracy;
                
                console.log(`Location accuracy: ±${Math.round(accuracy)} meters`);
                
                // Try to get more specific location name using reverse geocoding
                try {
                    await getLocationName(lat, lon);
                } catch (error) {
                    // Fallback to direct weather API call
                    await getWeatherByCoords(lat, lon);
                }
            },
            (error) => {
                let errorMsg = 'Location access denied. Please enter a city name manually.';
                
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMsg = 'Location access denied. Please allow location access or enter a city name manually.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMsg = 'Location information unavailable. Please enter a city name manually.';
                        break;
                    case error.TIMEOUT:
                        errorMsg = 'Location request timed out. Please try again or enter a city name manually.';
                        break;
                }
                
                showError(errorMsg);
            },
            options
        );
    } else {
        showError('Geolocation is not supported by this browser.');
    }
}

// Get location name using reverse geocoding
async function getLocationName(lat, lon) {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=5&appid=${apiKey}`
        );
        
        if (response.ok) {
            const locations = await response.json();
            
            if (locations.length > 0) {
                // Show user the detected locations and let them choose
                showLocationOptions(locations, lat, lon);
                return;
            }
        }
        
        // Fallback to direct coordinate weather call
        await getWeatherByCoords(lat, lon);
    } catch (error) {
        await getWeatherByCoords(lat, lon);
    }
}

// Show location options to user
function showLocationOptions(locations, lat, lon) {
    loading.style.display = 'none';
    
    const locationSelector = document.createElement('div');
    locationSelector.className = 'location-selector';
    locationSelector.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border-radius: 15px;
        padding: 25px;
        box-shadow: 0 15px 30px rgba(0,0,0,0.3);
        z-index: 1000;
        max-width: 400px;
        width: 90%;
    `;
    
    locationSelector.innerHTML = `
        <h3 style="margin-bottom: 15px; color: #2193b0;">Choose Your Location</h3>
        <p style="margin-bottom: 20px; color: #666; font-size: 14px;">We found multiple locations near you. Please select the most accurate one:</p>
        <div class="location-options">
            ${locations.map((loc, index) => `
                <button class="location-option" data-index="${index}" style="
                    display: block;
                    width: 100%;
                    padding: 12px;
                    margin: 8px 0;
                    border: 2px solid #ddd;
                    border-radius: 8px;
                    background: white;
                    cursor: pointer;
                    text-align: left;
                    transition: all 0.3s;
                ">
                    <strong>${loc.name}</strong>${loc.state ? `, ${loc.state}` : ''}, ${loc.country}
                </button>
            `).join('')}
        </div>
        <div style="margin-top: 20px; display: flex; gap: 10px;">
            <button id="use-coordinates" style="
                flex: 1;
                padding: 10px;
                background: #6c757d;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
            ">Use Coordinates</button>
            <button id="manual-entry" style="
                flex: 1;
                padding: 10px;
                background: #2193b0;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
            ">Enter Manually</button>
        </div>
    `;
    
    // Add overlay
    const overlay = document.createElement('div');
    overlay.className = 'location-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 999;
    `;
    
    document.body.appendChild(overlay);
    document.body.appendChild(locationSelector);
    
    // Add event listeners
    locationSelector.addEventListener('click', async (e) => {
        if (e.target.classList.contains('location-option')) {
            const index = parseInt(e.target.dataset.index);
            const selectedLocation = locations[index];
            
            document.body.removeChild(overlay);
            document.body.removeChild(locationSelector);
            
            await getWeatherData(selectedLocation.name);
        }
    });
    
    document.getElementById('use-coordinates').addEventListener('click', async () => {
        document.body.removeChild(overlay);
        document.body.removeChild(locationSelector);
        await getWeatherByCoords(lat, lon);
    });
    
    document.getElementById('manual-entry').addEventListener('click', () => {
        document.body.removeChild(overlay);
        document.body.removeChild(locationSelector);
        cityInput.focus();
    });
    
    overlay.addEventListener('click', () => {
        document.body.removeChild(overlay);
        document.body.removeChild(locationSelector);
        cityInput.focus();
    });
    
    // Style the hover effects
    const style = document.createElement('style');
    style.textContent = `
        .location-option:hover {
            border-color: #2193b0 !important;
            background: #f8f9fa !important;
            transform: translateY(-2px);
        }
    `;
    document.head.appendChild(style);
}

// Get weather data by coordinates
async function getWeatherByCoords(lat, lon) {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${isMetric ? 'metric' : 'imperial'}&appid=${apiKey}`
        );
        
        if (!response.ok) {
            throw new Error('Unable to fetch weather data for your location.');
        }
        
        const data = await response.json();
        await displayWeatherData(data);
        await getForecastData(data.name);
    } catch (error) {
        showError(error.message);
    }
}

// Get weather data from API
async function getWeatherData(city) {
    loading.style.display = 'block';
    errorMessage.style.display = 'none';
    weatherInfo.style.display = 'none';
    
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=${isMetric ? 'metric' : 'imperial'}&appid=${apiKey}`
        );
        
        if (!response.ok) {
            throw new Error('City not found. Please check the spelling and try again.');
        }
        
        const data = await response.json();
        await displayWeatherData(data);
        await getForecastData(city);
        addToRecentSearches(city);
    } catch (error) {
        showError(error.message);
    }
}

// Get 5-day forecast
async function getForecastData(city) {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=${isMetric ? 'metric' : 'imperial'}&appid=${apiKey}`
        );
        
        if (response.ok) {
            const data = await response.json();
            displayForecast(data);
        }
    } catch (error) {
        console.log('Forecast data unavailable');
    }
}

// Display forecast data
function displayForecast(data) {
    forecastContainer.innerHTML = '';
    
    // Get one forecast per day (every 8th item = 24 hours)
    for (let i = 0; i < data.list.length; i += 8) {
        if (forecastContainer.children.length >= 5) break;
        
        const forecast = data.list[i];
        const date = new Date(forecast.dt * 1000);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        const forecastItem = document.createElement('div');
        forecastItem.className = 'forecast-item';
        forecastItem.innerHTML = `
            <div class="forecast-time">${dayName}</div>
            <i class="forecast-icon ${getWeatherIconClass(forecast.weather[0].main)}"></i>
            <div class="forecast-temp">${Math.round(forecast.main.temp)}°${isMetric ? 'C' : 'F'}</div>
        `;
        
        forecastContainer.appendChild(forecastItem);
    }
}

// Display weather data
async function displayWeatherData(data) {
    loading.style.display = 'none';
    weatherInfo.style.display = 'block';
    
    // Update DOM elements with weather data
    cityName.textContent = `${data.name}, ${data.sys.country}`;
    temperature.innerHTML = `${Math.round(data.main.temp)}°${isMetric ? 'C' : 'F'} <button class="unit-toggle" id="unit-toggle">${isMetric ? '°F' : '°C'}</button>`;
    feelsLike.textContent = `${Math.round(data.main.feels_like)}°${isMetric ? 'C' : 'F'}`;
    humidity.textContent = `${data.main.humidity}%`;
    windSpeed.textContent = `${data.wind.speed} ${isMetric ? 'm/s' : 'mph'}`;
    pressure.textContent = `${data.main.pressure} hPa`;
    visibility.textContent = data.visibility ? `${(data.visibility / 1000).toFixed(1)} km` : 'N/A';
    weatherDescription.textContent = data.weather[0].description;
    
    // Set weather icon based on condition
    setWeatherIcon(data.weather[0].main, data.weather[0].icon);
    
    // Initialize or update weather map
    initWeatherMap(data.coord.lat, data.coord.lon, data.name);
    
    // Show weather tips
    showWeatherTips(data);
    
    // Check for weather alerts
    checkWeatherAlerts(data);
    
    // Show air quality data
    showAirQuality();
    
    // Re-bind unit toggle event
    document.getElementById('unit-toggle').addEventListener('click', toggleUnits);
}

// Get weather icon class
function getWeatherIconClass(condition) {
    switch(condition.toLowerCase()) {
        case 'clear': return 'fas fa-sun';
        case 'clouds': return 'fas fa-cloud';
        case 'rain': return 'fas fa-cloud-rain';
        case 'snow': return 'fas fa-snowflake';
        case 'thunderstorm': return 'fas fa-bolt';
        case 'drizzle': return 'fas fa-cloud-drizzle';
        case 'mist':
        case 'smoke':
        case 'haze':
        case 'fog': return 'fas fa-smog';
        default: return 'fas fa-cloud';
    }
}

// Set weather icon based on condition and time
function setWeatherIcon(condition, iconCode) {
    const isNight = iconCode && iconCode.includes('n');
    let iconClass = getWeatherIconClass(condition);
    
    // Adjust icons for night time
    if (isNight && condition.toLowerCase() === 'clear') {
        iconClass = 'fas fa-moon';
    }
    
    weatherIcon.className = iconClass;
}

// Show weather tips
function showWeatherTips(data) {
    const temp = data.main.temp;
    const humidity = data.main.humidity;
    const condition = data.weather[0].main.toLowerCase();
    
    let tip = '';
    
    if (temp > 30) {
        tip = '☀️ It\'s quite hot today! Stay hydrated and wear sunscreen when going outside.';
    } else if (temp < 10) {
        tip = '🧥 It\'s cold today! Bundle up and wear layers to stay warm.';
    } else if (humidity > 80) {
        tip = '💧 High humidity today! You might feel warmer than the actual temperature.';
    } else if (condition.includes('rain')) {
        tip = '☔ Don\'t forget your umbrella! Rain is expected today.';
    } else if (condition.includes('snow')) {
        tip = '❄️ Snow expected! Drive carefully and dress warmly.';
    } else {
        tip = '🌤️ Perfect weather for outdoor activities! Enjoy your day!';
    }
    
    tipsContent.textContent = tip;
}

// Check for weather alerts
function checkWeatherAlerts(data) {
    const temp = data.main.temp;
    const windSpeed = data.wind.speed;
    
    if (temp > 35) {
        alertContent.textContent = 'Extreme heat warning! Avoid prolonged outdoor activities and stay hydrated.';
        weatherAlerts.classList.add('show');
    } else if (temp < -10) {
        alertContent.textContent = 'Extreme cold warning! Dress in layers and limit outdoor exposure.';
        weatherAlerts.classList.add('show');
    } else if (windSpeed > 15) {
        alertContent.textContent = 'High wind advisory! Secure loose objects and drive carefully.';
        weatherAlerts.classList.add('show');
    } else {
        weatherAlerts.classList.remove('show');
    }
}

// Show air quality (simulated data)
function showAirQuality() {
    const aqi = Math.floor(Math.random() * 200) + 1;
    let status, className;
    
    if (aqi <= 50) {
        status = 'Good';
        className = 'aqi-good';
    } else if (aqi <= 100) {
        status = 'Moderate';
        className = 'aqi-moderate';
    } else {
        status = 'Unhealthy';
        className = 'aqi-unhealthy';
    }
    
    aqiValue.textContent = aqi;
    aqiValue.className = `aqi-value ${className}`;
    aqiStatus.textContent = status;
    airQuality.style.display = 'block';
}

// Add to recent searches
function addToRecentSearches(city) {
    if (!recentCities.includes(city)) {
        recentCities.unshift(city);
        if (recentCities.length > 5) {
            recentCities.pop();
        }
        localStorage.setItem('recentCities', JSON.stringify(recentCities));
        updateRecentSearches();
    }
}

// Update recent searches display
function updateRecentSearches() {
    if (recentCities.length > 0) {
        recentItems.innerHTML = recentCities.map(city => 
            `<span class="recent-item" onclick="getWeatherData('${city}')">${city}</span>`
        ).join('');
        recentSearches.style.display = 'block';
    }
}

// Toggle temperature units
function toggleUnits() {
    isMetric = !isMetric;
    const city = cityName.textContent.split(',')[0];
    if (city && city !== '-') {
        getWeatherData(city);
    }
}

// Toggle dark theme
function toggleTheme() {
    isDarkTheme = !isDarkTheme;
    document.body.classList.toggle('dark-theme');
    
    const icon = themeToggle.querySelector('i');
    icon.className = isDarkTheme ? 'fas fa-sun' : 'fas fa-moon';
    
    // Refresh map to apply theme changes
    if (weatherMapInstance && cityName.textContent !== '-') {
        const city = cityName.textContent.split(',')[0];
        getWeatherData(city);
    }
    
    localStorage.setItem('darkTheme', isDarkTheme);
}

// Load theme preference
function loadTheme() {
    const saved = localStorage.getItem('darkTheme');
    if (saved === 'true') {
        isDarkTheme = true;
        document.body.classList.add('dark-theme');
        themeToggle.querySelector('i').className = 'fas fa-sun';
    }
}

// Show error message
function showError(message) {
    loading.style.display = 'none';
    weatherInfo.style.display = 'none';
    errorMessage.style.display = 'block';
    errorText.textContent = message;
}

// Event listeners
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        getWeatherData(city);
        cityInput.value = '';
    }
});

locationBtn.addEventListener('click', getCurrentLocation);

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) {
            getWeatherData(city);
            cityInput.value = '';
        }
    }
});

themeToggle.addEventListener('click', toggleTheme);

// Temperature click to toggle units
temperature.addEventListener('click', (e) => {
    if (e.target.tagName !== 'BUTTON') {
        toggleUnits();
    }
});

// Map layer controls
mapBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        changeMapLayer(btn.dataset.layer);
    });
});

// Auto-complete for city input
const popularCities = [
    'New York', 'Tembisa', 'Paris', 'Tokyo', 'Sydney', 'Dubai', 'Singapore',
    'Los Angeles', 'Chicago', 'Mumbai', 'Delhi', 'Shanghai', 'Beijing',
    'Moscow', 'Istanbul', 'Ermelo', 'Rome', 'Amsterdam', 'Berlin',
    'Cape Town', 'Johannesburg', 'Cairo', 'Lagos', 'Nairobi', 'Winchester Hills', 
    'Fernie', 'Barcelona', 'London', 'Auckland Park'
];

cityInput.addEventListener('input', (e) => {
    const value = e.target.value.toLowerCase();
    if (value.length > 2) {
        const suggestions = popularCities.filter(city => 
            city.toLowerCase().includes(value)
        ).slice(0, 5);
        
        // Simple auto-complete implementation
        if (suggestions.length > 0) {
            cityInput.setAttribute('list', 'cities');
            let datalist = document.getElementById('cities');
            if (!datalist) {
                datalist = document.createElement('datalist');
                datalist.id = 'cities';
                document.body.appendChild(datalist);
            }
            datalist.innerHTML = suggestions.map(city => 
                `<option value="${city}"></option>`
            ).join('');
        }
    }
});

// Voice search functionality (if supported)
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const voiceBtn = document.createElement('button');
    voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
    voiceBtn.className = 'voice-btn';
    voiceBtn.style.cssText = `
        background: #2193b0;
        color: white;
        border: none;
        padding: 15px 20px;
        border-radius: 10px;
        cursor: pointer;
        font-size: 16px;
        transition: all 0.3s;
        margin-left: 10px;
    `;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    voiceBtn.addEventListener('click', () => {
        recognition.start();
        voiceBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    });
    
    recognition.addEventListener('result', (e) => {
        let transcript = e.results[0][0].transcript;
        
        // Clean the transcript
        transcript = transcript
            .replace(/[.,!?;:]/g, '')
            .trim()
            .replace(/\s+/g, ' ');
        
        cityInput.value = transcript;
        getWeatherData(transcript);
        voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
    });
    
    recognition.addEventListener('error', () => {
        voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
    });
    
    document.querySelector('.search-container').appendChild(voiceBtn);
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case 'k': // Ctrl/Cmd + K to focus search
                e.preventDefault();
                cityInput.focus();
                break;
            case 'l': // Ctrl/Cmd + L for location
                e.preventDefault();
                getCurrentLocation();
                break;
            case 'd': // Ctrl/Cmd + D for dark mode
                e.preventDefault();
                toggleTheme();
                break;
        }
    }
});

// Weather background animation
function createWeatherAnimation(condition) {
    const existing = document.querySelector('.weather-animation');
    if (existing) existing.remove();
    
    const animation = document.createElement('div');
    animation.className = 'weather-animation';
    animation.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: -1;
        opacity: 0.1;
    `;
    
    if (condition.includes('rain')) {
        // Simple rain animation
        for (let i = 0; i < 50; i++) {
            const drop = document.createElement('div');
            drop.style.cssText = `
                position: absolute;
                width: 2px;
                height: 10px;
                background: #2193b0;
                left: ${Math.random() * 100}%;
                animation: rain ${Math.random() * 3 + 2}s linear infinite;
                animation-delay: ${Math.random() * 2}s;
            `;
            animation.appendChild(drop);
        }
    } else if (condition.includes('snow')) {
        // Simple snow animation
        for (let i = 0; i < 30; i++) {
            const flake = document.createElement('div');
            flake.style.cssText = `
                position: absolute;
                width: 4px;
                height: 4px;
                background: white;
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                animation: snow ${Math.random() * 5 + 3}s linear infinite;
                animation-delay: ${Math.random() * 2}s;
            `;
            animation.appendChild(flake);
        }
    }
    
    document.body.appendChild(animation);
}

// Add CSS animations for weather effects
const style = document.createElement('style');
style.textContent = `
    @keyframes rain {
        0% { top: -10px; }
        100% { top: 100vh; }
    }
    
    @keyframes snow {
        0% { top: -10px; transform: translateX(0px); }
        100% { top: 100vh; transform: translateX(100px); }
    }
    
    .voice-btn:hover {
        background: #1a7a94 !important;
        transform: translateY(-2px);
    }
    
    .weather-animation {
        overflow: hidden;
    }
`;
document.head.appendChild(style);

// Initialize the app
init();

// Service worker for offline functionality (basic)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('data:text/javascript,console.log("SW registered")')
        .catch(() => console.log('SW registration failed'));
}