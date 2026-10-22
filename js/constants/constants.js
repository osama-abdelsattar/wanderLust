const API_BASE_URLS = {
  countries: "https://date.nager.at/api/v3",
  cities: {
    base_url: "https://api.restcountries.com/countries/v5",
    headers: {
      Authorization: "Bearer rc_live_d74f54e4f4aa493296ccb9c761fb9d9b",
    },
  },
  ticketmaster: {
    base_url: "https://app.ticketmaster.com/discovery/v2/events.json",
    apiKey: "iDgFFw8AI8DL3wVKtASnCxOI0EWKlOBs",
  },
  openMeteo: "https://api.open-meteo.com/v1/forecast",
  sunTimes: "https://api.sunrise-sunset.org/json",
  exchangeRate: "https://v6.exchangerate-api.com/v6/035fcf8658d9e4862ae18302",
};

export { API_BASE_URLS };
