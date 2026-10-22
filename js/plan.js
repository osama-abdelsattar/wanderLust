class Plan {
  constructor() {
    this.planList = JSON.parse(localStorage.getItem("plans")) || [];
  }

  save(type, data) {
    this.planList.push({ type: type, data: data });

    this.persist();
  }

  delete(index) {
    this.planList.splice(index, 1);

    this.persist();
  }

  clearAll() {
    this.planList = [];

    this.persist();
  }

  persist() {
    localStorage.setItem("plans", JSON.stringify(this.planList));
  }

  refresh() {
    this.planList = JSON.parse(localStorage.getItem("plans")) || [];
  }

  findIndex(itemData, planType) {
    const targetIndex = this.planList.findIndex((savedPlan) => {
      if (planType === "holidays") {
        return (
          itemData.date === savedPlan.data.date &&
          itemData.localName === savedPlan.data.localName
        );
      } else if (planType === "longWeekends") {
        return (
          itemData.startDate === savedPlan.data.startDate &&
          itemData.endDate === savedPlan.data.endDate
        );
      } else {
        return itemData.id === savedPlan.data.id;
      }
    });

    return targetIndex;
  }

  render(onlyFilter = null) {
    this.refresh();

    const plansContainer = document.querySelector("#plans-content");
    const plansBadge = document.querySelector("#plans-count");
    const filterAllCount = document.querySelector("#filter-all-count");
    const filterHolidayCount = document.querySelector("#filter-holiday-count");
    const filterEventCount = document.querySelector("#filter-event-count");
    const filterLongWeekendCount = document.querySelector("#filter-lw-count");

    if (this.planList.length === 0) {
      this.renderEmptyState(plansContainer);

      plansBadge.classList.add("hidden");

      [
        filterAllCount,
        filterHolidayCount,
        filterEventCount,
        filterLongWeekendCount,
      ].forEach((count) => {
        if (count) count.innerHTML = "0";
      });

      return;
    }

    let planCards = "";
    let holidaysCount = 0;
    let eventsCount = 0;
    let longWeekendsCount = 0;

    this.planList.forEach(({ type, data }, planIndex) => {
      if (type === "holidays") holidaysCount++;
      else if (type === "events") eventsCount++;
      else if (type === "longWeekends") longWeekendsCount++;

      planCards += this.createPlanCardHtml(type, data, planIndex);
    });

    plansContainer.innerHTML = planCards;

    if (plansBadge) {
      plansBadge.classList.remove("hidden");
      plansBadge.innerHTML = this.planList.length;
    }

    if (filterAllCount) filterAllCount.innerHTML = this.planList.length;
    if (filterHolidayCount) filterHolidayCount.innerHTML = holidaysCount;
    if (filterEventCount) filterEventCount.innerHTML = eventsCount;
    if (filterLongWeekendCount) filterLongWeekendCount.innerHTML = longWeekendsCount;

    if (onlyFilter) {
      this.applyFilter(onlyFilter);
    }

    this.attachCardEventListeners();
  }

  createPlanCardHtml(type, data, planIndex) {
    const formattedDate =
      type === "holidays"
        ? new Date(data.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : type === "longWeekends"
          ? `${new Date(data.startDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })} - ${new Date(data.endDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}`
          : new Date(data.dates?.start?.dateTime || Date.now()).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

    const infoText =
      type === "holidays"
        ? data.name
        : type === "longWeekends"
          ? data.needBridgeDay
            ? "No extra days needed"
            : "Requires taking a bridge day off"
          : data._embedded?.venues?.[0]?.name || "Venue TBD";

    const titleText =
      type === "holidays"
        ? data.localName
        : type === "longWeekends"
          ? `${data.dayCount} Days Long Weekend`
          : data.name;

    return `
      <div class="plan-card" data-type="${type}">
        <span class="plan-card-type ${type.slice(0, -1).toLowerCase()}">${type}</span>
        <div class="plan-card-content">
          <h4>${titleText}</h4>
          <div class="plan-card-details">
            <div><i class="fas fa-calendar"></i>${formattedDate}</div>
            <div><i class="fas fa-${type === "events" ? "location-dot" : "circle-info"}"></i>${infoText}</div>
          </div>
          <div class="plan-card-actions">
            <button class="btn-plan-remove" data-index="${planIndex}">
              <i class="fas fa-trash"></i> Remove
            </button>
          </div>
        </div>
      </div>
    `;
  }

  applyFilter(filterItem) {
    const planCards = document.querySelectorAll(".plan-card");

    planCards.forEach((card) => {
      if (filterItem !== "all" && card.dataset.type !== filterItem) {
        card.classList.add("hidden");
      } else {
        card.classList.remove("hidden");
      }
    });
  }

  attachCardEventListeners() {
    const removePlanBtns = document.querySelectorAll(".btn-plan-remove");

    removePlanBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const planIndex = Number(e.currentTarget.dataset.index);

        this.confirmRemovePlan(planIndex);
      });
    });
  }

  confirmRemovePlan(index) {
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
        this.delete(index);

        this.render();

        const prevActiveBtn = document.querySelector(".plan-filter.active");
        const allPlansBtn = document.querySelector(".plan-filter:first-child");

        if (prevActiveBtn) prevActiveBtn.classList.remove("active");
        if (allPlansBtn) allPlansBtn.classList.add("active");

        Swal.fire({
          title: "Cleared",
          text: "The plan has been removed",
          icon: "success",
        });
      }
    });
  }

  confirmClearAll() {
    if (this.planList.length === 0) {
      Swal.fire({
        title: "No Plans",
        text: "There are no saved plans to clear.",
        icon: "info",
      });

      return;
    }

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
        this.clearAll();

        this.render();

        const prevActiveBtn = document.querySelector(".plan-filter.active");
        const allPlansBtn = document.querySelector(".plan-filter:first-child");

        if (prevActiveBtn) prevActiveBtn.classList.remove("active");
        if (allPlansBtn) allPlansBtn.classList.add("active");

        Swal.fire({
          title: "Cleared",
          text: "All your plans have been deleted",
          icon: "success",
        });
      }
    });
  }

  renderEmptyState(container) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <i class="fas fa-heart-crack"></i>
        </div>
        <h3>No Saved Plans Yet</h3>
        <p>Start exploring and save holidays, events, or long weekends you like!</p>
        <button id="toDashboardBtn" class="btn btn-primary">
          <i class="fas fa-globe"></i>
          Go to Dashboard
        </button>
      </div>
    `;

    const dashboardBtn = container.querySelector("#toDashboardBtn");

    if (dashboardBtn) {
      dashboardBtn.addEventListener("click", () => {
        const dashboardPage = document.querySelector("#dashboard-view");
        const selectedPage = document.querySelector("section.view.active");
        const dashboardNavLink = document.querySelector(".nav-item[data-view='dashboard']");

        if (selectedPage) selectedPage.classList.remove("active");
        if (dashboardPage) dashboardPage.classList.add("active");
        if (dashboardNavLink) dashboardNavLink.classList.add("active");
      });
    }
  }
}

export default Plan;
