import * as UI from "./ui.js";
import * as API from "./api.js";
import * as Storage from "./storage.js";
import { getDOMElements } from "./ui.js";
import { parseTimeStringToToday, formatToHHMMSS } from "./utils.js";

let countdownTimer = null;
let nextPrayer = null;

const el = getDOMElements();
const initialSelection = {
  continent: "Africa",
  country: "Algeria",
  city: "Abou el Hassan",
  method: 2,
};

export function initApp() {
  UI.populateContinentSelect();
  UI.populateMethodSelect();

  restoreSelections();
}

el.continentSelect.addEventListener("change", async () => {
  const continent = el.continentSelect.value;
  Storage.save("continent", continent);
  if (!continent) return;
  UI.showCountriesLoading();
  try {
    const countries = await API.fetchCountries(continent);
    UI.renderCountries(countries);
  } catch (err) {
    UI.showError(err.message);
  }
});

el.countrySelect.addEventListener("change", async () => {
  const country = el.countrySelect.value;
  Storage.save("country", country);
  if (!country) return;
  UI.showCitiesLoading();
  try {
    const cities = await API.fetchCities(country);
    UI.renderCities(cities);
  } catch (err) {
    UI.showError(err.message);
  }
});

el.citySelect.addEventListener("change", () => {
  Storage.save("city", el.citySelect.value);
  UI.enableLoadButtonIfReady();
});

el.methodSelect.addEventListener("change", () => {
  Storage.save("method", el.methodSelect.value);
});

el.loadButton.addEventListener("click", async () => {
  const city = el.citySelect.value;
  const country = el.countrySelect.value;
  const methodId = el.methodSelect.value;

  if (!city || !country || !methodId) return;

  try {
    UI.hideError();
    const timings = await API.fetchPrayerTimes(city, country, methodId);

    UI.renderPrayerTable(timings);

    document.getElementById("next-prayer-wrapper")?.classList.remove("hidden");
    document.getElementById("prayer-table")?.classList.remove("hidden");

    startNextPrayerCountdown(timings);
    el.resetButton.classList.remove("hidden");
  } catch (err) {
    UI.showError(err.message);
  }
});
el.resetButton.addEventListener("click", () => {
  reset();
  el.nextPrayerWrapper.classList.add("hidden");
  el.prayerTable.classList.add("hidden");
  el.resetButton.classList.add("hidden");
});

async function restoreSelections() {
  const saved = Storage.loadAll();

  if (saved.continent) el.continentSelect.value = saved.continent;
  else el.continentSelect.value = initialSelection.continent;
  if (saved.country) el.countrySelect.value = saved.country;
  else {
    const countries = await API.fetchCountries(initialSelection.continent);
    UI.renderCountries(countries);
    el.countrySelect.value = countries[0];
  }
  if (saved.city) el.citySelect.value = saved.city;
  else {
    const cities = await API.fetchCities(initialSelection.country);
    UI.renderCities(cities);
    el.citySelect.value = cities[0];
  }
  if (saved.method) el.methodSelect.value = saved.method;
  else el.methodSelect.value = initialSelection.method;
}

function startNextPrayerCountdown(timings) {
  if (countdownTimer) clearInterval(countdownTimer);

  const prayerNames = Object.keys(timings);
  const now = new Date();
  nextPrayer = null;

  for (let name of prayerNames) {
    const prayerDate = parseTimeStringToToday(timings[name]);
    if (prayerDate > now) {
      nextPrayer = { name, timeStr: timings[name], nextDate: prayerDate };
      break;
    }
  }

  if (!nextPrayer) {
    UI.hideNextPrayer();
    return;
  }

  const updateCountdown = () => {
    const diff = Math.floor((nextPrayer.nextDate - new Date()) / 1000);
    if (diff <= 0) {
      clearInterval(countdownTimer);
      UI.hideNextPrayer();
    } else {
      UI.showNextPrayer({
        ...nextPrayer,
        countdownSeconds: diff,
      });
    }
  };

  updateCountdown();
  countdownTimer = setInterval(updateCountdown, 1000);
}
function reset() {
  Storage.clear();
  restoreSelections();
}

document.addEventListener("DOMContentLoaded", () => {
  initApp();
});
