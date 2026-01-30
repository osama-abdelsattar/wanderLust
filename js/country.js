import { neighborListeners } from "./events.js";
import {
  selectedCountryContainer,
  countryInfoContainer,
  countrySelect,
  citySelect,
  showLoading,
  hideLoading,
  yearSelect,
  capitalize,
  toastPopup,
  editDefaultValues,
} from "./main.js";
import Plan from "./plan.js";

export default class Country {
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
  }
  async setFacts() {
    try {
      if (this.facts && this.facts.officialName) return this.facts;
      const response = await fetch(
          `https://restcountries.com/v3.1/alpha/${this.code}`,
        ),
        data = await response.json(),
        factsData = await data[0];
      this.facts = {
        officialName: factsData.name.official,
        region: factsData.subregion,
        timeZone: factsData.timezones[0],
        population: factsData.population,
        area: factsData.area,
        continent: factsData.region,
        callingCode: factsData.idd,
        drivingSide: capitalize(factsData.car.side),
        weekStart: capitalize(factsData.startOfWeek),
        currency: factsData.currencies,
        languages: factsData.languages,
        neighbors: factsData.borders,
        latitude: factsData.capitalInfo.latlng[0],
        longitude: factsData.capitalInfo.latlng[1],
      };
    } catch {
      hideLoading();
      alert("failed to get city facts data");
    }
  }
  async getCoordinates() {
    try {
      if (this.facts && this.facts.latitude)
        return {
          latitude: this.facts.latitude,
          longitude: this.facts.longitude,
        };
      const response = await fetch(
          "https://restcountries.com/v3.1/alpha/" + this.code,
        ),
        data = await response.json(),
        factsData = await data[0];
      return {
        latitude: factsData.capitalInfo.latlng[0],
        longitude: factsData.capitalInfo.latlng[1],
      };
    } catch {
      hideLoading();
      alert("failed to get city data");
    }
  }
  async previewCountry() {
    if (!this.facts || !this.facts.timeZone) {
      this.facts = await this.getCoordinates(this.code);
    }
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
        this.clearSelection();
      },
      { once: true },
    );
  }
  async exploreCountry() {
    if (this.timeInterval) clearInterval(this.timeInterval);
    await this.setFacts();
    const header = `
      <div class="dashboard-country-header">
        <img
          src="${this.flag}"
          alt="${this.name}"
          class="dashboard-country-flag"
        />
        <div class="dashboard-country-title">
          <h3>${this.name}</h3>
          <p class="official-name">${this.facts.officialName}</p>
          <span class="region"
            ><i class="fa-solid fa-location-dot"></i> ${this.facts.continent} •
            ${this.facts.region}</span
          >
        </div>
      </div>
    `,
      localTime = `
        <div class="dashboard-local-time">
          <div class="local-time-display">
            <i class="fa-solid fa-clock"></i>
            <span class="local-time-value" id="country-local-time">
              ${this.getTimeFromTimezone(this.facts.timeZone)}
            </span>
            <span class="local-time-zone">${this.facts.timeZone}</span>
          </div>
        </div>
      `,
      factsGrid = `
        <div class="dashboard-country-grid">
          <div class="dashboard-country-detail">
            <i class="fa-solid fa-building-columns"></i>
            <span class="label">Capital</span>
            <span class="value">${this.cityName}</span>
          </div>
          <div class="dashboard-country-detail">
            <i class="fa-solid fa-users"></i>
            <span class="label">Population</span>
            <span class="value">${this.facts.population.toLocaleString("en-GB")}</span>
          </div>
          <div class="dashboard-country-detail">
            <i class="fa-solid fa-ruler-combined"></i>
            <span class="label">Area</span>
            <span class="value">${this.facts.area.toLocaleString("en-GB")} km²</span>
          </div>
          <div class="dashboard-country-detail">
            <i class="fa-solid fa-globe"></i>
            <span class="label">Continent</span>
            <span class="value">${this.facts.continent}</span>
          </div>
          <div class="dashboard-country-detail">
            <i class="fa-solid fa-phone"></i>
            <span class="label">Calling Code</span>
            <span class="value">${this.facts.callingCode.root + this.facts.callingCode.suffixes[0]}</span>
          </div>
          <div class="dashboard-country-detail">
            <i class="fa-solid fa-car"></i>
            <span class="label">Driving Side</span>
            <span class="value">${this.facts.drivingSide}</span>
          </div>
          <div class="dashboard-country-detail">
            <i class="fa-solid fa-calendar-week"></i>
            <span class="label">Week Starts</span>
            <span class="value">${this.facts.weekStart}</span>
          </div>
        </div>
      `,
      actions = `
        <div class="dashboard-country-actions">
          <a
            href="https://www.google.com/maps/place/${this.name}"
            target="_blank"
            class="btn-map-link"
          >
            <i class="fa-solid fa-map"></i> View on Google Maps
          </a>
        </div>
      `,
      extras = `
        <div class="dashboard-country-extras">
          <div class="dashboard-country-extra">
            <h4><i class="fa-solid fa-coins"></i> Currency</h4>
            <div class="extra-tags">
                ${Object.keys(this.facts.currency)
                  .map((currency, i) => {
                    return `<span class="extra-tag">
                    ${Object.values(this.facts.currency).at(i).name} (${currency} ${Object.values(this.facts.currency).at(i).symbol})
                  </span>`;
                  })
                  .join("")}
            </div>
          </div>
          <div class="dashboard-country-extra">
            <h4><i class="fa-solid fa-language"></i> Languages</h4>
            <div class="extra-tags">
              ${Object.values(this.facts.languages)
                .map((language) => {
                  return `<span class="extra-tag">${language}</span>`;
                })
                .join("")}
            </div>
          </div>
          ${
            this.facts.neighbors
              ? `
                <div class="dashboard-country-extra">
                  <h4>
                    <i class="fa-solid fa-map-location-dot"></i> Neighbors
                  </h4>
                  <div class="extra-tags">
                    ${this.facts.neighbors
                      .map((neighbor) => {
                        return `
                          <span
                            class="extra-tag border-tag"
                            data-country-code="${neighbor}"
                          >${neighbor}</span>
                        `;
                      })
                      .join("")}
                  </div>
                </div>
              `
              : ""
          }
          </div>
        </div>
      `,
      countryInfoCard = `
        ${header}
        ${localTime}
        ${factsGrid}
        ${extras}
        ${actions}
      `;
    countryInfoContainer.innerHTML = countryInfoCard;
    neighborListeners();
    this.updateLocalTime();
    this.alreadyExplored = true;
  }
  getTimeFromTimezone(timeZone) {
    const match = timeZone.match(/UTC([+-])(\d{2}):(\d{2})/);
    if (!match) return "00:00:00";
    const sign = match[1],
      hours = parseInt(match[2]),
      minutes = parseInt(match[3]),
      totalMinutes = (hours * 60 + minutes) * (sign === "+" ? 1 : -1),
      currentDate = new Date(),
      utcTime = currentDate.getTime() + currentDate.getTimezoneOffset() * 60000,
      localTime = new Date(utcTime + totalMinutes * 60000);
    return localTime.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  }
  updateLocalTime() {
    const countryLocalTime = document.querySelector("#country-local-time");
    this.timeInterval = setInterval(() => {
      countryLocalTime.innerHTML = this.getTimeFromTimezone(
        this.facts.timeZone,
      );
    }, 1000);
  }
  clearSelection() {
    if (this.timeInterval) clearInterval(this.timeInterval);
    this.resetPages();
    countrySelect.value = "";
    citySelect.value = "";
    editDefaultValues();
    toastPopup("info", "circle-info", "Selection cleared!");
    this.reset();
  }
  resetPages() {
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
    this.resetSectionsHeader();
    const pageEmptyStateContainers = document.querySelectorAll(
      "section.view > [id $='-content']",
    );
    pageEmptyStateContainers.forEach((container) => {
      container.innerHTML = "";
    });
  }
  resetSectionsHeader() {
    const pagesHeaderSelection = document.querySelectorAll(
      ".view-header-selection",
    );
    pagesHeaderSelection.forEach((container) => {
      container.innerHTML = "";
    });
  }
  reset() {
    this.name = null;
    this.cityName = null;
    this.flag = null;
    this.code = null;
    this.facts = null;
    this.cachedSections = {};
    this.alreadyExplored = false;
    this.holidays = null;
    this.longWeekends = null;
    this.events = null;
  }
  async getListData(api, sectionName) {
    try {
      const response = await fetch(api),
        list = await response.json();
      return list;
    } catch {
      this.renderNotFound(
        sectionName,
        document.querySelector(`#${sectionName}-content`),
      );
      hideLoading();
    }
  }
  displayList(list, getCardStructure, selectionBadge, sectionName) {
    const cardsContainer = document.querySelector(`#${sectionName}-content`);
    if (list)
      this.renderData(
        list,
        getCardStructure,
        selectionBadge,
        sectionName,
        cardsContainer,
      );
    else this.renderNotFound(sectionName, cardsContainer);
  }
  async renderData(
    list,
    getCardStructure,
    selectionBadge = null,
    sectionName,
    container,
  ) {
    const listSelection = document.querySelector(
      `#${sectionName}-view #${sectionName}-selection`,
    );
    if (listSelection) listSelection.innerHTML = selectionBadge;
    let cards = "";
    const promiseArr = await Promise.all(
      list.map((item, i) => getCardStructure(item, i)),
    );
    cards = promiseArr.join("");
    container.innerHTML = cards;
    if (["holidays", "events", "long-weekends"].includes(sectionName)) {
      const saveToPlanBtns = document.querySelectorAll(".save-to-plan");
      saveToPlanBtns.forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const planType = e.currentTarget.dataset.planType,
            planData = this[planType]?.find((itemData) => {
              if (planType === "holidays")
                return (
                  e.currentTarget.dataset.planDate === itemData.date &&
                  e.currentTarget.dataset.planName === itemData.localName
                );
              else if (planType === "longWeekends")
                return (
                  e.currentTarget.dataset.planStart === itemData.startDate &&
                  e.currentTarget.dataset.planEnd === itemData.endDate
                );
              else return e.currentTarget.dataset.planId === itemData.id;
            }),
            plan = new Plan(),
            plansBadge = document.querySelector("#plans-count");
          if (!e.currentTarget.classList.contains("saved")) {
            e.currentTarget.classList.add("saved");
            toastPopup("success", "circle-check", "Added to plans!");
            plan.save(planType, planData);
            plansBadge.classList.remove("hidden");
            plansBadge.innerHTML = plan.planList.length;
          } else {
            e.currentTarget.classList.remove("saved");
            toastPopup("info", "info-circle", "Removed from plans!");
            plan.delete(plan.findIndex(planData, planType));
            plansBadge.innerHTML = plan.planList.length;
            if (plan.planList.length === 0) console.log("hidden");
          }
        });
      });
    }
  }
  renderNotFound(sectionName, container) {
    this.resetSectionsHeader();
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <i class="fas fa-xmark"></i>
        </div>
        <h3>No ${capitalize(sectionName)} Found</h3>
        <p>Please try again later or try another country</p>
        <button id="toDashboardBtn" class="btn btn-primary">
          <i class="fas fa-globe"></i>
          Go to Dashboard
        </button>
      </div>
    `;
    const dashboardBtn = document.querySelector(
        `#${sectionName}-view #toDashboardBtn`,
      ),
      selectedPageId = `#${sectionName}-view`,
      selectedPage = document.querySelector(selectedPageId);
    if (dashboardBtn)
      dashboardBtn.addEventListener("click", () => {
        const dashboardPage = document.querySelector("#dashboard-view"),
          dashboardNavLink = document.querySelector(
            ".nav-item[data-view='dashboard']",
          );
        selectedPage.classList.remove("active");
        dashboardPage.classList.add("active");
        dashboardNavLink.classList.add("active");
      });
  }
  async showSelectedSection(sectionApiUrl, sectionName) {
    showLoading();
    const list = await this.getListData(sectionApiUrl, sectionName);
    this.cachedSections[sectionName] = list;
    this.displayList(...this.setCardStructure(list, sectionName));
    setTimeout(hideLoading, 100);
  }
  setCardStructure(dataList, sectionName) {
    let getCardStructure, selectionBadge, listData;
    switch (sectionName) {
      case "holidays":
        getCardStructure = (item) => {
          const { date, name, localName, types } = item,
            planList = JSON.parse(localStorage.getItem("plans")),
            isCurrentItemInPlans = planList?.some(
              (plan) =>
                plan.data.date === date && plan.data.localName === localName,
            );
          return `
            <div class="holiday-card">
              <div class="holiday-card-header">
                <div class="holiday-date-box">
                  <span class="day">${new Date(date).toLocaleDateString(
                    "en-US",
                    {
                      day: "numeric",
                    },
                  )}</span><span class="month">${new Date(
                    date,
                  ).toLocaleDateString("en-US", {
                    month: "short",
                  })}</span>
                </div>
                <button class="holiday-action-btn save-to-plan ${isCurrentItemInPlans ? "saved" : ""}" data-plan-type="holidays" data-plan-date="${date}" data-plan-name="${localName}">
                  <i class="fa-regular fa-heart"></i>
                </button>
              </div>
              <h3>${localName}</h3>
              <p class="holiday-name">${name}</p>
              <div class="holiday-card-footer">
                <span class="holiday-day-badge">
                  <i class="fa-regular fa-calendar"></i> ${new Date(
                    date,
                  ).toLocaleDateString("en-US", {
                    weekday: "long",
                  })}
                </span>
                <span class="holiday-type-badge">${types[0]}</span>
              </div>
            </div>
          `;
        };
        selectionBadge = `
          <div class="current-selection-badge">
            <img
              src="${this.flag}"
              alt="${this.name}"
              class="selection-flag"
            />
            <span>${this.name}</span>
            <span class="selection-year">${yearSelect.value}</span>
          </div>
        `;
        this.holidays = listData = dataList;
        break;
      case "events":
        getCardStructure = (item) => {
          const {
              images,
              classifications,
              _embedded,
              name,
              dates,
              locale,
              url,
              id,
            } = item,
            planList = JSON.parse(localStorage.getItem("plans")),
            isCurrentItemInPlans = planList?.some((plan) => {
              return plan.data.id === item.id;
            });
          return `
            <div class="event-card">
              <div class="event-card-image">
                <img
                  src="${images[0].url}"
                  alt="${_embedded.venues[0].name}"
                />
                <span class="event-card-category">${classifications[0].segment.name}</span>
                <button class="event-card-save save-to-plan ${isCurrentItemInPlans ? "saved" : ""}" data-plan-type="events" data-plan-id="${id}">
                  <i class="fa-regular fa-heart"></i>
                </button>
              </div>
              <div class="event-card-body">
                <h3>${name}</h3>
                <div class="event-card-info">
                  <div>
                    <i class="fa-regular fa-calendar"></i>${new Date(
                      dates.start.dateTime,
                    ).toLocaleDateString(locale, {
                      month: "short",
                      day: "2-digit",
                      year: "numeric",
                    })} at ${new Date(dates.start.dateTime).toLocaleTimeString(
                      locale,
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      },
                    )}
                  </div>
                  <div>
                    <i class="fa-solid fa-location-dot"></i>${_embedded.venues[0].name}, ${_embedded.venues[0].city.name}
                  </div>
                </div>
                <div class="event-card-footer">
                  <button class="btn-event">
                    <i class="fa-regular fa-heart"></i> Save
                  </button>
                  <a href="${url}" target="_blank" class="btn-buy-ticket"
                    ><i class="fa-solid fa-ticket"></i> Buy Tickets</a
                  >
                </div>
              </div>
            </div>
          `;
        };
        selectionBadge = `
          <div class="current-selection-badge">
              <img
                src="${this.flag}"
                alt="${this.name}"
                class="selection-flag"
              />
              <span>${this.name}</span>
              <span class="selection-city">${this.cityName}</span>
            </div>
          </div>
        `;
        this.events = listData = dataList._embedded?.events;
        break;
      case "weather":
        getCardStructure = (item) => {
          const { current, hourly, daily } = item,
            heroCard = `
              <div class="weather-hero-card weather-${checkWeatherClass(
                current.weather_code,
              )}">
                <div class="weather-hero-bg"></div>
                <div class="weather-hero-content">
                  <div class="weather-location">
                    <i class="fa-solid fa-location-dot"></i>
                    <span>${this.cityName}</span>
                    <span class="weather-time">${new Date(
                      current.time,
                    ).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "short",
                      day: "2-digit",
                    })}</span>
                  </div>
                  <div class="weather-hero-main">
                    <div class="weather-hero-left">
                      <div class="weather-hero-icon">
                        <i class="fa-solid fa-${checkWeatherIcon(current.weather_code)}"></i>
                      </div>
                      <div class="weather-hero-temp">
                        <span class="temp-value">${Math.round(current.temperature_2m)}</span>
                        <span class="temp-unit">°C</span>
                      </div>
                    </div>
                    <div class="weather-hero-right">
                      <div class="weather-condition">${checkWeatherCondition(
                        current.weather_code,
                      )}</div>
                      <div class="weather-feels">Feels like ${Math.round(
                        current.apparent_temperature,
                      )}°C</div>
                      <div class="weather-high-low">
                        <span class="high"
                          ><i class="fa-solid fa-arrow-up"></i> ${Math.round(daily.temperature_2m_max[0])}°</span
                        >
                        <span class="low"
                          ><i class="fa-solid fa-arrow-down"></i> ${Math.round(daily.temperature_2m_min[0])}°</span
                        >
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            `,
            humidityCard = `
              <div class="weather-detail-card">
                <div class="detail-icon humidity">
                  <i class="fa-solid fa-droplet"></i>
                </div>
                <div class="detail-info">
                  <span class="detail-label">Humidity</span>
                  <span class="detail-value">${current.relative_humidity_2m}%</span>
                </div>
                <div class="detail-bar">
                  <div class="detail-bar-fill" style="width: ${current.relative_humidity_2m}%"></div>
                </div>
              </div>
            `,
            windCard = `
              <div class="weather-detail-card">
                <div class="detail-icon wind">
                  <i class="fa-solid fa-wind"></i>
                </div>
                <div class="detail-info">
                  <span class="detail-label">Wind</span>
                  <span class="detail-value">${Math.round(current.wind_speed_10m)} km/h</span>
                </div>
                <div class="detail-extra">${getWindDirection(
                  current.wind_direction_10m,
                )}</div>
              </div>
            `,
            uvIndexCard = `
              <div class="weather-detail-card">
                <div class="detail-icon uv">
                  <i class="fa-solid fa-sun"></i>
                </div>
                <div class="detail-info">
                  <span class="detail-label">UV Index</span>
                  <span class="detail-value">${Math.round(current.uv_index)}</span>
                </div>
                ${
                  [0, 1, 2].includes(current.uv_index)
                    ? "<div class='detail-extra uv-level low'>Low</div>"
                    : [3, 4, 5].includes(current.uv_index)
                      ? "<div class='detail-extra uv-level moderate'>Moderate</div>"
                      : [6, 7].includes(current.uv_index)
                        ? "<div class='detail-extra uv-level high'>High</div>"
                        : [8, 9, 10].includes(current.uv_index)
                          ? "<div class='detail-extra uv-level very-high'>Very high</div>"
                          : "<div class='detail-extra uv-level extreme'>Extreme</div>"
                }
              </div>
            `,
            precipitationCard = `
              <div class="weather-detail-card">
                <div class="detail-icon precip">
                  <i class="fa-solid fa-cloud-rain"></i>
                </div>
                <div class="detail-info">
                  <span class="detail-label">Precipitation</span>
                  <span class="detail-value">${Math.round(daily.precipitation_probability_max[0])}%</span>
                </div>
                <div class="detail-extra">${daily.precipitation_sum[0].toFixed(1)}mm expected</div>
              </div>
            `,
            sunriseSunsetCard = `
              <div class="weather-detail-card sunrise-sunset">
                <div class="sun-times-visual">
                  <div class="sun-time sunrise">
                    <i class="fas fa-sun"></i>
                    <span class="sun-label">Sunrise</span>
                    <span class="sun-value">${new Date(
                      daily.sunrise[0],
                    ).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}</span>
                  </div>
                  <div class="sun-arc">
                    <div class="sun-arc-path"></div>
                    <div class="sun-position" style="--sun-progress: ${getSunPosition(
                      daily.sunrise[0],
                      daily.sunset[0],
                    )}%"></div>
                  </div>
                  <div class="sun-time sunset">
                    <i class="fas fa-cloud-moon"></i>
                    <span class="sun-label">Sunset</span>
                    <span class="sun-value">${new Date(
                      daily.sunset[0],
                    ).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}</span>
                  </div>
                </div>
              </div>
            `,
            weatherDetailCards = `
              <div class="weather-details-grid">
                ${humidityCard}
                ${windCard}
                ${uvIndexCard}
                ${precipitationCard}
                ${sunriseSunsetCard}
              </div>
            `,
            currentHourIndex = hourly.time.findIndex(
              (hour) =>
                new Date(hour).toLocaleString("en-US", {
                  day: "numeric",
                  hour: "numeric",
                  hour12: false,
                }) ===
                new Date().toLocaleString("en-US", {
                  day: "numeric",
                  hour: "numeric",
                  hour12: false,
                }),
            ),
            next24Hours = hourly.time.slice(
              currentHourIndex,
              currentHourIndex + 24,
            ),
            hourlyWeatherCards = `
              <div class="weather-section">
                <h3 class="weather-section-title">
                  <i class="fa-solid fa-clock"></i> Hourly Forecast
                </h3>
                <div class="hourly-scroll">
                  ${next24Hours
                    .map((time, i) => {
                      const originalIndex = currentHourIndex + i,
                        temp = hourly.temperature_2m[originalIndex],
                        code = hourly.weather_code[originalIndex],
                        precip =
                          hourly.precipitation_probability[originalIndex],
                        isNow = i === 0;
                      return `
                        <div class="hourly-item ${isNow ? "now" : ""}">
                          <span class="hourly-time">${
                            isNow
                              ? "Now"
                              : new Date(time).toLocaleTimeString("en-US", {
                                  hour: "numeric",
                                  hour12: true,
                                })
                          }</span>
                          <div class="hourly-icon">
                            <i class="fa-solid fa-${checkWeatherIcon(code)}"></i>
                          </div>
                          <span class="hourly-temp">${Math.round(temp)}°</span>
                          ${
                            precip > 0
                              ? `
                                <span class="hourly-precip">
                                  <i class="fas fa-droplet"></i> ${Math.round(precip)}%
                                </span>
                              `
                              : ""
                          }
                        </div>
                      `;
                    })
                    .join("")}
                  </div>
                </div>
              </div>
            `,
            dailyWeatherCards = `
              <div class="weather-section">
                <h3 class="weather-section-title">
                  <i class="fa-solid fa-calendar-week"></i> 7-Day Forecast
                </h3>
                <div class="forecast-list">
                  ${daily.time
                    .map((day, i) => {
                      const maxTemp = daily.temperature_2m_max[i],
                        minTemp = daily.temperature_2m_min[i],
                        code = daily.weather_code[i],
                        date = new Date(day),
                        precip = Math.round(
                          daily.precipitation_probability_max[i],
                        ),
                        isToday = i === 0;
                      return `
                      <div class="forecast-day ${isToday ? "today" : ""}">
                        <div class="forecast-day-name">
                          <span class="day-label">${
                            isToday
                              ? "Today"
                              : date.toLocaleDateString("en-US", {
                                  weekday: "short",
                                })
                          }</span
                          ><span class="day-date">${date.toLocaleDateString(
                            "en-GB",
                            {
                              day: "2-digit",
                              month: "short",
                            },
                          )}</span>
                        </div>
                        <div class="forecast-icon">
                          <i class="fa-solid fa-${checkWeatherIcon(code)}"></i>
                        </div>
                        <div class="forecast-temps">
                          <span class="temp-max">${Math.round(maxTemp)}°</span
                          ><span class="temp-min">${Math.round(minTemp)}°</span>
                        </div>
                        ${
                          precip > 0
                            ? `
                              <div class="forecast-precip">
                                <i class="fas fa-droplet"></i> ${precip}%
                              </div>
                            `
                            : ""
                        }
                      </div>
                    `;
                    })
                    .join("")}
                </div>
              </div>
            `;
          return `
            <!-- Current Weather Hero -->
            ${heroCard}
            <!-- Weather Details Grid -->
            ${weatherDetailCards}
            <!-- Hourly Forecast -->
            ${hourlyWeatherCards}
            <!-- 7-Day Forecast -->
            ${dailyWeatherCards}
          `;
        };
        selectionBadge = `
          <div class="current-selection-badge">
              <img
                src="${this.flag}"
                alt="${this.name}"
                class="selection-flag"
              />
              <span>${this.name}</span>
              <span class="selection-city">${this.cityName}</span>
            </div>
          </div>
        `;
        listData = [dataList];
        break;
      case "long-weekends":
        getCardStructure = (item, i = null) => {
          const { dayCount, startDate, endDate, needBridgeDay } = item,
            planList = JSON.parse(localStorage.getItem("plans")),
            isCurrentItemInPlans = planList?.some(
              (plan) =>
                plan.data.startDate === startDate &&
                plan.data.endDate === endDate,
            ),
            formattedStartDate = new Date(startDate).toLocaleDateString(
              "en-US",
              {
                month: "short",
                day: "2-digit",
                year: "numeric",
              },
            ),
            formattedEndDate = new Date(endDate).toLocaleDateString("en-US", {
              month: "short",
              day: "2-digit",
              year: "numeric",
            });
          return `
            <div class="lw-card">
              <div class="lw-card-header">
                <span class="lw-badge"
                  ><i class="fa-solid fa-calendar-days"></i> ${dayCount} Days</span
                >
                <button 
                  class="holiday-action-btn save-to-plan ${isCurrentItemInPlans ? "saved" : ""}"
                  data-plan-type="longWeekends"
                  data-plan-start="${startDate}"
                  data-plan-end="${endDate}"
                >
                  <i class="fa-regular fa-heart"></i>
                </button>
              </div>
              <h3>Long Weekend #${i + 1}</h3>
              <div class="lw-dates">
                <i class="fa-regular fa-calendar"></i> ${formattedStartDate} - ${formattedEndDate}
              </div>
              ${
                !needBridgeDay
                  ? `<div class="lw-info-box success">
                      <i class="fa-solid fa-check-circle"></i> No extra days off needed!
                    </div>
                  `
                  : `<div class="lw-info-box warning">
                      <i class="fa-solid fa-circle-info"></i> Requires taking a bridge day off
                    </div>
                  `
              }
              <div class="lw-days-visual">
                ${getAllHolidayDays(startDate, endDate)
                  .map((holiday) => {
                    const formattedDate = new Date(holiday),
                      weekday = formattedDate.toLocaleDateString("en-US", {
                        weekday: "short",
                      }),
                      day = formattedDate.toLocaleDateString("en-US", {
                        day: "numeric",
                      }),
                      isWeekend = ["Sat", "Sun"].includes(weekday);
                    return `
                    <div class="lw-day ${isWeekend ? "weekend" : ""}">
                      <span class="name">${weekday}</span> <span class="num">${day}</span>
                    </div>
                  `;
                  })
                  .join("")}
              </div>
            </div>
          `;
        };
        selectionBadge = `
          <div class="current-selection-badge">
            <img
              src="${this.flag}"
              alt="${this.name}"
              class="selection-flag"
            />
            <span>${this.name}</span>
            <span class="selection-year">${yearSelect.value}</span>
          </div>
        `;
        this.longWeekends = listData = dataList;
        break;
      case "currency":
        getCardStructure = (item) => {
          const { conversion_rates } = item;
          return Object.keys(conversion_rates)
            .map((key, i) => {
              return `
                  <div class="popular-currency-card">
                    <img
                      src="https://flagcdn.com/w40/eg.png"
                      alt="${key}"
                      class="flag"
                    />
                    <div class="info">
                      <div class="code">
                        ${key}
                      </div>
                      <div class="name">
                        Egyptian pound
                      </div>
                    </div>
                    <div class="rate">
                      ${Object.values(conversion_rates).at(i).toFixed(4)}
                    </div>
                  </div>
                `;
            })
            .join("");
        };
        listData = [dataList];
        break;
      case "sun-times":
        getCardStructure = (item) => {
          const { results } = item,
            totalDaySeconds = results.day_length,
            dayHours = Math.floor(totalDaySeconds / 3600),
            dayMinutes = Math.floor((totalDaySeconds % 3600) / 60);
          return `
            <div class="sun-main-card">
              <div class="sun-main-header">
                <div class="sun-location">
                  <h2><i class="fa-solid fa-location-dot"></i> ${this.cityName}</h2>
                  <p>Sun times for your selected location</p>
                </div>
                <div class="sun-date-display">
                  <div class="date">${new Date(
                    results.astronomical_twilight_begin,
                  ).toLocaleDateString("en-US", {
                    month: "long",
                    day: "2-digit",
                    year: "numeric",
                  })}</div>
                  <div class="day">${new Date(
                    results.astronomical_twilight_begin,
                  ).toLocaleDateString("en-US", {
                    weekday: "long",
                  })}</div>
                </div>
              </div>
              <div class="sun-times-grid">
                <div class="sun-time-card dawn">
                  <div class="icon"><i class="fa-solid fa-moon"></i></div>
                  <div class="label">Dawn</div>
                  <div class="time">${new Date(
                    results.civil_twilight_begin,
                  ).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}</div>
                  <div class="sub-label">Civil Twilight</div>
                </div>
                <div class="sun-time-card sunrise">
                  <div class="icon"><i class="fa-solid fa-sun"></i></div>
                  <div class="label">Sunrise</div>
                  <div class="time">${new Date(
                    results.sunrise,
                  ).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}</div>
                  <div class="sub-label">Golden Hour Start</div>
                </div>
                <div class="sun-time-card noon">
                  <div class="icon"><i class="fa-solid fa-sun"></i></div>
                  <div class="label">Solar Noon</div>
                  <div class="time">${new Date(
                    results.solar_noon,
                  ).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}</div>
                  <div class="sub-label">Sun at Highest</div>
                </div>
                <div class="sun-time-card sunset">
                  <div class="icon"><i class="fa-solid fa-sun"></i></div>
                  <div class="label">Sunset</div>
                  <div class="time">${new Date(
                    results.sunset,
                  ).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}</div>
                  <div class="sub-label">Golden Hour End</div>
                </div>
                <div class="sun-time-card dusk">
                  <div class="icon"><i class="fa-solid fa-moon"></i></div>
                  <div class="label">Dusk</div>
                  <div class="time">${new Date(
                    results.civil_twilight_end,
                  ).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}</div>
                  <div class="sub-label">Civil Twilight</div>
                </div>
                <div class="sun-time-card daylight">
                  <div class="icon">
                    <i class="fa-solid fa-hourglass-half"></i>
                  </div>
                  <div class="label">Day Length</div>
                  <div class="time">
                    ${Math.floor(dayHours)}h
                    ${Math.floor(dayMinutes)}m
                  </div>
                  <div class="sub-label">Total Daylight</div>
                </div>
              </div>
            </div>
            <div class="day-length-card">
              <h3>
                <i class="fa-solid fa-chart-pie"></i> Daylight Distribution
              </h3>
              <div class="day-progress">
                <div class="day-progress-bar">
                  <div class="day-progress-fill" style="width: ${(totalDaySeconds / 86400) * 100}%"></div>
                </div>
              </div>
              <div class="day-length-stats">
                <div class="day-stat">
                  <div class="value">
                    ${Math.floor(dayHours)}h
                    ${Math.floor(dayMinutes)}m
                  </div>
                  <div class="label">Daylight</div>
                </div>
                <div class="day-stat">
                  <div class="value">
                    ${((totalDaySeconds / 86400) * 100).toFixed(1)}%</div>
                  <div class="label">of 24 Hours</div>
                </div>
                <div class="day-stat">
                  <div class="value"><div class="value">
                    ${Math.floor(24 - dayHours)}h
                    ${Math.floor(60 - dayMinutes)}m
                  </div></div>
                  <div class="label">Darkness</div>
                </div>
              </div>
            </div>
          `;
        };
        selectionBadge = `
          <div class="current-selection-badge">
              <img
                src="${this.flag}"
                alt="${this.name}"
                class="selection-flag"
              />
              <span>${this.name}</span>
              <span class="selection-city">${this.cityName}</span>
            </div>
          </div>
        `;
        listData = [dataList];
    }
    function checkWeatherCondition(weatherCode) {
      switch (weatherCode) {
        case 0:
          return "Clear sky";
        case 1:
          return "Mainly clear";
        case 2:
          return "Partly cloudy";
        case 3:
          return "Overcast";
        case 45:
          return "Fog";
        case 48:
          return "Depositing rime fog";
        case 51:
          return "Light drizzle";
        case 53:
          return "Moderate drizzle";
        case 55:
          return "Dense drizzle";
        case 61:
          return "Slight rain";
        case 63:
          return "Moderate rain";
        case 65:
          return "Heavy rain";
        case 71:
          return "Slight snowfall";
        case 73:
          return "Moderate snowfall";
        case 75:
          return "Heavy snowfall";
        case 80:
          return "Slight rain showers";
        case 81:
          return "Moderate rain showers";
        case 82:
          return "Violent rain showers";
        case 95:
          return "Slight thunderstorm";
        case 96:
          return "Moderate thunderstorm";
        case 99:
          return "Moderate thunderstorm with hail";
      }
    }
    function checkWeatherClass(weatherCode) {
      if (weatherCode === 0) return "sunny";
      else if ([1, 2, 3].includes(weatherCode)) return "cloudy";
      else if ([45, 48].includes(weatherCode)) return "foggy";
      else if ([51, 53, 55, 61, 62, 63, 80, 81, 82].includes(weatherCode))
        return "rainy";
      else if ([71, 73, 75].includes(weatherCode)) return "snowy";
      else if ([71, 73, 75].includes(weatherCode)) return "stormy";
      else return "default";
    }
    function checkWeatherIcon(weatherCode) {
      if (weatherCode === 0) return "sun";
      else if ([1, 2].includes(weatherCode)) return "cloud-sun";
      else if ([3, 66].includes(weatherCode)) return "cloud";
      else if ([45, 48].includes(weatherCode)) return "smog";
      else if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(weatherCode))
        return "cloud-showers-heavy";
      else if ([71, 73, 75].includes(weatherCode)) return "snowflake";
      else if ([95, 96, 99].includes(weatherCode)) return "cloud-bolt";
    }
    function getWindDirection(degrees) {
      const directions = [
          "N",
          "NNE",
          "NE",
          "ENE",
          "E",
          "ESE",
          "SE",
          "SSE",
          "S",
          "SSW",
          "SW",
          "WSW",
          "W",
          "WNW",
          "NW",
          "NNW",
        ],
        index = Math.round(degrees / 22.5) % 16;
      return directions[index];
    }
    function getSunPosition(sunriseISO, sunsetISO) {
      const now = new Date(),
        sunrise = new Date(sunriseISO),
        sunset = new Date(sunsetISO);
      if (now < sunrise) return "0";
      if (now > sunset) return "100";
      const totalDaylight = sunset - sunrise,
        elapsedTime = now - sunrise,
        percentage = (elapsedTime / totalDaylight) * 100;
      return percentage;
    }
    function getAllHolidayDays(startDate, endDate) {
      let dates = [];
      const currentDate = new Date(startDate),
        finalDate = new Date(endDate);
      while (currentDate <= finalDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      return dates;
    }
    return [listData, getCardStructure, selectionBadge, sectionName];
  }
  buildApiUrl(...endpoints) {
    const q = new URLSearchParams();
    endpoints.forEach((endpoint) => {
      q.append(endpoint.prop, endpoint.query);
    });
    return q.toString();
  }
}
