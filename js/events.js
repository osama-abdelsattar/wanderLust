import Country from "./country.js";
import {
  countrySelect,
  citySelect,
  yearSelect,
  capitalize,
  toastPopup,
  hideLoading,
  debounce,
  setCity,
  editDefaultValues,
} from "./main.js";
import Plan from "./plan.js";

export let selectedCountry = null;
export default function eventListeners() {
  // Elements
  const menuBtn = document.querySelector("#mobile-menu-btn"),
    sidebar = document.querySelector("#sidebar"),
    sidebarOverlay = document.querySelector("#sidebar-overlay"),
    navItems = document.querySelectorAll(".nav-item"),
    pages = document.querySelectorAll(".view"),
    exploreBtn = document.querySelector("#global-search-btn"),
    headerTitle = document.querySelector("#top-header #page-title"),
    headerSubtitle = document.querySelector("#top-header #page-subtitle"),
    convertCurrencyBtn = document.querySelector("#convert-btn"),
    currencyFromSelect = document.querySelector("#currency-from"),
    currencyToSelect = document.querySelector("#currency-to"),
    swapCurrenciesBtn = document.querySelector("#swap-currencies-btn"),
    favoriteCurrencyBtns = document.querySelectorAll(
      "#popular-currencies .popular-currency-card",
    ),
    clearPlansBtn = document.querySelector("#clear-all-plans-btn"),
    planPageNavs = document.querySelectorAll(".plan-filter");
  let currencyLastUpdated = null;
  // Navigation Listeners
  menuBtn.addEventListener("click", () => {
    sidebar.style.transform = "translateX(0)";
    sidebarOverlay.classList.remove("hidden");
  });
  sidebarOverlay.addEventListener("click", () => {
    sidebar.style = "";
    sidebarOverlay.classList.add("hidden");
  });
  navItems.forEach((item) => {
    item.addEventListener("click", async (e) => {
      const sectionName = e.currentTarget.dataset.view,
        prevPage = document.querySelector(".view.active"),
        selectedPageId = `#${sectionName}-view`,
        selectedPage = document.querySelector(selectedPageId);
      if (selectedPage !== prevPage) {
        removeActiveFromPrevious(pages);
        removeActiveFromPrevious(navItems);
      }
      selectedPage.classList.add("active");
      e.currentTarget.classList.add("active");
      sidebar.style = "";
      sidebarOverlay.classList.add("hidden");
      // Navbar Heading
      headerTitle.innerHTML = capitalize(sectionName);
      headerSubtitle.innerHTML = setHeaderSubtitle(sectionName);
      // Show Pages
      if (
        [...countrySelect].find(
          (option) => option.value === selectedCountry?.code,
        ) &&
        !["dashboard", "plans", "currency"].includes(sectionName)
      ) {
        selectedCountry.showSelectedSection(
          setApiUrl(sectionName),
          sectionName,
        );
      } else if (
        ![...countrySelect].find(
          (option) => option.value === selectedCountry?.code,
        ) &&
        !["dashboard", "currency"].includes(sectionName)
      ) {
        showEmptyStates();
      }
      if (sectionName === "plans") {
        displayPlans();
      }
      if (sectionName === "currency") {
        displayFavoriteCurrencyConversion();
      }
    });
  });
  function removeActiveFromPrevious(allItems) {
    allItems.forEach((item) => {
      item.classList.remove("active");
    });
  }
  function setHeaderSubtitle(sectionName) {
    switch (sectionName) {
      case "dashboard":
        return "Welcome back! Ready to plan your next adventure?";
      case "holidays":
        return "Explore public holidays around the world";
      case "events":
        return "Find concerts, sports, and entertainment";
      case "weather":
        return "Check forecasts for any destination";
      case "long-weekends":
        return "Find the perfect mini-trip opportunities";
      case "currency":
        return "Convert currencies with live exchange rates";
      case "sun-times":
        return "Check sunrise and sunset times worldwide";
      case "plans":
        return "Your saved holidays and events";
    }
  }
  function setApiUrl(sectionName) {
    let sectionApiUrl, endpoints;
    switch (sectionName) {
      case "holidays":
        sectionApiUrl = `https://date.nager.at/api/v3/PublicHolidays/${yearSelect.value}/${selectedCountry.code}`;
        break;
      case "events":
        endpoints = [
          { prop: "apikey", query: "iDgFFw8AI8DL3wVKtASnCxOI0EWKlOBs" },
          {
            prop: "city",
            query: decodeURIComponent(selectedCountry.cityName),
          },
          { prop: "countryCode", query: selectedCountry.code },
          { prop: "size", query: "20" },
        ];
        sectionApiUrl = `https://app.ticketmaster.com/discovery/v2/events.json?${selectedCountry.buildApiUrl(...endpoints)}`;
        break;
      case "weather":
        endpoints = [
          { prop: "latitude", query: selectedCountry.facts.latitude },
          { prop: "longitude", query: selectedCountry.facts.longitude },
          {
            prop: "current",
            query:
              "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,uv_index",
          },
          {
            prop: "hourly",
            query: "temperature_2m,weather_code,precipitation_probability",
          },
          {
            prop: "daily",
            query:
              "weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_direction_10m_dominant",
          },
          { prop: "timezone", query: "auto" },
        ];
        sectionApiUrl = `https://api.open-meteo.com/v1/forecast?${selectedCountry.buildApiUrl(...endpoints)}`;
        break;
      case "long-weekends":
        sectionApiUrl = `https://date.nager.at/api/v3/LongWeekend/${yearSelect.value}/${selectedCountry.code}`;
        break;
      case "sun-times":
        endpoints = [
          { prop: "lat", query: selectedCountry.facts.latitude },
          { prop: "lng", query: selectedCountry.facts.longitude },
          {
            prop: "date",
            query: decodeURIComponent(
              new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              }),
            ),
          },
          { prop: "formatted", query: "0" },
        ];
        sectionApiUrl = `https://api.sunrise-sunset.org/json?${selectedCountry.buildApiUrl(...endpoints)}`;
        break;
    }
    if (sectionApiUrl) return sectionApiUrl;
  }
  function showEmptyStates(...only) {
    const pageEmptyStateContainers = document.querySelectorAll(
      only.length === 0
        ? "section.view > [id $='-content']"
        : only.map((item) => `#${item}-content`).join(", "),
    );
    pageEmptyStateContainers.forEach((container) => {
      const sectionName = container.id.split("-"),
        emptyStateText = () => {
          switch (sectionName[0]) {
            case "holidays":
              return "Select a country from the dashboard to explore public holidays";
            case "events":
              return "Select a country and city from the dashboard to discover events";
            case "weather":
              return "Select a country and city from the dashboard to see the weather forecast";
            case "long":
              return "Select a country from the dashboard to discover long weekend opportunities";
            case "sun":
              return "Select a country and city from the dashboard to see sunrise and sunset times";
            case "plans":
              return "Start exploring and save holidays, events, or long weekends you like!";
          }
        };
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">
            <i class="fas fa-${
              sectionName[0] === "holidays"
                ? "calendar-xmark"
                : sectionName[0] === "events"
                  ? "ticket"
                  : sectionName[0] === "long"
                    ? "umbrella-beach"
                    : sectionName[0] === "sun"
                      ? "sun"
                      : sectionName[0] === "plans"
                        ? "heart-crack"
                        : "cloud-question"
            }"></i>
          </div>
          <h3>No ${
            ["holidays", "long"].includes(sectionName[0])
              ? "Country Selected"
              : sectionName[0] === "plans"
                ? "Saved Plans Yet"
                : "City Selected"
          }</h3>
          <p>
            ${emptyStateText()}
          </p>
          <button id="toDashboardBtn" class="btn btn-primary">
            <i class="fas fa-globe"></i>
            Go to Dashboard
          </button>
        </div>
      `;
    });
    const dashboardBtns = document.querySelectorAll(`#toDashboardBtn`),
      selectedPage = document.querySelector("section.view.active");
    if (dashboardBtns)
      dashboardBtns.forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const dashboardPage = document.querySelector("#dashboard-view"),
            dashboardNavLink = document.querySelector(
              ".nav-item[data-view='dashboard']",
            );
          selectedPage.classList.remove("active");
          e.target.classList.remove("active");
          dashboardPage.classList.add("active");
          dashboardNavLink.classList.add("active");
        });
      });
  }
  function displayPlans(...only) {
    const planList = JSON.parse(localStorage.getItem("plans")),
      plansContainer = document.querySelector("#plans-content"),
      plansBadge = document.querySelector("#plans-count"),
      filterAllCount = document.querySelector("#filter-all-count"),
      filterHolidayCount = document.querySelector("#filter-holiday-count"),
      filterEventCount = document.querySelector("#filter-event-count"),
      filterLongWeekendCount = document.querySelector("#filter-lw-count");
    if (planList.length !== 0) {
      let planCards = "",
        holidaysCount = 0,
        eventsCount = 0,
        longWeekendsCount = 0;
      planList.forEach(({ type, data }, i) => {
        switch (type) {
          case "holidays":
            holidaysCount++;
            break;
          case "events":
            eventsCount++;
            break;
          case "longWeekends":
            longWeekendsCount++;
            break;
        }
        planCards += `
          <div class="plan-card" data-type="${type}">
            <span class="plan-card-type ${type.slice(0, -1).toLowerCase()}">${type}</span>
            <div class="plan-card-content">
              <h4>${
                type === "holidays"
                  ? data.localName
                  : type === "longWeekends"
                    ? `${data.dayCount} Days Long Weekend`
                    : data.name
              }</h4>
              <div div class="plan-card-details">
                <div><i class="fas fa-calendar"></i>${
                  type === "holidays"
                    ? new Date(data.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : type === "longWeekends"
                      ? `${new Date(data.startDate).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )} - ${new Date(data.endDate).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}`
                      : new Date(data.dates.start.dateTime).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )
                }</div>
                <div><i class="fas fa-${
                  type === "events" ? "location-dot" : "circle-info"
                }"></i>${
                  type === "holidays"
                    ? data.name
                    : type === "longWeekends"
                      ? `${
                          data.needBridgeDay
                            ? "No extra days needed"
                            : "Requires taking a bridge day off"
                        }`
                      : data._embedded.venues[0].name
                }</div>
              </div>
              <div class="plan-card-actions">
                <button class="btn-plan-remove" data-index="${i}">
                  <i class="fas fa-trash"></i> Remove
                </button>
              </div>
            </div>
          </div>
        `;
      });
      plansContainer.innerHTML = planCards;
      filterAllCount.innerHTML = plansBadge.innerHTML = planList.length;
      filterHolidayCount.innerHTML = holidaysCount;
      filterEventCount.innerHTML = eventsCount;
      filterLongWeekendCount.innerHTML = longWeekendsCount;
      if (only) {
        const planCards = document.querySelectorAll(".plan-card");
        only.forEach((filterItem) => {
          if (filterItem !== "all")
            planCards.forEach((card) => {
              if (card.dataset.type !== filterItem)
                card.classList.add("hidden");
              else card.classList.remove("hidden");
            });
          else {
            planCards.forEach((card) => card.classList.remove("hidden"));
          }
        });
      }
      const removePlanBtns = document.querySelectorAll(".btn-plan-remove");
      removePlanBtns.forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const thisIndex = e.target.dataset.index,
            plan = new Plan();
          Swal.fire({
            title: "Remove Plan?",
            text: "Are you sure you want to remove this plan?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#64748b",
            confirmButtonText: "Yes, remove it!",
          }).then((result) => {
            if (result.isConfirmed) {
              plan.delete(thisIndex, planList);
              displayPlans();
              const pervActiveBtn = document.querySelector(
                  ".plan-filter.active",
                ),
                allPlansBtn = document.querySelector(
                  ".plan-filter:first-child",
                );
              pervActiveBtn.classList.remove("active");
              allPlansBtn.classList.add("active");
              Swal.fire({
                title: "Cleared",
                text: "The plan has been removed",
                icon: "success",
              });
            }
          });
        });
      });
    } else {
      showEmptyStates("plans");
      plansBadge.classList.add("hidden");
      [
        filterAllCount,
        filterHolidayCount,
        filterEventCount,
        filterLongWeekendCount,
      ].forEach((count) => (count.innerHTML = "0"));
    }
  }
  async function displayFavoriteCurrencyConversion(from = "USD") {
    const response = await fetch(
        `https://v6.exchangerate-api.com/v6/035fcf8658d9e4862ae18302/latest/${from}`,
      ),
      { conversion_rates, time_last_update_utc } = await response.json();
    favoriteCurrencyBtns.forEach((btn) => {
      const currencyCode = btn.querySelector(".code"),
        currencyRate = btn.querySelector(".rate");
      currencyRate.innerHTML =
        conversion_rates[currencyCode.textContent].toFixed(4);
    });
    currencyLastUpdated = time_last_update_utc;
  }
  // Dashboard Form Listeners
  countrySelect.addEventListener(
    "change",
    debounce(async (e) => {
      if (!e.target.value) return;
      const allCities = await setCity(e.target.value);
      selectedCountry = new Country(
        e.target.selectedOptions[0].textContent,
        citySelect.value,
        countrySelect.value,
        allCities.flags.png,
      );
      await selectedCountry.previewCountry();
    }, 200),
  );
  citySelect.addEventListener("change", () => {
    if (selectedCountry) {
      selectedCountry.cityName = citySelect.value;
      delete selectedCountry.cachedSections["events"];
      delete selectedCountry.cachedSections["weather"];
    }
  });
  yearSelect.addEventListener("change", () => {
    if (selectedCountry) {
      delete selectedCountry.cachedSections["holidays"];
      delete selectedCountry.cachedSections["long-weekends"];
    }
  });
  exploreBtn.addEventListener("click", async () => {
    if (selectedCountry) {
      await selectedCountry.exploreCountry();
      addCountryCurrencyToConverter(selectedCountry);
      toastPopup(
        "success",
        "circle-check",
        `Exploring ${selectedCountry.name}, ${selectedCountry.cityName}!`,
      );
    }
  });
  // Currency Page Listeners
  currencyFromSelect.addEventListener("change", async (e) => {
    displayFavoriteCurrencyConversion(e.currentTarget.value);
  });
  convertCurrencyBtn.addEventListener("click", async () => {
    convertCurrency(currencyFromSelect.value, currencyToSelect.value);
  });
  swapCurrenciesBtn.addEventListener("click", swapSelect);
  favoriteCurrencyBtns.forEach((btn) => {
    const currencyCode = btn.querySelector(".code");
    btn.addEventListener("click", () => {
      currencyFromSelect.value =
        currencyFromSelect.value === "" ? "USD" : currencyFromSelect.value;
      currencyToSelect.value = currencyCode.textContent;
      convertCurrency(currencyFromSelect.value, currencyToSelect.value);
    });
  });
  function swapSelect() {
    const tempValue = currencyToSelect.value;
    currencyToSelect.value = currencyFromSelect.value;
    currencyFromSelect.value = tempValue;
    displayFavoriteCurrencyConversion(currencyFromSelect.value);
  }
  async function convertCurrency(from, to) {
    const currencyResult = document.querySelector("#currency-result"),
      currencyAmount = document.querySelector("#currency-amount");
    if (currencyAmount.value == 0) {
      alert("plz select a valid amount (shouldn't be zero)");
      return;
    }
    if (currencyFromSelect.value === currencyToSelect.value) {
      alert("You shouldn't choose similar currencies");
      return;
    }
    const response = await fetch(
        `https://v6.exchangerate-api.com/v6/035fcf8658d9e4862ae18302/pair/${from}/${to}/${currencyAmount.value}`,
      ),
      { conversion_result, base_code, target_code, conversion_rate } =
        await response.json();
    currencyResult.classList.remove("hidden");
    currencyResult.innerHTML = `
      <div class="conversion-display">
        <div class="conversion-from">
          <span class="amount">${currencyAmount.value}</span>
          <span class="currency-code">${base_code}</span>
        </div>
        <div class="conversion-equals">
          <i class="fa-solid fa-equals"></i>
        </div>
        <div class="conversion-to">
          <span class="amount">${conversion_result.toFixed(3)}</span>
          <span class="currency-code">${target_code}</span>
        </div>
      </div>
      <div class="exchange-rate-info">
        <p>1 ${base_code} = ${conversion_rate.toFixed(3)} ${target_code}</p>
        <small>Last updated: ${new Date(currencyLastUpdated).toLocaleDateString(
          "en-US",
          {
            month: "long",
            day: "2-digit",
            year: "numeric",
          },
        )}</small>
      </div>
    `;
  }
  // Plans Listeners
  clearPlansBtn.addEventListener("click", () => {
    if (
      localStorage.getItem("plans") &&
      localStorage.getItem("plans") !== "[]"
    ) {
      Swal.fire({
        title: "Clear All Plans?",
        text: "This will permanently delete all your saved plans. This action cannot be undone!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#64748b",
        confirmButtonText: "Yes, clear all!",
      }).then((result) => {
        if (result.isConfirmed) {
          localStorage.setItem("plans", "[]");
          displayPlans();
          const pervActiveBtn = document.querySelector(".plan-filter.active"),
            allPlansBtn = document.querySelector(".plan-filter:first-child");
          pervActiveBtn.classList.remove("active");
          allPlansBtn.classList.add("active");
          Swal.fire({
            title: "Cleared",
            text: "All your plans have been deleted",
            icon: "success",
          });
        }
      });
    } else {
      Swal.fire({
        title: "No Plans",
        text: "There are no saved plans to clear.",
        icon: "info",
      });
    }
  });
  planPageNavs.forEach((nav) => {
    nav.addEventListener("click", (e) => {
      const pervActiveBtn = document.querySelector(".plan-filter.active"),
        filter = e.currentTarget.dataset.filter;
      pervActiveBtn.classList.remove("active");
      e.currentTarget.classList.add("active");
      displayPlans(filter);
    });
  });
}
export function neighborListeners() {
  const neighborTags = document.querySelectorAll(".border-tag");
  neighborTags.forEach((tag) => {
    tag.style.cursor = "pointer";
    tag.addEventListener("click", async () => {
      const code = await selectNeighborCountry(tag.dataset.countryCode),
        selectedOption = [...countrySelect].find(
          (option) => option.value === code,
        );
      if (selectedOption) {
        countrySelect.value = code;
        await setCity(code);
      } else {
        editDefaultValues();
        countrySelect.value = "";
        citySelect.value = "";
      }
      await selectedCountry.previewCountry();
      await selectedCountry.exploreCountry();
      toastPopup(
        "success",
        "circle-check",
        `Exploring ${selectedCountry.name}, ${selectedCountry.cityName}!`,
      );
    });
  });
  async function selectNeighborCountry(code) {
    try {
      const response = await fetch(
          `https://restcountries.com/v3.1/alpha/${code}`,
        ),
        data = await response.json(),
        countryData = data[0];
      selectedCountry = new Country(
        countryData.name.common,
        countryData.capital[0],
        countryData.cca2,
        countryData.flags.png,
      );
      await selectedCountry.setFacts();
      return countryData.cca2;
    } catch {
      hideLoading();
      alert("failed to get neighbor country data");
    }
  }
}
function addCountryCurrencyToConverter(country) {
  const currencyFromSelect = document.querySelector("#currency-from"),
    currencyToSelect = document.querySelector("#currency-to"),
    currencies = country.facts.currency;
  Object.keys(currencies).forEach((currencyCode) => {
    const currencyInfo = currencies[currencyCode],
      currencyName = currencyInfo.name,
      currencyExistsInFrom = [...currencyFromSelect].some(
        (option) => option.value === currencyCode,
      ),
      currencyExistsInTo = [...currencyToSelect].some(
        (option) => option.value === currencyCode,
      ),
      optionText = `${currencyCode} - ${currencyName}`;
    if (!currencyExistsInFrom) {
      addOption(currencyCode, currencyFromSelect, optionText);
    }
    if (!currencyExistsInTo) {
      addOption(currencyCode, currencyToSelect, optionText);
    }
  });
  function addOption(currencyCode, select, optionText) {
    const newOption = document.createElement("option");
    newOption.value = currencyCode;
    newOption.textContent = optionText;
    select.appendChild(newOption);
  }
}
