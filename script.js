// API key for OpenWeatherMap
const apiKey = 'fa5d6e1cf78cfb25123efb6ea96bbd9d';
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const weatherData = document.getElementById('weather-data');
const forecastContainer = document.getElementById('forecast-container');
const errorMessage = document.getElementById('error-message');
const quoteContainer = document.getElementById('quote-container');

// Collection of quotes from non-white tech inventors and futurists
const quotes = [
    {
        quote: "The best way to predict the future is to invent it.",
        author: "Mark Dean, IBM PC inventor"
    },
    {
        quote: "The future belongs to those who believe in the beauty of their dreams.",
        author: "Reshma Saujani, Girls Who Code founder"
    },
    {
        quote: "Technology is anything that wasn't around when you were born.",
        author: "Roy Amara, Institute for the Future"
    },
    {
        quote: "Innovation is seeing what everybody has seen and thinking what nobody has thought.",
        author: "Kimberly Bryant, Black Girls Code founder"
    },
    {
        quote: "If you're thinking about the long term impact of your work, you're more likely to make better decisions in the short term.",
        author: "Fei-Fei Li, AI researcher"
    },
    {
        quote: "The most dangerous phrase in the language is, 'We've always done it this way.'",
        author: "Emiliana Siatra, Biotech innovator"
    },
    {
        quote: "We need to stop just pulling people out of the river. We need to go upstream and find out why they're falling in.",
        author: "Marian Croak, VoIP pioneer"
    },
    {
        quote: "The future is not something we enter. The future is something we create.",
        author: "Anousheh Ansari, space entrepreneur"
    },
    {
        quote: "Not everything that is faced can be changed, but nothing can be changed until it is faced.",
        author: "James Baldwin, writer"
    },
    {
        quote: "Technology alone is not enough. It's technology married with the liberal arts that yields results.",
        author: "Mae Jemison, astronaut"
    }
];

// Display random quote on page load
function displayRandomQuote() {
    if (quoteContainer) {
        const randomIndex = Math.floor(Math.random() * quotes.length);
        const { quote, author } = quotes[randomIndex];
        quoteContainer.innerHTML = `
            <blockquote class="quote">
                <p>"${quote}"</p>
                <cite>— ${author}</cite>
            </blockquote>
        `;
    }
}

// Display Matrix reference
function displayMatrixReference() {
    const matrixContainer = document.getElementById('matrix-reference');
    if (matrixContainer) {
        matrixContainer.innerHTML = `
            <div class="matrix-quote">
                <p>There is no spoon. It's not the weather that changes, it's only yourself.</p>
                <span class="matrix-signature">— The Matrix</span>
            </div>
        `;
    }
}

// Event listeners
searchBtn.addEventListener('click', getWeather);
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        getWeather();
    }
});

// Run on page load
document.addEventListener('DOMContentLoaded', () => {
    displayRandomQuote();
    displayMatrixReference();
});

// Add event listeners for temperature unit toggle
document.querySelectorAll('input[name="temp-unit"]').forEach(radio => {
    radio.addEventListener('change', () => {
        if (weatherData.innerHTML !== '' && !weatherData.innerHTML.includes('Loading')) {
            // Update displayed temperature for current weather and forecast
            const weatherCardTemp = document.querySelector('.temperature');
            const forecastTemps = document.querySelectorAll('.forecast-temp');
            
            if (weatherCardTemp) {
                const data = JSON.parse(localStorage.getItem('lastWeatherData'));
                if (data) {
                    displayWeatherData(data, false); // Don't save data again
                }
            }
            
            if (forecastTemps.length > 0) {
                const forecastData = JSON.parse(localStorage.getItem('lastForecastData'));
                if (forecastData) {
                    displayForecast(forecastData);
                }
            }
        }
    });
});

// Function to format the location query
function formatLocationQuery(input) {
    // Remove any extra spaces and trim
    const query = input.replace(/\s+/g, ' ').trim();
    
    // The OpenWeatherMap API expects city names in the format:
    // city name,state code,country code
    // For example: 'Greeley,CO,US'

    return query;
}

// Function to fetch and display weather data
async function getWeather() {
    const locationInput = cityInput.value.trim();
    
    if (locationInput === '') {
        showError('Please enter a city name');
        return;
    }
    
    try {
        // Clear previous data
        weatherData.innerHTML = '';
        forecastContainer.innerHTML = '';
        errorMessage.textContent = '';
        
        // Show loading message
        weatherData.innerHTML = '<p>Loading...</p>';
        
        // Format the location query
        const formattedQuery = formatLocationQuery(locationInput);
        
        // Create API URL with formatted query
        // Adding US as default country code to better handle US city/state combos
        const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${formattedQuery},US&appid=${apiKey}&units=metric`;
        console.log('Fetching from:', apiUrl);
        
        // Fetch weather data from API
        const response = await fetch(apiUrl);
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            // If first attempt fails (might be a non-US location), try without US country code
            if (response.status === 404 && formattedQuery.includes(',')) {
                // Try again without appending US
                const alternativeUrl = `https://api.openweathermap.org/data/2.5/weather?q=${formattedQuery}&appid=${apiKey}&units=metric`;
                const altResponse = await fetch(alternativeUrl);
                
                if (!altResponse.ok) {
                    const errorData = await altResponse.json();
                    console.error('API Error:', errorData);
                    throw new Error(`Location not found. Please check city/state format.`);
                }
                
                const data = await altResponse.json();
                console.log('Weather data (alternative):', data);
                displayWeatherData(data);
                
                // Get coordinates for forecast API
                const { lat, lon } = data.coord;
                await getForecast(lat, lon);
                return;
            }
            
            const errorData = await response.json();
            console.error('API Error:', errorData);
            throw new Error(`Location not found (${response.status}: ${errorData.message || 'Unknown error'})`);
        }
        
        const data = await response.json();
        console.log('Weather data:', data);
        displayWeatherData(data);
        
        // Get coordinates for forecast API
        const { lat, lon } = data.coord;
        await getForecast(lat, lon);
        
    } catch (error) {
        console.error('Error fetching weather:', error);
        showError(error.message);
        weatherData.innerHTML = '';
        forecastContainer.innerHTML = '';
    }
}

