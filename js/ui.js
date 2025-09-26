import { PRAYER_NAMES, CONTINENTS, CALCULATION_METHODS } from "./config.js";
import { formatToHHMMSS, getDayLabel } from "./utils.js";

const elements = {
  continentSelect: document.getElementById("continent"),
  countrySelect: document.getElementById("country"),
  citySelect: document.getElementById("city"),
  methodSelect: document.getElementById("method"),
  loadButton: document.getElementById("load"),
  errorBox: document.getElementById("error"),
  prayerTable: document.getElementById("prayer-table"),
  prayerTableBody: document.querySelector("#prayer-table tbody"),
  nextPrayerName: document.getElementById("next-prayer-name"),
  nextPrayerTime: document.getElementById("next-prayer-time"),
  nextPrayerCountdown: document.getElementById("next-prayer-countdown"),
  nextPrayerWrapper: document.getElementById("next-prayer-wrapper"),
  resetButton: document.getElementById("reset"),
};

function clearChildren(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

function setSelectOptions(
  selectEl,
  list,
  valueKey = "value",
  labelKey = "label"
) {
  clearChildren(selectEl);
  list.forEach((item) => {
    const opt = document.createElement("option");
    opt.value = item[valueKey];
    opt.textContent = item[labelKey];
    selectEl.appendChild(opt);
  });
  selectEl.disabled = false;
}

function setSelectLoading(selectEl, loadingText = "Loading...") {
  clearChildren(selectEl);
  const opt = document.createElement("option");
  opt.value = "";
  opt.textContent = loadingText;
  selectEl.appendChild(opt);
  selectEl.disabled = true;
}

function setSelectEmpty(selectEl, emptyText = "Select...") {
  clearChildren(selectEl);
  const opt = document.createElement("option");
  opt.value = "";
  opt.textContent = emptyText;
  selectEl.appendChild(opt);
  selectEl.disabled = true;
}

export function populateContinentSelect() {
  const items = CONTINENTS.map((c) => ({ value: c, label: capitalize(c) }));
  setSelectOptions(elements.continentSelect, items, "value", "label");
}

export function populateMethodSelect(defaultId = 2) {
  const items = CALCULATION_METHODS.map((m) => ({
    value: m.id,
    label: m.name,
  }));
  setSelectOptions(elements.methodSelect, items, "value", "label");
  elements.methodSelect.value = String(defaultId);
}

export function showError(message) {
  elements.errorBox.textContent = message || "";
  elements.errorBox.classList.remove("hidden");
}

export function hideError() {
  elements.errorBox.textContent = "";
  elements.errorBox.classList.add("hidden");
}

/* ---------- Select State ---------- */
export function showCountriesLoading() {
  setSelectLoading(elements.countrySelect, "Loading countries...");
  setSelectEmpty(elements.citySelect);
  elements.loadButton.disabled = true;
}

export function showCitiesLoading() {
  setSelectLoading(elements.citySelect, "Loading cities...");
  elements.loadButton.disabled = true;
}

export function renderCountries(countries) {
  setSelectOptions(
    elements.countrySelect,
    countries.map((c) => ({ value: c, label: c })),
    "value",
    "label"
  );
  setSelectEmpty(elements.citySelect);
  elements.loadButton.disabled = true;
}

export function renderCities(cities) {
  setSelectOptions(
    elements.citySelect,
    cities.map((c) => ({ value: c, label: c })),
    "value",
    "label"
  );
  elements.loadButton.disabled = !elements.citySelect.value;
}

export function renderPrayerTable(timings) {
  clearChildren(elements.prayerTableBody);
  PRAYER_NAMES.forEach((prayer) => {
    const tr = document.createElement("tr");
    const tdName = document.createElement("td");
    tdName.textContent = prayer;
    const tdTime = document.createElement("td");
    tdTime.textContent = timings[prayer] || "-";
    tr.appendChild(tdName);
    tr.appendChild(tdTime);
    elements.prayerTableBody.appendChild(tr);
  });
}

export function showNextPrayer({ name, timeStr, nextDate, countdownSeconds }) {
  if (!name || !timeStr || !nextDate) return hideNextPrayer();
  elements.nextPrayerName.textContent = name;
  elements.nextPrayerTime.textContent = `${timeStr} (${getDayLabel(nextDate)})`;
  elements.nextPrayerCountdown.textContent = formatToHHMMSS(countdownSeconds);
}

export function updateNextPrayerCountdown(countdownSeconds) {
  elements.nextPrayerCountdown.textContent = formatToHHMMSS(countdownSeconds);
}

export function hideNextPrayer() {
  elements.nextPrayerName.textContent = "";
  elements.nextPrayerTime.textContent = "";
  elements.nextPrayerCountdown.textContent = "";
}

export function enableLoadButtonIfReady() {
  const ready =
    elements.continentSelect.value &&
    elements.countrySelect.value &&
    elements.citySelect.value;
  elements.loadButton.disabled = !ready;
}

function capitalize(str) {
  return str ? str[0].toUpperCase() + str.slice(1) : "";
}

export function getDOMElements() {
  return elements;
}
