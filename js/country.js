import { SECTIONS_TEMPLATES } from "./utils/templates.js";
import { neighborListeners } from "./events.js";
import {
  selectedCountryContainer,
  countryInfoContainer,
  clearSelection,
} from "./main.js";
import { capitalize, getTimeFromTimezone } from "./utils/helpers.js";

class Country {
  constructor(name, cityName, code, flag) {
    this.name = name;
    this.cityName = cityName;
    this.code = code;
    this.flag = flag;
    this.facts = null;
    this.holidays = null;
    this.longWeekends = null;
    this.events = null;
    this.cachedSections = {};
    this.alreadyExplored = false;
    this.data = null;
  }

  saveCountryData(data) {
    this.data = data;
  }

  cacheData(sectionName, data) {
    this.cachedSections[sectionName] = data;
  }

  setFacts() {
    this.facts = {
      officialName: this.data.names.official,
      region: this.data.subregion,
      timeZone: this.data.timezones[0],
      population: this.data.population,
      area: this.data.area.kilometers,
      continent: this.data.region,
      callingCode: this.data.calling_codes[0],
      drivingSide: capitalize(this.data.cars.driving_side),
      weekStart: capitalize(this.data.date.start_of_week),
      currency: this.data.currencies,
      languages: this.data.languages,
      neighbors: this.data.borders,
    };
  }

  getCoordinates() {
    return {
      latitude: this.data.coordinates.lat,
      longitude: this.data.coordinates.lng,
    };
  }

  previewCountry() {
    const countryCard = `
      <div class="selected-flag">
        <img
          id="selected-country-flag"
          src="${this.flag}"
          alt="${this.name}"
        />
      </div>
      <div class="selected-info">
        <span
          class="selected-country-name"
          id="selected-country-name"
        >${this.name}</span>
        <span
          class="selected-city-name"
          id="selected-city-name"
        >• ${this.cityName}</span>
      </div>
      <button class="clear-selection-btn" id="clear-selection-btn">
        <i class="fa-solid fa-xmark"></i>
      </button>
    `;

    selectedCountryContainer.classList.remove("hidden");
    selectedCountryContainer.innerHTML = countryCard;

    const clearBtn = document.querySelector("#clear-selection-btn");

    clearBtn.addEventListener(
      "click",
      () => {
        clearSelection();
      },
      { once: true },
    );
  }

  exploreCountry() {
    if (this.timeInterval) clearInterval(this.timeInterval);

    this.setFacts();

    const countryData = [this.flag, this.name, this.facts, this.cityName];
    const countryDataTemplates = SECTIONS_TEMPLATES.COUNTRY_DATA_TEMPLATES(
      ...countryData,
    );

    countryInfoContainer.innerHTML = `
      ${countryDataTemplates.header}
      ${countryDataTemplates.localTime}
      ${countryDataTemplates.factsGrid}
      ${countryDataTemplates.extras}
      ${countryDataTemplates.actions}
    `;

    neighborListeners();

    this.updateLocalTime();

    this.alreadyExplored = true;
  }

  updateLocalTime() {
    const countryLocalTime = document.querySelector("#country-local-time");

    this.timeInterval = setInterval(() => {
      countryLocalTime.innerHTML = getTimeFromTimezone(this.facts.timeZone);
    }, 1000);
  }

  resetIntervals() {
    if (!this.timeInterval) return;

    clearInterval(this.timeInterval);
  }
}

export default Country;
