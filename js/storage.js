
const STORAGE_PREFIX = 'prayer-times-';

export function save(key, value) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.warn('Failed to save to localStorage:', err);
  }
}

export function load(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(STORAGE_PREFIX + key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (err) {
    console.warn('Failed to load from localStorage:', err);
    return defaultValue;
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(STORAGE_PREFIX + key);
  } catch (err) {
    console.warn('Failed to remove from localStorage:', err);
  }
}

export function loadAll() {
  return {
    continent: load('continent'),
    country: load('country'),
    city: load('city'),
    method: load('method')
  };
}

export function clear() {
  try {
    Object.keys(localStorage)
      .filter(key => key.startsWith(STORAGE_PREFIX))
      .forEach(key => localStorage.removeItem(key));
  } catch (err) {
    console.warn('Failed to clear localStorage:', err);
  }
}