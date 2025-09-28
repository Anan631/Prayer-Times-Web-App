export function padTwoDigits(num) {
  return String(num).padStart(2, '0');
}

export function formatToHHMMSS(totalSeconds) {
  if (totalSeconds <= 0) return '00:00:00';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${padTwoDigits(h)}:${padTwoDigits(m)}:${padTwoDigits(s)}`;
}

export function parseTimeStringToToday(timeStr) {
  const m = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const hours = parseInt(m[1], 10);
  const minutes = parseInt(m[2], 10);
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
}

export function getDayLabel(dateObj) {
  if (!dateObj) return '';
  const now = new Date();
  const todayYMD = [now.getFullYear(), now.getMonth(), now.getDate()].join('-');
  const dYMD = [dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()].join('-');
  if (todayYMD === dYMD) return 'today';
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const tYMD = [tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate()].join('-');
  if (dYMD === tYMD) return 'tomorrow';
  return dateObj.toLocaleDateString();
}

export async function fetchJson(url, opts = {}) {
  const res = await fetch(url, opts);
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Network error: ${res.status} ${res.statusText} ${txt}`);
  }
  return await res.json();
}

export function debounce(fn, wait = 200) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}