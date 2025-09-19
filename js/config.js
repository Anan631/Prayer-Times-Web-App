export const API_ENDPOINTS = {
  countriesByContinent: (continent) => `https://restcountries.com/v3.1/region/${continent}`,
  citiesByCountry: "https://countriesnow.space/api/v0.1/countries/cities",
  prayerTimes: "https://api.aladhan.com/v1/timingsByCity",
};

export const PRAYER_NAMES = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

export const CALCULATION_METHODS = [
  { id: 2, name: 'Islamic Society of North America (ISNA)' },
  { id: 3, name: 'Muslim World League' },
  { id: 4, name: 'Umm Al-Qura University, Makkah' },
  { id: 5, name: 'Egyptian General Authority' },
  { id: 12, name: 'Dubai, UAE' },
];

export const CONTINENTS = ['Africa', 'Americas', 'Asia', 'Europe', 'Oceania'];
