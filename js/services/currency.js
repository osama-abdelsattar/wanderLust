import {
  fetchExchangeRates,
  fetchCurrencyPairConversion,
} from "./api.js";

let currencyLastUpdated = null;

function initCurrencyListeners() {
  const convertCurrencyBtn = document.querySelector("#convert-btn");
  const currencyFromSelect = document.querySelector("#currency-from");
  const currencyToSelect = document.querySelector("#currency-to");
  const swapCurrenciesBtn = document.querySelector("#swap-currencies-btn");
  const favoriteCurrencyBtns = document.querySelectorAll(
    "#popular-currencies .popular-currency-card",
  );

  currencyFromSelect.addEventListener("change", async (e) => {
    displayFavoriteCurrencyConversion(e.currentTarget.value);
  });

  convertCurrencyBtn.addEventListener("click", async () => {
    convertCurrency(currencyFromSelect.value, currencyToSelect.value);
  });

  swapCurrenciesBtn.addEventListener("click", () => {
    const tempValue = currencyToSelect.value;

    currencyToSelect.value = currencyFromSelect.value;
    currencyFromSelect.value = tempValue;

    displayFavoriteCurrencyConversion(currencyFromSelect.value);
  });

  favoriteCurrencyBtns.forEach((btn) => {
    const currencyCode = btn.querySelector(".code");

    btn.addEventListener("click", () => {
      currencyFromSelect.value =
        currencyFromSelect.value === "" ? "USD" : currencyFromSelect.value;
      currencyToSelect.value = currencyCode.textContent;

      convertCurrency(currencyFromSelect.value, currencyToSelect.value);
    });
  });
}

async function displayFavoriteCurrencyConversion(from = "USD") {
  const favoriteCurrencyBtns = document.querySelectorAll(
    "#popular-currencies .popular-currency-card",
  );

  const { conversion_rates, time_last_update_utc } =
    await fetchExchangeRates(from);

  favoriteCurrencyBtns.forEach((btn) => {
    const currencyCode = btn.querySelector(".code");
    const currencyRate = btn.querySelector(".rate");

    currencyRate.innerHTML =
      conversion_rates[currencyCode.textContent].toFixed(4);
  });

  currencyLastUpdated = time_last_update_utc;
}

async function convertCurrency(from, to) {
  const currencyResult = document.querySelector("#currency-result");
  const currencyAmount = document.querySelector("#currency-amount");

  if (!currencyAmount.value || Number(currencyAmount.value) === 0) {
    alert("plz select a valid amount (shouldn't be zero)");
    return;
  }

  if (from === to) {
    alert("You shouldn't choose similar currencies");
    return;
  }

  const { conversion_result, base_code, target_code, conversion_rate } =
    await fetchCurrencyPairConversion(from, to, currencyAmount.value);

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

function addCountryCurrencyToConverter(country) {
  const currencyFromSelect = document.querySelector("#currency-from");
  const currencyToSelect = document.querySelector("#currency-to");
  const currencies = country.facts.currency;

  Object.keys(currencies).forEach((currencyCode) => {
    const currencyInfo = currencies[currencyCode];
    const currencyName = currencyInfo.name;
    const currencyExistsInFrom = [...currencyFromSelect].some(
      (option) => option.value === currencyCode,
    );
    const currencyExistsInTo = [...currencyToSelect].some(
      (option) => option.value === currencyCode,
    );
    const optionText = `${currencyCode} - ${currencyName}`;

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

export {
  initCurrencyListeners,
  displayFavoriteCurrencyConversion,
  convertCurrency,
  addCountryCurrencyToConverter,
};
