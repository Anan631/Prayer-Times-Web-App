import * as UI from "./ui.js";
import * as API from "./api.js";
import * as Storage from "./storage.js";
import { getDOMElements } from "./ui.js";
import { parseTimeStringToToday, formatToHHMMSS } from "./utils.js";

let countdownTimer = null;
let nextPrayer = null;

export async function initApp() {
  const el = getDOMElements();

  UI.populateContinentSelect();
  UI.populateMethodSelect();

  await restoreSelections();

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

      Storage.save("prayerTimes", timings);

      UI.renderPrayerTable(timings);

      document
        .getElementById("next-prayer-wrapper")
        ?.classList.remove("hidden");
      document.getElementById("prayer-table")?.classList.remove("hidden");

      startNextPrayerCountdown(timings);
      el.resetButton.classList.remove("hidden");
      el.loadButton.disabled = true;
    } catch (err) {
      UI.showError(err.message);
    }
  });

  el.resetButton.addEventListener("click", () => {
    Storage.clear();
    reset(el);
  });
}

function reset(el) {
  el.loadButton.disabled = false;
  el.resetButton.classList.add("hidden");
  el.prayerTable.classList.add("hidden");
  el.nextPrayerWrapper.classList.add("hidden");
  el.continentSelect.value = "";
  el.countrySelect.value = "";
  el.citySelect.value = "";
}
async function restoreSelections() {
  const el = getDOMElements();
  const saved = Storage.loadAll();

  if (saved.method) {
    el.methodSelect.value = saved.method;
  }

  if (saved.continent) {
    el.continentSelect.value = saved.continent;

    try {
      UI.showCountriesLoading();
      const countries = await API.fetchCountries(saved.continent);
      UI.renderCountries(countries);

      if (saved.country) {
        el.countrySelect.value = saved.country;

        try {
          UI.showCitiesLoading();
          const cities = await API.fetchCities(saved.country);
          UI.renderCities(cities);

          if (saved.city) {
            el.citySelect.value = saved.city;
            UI.enableLoadButtonIfReady();

            if (saved.prayerTimes) {
              UI.renderPrayerTable(saved.prayerTimes);
              document
                .getElementById("next-prayer-wrapper")
                ?.classList.remove("hidden");
              document
                .getElementById("prayer-table")
                ?.classList.remove("hidden");
              startNextPrayerCountdown(saved.prayerTimes);
              // el.loadButton.toggleAttribute("disabled");
              // el.resetButton.classList.toggle("hidden");
              el.loadButton.disabled = true;
              el.resetButton.classList.remove("hidden");
            } else {
              restoreNextPrayerCountdown();
            }
          }
        } catch (err) {
          console.warn("Failed to load cities for saved country:", err);
          UI.showError("Failed to load cities. Please select country again.");
        }
      }
    } catch (err) {
      console.warn("Failed to load countries for saved continent:", err);
      UI.showError("Failed to load countries. Please select continent again.");
    }
  } else {
    restoreNextPrayerCountdown();
  }
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
    Storage.remove("nextPrayer");
    return;
  }

  Storage.save("nextPrayer", {
    name: nextPrayer.name,
    timeStr: nextPrayer.timeStr,
    nextDate: nextPrayer.nextDate.toISOString(),
  });

  const updateCountdown = () => {
    const diff = Math.floor((nextPrayer.nextDate - new Date()) / 1000);
    if (diff <= 0) {
      clearInterval(countdownTimer);
      UI.hideNextPrayer();
      Storage.remove("nextPrayer");
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

function restoreNextPrayerCountdown() {
  const saved = Storage.load("nextPrayer");
  if (!saved) return;

  const savedDate = new Date(saved.nextDate);
  const now = new Date();

  if (savedDate <= now) {
    Storage.remove("nextPrayer");
    return;
  }

  nextPrayer = {
    name: saved.name,
    timeStr: saved.timeStr,
    nextDate: savedDate,
  };

  const updateCountdown = () => {
    const diff = Math.floor((nextPrayer.nextDate - new Date()) / 1000);
    if (diff <= 0) {
      clearInterval(countdownTimer);
      UI.hideNextPrayer();
      Storage.remove("nextPrayer");
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

document.addEventListener("DOMContentLoaded", async () => {
  await initApp();
});
