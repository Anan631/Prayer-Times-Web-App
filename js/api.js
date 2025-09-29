import { API_ENDPOINTS } from "./config.js";

const cityCache = new Map();

export async function fetchCountries(continent) {
  const res = await fetch(API_ENDPOINTS.countriesByContinent(continent));
  if (!res.ok) throw new Error("Failed to fetch countries");
  const data = await res.json();
  return data.map((c) => c.name.common).sort();
}

export async function fetchCities(country) {
  if (cityCache.has(country)) return cityCache.get(country);

  const res = await fetch(API_ENDPOINTS.citiesByCountry, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ country }),
  });
  if (!res.ok) throw new Error("Failed to fetch cities");
  const json = await res.json();
  const data = json.data;
  if (!Array.isArray(data)) throw new Error("Cities not found");

  cityCache.set(country, data.sort());
  return data;
}

export async function fetchPrayerTimes(city, country, methodId) {
  const url = `${API_ENDPOINTS.prayerTimes}?city=${encodeURIComponent(
    city
  )}&country=${encodeURIComponent(country)}&method=${methodId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch prayer times");
  const { data } = await res.json();
  if (!data?.timings) throw new Error("Failed to fetch prayer times");
  return data.timings;
}

export async function fetchPrayerTimesByDate(city, country, methodId, dateDdMmYyyy) {
  const url = `${API_ENDPOINTS.prayerTimes}?city=${encodeURIComponent(
    city
  )}&country=${encodeURIComponent(country)}&method=${methodId}&date=${encodeURIComponent(dateDdMmYyyy)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch prayer times");
  const { data } = await res.json();
  if (!data?.timings) throw new Error("Failed to fetch prayer times");
  return data.timings;
}