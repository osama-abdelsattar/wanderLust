import { SECTIONS_TEMPLATES } from "../utils/templates.js";
import { state } from "../events.js";

import {
  showLoading,
  yearSelect,
  resetSectionsHeader,
  toastPopup,
  showError,
} from "../main.js";
import Plan from "../plan.js";
import { STATES } from "../utils/templates.js";

function displayNotFound(sectionName, container) {
  resetSectionsHeader();

  container.innerHTML = STATES.NOT_FOUND_TEMPLATE(sectionName);

  const dashboardBtn = document.querySelector(
    `#${sectionName}-view #toDashboardBtn`,
  );
  const selectedPageId = `#${sectionName}-view`;
  const selectedPage = document.querySelector(selectedPageId);

  if (dashboardBtn) {
    dashboardBtn.addEventListener("click", () => {
      const dashboardPage = document.querySelector("#dashboard-view");
      const dashboardNavLink = document.querySelector(
        ".nav-item[data-view='dashboard']",
      );

      selectedPage.classList.remove("active");
      dashboardPage.classList.add("active");
      dashboardNavLink.classList.add("active");
    });
  }
}

async function getListData(api, sectionName) {
  const cachedData = state.selectedCountry.cachedSections[sectionName];

  if (cachedData) return cachedData;

  const response = await fetch(api);
  const list = await response.json();

  state.selectedCountry.cacheData(sectionName, list);

  return list;
}

function setCard(dataList, sectionName) {
  let getCard;
  let selectionBadge;
  let listData;

  switch (sectionName) {
    case "holidays":
      getCard = (item) => {
        const planList = JSON.parse(localStorage.getItem("plans"));
        const isCurrentItemInPlans = planList?.some(
          (plan) =>
            plan.data.date === item.date &&
            plan.data.localName === item.localName,
        );

        return SECTIONS_TEMPLATES.HOLIDAY_CARD(item, isCurrentItemInPlans);
      };
      selectionBadge = `
        <div class="current-selection-badge">
          <img
            src="${state.selectedCountry.flag}"
            alt="${state.selectedCountry.name}"
            class="selection-flag"
          />
          <span>${state.selectedCountry.name}</span>
          <span class="selection-year">${yearSelect.value}</span>
        </div>
      `;

      state.selectedCountry.holidays = listData = dataList;
      break;
    case "events":
      getCard = (item) => {
        const planList = JSON.parse(localStorage.getItem("plans"));
        const isCurrentItemInPlans = planList?.some((plan) => {
          return plan.data.id === item.id;
        });

        return SECTIONS_TEMPLATES.EVENT_CARD(item, isCurrentItemInPlans);
      };
      selectionBadge = `
        <div class="current-selection-badge">
            <img
              src="${state.selectedCountry.flag}"
              alt="${state.selectedCountry.name}"
              class="selection-flag"
            />
            <span>${state.selectedCountry.name}</span>
            <span class="selection-city">${state.selectedCountry.cityName}</span>
          </div>
        </div>
      `;

      state.selectedCountry.events = listData = dataList._embedded?.events;
      break;
    case "weather":
      getCard = (item) => {
        const currentHourIndex = item.hourly.time.findIndex(
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
        );
        const next24Hours = item.hourly.time.slice(
          currentHourIndex,
          currentHourIndex + 24,
        );

        const weatherTemplates = SECTIONS_TEMPLATES.WEATHER_TEMPLATES(
          item,
          currentHourIndex,
          next24Hours,
        );

        const weatherDetailCards = `
          <div class="weather-details-grid">
            ${weatherTemplates.humidityCard}
            ${weatherTemplates.windCard}
            ${weatherTemplates.uvIndexCard}
            ${weatherTemplates.precipitationCard}
            ${weatherTemplates.sunriseSunsetCard}
          </div>
        `;

        return `
            <!-- Current Weather Hero -->
            ${weatherTemplates.heroCard}
            <!-- Weather Details Grid -->
            ${weatherDetailCards}
            <!-- Hourly Forecast -->
            ${weatherTemplates.hourlyWeatherCards}
            <!-- 7-Day Forecast -->
            ${weatherTemplates.dailyWeatherCards}
          `;
      };
      selectionBadge = `
          <div class="current-selection-badge">
              <img
                src="${state.selectedCountry.flag}"
                alt="${state.selectedCountry.name}"
                class="selection-flag"
              />
              <span>${state.selectedCountry.name}</span>
              <span class="selection-city">${state.selectedCountry.cityName}</span>
            </div>
          </div>
        `;

      listData = [dataList];
      break;
    case "long-weekends":
      getCard = (item, index = 0) => {
        const planList = JSON.parse(localStorage.getItem("plans"));
        const isCurrentItemInPlans = planList?.some(
          (plan) =>
            plan.data.startDate === item.startDate &&
            plan.data.endDate === item.endDate,
        );

        return SECTIONS_TEMPLATES.LONG_WEEKENDS_CARD(
          item,
          index,
          isCurrentItemInPlans,
        );
      };

      selectionBadge = `
        <div class="current-selection-badge">
          <img
            src="${state.selectedCountry.flag}"
            alt="${state.selectedCountry.name}"
            class="selection-flag"
          />
          <span>${state.selectedCountry.name}</span>
          <span class="selection-year">${yearSelect.value}</span>
        </div>
      `;

      state.selectedCountry.longWeekends = listData = dataList;
      break;
    case "sun-times":
      getCard = (item) => {
        const templates = SECTIONS_TEMPLATES.SUN_TIMES_TEMPLATES(item);

        return `
          <div class="sun-main-card">
            ${templates.mainCard.header}
            ${templates.mainCard.grid}
          </div>
          <div class="day-length-card">
            ${templates.dayLengthCard.header}
            ${templates.dayLengthCard.progressBar}
            ${templates.dayLengthCard.dayLengthStats}
          </div>
        `;
      };

      selectionBadge = `
        <div class="current-selection-badge">
            <img
              src="${state.selectedCountry.flag}"
              alt="${state.selectedCountry.name}"
              class="selection-flag"
            />
            <span>${state.selectedCountry.name}</span>
            <span class="selection-city">${state.selectedCountry.cityName}</span>
          </div>
        </div>
      `;

      listData = [dataList];
  }

  return [
    listData,
    getCard,
    selectionBadge,
    sectionName,
    state.selectedCountry,
  ];
}

