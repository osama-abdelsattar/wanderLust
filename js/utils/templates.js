import { capitalize, getTimeFromTimezone } from "../utils/helpers.js";
import {
  checkWeatherClass,
  checkWeatherCondition,
  checkWeatherIcon,
  getWindDirection,
  getSunPosition,
} from "../services/weather.js";
import { state } from "../events.js";

const SECTIONS_TEMPLATES = {
  COUNTRY_DATA_TEMPLATES(flag, name, facts, cityName) {
    return {
      header: `
        <div class="dashboard-country-header">
          <img
            src="${flag}"
            alt="${name}"
            class="dashboard-country-flag"
          />
          <div class="dashboard-country-title">
            <h3>${name}</h3>
            <p class="official-name">${facts.officialName}</p>
            <span class="region"
              ><i class="fa-solid fa-location-dot"></i> ${facts.continent} •
              ${facts.region}</span
            >
          </div>
        </div>
      `,
      localTime: `
        <div class="dashboard-local-time">
          <div class="local-time-display">
            <i class="fa-solid fa-clock"></i>
            <span class="local-time-value" id="country-local-time">
              ${getTimeFromTimezone(facts.timeZone)}
            </span>
            <span class="local-time-zone">${facts.timeZone}</span>
          </div>
        </div>
      `,
      factsGrid: `
        <div class="dashboard-country-grid">
          <div class="dashboard-country-detail">
            <i class="fa-solid fa-building-columns"></i>
            <span class="label">Capital</span>
            <span class="value">${cityName}</span>
          </div>
          <div class="dashboard-country-detail">
            <i class="fa-solid fa-users"></i>
            <span class="label">Population</span>
            <span class="value">${facts.population.toLocaleString("en-GB")}</span>
          </div>
          <div class="dashboard-country-detail">
            <i class="fa-solid fa-ruler-combined"></i>
            <span class="label">Area</span>
            <span class="value">${facts.area.toLocaleString("en-GB")} km²</span>
          </div>
          <div class="dashboard-country-detail">
            <i class="fa-solid fa-globe"></i>
            <span class="label">Continent</span>
            <span class="value">${facts.continent}</span>
          </div>
          <div class="dashboard-country-detail">
            <i class="fa-solid fa-phone"></i>
            <span class="label">Calling Code</span>
            <span class="value">+${facts.callingCode}</span>
          </div>
          <div class="dashboard-country-detail">
            <i class="fa-solid fa-car"></i>
            <span class="label">Driving Side</span>
            <span class="value">${facts.drivingSide}</span>
          </div>
          <div class="dashboard-country-detail">
            <i class="fa-solid fa-calendar-week"></i>
            <span class="label">Week Starts</span>
            <span class="value">${facts.weekStart}</span>
          </div>
        </div>
      `,
      actions: `
        <div class="dashboard-country-actions">
          <a
            href="https://www.google.com/maps/place/${name}"
            target="_blank"
            class="btn-map-link"
          >
            <i class="fa-solid fa-map"></i> View on Google Maps
          </a>
        </div>
      `,
      extras: `
        <div class="dashboard-country-extras">
          <div class="dashboard-country-extra">
            <h4><i class="fa-solid fa-coins"></i> Currency</h4>
            <div class="extra-tags">
                ${facts.currency
                  .map((currency, i) => {
                    return `<span class="extra-tag">${currency.name}${currency.symbol ? ` (${currency.symbol})` : ""}</span>`;
                  })
                  .join("")}
            </div>
          </div>
          <div class="dashboard-country-extra">
            <h4><i class="fa-solid fa-language"></i> Languages</h4>
            <div class="extra-tags">
              ${facts.languages
                .map((language) => {
                  return `<span class="extra-tag">${language.name}${language.native_name ? ` (${language.native_name})` : ""}</span>`;
                })
                .join("")}
            </div>
          </div>
          ${
            facts.neighbors
              ? `
                <div class="dashboard-country-extra">
                  <h4>
                    <i class="fa-solid fa-map-location-dot"></i> Neighbors
                  </h4>
                  <div class="extra-tags">
                    ${facts.neighbors
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
    };
  },

  HOLIDAY_CARD(item, isCurrentItemInPlans) {
    const { date, name, localName, types } = item;

    return `
      <div class="holiday-card">
        <div class="holiday-card-header">
          <div class="holiday-date-box">
            <span class="day">${new Date(date).toLocaleDateString("en-US", {
              day: "numeric",
            })}</span><span class="month">${new Date(date).toLocaleDateString(
              "en-US",
              {
                month: "short",
              },
            )}</span>
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
  },

  EVENT_CARD(item, isCurrentItemInPlans) {
    const { images, classifications, _embedded, name, dates, locale, url, id } =
      item;

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
  },

  WEATHER_TEMPLATES(item, currentHourIndex, next24Hours) {
    const { current, hourly, daily } = item;

    return {
      heroCard: `
        <div class="weather-hero-card weather-${checkWeatherClass(
          current.weather_code,
        )}">
          <div class="weather-hero-bg"></div>
          <div class="weather-hero-content">
            <div class="weather-location">
              <i class="fa-solid fa-location-dot"></i>
              <span>${state.selectedCountry.cityName}</span>
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
      humidityCard: `
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
      windCard: `
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
      uvIndexCard: `
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
      precipitationCard: `
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
      sunriseSunsetCard: `
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
      hourlyWeatherCards: `
        <div class="weather-section">
          <h3 class="weather-section-title">
            <i class="fa-solid fa-clock"></i> Hourly Forecast
          </h3>
          <div class="hourly-scroll">
            ${next24Hours
              .map((time, i) => {
                const originalIndex = currentHourIndex + i;
                const temp = hourly.temperature_2m[originalIndex];
                const code = hourly.weather_code[originalIndex];
                const precip = hourly.precipitation_probability[originalIndex];
                const isNow = i === 0;

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
      dailyWeatherCards: `
        <div class="weather-section">
          <h3 class="weather-section-title">
            <i class="fa-solid fa-calendar-week"></i> 7-Day Forecast
          </h3>
          <div class="forecast-list">
            ${daily.time
              .map((day, i) => {
                const maxTemp = daily.temperature_2m_max[i];
                const minTemp = daily.temperature_2m_min[i];
                const code = daily.weather_code[i];
                const date = new Date(day);
                const precip = Math.round(
                  daily.precipitation_probability_max[i],
                );
                const isToday = i === 0;

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
                    ><span class="day-date">${date.toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                    })}</span>
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
      `,
    };
  },

  LONG_WEEKENDS_CARD(item, index, isCurrentItemInPlans) {
    const { dayCount, startDate, endDate, needBridgeDay } = item;

    const formattedStartDate = new Date(startDate).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
    const formattedEndDate = new Date(endDate).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });

    function getAllHolidayDays(startDate, endDate) {
      let dates = [];
      const currentDate = new Date(startDate);
      const finalDate = new Date(endDate);

      while (currentDate <= finalDate) {
        dates.push(new Date(currentDate));

        currentDate.setDate(currentDate.getDate() + 1);
      }

      return dates;
    }

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
        <h3>Long Weekend #${index + 1}</h3>
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
              const formattedDate = new Date(holiday);
              const weekday = formattedDate.toLocaleDateString("en-US", {
                weekday: "short",
              });
              const day = formattedDate.toLocaleDateString("en-US", {
                day: "numeric",
              });
              const isWeekend = ["Sat", "Sun"].includes(weekday);

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
  },

  SUN_TIMES_TEMPLATES(item) {
    const totalDaySeconds = item.results.day_length;
    const dayHours = Math.floor(totalDaySeconds / 3600);
    const dayMinutes = Math.floor((totalDaySeconds % 3600) / 60);

    const gridItems = [
      {
        type: "dawn",
        icon: "moon",
        time: item.results.civil_twilight_begin,
        subLabel: "Civil Twilight",
      },
      {
        type: "sunrise",
        icon: "sun",
        time: item.results.sunrise,
        subLabel: "Golden Hour Start",
      },
      {
        type: "noon",
        label: "Solar Noon",
        icon: "sun",
        time: item.results.solar_noon,
        subLabel: "Sun at Highest",
      },
      {
        type: "sunset",
        icon: "sun",
        time: item.results.sunset,
        subLabel: "Golden Hour End",
      },
      {
        type: "dusk",
        icon: "moon",
        time: item.results.civil_twilight_end,
        subLabel: "Civil Twilight",
      },
      {
        type: "daylight",
        label: "Day Length",
        icon: "hourglass-half",
        duration: `${Math.floor(dayHours)}h ${Math.floor(dayMinutes)}m`,
        subLabel: "Total Daylight",
      },
    ];

    return {
      mainCard: {
        header: `
          <div class="sun-main-header">
            <div class="sun-location">
              <h2><i class="fa-solid fa-location-dot"></i> ${state.selectedCountry.cityName}</h2>
              <p>Sun times for your selected location</p>
            </div>
            <div class="sun-date-display">
              <div class="date">${new Date(
                item.results.astronomical_twilight_begin,
              ).toLocaleDateString("en-US", {
                month: "long",
                day: "2-digit",
                year: "numeric",
              })}</div>
              <div class="day">${new Date(
                item.results.astronomical_twilight_begin,
              ).toLocaleDateString("en-US", {
                weekday: "long",
              })}</div>
            </div>
          </div>
        `,
        grid: `
          <div class="sun-times-grid">
            ${gridItems
              .map(
                ({ type, icon, time, duration, label, subLabel }) => `
                  <div class="sun-time-card ${type}">
                    <div class="icon"><i class="fa-solid fa-${icon}"></i></div>
                    <div class="label">${label ?? type}</div>
                    <div class="time">
                    ${
                      time
                        ? new Date(time).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })
                        : duration
                    }</div>
                    <div class="sub-label">${subLabel}</div>
                  </div>
                `,
              )
              .join("")}
          </div>
        `,
      },
      dayLengthCard: {
        header: `
          <h3><i class="fa-solid fa-chart-pie"></i> Daylight Distribution</h3>
        `,
        progressBar: `
          <div class="day-progress">
            <div class="day-progress-bar">
              <div class="day-progress-fill" style="width: ${(totalDaySeconds / 86400) * 100}%"></div>
            </div>
          </div>
        `,
        dayLengthStats: `
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
        `,
      },
    };
  },
};

const STATES = {
  NOT_FOUND_TEMPLATE: (sectionName) => `
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
  `,

  LOADING_TEMPLATE: `
    <div class="loader-container">
      <div class="loader"></div>
    </div>
  `,

  ERROR_TEMPLATE: `
    <div class="empty-state">
      <div class="empty-icon">
        <i class="fas fa-triangle-exclamation"></i>
      </div>
      <h3>An unexpected error occured</h3>
      <p>Please check your internet connection and try again, or try reloading the website</p>
      <button id="refreshBtn" class="btn btn-primary" onclick="window.location.reload()">
        <i class="fas fa-rotate-right"></i> Reload
      </button>
    </div>
  `,
};

export { STATES, SECTIONS_TEMPLATES };