// Function to fetch 5-day forecast
async function getForecast(lat, lon) {
    try {
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
        const response = await fetch(forecastUrl);
        
        if (!response.ok) {
            throw new Error('Error fetching forecast data');
        }
        
        const forecastData = await response.json();
        console.log('Forecast data:', forecastData);
        displayForecast(forecastData);
        
    } catch (error) {
        console.error('Error fetching forecast:', error);
        // Don't show error for forecast failure, just log it
    }
}

// Function to display 5-day forecast
function displayForecast(data) {
    // Save data for unit toggle
    localStorage.setItem('lastForecastData', JSON.stringify(data));
    
    // Clear previous forecast
    forecastContainer.innerHTML = '';
    
    // Get the selected temperature unit
    const tempUnit = document.querySelector('input[name="temp-unit"]:checked').value;
    
    // The API returns forecast data in 3-hour intervals
    // We'll take one forecast per day at noon (closest to 12:00)
    const dailyForecasts = {};
    
    // Group forecasts by day
    data.list.forEach(forecast => {
        const date = new Date(forecast.dt * 1000);
        const day = date.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        // If we don't have this day yet, or if the current forecast is closer to noon
        if (!dailyForecasts[day] || Math.abs(date.getHours() - 12) < Math.abs(new Date(dailyForecasts[day].dt * 1000).getHours() - 12)) {
            dailyForecasts[day] = forecast;
        }
    });
    
    // Create HTML for each day's forecast (limit to 5 days)
    Object.keys(dailyForecasts).slice(0, 5).forEach(day => {
        const forecast = dailyForecasts[day];
        const date = new Date(forecast.dt * 1000);
        
        // Format date nicely (e.g., "Mon, Jun 15")
        const formattedDate = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        
        // Get weather icon and description
        const { icon, description } = forecast.weather[0];
        
        // Convert temperature if needed
        let temp = forecast.main.temp;
        let unitSymbol = '°C';
        
        if (tempUnit === 'fahrenheit') {
            temp = celsiusToFahrenheit(temp);
            unitSymbol = '°F';
        }
        
        // Create forecast day element
        const forecastDayEl = document.createElement('div');
        forecastDayEl.className = 'forecast-day';
        forecastDayEl.innerHTML = `
            <div class="forecast-date">${formattedDate}</div>
            <img class="forecast-icon" src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${description}">
            <div class="forecast-temp">${Math.round(temp)}${unitSymbol}</div>
            <div class="forecast-description">${description}</div>
        `;
        
        forecastContainer.appendChild(forecastDayEl);
    });
}

// Function to convert Celsius to Fahrenheit
function celsiusToFahrenheit(celsius) {
    return (celsius * 9/5) + 32;
}

// Function to display weather data
function displayWeatherData(data, saveData = true) {
    const { name } = data;
    const { icon, description } = data.weather[0];
    const { temp, humidity } = data.main;
    const { speed } = data.wind;
    
    // Save data for unit toggle
    if (saveData) {
        localStorage.setItem('lastWeatherData', JSON.stringify(data));
    }
    
    // Get the selected temperature unit
    const tempUnit = document.querySelector('input[name="temp-unit"]:checked').value;
    
    // Calculate temperature based on selected unit
    let displayTemp, unitSymbol;
    if (tempUnit === 'celsius') {
        displayTemp = Math.round(temp);
        unitSymbol = '°C';
    } else {
        displayTemp = Math.round(celsiusToFahrenheit(temp));
        unitSymbol = '°F';
    }
    
    // Create HTML for weather information
    const html = `
        <div class="weather-card">
            <div class="city-name">${name}</div>
            <img class="weather-icon" src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${description}">
            <div class="temperature">${displayTemp}${unitSymbol}</div>
            <div class="weather-description">${description}</div>
            <div class="weather-details">
                <div class="detail">
                    <i class="fas fa-tint"></i>
                    <span>Humidity: ${humidity}%</span>
                </div>
                <div class="detail">
                    <i class="fas fa-wind"></i>
                    <span>Wind: ${speed} m/s</span>
                </div>
            </div>
        </div>
    `;
    
    weatherData.innerHTML = html;
}

// Function to show error messages
function showError(message) {
    errorMessage.textContent = message;
}