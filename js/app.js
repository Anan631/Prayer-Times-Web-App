import * as UI from "./ui.js";
import * as API from "./api.js";
import * as Storage from "./storage.js";
import { getDOMElements } from "./ui.js";
import { parseTimeStringToToday, formatToHHMMSS } from "./utils.js";
import { PRAYER_NAMES } from "./config.js";

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
    UI.enableLoadButtonIfReady();
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

      await startNextPrayerCountdown(timings);
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
  // Hide results
  el.resetButton.classList.add("hidden");
  el.prayerTable.classList.add("hidden");
  el.nextPrayerWrapper.classList.add("hidden");
  // Reset cascaded selects and method properly
  UI.resetControls();
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
              await startNextPrayerCountdown(saved.prayerTimes);
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

async function startNextPrayerCountdown(timings) {
  if (countdownTimer) clearInterval(countdownTimer);

  const now = new Date();
  nextPrayer = null;

  // Only consider the 5 main prayers in the correct order
  for (let name of PRAYER_NAMES) {
    const timeStr = timings[name];
    if (!timeStr) continue;
    const prayerDate = parseTimeStringToToday(timeStr);
    if (prayerDate && prayerDate > now) {
      nextPrayer = { name, timeStr, nextDate: prayerDate };
      break;
    }
  }

  if (!nextPrayer) {
    // All today's prayers have passed; compute tomorrow's Fajr
    const el = getDOMElements();
    const city = el.citySelect.value;
    const country = el.countrySelect.value;
    const methodId = el.methodSelect.value;
    if (city && country && methodId) {
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const dd = String(tomorrow.getDate()).padStart(2, '0');
      const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const yyyy = String(tomorrow.getFullYear());
      const ddmmyyyy = `${dd}-${mm}-${yyyy}`;
      try {
        const tmrTimings = await API.fetchPrayerTimesByDate(city, country, Number(methodId), ddmmyyyy);
        const fajrStr = tmrTimings["Fajr"];
        const fajrDate = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(),
          parseInt(fajrStr.split(":")[0], 10), parseInt(fajrStr.split(":")[1], 10), 0, 0);
        nextPrayer = { name: "Fajr", timeStr: fajrStr, nextDate: fajrDate };
      } catch (e) {
        UI.hideNextPrayer();
        Storage.remove("nextPrayer");
        return;
      }
    } else {
      UI.hideNextPrayer();
      Storage.remove("nextPrayer");
      return;
    }
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
