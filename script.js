// DOM Elements
const countryInput = document.getElementById('country-input');
const searchBtn = document.getElementById('search-btn');
const suggestionsContainer = document.querySelector('.suggestions');
const resultsContainer = document.getElementById('results-container');
const loadingSpinner = document.getElementById('loading-spinner');
const errorMessage = document.getElementById('error-message');
const modal = document.getElementById('country-modal');
const closeBtn = document.querySelector('.close-btn');
const modalBody = document.getElementById('modal-body');
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

// API Key for OpenWeatherMap
const weatherApiKey = '4480fff3ac8ca5d4aac169413a2598c7';

// Event Listeners
searchBtn.addEventListener('click', searchCountry);
countryInput.addEventListener('input', handleInput);
closeBtn.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});
hamburger.addEventListener('click', toggleMobileMenu);

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        if (navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
        }
    });
});

// Functions
function toggleMobileMenu() {
    navLinks.classList.toggle('active');
}

function handleInput() {
    const inputValue = countryInput.value.trim();
    
    if (inputValue.length < 2) {
        suggestionsContainer.style.display = 'none';
        return;
    }
    
    fetch(`https://restcountries.com/v3.1/name/${inputValue}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 404) {
                suggestionsContainer.style.display = 'none';
                return;
            }
            
            suggestionsContainer.innerHTML = '';
            data.slice(0, 5).forEach(country => {
                const suggestion = document.createElement('div');
                suggestion.textContent = country.name.common;
                suggestion.addEventListener('click', () => {
                    countryInput.value = country.name.common;
                    suggestionsContainer.style.display = 'none';
                    searchCountry();
                });
                suggestionsContainer.appendChild(suggestion);
            });
            
            suggestionsContainer.style.display = 'block';
        })
        .catch(() => {
            suggestionsContainer.style.display = 'none';
        });
}

function searchCountry() {
    const countryName = countryInput.value.trim();
    
    if (!countryName) {
        showError('Please enter a country name');
        return;
    }
    
    clearResults();
    showLoading();
    
    fetch(`https://restcountries.com/v3.1/name/${countryName}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Country not found');
            }
            return response.json();
        })
        .then(data => {
            hideLoading();
            displayResults(data);
        })
        .catch(error => {
            hideLoading();
            showError(error.message);
        });
}

function clearResults() {
    resultsContainer.innerHTML = '';
    errorMessage.style.display = 'none';
    errorMessage.textContent = '';
}

function showLoading() {
    loadingSpinner.style.display = 'flex';
}

function hideLoading() {
    loadingSpinner.style.display = 'none';
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

function displayResults(countries) {
    resultsContainer.innerHTML = '';
    
    countries.forEach(country => {
        const countryCard = document.createElement('div');
        countryCard.className = 'country-card';
        
        const languages = country.languages ? Object.values(country.languages).join(', ') : 'N/A';
        const currencies = country.currencies ? Object.values(country.currencies).map(c => c.name).join(', ') : 'N/A';
        
        countryCard.innerHTML = `
            <img src="${country.flags.png}" alt="${country.name.common} Flag" class="country-flag">
            <div class="country-info">
                <h3>${country.name.common}</h3>
                <p><span>Official Name:</span> ${country.name.official}</p>
                <p><span>Capital:</span> ${country.capital ? country.capital[0] : 'N/A'}</p>
                <p><span>Region:</span> ${country.region}</p>
                <p><span>Population:</span> ${country.population.toLocaleString()}</p>
                <button class="btn more-details-btn" data-country="${country.name.common}">More Details</button>
            </div>
        `;
        
        resultsContainer.appendChild(countryCard);
    });
    
    // Add event listeners to all "More Details" buttons
    document.querySelectorAll('.more-details-btn').forEach(button => {
        button.addEventListener('click', () => {
            const countryName = button.getAttribute('data-country');
            showCountryDetails(countryName);
        });
    });
}

function showCountryDetails(countryName) {
    showLoading();
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    fetch(`https://restcountries.com/v3.1/name/${countryName}`)
        .then(response => response.json())
        .then(data => {
            const country = data[0];
            hideLoading();
            
            // Get weather data
            fetchWeatherData(country.capital ? country.capital[0] : country.name.common, country)
                .then(weatherHTML => {
                    displayCountryDetails(country, weatherHTML);
                })
                .catch(() => {
                    displayCountryDetails(country, '<p>Weather data not available</p>');
                });
        })
        .catch(error => {
            hideLoading();
            modalBody.innerHTML = `<p>Error loading country details: ${error.message}</p>`;
        });
}

function fetchWeatherData(city, country) {
    return new Promise((resolve, reject) => {
        fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city},${country.cca2}&units=metric&appid=${weatherApiKey}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Weather data not available');
                }
                return response.json();
            })
            .then(weatherData => {
                const weatherHTML = createWeatherHTML(weatherData);
                resolve(weatherHTML);
            })
            .catch(error => {
                reject(error);
            });
    });
}

