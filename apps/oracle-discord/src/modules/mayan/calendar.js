// Maya calendar from a Gregorian date with the GMT correlation (Long Count 0.0.0.0.0 = JDN 584283 = 4 Ajaw 8 Kumk'u).
export const GMT = 584283;
export function jdn(y, m, d) {
  const a = Math.floor((14 - m) / 12), yy = y + 4800 - a, mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}
const mod = (n, m) => ((n % m) + m) % m;

export const SIGNS = [
  "Imix", "Ik'", "Ak'bal", "K'an", "Chikchan", "Kimi", "Manik'", "Lamat", "Muluk", "Ok",
  "Chuwen", "Eb", "Ben", "Ix", "Men", "K'ib", "Kaban", "Etz'nab", "Kawak", "Ajaw",
];
export const HAAB = ["Pop", "Wo", "Sip", "Sotz'", "Sek", "Xul", "Yaxk'in", "Mol", "Ch'en", "Yax", "Sak'", "Keh", "Mak", "K'ank'in", "Muwan", "Pax", "K'ayab", "Kumk'u", "Wayeb'"];
export const DIRECTIONS = [["East", "red", "#FF7A59"], ["North", "white", "#F2EEFF"], ["West", "black", "#8A80B8"], ["South", "yellow", "#FADE8C"]];

/** Tzolk'in, Haab', Long Count, Lord of the Night and trecena for a Gregorian date. */
export function mayaDate({ year, month, day }) {
  const j = jdn(year, month, day), days = j - GMT;
  const tone = mod(days + 3, 13) + 1, sign = mod(days + 19, 20);
  const hp = mod(days + 348, 365), haab = { month: Math.floor(hp / 20), day: hp % 20 };
  // kin number 1..260 counted from 1 Imix
  let kin = 0; for (let n = 0; n < 260; n++) if (n % 13 === tone - 1 && n % 20 === sign) { kin = n + 1; break; }
  const lc = []; let r = days;
  for (const u of [144000, 7200, 360, 20, 1]) { lc.push(Math.floor(r / u)); r = mod(r, u); }
  const lord = mod(days - 1, 9) + 1; // G9 on 0.0.0.0.0
  const trecenaSign = mod(sign - (tone - 1), 20); // the sign that carried tone 1 of this 13-day week
  const dayInTrecena = tone;
  return { jdn: j, days, tone, sign, signName: SIGNS[sign], kin, haab, haabName: `${haab.day} ${HAAB[haab.month]}`, longCount: lc, lord, trecenaSign, dayInTrecena, direction: DIRECTIONS[sign % 4] };
}

/** Days until a given sign next returns with tone, from today (for "your next birthday in the sacred calendar"). */
export function nextKinReturn(kin, today) {
  const t = mayaDate(today);
  return mod(kin - t.kin, 260);
}
