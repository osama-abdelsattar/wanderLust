import eventListeners, { selectedCountry } from "./events.js";
export const countrySelect = document.querySelector("#global-country"),
  citySelect = document.querySelector("#global-city"),
  yearSelect = document.querySelector("#global-year"),
  selectedCountryContainer = document.querySelector("#selected-destination"),
  countryInfoContainer = document.querySelector("#dashboard-country-info");

async function getAllCountryOptions() {
  const response = await fetch(
      "https://date.nager.at/api/v3/AvailableCountries",
    ),
    allCountries = await response.json();
  allCountries.forEach(({ countryCode, name }) => {
    const countryOption = document.createElement("option");
    countryOption.setAttribute("value", countryCode);
    countryOption.setAttribute("data-name", name);
    countryOption.innerHTML = name;
    countrySelect.appendChild(countryOption);
  });
}
function updateTime() {
  const currentDatetimeContainer = document.querySelector("#current-datetime"),
    currentDatetime = new Date();
  currentDatetimeContainer.innerHTML = currentDatetime.toLocaleDateString(
    "en-US",
    {
      weekday: "short",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    },
  );
}
export function showLoading() {
  const loadingOverlay = document.querySelector("#loading-overlay");
  loadingOverlay.classList.remove("hidden");
}
export function hideLoading() {
  const loadingOverlay = document.querySelector("#loading-overlay");
  loadingOverlay.classList.add("hidden");
}
export function capitalize(item) {
  const slicedText = item.split("-"),
    result = slicedText.map((word) => {
      return word.slice(0, 1).toUpperCase().concat(word.slice(1));
    });
  return result.join(" ");
}
export function toastPopup(color, icon, text) {
  const toastContainer = document.querySelector("#toast-container"),
    toast = `
        <div class="toast ${color}">
          <i class="fas fa-${icon}"></i>
          <span>${text}</span>
          <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-xmark"></i>
          </button>
        </div>
      `;
  toastContainer.innerHTML = toast;
  setTimeout(() => {
    toastContainer.innerHTML = "";
  }, 5000);
}
export function editDefaultValues() {
  const firstCityOption = document.querySelector("#global-city > :first-child"),
    lastCityOptions = document.querySelectorAll(
      "#global-city > :not(:first-child)",
    );
  firstCityOption.toggleAttribute("selected");
  if (!document.querySelector("#disabled-option")) {
    const disabledOption = document.createElement("option");
    disabledOption.id = "disabled-option";
    disabledOption.classList = "text-center";
    disabledOption.toggleAttribute("disabled");
    disabledOption.textContent = "Select a country first";
    citySelect.appendChild(disabledOption);
  }
  lastCityOptions.forEach((option) => {
    citySelect.removeChild(option);
  });
}
async function getCity(selectedCountryCode) {
  const response = await fetch(
      `https://restcountries.com/v3.1/alpha/${selectedCountryCode}`,
    ),
    data = await response.json();
  return data[0];
}
export async function setCity(selectedCountryCode) {
  try {
    const allCities = await getCity(selectedCountryCode);
    editDefaultValues();
    allCities.capital.forEach((city) => {
      setCityOption(city);
    });
    function setCityOption(city) {
      const cityOption = document.createElement("option");
      cityOption.setAttribute("value", city);
      cityOption.toggleAttribute("selected");
      cityOption.innerHTML = city;
      citySelect.appendChild(cityOption);
    }
    return allCities;
  } catch {
    hideLoading();
    alert("failed to get city data");
  }
}
export function debounce(func, delay = 300) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

(() => {
  eventListeners();
  updateTime();
  setInterval(updateTime, 30000);
  getAllCountryOptions();
  const plansBadge = document.querySelector("#plans-count"),
    planList = JSON.parse(localStorage.getItem("plans"));
  if (planList.length !== 0) plansBadge.classList.remove("hidden");
  plansBadge.innerHTML = planList.length;
})();