function createWeatherHTML(weatherData) {
    const weatherIconUrl = `https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png`;
    const date = new Date(weatherData.dt * 1000).toLocaleDateString();
    
    return `
        <div class="weather-info">
            <div class="weather-header">
                <img src="${weatherIconUrl}" alt="${weatherData.weather[0].description}" class="weather-icon">
                <div>
                    <div class="weather-temp">${Math.round(weatherData.main.temp)}°C</div>
                    <div>${weatherData.weather[0].description}</div>
                </div>
            </div>
            <div class="weather-details">
                <div>
                    <h4>Feels Like</h4>
                    <p>${Math.round(weatherData.main.feels_like)}°C</p>
                </div>
                <div>
                    <h4>Humidity</h4>
                    <p>${weatherData.main.humidity}%</p>
                </div>
                <div>
                    <h4>Wind</h4>
                    <p>${weatherData.wind.speed} m/s</p>
                </div>
                <div>
                    <h4>Pressure</h4>
                    <p>${weatherData.main.pressure} hPa</p>
                </div>
            </div>
            <p style="margin-top: 10px; font-size: 14px; color: #7f8c8d;">Last updated: ${date}</p>
        </div>
    `;
}

function displayCountryDetails(country, weatherHTML) {
    const languages = country.languages ? Object.values(country.languages).join(', ') : 'N/A';
    const currencies = country.currencies ? Object.values(country.currencies).map(c => `${c.name} (${c.symbol || 'N/A'})`).join(', ') : 'N/A';
    const timezones = country.timezones ? country.timezones.join(', ') : 'N/A';
    
    modalBody.innerHTML = `
        <div class="modal-header">
            <img src="${country.flags.png}" alt="${country.name.common} Flag" class="modal-flag">
            <h2 class="modal-title">${country.name.common}</h2>
        </div>
        
        <div class="modal-details">
            <div class="detail-group">
                <h4>Basic Information</h4>
                <p><span>Official Name:</span> ${country.name.official}</p>
                <p><span>Capital:</span> ${country.capital ? country.capital[0] : 'N/A'}</p>
                <p><span>Region:</span> ${country.region} ${country.subregion ? `(${country.subregion})` : ''}</p>
                <p><span>Population:</span> ${country.population.toLocaleString()}</p>
            </div>
            
            <div class="detail-group">
                <h4>Geography</h4>
                <p><span>Area:</span> ${country.area.toLocaleString()} km²</p>
                <p><span>Timezone:</span> ${timezones}</p>
                <p><span>Lat/Lng:</span> ${country.latlng ? country.latlng.join(', ') : 'N/A'}</p>
                <p><span>Landlocked:</span> ${country.landlocked ? 'Yes' : 'No'}</p>
            </div>
            
            <div class="detail-group">
                <h4>Culture</h4>
                <p><span>Languages:</span> ${languages}</p>
                <p><span>Currencies:</span> ${currencies}</p>
                <p><span>Demonym:</span> ${country.demonyms ? country.demonyms.eng.f : 'N/A'}</p>
                <p><span>Independent:</span> ${country.independent ? 'Yes' : 'No'}</p>
            </div>
        </div>
        
        <h3>Weather in ${country.capital ? country.capital[0] : country.name.common}</h3>
        ${weatherHTML}
    `;
}

function closeModal() {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}