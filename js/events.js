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
    headerSubtitle = document.querySelector("#top-header #page-subtitle");
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
        sectionName !== "dashboard"
      ) {
        showEmptyStates();
      }
      if (sectionName === "plans") {
        const clearPlansBtn = document.querySelector("#clear-all-plans-btn");
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
        displayPlans();
      }
      const dashboardBtn = document.querySelector(
        `#${sectionName}-view #toDashboardBtn`,
      );
      if (dashboardBtn)
        dashboardBtn.addEventListener("click", () => {
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
          { prop: "apikey", query: "VwECw2OiAzxVzIqnwmKJUG41FbeXJk1y" },
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
      case "currency":
        sectionApiUrl =
          "https://v6.exchangerate-api.com/v6/805842951e5953ad31497176/latest/USD";
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
    else return;
  }
  function showEmptyStates(...only) {
    const pageEmptyStateContainers = document.querySelectorAll(
        only.length === 0
          ? "section.view > [id $='-content']"
          : only.map((item) => `#${item}-content`).join(", "),
      ),
      plansBadge = document.querySelector("#plans-count");
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
  }
  function displayPlans() {
    const planList = JSON.parse(localStorage.getItem("plans")),
      plansContainer = document.querySelector("#plans-content"),
      plansBadge = document.querySelector("#plans-count");
    if (planList.length !== 0) {
      let planCards = "";
      planList.forEach(({ type, data }, i) => {
        planCards += `
          <div class="plan-card">
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
      plansBadge.innerHTML = planList.length;
      const removePlanBtns = document.querySelectorAll(".btn-plan-remove");
      removePlanBtns?.forEach((btn) => {
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
    }
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
  exploreBtn.addEventListener("click", () => {
    if (selectedCountry) {
      selectedCountry.exploreCountry();
      toastPopup(
        "success",
        "circle-check",
        `Exploring ${selectedCountry.name}, ${selectedCountry.cityName}!`,
      );
    }
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
