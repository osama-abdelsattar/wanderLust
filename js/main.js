import eventListeners, { state } from "./events.js";
import { fetchAllCountries } from "./services/api.js";
import { STATES } from "./utils/templates.js";
const countrySelect = document.querySelector("#global-country");
const citySelect = document.querySelector("#global-city");
const yearSelect = document.querySelector("#global-year");
const selectedCountryContainer = document.querySelector(
  "#selected-destination",
);
const countryInfoContainer = document.querySelector("#dashboard-country-info");

async function getAllCountryOptions() {
  const allCountries = await fetchAllCountries();

  allCountries.forEach(({ countryCode, name }) => {
    const countryOption = document.createElement("option");
    countryOption.setAttribute("value", countryCode);
    countryOption.setAttribute("data-name", name);
    countryOption.innerHTML = name;
    countrySelect.appendChild(countryOption);
  });
}

function updateTime() {
  const currentDatetimeContainer = document.querySelector("#current-datetime");
  const currentDatetime = new Date();

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

function showLoading(sectionName) {
  const cardsContainer = document.querySelector(`#${sectionName}-content`);

  cardsContainer.innerHTML = STATES.LOADING_TEMPLATE;
}

function showError(sectionName) {
  const sectionContainer = document.querySelector(`#${sectionName}-content`);

  sectionContainer.innerHTML = STATES.ERROR_TEMPLATE;
}

function toastPopup(type, icon, text) {
  const toastContainer = document.querySelector("#toast-container");
  const toast = `
    <div class="toast ${type}">
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

function editDefaultValues() {
  const firstCityOption = document.querySelector("#global-city > :first-child");
  const lastCityOptions = document.querySelectorAll(
    "#global-city > :not(:first-child)",
  );

  if (!countrySelect.value) citySelect.toggleAttribute("disabled", true);

  firstCityOption.toggleAttribute("selected");

  lastCityOptions.forEach((option) => {
    citySelect.removeChild(option);
  });
}

function clearSelection() {
  resetPages();

  countrySelect.value = "";
  citySelect.value = "";

  editDefaultValues();

  toastPopup("info", "circle-info", "Selection cleared!");

  state.selectedCountry.resetIntervals();
  state.selectedCountry = null;
}

function resetSectionsHeader() {
  const pagesHeaderSelection = document.querySelectorAll(
    ".view-header-selection",
  );

  pagesHeaderSelection.forEach((container) => {
    container.innerHTML = "";
  });
}

function resetPages() {
  selectedCountryContainer.classList.add("hidden");
  selectedCountryContainer.innerHTML = "";

  countryInfoContainer.innerHTML = `
        <div class="country-info-placeholder">
          <div class="placeholder-icon">
            <i class="fas fa-globe"></i>
          </div>
          <p>Select a country to view detailed information</p>
        </div>
      `;

  resetSectionsHeader();

  const pageEmptyStateContainers = document.querySelectorAll(
    "section.view > [id $='-content']",
  );

  pageEmptyStateContainers.forEach((container) => {
    container.innerHTML = "";
  });
}

function setCity(cities) {
  editDefaultValues();

  cities.forEach((city) => {
    setCityOption(city.name);
  });

  function setCityOption(city) {
    const cityOption = document.createElement("option");
    cityOption.setAttribute("value", city);
    cityOption.toggleAttribute("selected");
    cityOption.innerHTML = city;

    citySelect.appendChild(cityOption);
  }
}

(() => {
  eventListeners();

  updateTime();

  setInterval(updateTime, 30000);

  getAllCountryOptions();

  const plansBadge = document.querySelector("#plans-count");
  const planList = JSON.parse(localStorage.getItem("plans"));

  if (planList && planList.length > 0) plansBadge.classList.remove("hidden");

  plansBadge.innerHTML = planList?.length;
})();

export {
  countrySelect,
  citySelect,
  yearSelect,
  selectedCountryContainer,
  countryInfoContainer,
};

export {
  showLoading,
  showError,
  toastPopup,
  editDefaultValues,
  clearSelection,
  resetSectionsHeader,
  resetPages,
  setCity,
};
