import Country from "./country.js";
import {
  countrySelect,
  citySelect,
  yearSelect,
  toastPopup,
  setCity,
  editDefaultValues,
} from "./main.js";
import Plan from "./plan.js";
import { fetchSpecificCountry, getSectionApiUrl } from "./services/api.js";
import {
  initCurrencyListeners,
  displayFavoriteCurrencyConversion,
  addCountryCurrencyToConverter,
} from "./services/currency.js";
import { showSelectedSection } from "./services/sections.js";
import { capitalize, debounce } from "./utils/helpers.js";

let state = {
  selectedCountry: null,
};
const plansManager = new Plan();

function eventListeners() {
  setupNavigationListeners();
  setupDashboardListeners();
  setupPlansListeners();
  initCurrencyListeners();
}

function setupNavigationListeners() {
  const menuBtn = document.querySelector("#mobile-menu-btn");

  const sidebar = document.querySelector("#sidebar");
  const sidebarOverlay = document.querySelector("#sidebar-overlay");

  const pages = document.querySelectorAll(".view");
  const navItems = document.querySelectorAll(".nav-item");

  const headerTitle = document.querySelector("#top-header #page-title");
  const headerSubtitle = document.querySelector("#top-header #page-subtitle");

  function showSidebar() {
    sidebar.style.transform = "translateX(0)";
    sidebarOverlay.classList.remove("hidden");
  }

  function hideSidebar() {
    sidebar.style = "";
    sidebarOverlay.classList.add("hidden");
  }

  function removeActiveFromPrevious(items) {
    items.forEach((item) => {
      item.classList.remove("active");
    });
  }

  function handleSectionActivation(sectionName) {
    const hasCountrySelected = [...countrySelect].some(
      (option) => option.value === state.selectedCountry?.code,
    );

    if (
      hasCountrySelected &&
      !["dashboard", "plans", "currency"].includes(sectionName)
    ) {
      const apiUrl = getSectionApiUrl(
        sectionName,
        state.selectedCountry,
        yearSelect.value,
      );

      showSelectedSection(apiUrl, sectionName);
    } else if (
      !hasCountrySelected &&
      !["dashboard", "currency"].includes(sectionName)
    ) {
      showEmptyStates();
    }

    if (sectionName === "plans") {
      plansManager.render();
    }

    if (sectionName === "currency") {
      displayFavoriteCurrencyConversion();
    }
  }

  function getHeaderSubtitle(sectionName) {
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

  menuBtn.addEventListener("click", () => {
    showSidebar();
  });

  sidebarOverlay.addEventListener("click", () => {
    hideSidebar();
  });

  navItems.forEach((item) => {
    item.addEventListener("click", async (e) => {
      const sectionName = e.currentTarget.dataset.view;
      const prevPage = document.querySelector(".view.active");
      const selectedPage = document.querySelector(`#${sectionName}-view`);

      hideSidebar();

      if (selectedPage === prevPage) return;

      removeActiveFromPrevious(pages);
      removeActiveFromPrevious(navItems);

      selectedPage.classList.add("active");
      e.currentTarget.classList.add("active");

      headerTitle.innerHTML = capitalize(sectionName);
      headerSubtitle.innerHTML = getHeaderSubtitle(sectionName);

      handleSectionActivation(sectionName);
    });
  });
}

function showEmptyStates(...only) {
  function getEmptyStateIcon(prefix) {
    switch (prefix) {
      case "holidays":
        return "calendar-xmark";
      case "events":
        return "ticket";
      case "long":
        return "umbrella-beach";
      case "sun":
        return "sun";
      case "plans":
        return "heart-crack";
      default:
        return "cloud-question";
    }
  }

  function getEmptyStateText(prefix) {
    switch (prefix) {
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
      default:
        return "";
    }
  }

  const pageEmptyStateContainers = document.querySelectorAll(
    only.length === 0
      ? "section.view > [id $='-content']"
      : only.map((item) => `#${item}-content`).join(", "),
  );

  pageEmptyStateContainers.forEach((container) => {
    const sectionPrefix = container.id.split("-")[0];
    const emptyStateText = getEmptyStateText(sectionPrefix);

    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <i class="fas fa-${getEmptyStateIcon(sectionPrefix)}"></i>
        </div>
        <h3>No ${
          ["holidays", "long"].includes(sectionPrefix)
            ? "Country Selected"
            : sectionPrefix === "plans"
              ? "Saved Plans Yet"
              : "City Selected"
        }</h3>
        <p>${emptyStateText}</p>
        <button id="toDashboardBtn" class="btn btn-primary">
          <i class="fas fa-globe"></i>
          Go to Dashboard
        </button>
      </div>
    `;
  });

  const dashboardBtns = document.querySelectorAll("#toDashboardBtn");
  const selectedPage = document.querySelector("section.view.active");

  if (dashboardBtns) {
    dashboardBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const dashboardPage = document.querySelector("#dashboard-view");
        const dashboardNavLink = document.querySelector(
          ".nav-item[data-view='dashboard']",
        );

        selectedPage.classList.remove("active");
        e.target.classList.remove("active");
        dashboardPage.classList.add("active");
        dashboardNavLink.classList.add("active");
      });
    });
  }
}

function setupDashboardListeners() {
  const exploreBtn = document.querySelector("#global-search-btn");

  countrySelect.addEventListener(
    "change",
    debounce(async (e) => {
      if (!e.target.value) return;

      const loadingOption = document.createElement("option");
      loadingOption.textContent = "Loading...";
      loadingOption.toggleAttribute("selected");

      citySelect.appendChild(loadingOption);
      citySelect.toggleAttribute("disabled", true);

      const countryCode = e.target.value;
      const countryData = await fetchSpecificCountry(countryCode);

      if (!countryData) {
        loadingOption.textContent = "No city found";
        return;
      }

      citySelect.removeChild(loadingOption);
      citySelect.toggleAttribute("disabled", false);

      setCity(countryData.capitals, countryCode);

      state.selectedCountry = new Country(
        e.target.selectedOptions[0].textContent,
        citySelect.value,
        countrySelect.value,
        countryData.flag.url_png,
      );

      state.selectedCountry.saveCountryData(countryData);
      state.selectedCountry.previewCountry();
    }, 200),
  );

  citySelect.addEventListener("change", () => {
    if (!state.selectedCountry) return;

    state.selectedCountry.cityName = citySelect.value;
    delete state.selectedCountry.cachedSections["events"];
    delete state.selectedCountry.cachedSections["weather"];
  });

  yearSelect.addEventListener("change", () => {
    if (!state.selectedCountry) return;

    delete state.selectedCountry.cachedSections["holidays"];
    delete state.selectedCountry.cachedSections["long-weekends"];
  });

  exploreBtn.addEventListener("click", async () => {
    try {
      if (!state.selectedCountry) throw new Error("Please select a city first");

      state.selectedCountry.exploreCountry();
      addCountryCurrencyToConverter(state.selectedCountry);
      toastPopup(
        "success",
        "circle-check",
        `Exploring ${state.selectedCountry.name}, ${state.selectedCountry.cityName}!`,
      );
    } catch (error) {
      console.error(error);
      toastPopup("error", "circle-exclamation", error.message);
    }
  });
}

function setupPlansListeners() {
  const clearPlansBtn = document.querySelector("#clear-all-plans-btn");
  const planPageNavs = document.querySelectorAll(".plan-filter");

  clearPlansBtn.addEventListener("click", () => {
    plansManager.confirmClearAll();
  });

  planPageNavs.forEach((nav) => {
    nav.addEventListener("click", (e) => {
      const prevActiveBtn = document.querySelector(".plan-filter.active");
      const filter = e.currentTarget.dataset.filter;

      if (prevActiveBtn) prevActiveBtn.classList.remove("active");
      e.currentTarget.classList.add("active");

      plansManager.applyFilter(filter);
    });
  });
}

function neighborListeners() {
  async function selectNeighborCountry(code) {
    const countryData = await fetchSpecificCountry(code);

    state.selectedCountry = new Country(
      countryData.names.common,
      countryData.capitals[0].name,
      countryData.codes.alpha_2,
      countryData.flag.url_png,
    );

    state.selectedCountry.saveCountryData(countryData);
    state.selectedCountry.setFacts();

    return countryData;
  }

  const neighborTags = document.querySelectorAll(".border-tag");

  neighborTags.forEach((tag) => {
    tag.style.cursor = "pointer";

    tag.addEventListener("click", async () => {
      const spinnner = document.createElement("div");
      spinnner.className = "loader";
      spinnner.style =
        "--loader-color: currentColor; --loader-spacing: 3px; margin-inline-end: 6px";

      // Show a loader untill the fetch finishes its work;
      tag.prepend(spinnner);
      tag.toggleAttribute("disabled", true);

      try {
        const countryData = await selectNeighborCountry(
          tag.dataset.countryCode,
        );
        const code = countryData.codes.alpha_2;

        const selectedOption = [...countrySelect].find(
          (option) => option.value === code,
        );

        if (selectedOption) {
          countrySelect.value = code;

          setCity(countryData.capitals, code);
        } else {
          editDefaultValues();

          countrySelect.value = "";
          citySelect.value = "";
        }

        state.selectedCountry.previewCountry();
        state.selectedCountry.exploreCountry();

        toastPopup(
          "success",
          "circle-check",
          `Exploring ${state.selectedCountry.name}, ${state.selectedCountry.cityName}!`,
        );
      } catch {
        // Hide the loader and revert to original text (in error cases)
        tag.removeChild(spinnner);
        tag.toggleAttribute("disabled", false);
      }
    });
  });
}

export { state, plansManager };

export { eventListeners as default, neighborListeners };