function displayList(list, getCard, selectionBadge, sectionName) {
  const cardsContainer = document.querySelector(`#${sectionName}-content`);

  const listSelection = document.querySelector(
    `#${sectionName}-view #${sectionName}-selection`,
  );
  if (listSelection) listSelection.innerHTML = selectionBadge;

  if (!list) {
    displayNotFound(sectionName, cardsContainer);
    return;
  }

  const cards = list.map((item, i) => getCard(item, i));
  cardsContainer.innerHTML = cards.join("");

  if (["holidays", "events", "long-weekends"].includes(sectionName)) {
    const saveToPlanBtns = document.querySelectorAll(".save-to-plan");

    saveToPlanBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const planType = e.currentTarget.dataset.planType;
        const planData = state.selectedCountry[planType]?.find((itemData) => {
          if (planType === "holidays") {
            return (
              e.currentTarget.dataset.planDate === itemData.date &&
              e.currentTarget.dataset.planName === itemData.localName
            );
          } else if (planType === "longWeekends") {
            return (
              e.currentTarget.dataset.planStart === itemData.startDate &&
              e.currentTarget.dataset.planEnd === itemData.endDate
            );
          } else {
            return e.currentTarget.dataset.planId === itemData.id;
          }
        });
        const planManager = new Plan();
        const plansBadge = document.querySelector("#plans-count");

        if (!e.currentTarget.classList.contains("saved")) {
          e.currentTarget.classList.add("saved");
          toastPopup("success", "circle-check", "Added to plans!");
          planManager.save(planType, planData);
          plansBadge.classList.remove("hidden");
          plansBadge.innerHTML = planManager.planList.length;
        } else {
          e.currentTarget.classList.remove("saved");
          toastPopup("info", "info-circle", "Removed from plans!");
          planManager.delete(planManager.findIndex(planData, planType));
          plansBadge.innerHTML = planManager.planList.length;
          if (planManager.planList.length === 0)
            plansBadge.classList.add("hidden");
        }
      });
    });
  }
}

async function showSelectedSection(sectionApiUrl, sectionName) {
  try {
    showLoading(sectionName);

    const list = await getListData(sectionApiUrl, sectionName);

    displayList(...setCard(list, sectionName));
  } catch (error) {
    console.error(error);

    toastPopup("error", "circle-exclamation", error.message);
    showError(sectionName);
  }
}

export { showSelectedSection };
