export default class Plan {
  constructor() {
    this.planList = JSON.parse(localStorage.getItem("plans")) || [];
  }
  save(type, data) {
    this.planList.push({ type: type, data: data });
    localStorage.setItem("plans", JSON.stringify(this.planList));
  }
  findIndex(planData, planType) {
    const planIndex = this.planList.findIndex((listPlan) => {
      if (planType === "holidays")
        return (
          planData.date === listPlan.data.date &&
          planData.localName === listPlan.data.localName
        );
      else if (planType === "longWeekends")
        return (
          planData.startDate === listPlan.startDate &&
          planData.endDate === listPlan.endDate
        );
      else return planData.id === listPlan.data.id;
    });
    return planIndex;
  }
  delete(index) {
    this.planList.splice(index, 1);
    localStorage.setItem("plans", JSON.stringify(this.planList));
  }
}
