import { API_BASE_URLS } from "../constants/constants.js";
import { toastPopup } from "../main.js";

function buildApiUrl(...paramPairs) {
  const queryParams = new URLSearchParams();

  paramPairs.forEach(({ prop, query }) => {
    queryParams.append(prop, query);
  });

  return queryParams.toString();
}

async function fetchAllCountries() {
  try {
    const response = await fetch(
      `${API_BASE_URLS.countries}/AvailableCountries`,
    );

    return await response.json();
  } catch (error) {
    console.error(error);

    toastPopup("error", "circle-exclamation", error.message);
  }
}

async function fetchSpecificCountry(countryCode) {
  try {
    const codeLength = countryCode.length === 2 ? "2" : "3";
    const response = await fetch(
      `${API_BASE_URLS.cities.base_url}/codes.alpha_${codeLength}/${countryCode}`,
      {
        headers: API_BASE_URLS.cities.headers,
      },
    );

    const countryData = await response.json();

    return countryData.data.objects[0];
  } catch (error) {
    console.error(error);

    toastPopup("error", "circle-exclamation", error.message);
  }
}

function getSectionApiUrl(sectionName, selectedCountry, year) {
  let sectionApiUrl;
  let endpoints;

  switch (sectionName) {
    case "holidays":
      sectionApiUrl = `${API_BASE_URLS.countries}/PublicHolidays/${year}/${selectedCountry.code}`;
      break;

    case "events":
      endpoints = [
        { prop: "apikey", query: API_BASE_URLS.ticketmaster.apiKey },
        {
          prop: "city",
          query: decodeURIComponent(selectedCountry.cityName),
        },
        { prop: "countryCode", query: selectedCountry.code },
        { prop: "size", query: "20" },
      ];
      sectionApiUrl = `${API_BASE_URLS.ticketmaster.base_url}?${buildApiUrl(...endpoints)}`;
      break;

    case "weather":
      endpoints = [
        {
          prop: "latitude",
          query: selectedCountry.getCoordinates().latitude,
        },
        {
          prop: "longitude",
          query: selectedCountry.getCoordinates().longitude,
        },
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
      sectionApiUrl = `${API_BASE_URLS.openMeteo}?${buildApiUrl(...endpoints)}`;
      break;

    case "long-weekends":
      sectionApiUrl = `${API_BASE_URLS.countries}/LongWeekend/${year}/${selectedCountry.code}`;
      break;

    case "sun-times":
      endpoints = [
        { prop: "lat", query: selectedCountry.getCoordinates().latitude },
        {
          prop: "lng",
          query: selectedCountry.getCoordinates().longitude,
        },
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
      sectionApiUrl = `${API_BASE_URLS.sunTimes}?${buildApiUrl(...endpoints)}`;
      break;
  }

  return sectionApiUrl;
}

async function fetchExchangeRates(fromCurrency = "USD") {
  try {
    const response = await fetch(
      `${API_BASE_URLS.exchangeRate}/latest/${fromCurrency}`,
    );

    return await response.json();
  } catch (error) {
    console.error(error);

    toastPopup("error", "circle-exclamation", error.message);
  }
}

async function fetchCurrencyPairConversion(from, to, amount) {
  try {
    const response = await fetch(
      `${API_BASE_URLS.exchangeRate}/pair/${from}/${to}/${amount}`,
    );

    return await response.json();
  } catch (error) {
    console.error(error);

    toastPopup("error", "circle-exclamation", error.message);
  }
}

export {
  buildApiUrl,
  fetchAllCountries,
  fetchSpecificCountry,
  getSectionApiUrl,
  fetchExchangeRates,
  fetchCurrencyPairConversion,
};
