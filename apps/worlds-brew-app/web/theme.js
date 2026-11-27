// Pixel Scape web build: the weekly build theme. Everyone sees the same theme for an ISO week (Monday to Sunday,
// UTC), and posted renders carry it in their caption so server mods can spot theme builds and award points.
export const THEMES = [
  "Floating islands", "Lost city", "Moon base", "Desert oasis", "Crystal cave", "Volcano island", "Sunken ship",
  "Mountain temple", "Alien garden", "Winter village", "Canyon bridge", "Lighthouse coast", "Ancient ruins",
  "Neon night", "Waterfall valley", "Castle on a hill", "Space station", "Mushroom forest", "Pirate cove",
  "Your home town", "Observatory", "Tiny planet", "Stone circle", "Wizard tower",
];
// ISO 8601 week number and its year (week 1 holds the year's first Thursday)
export function isoWeek(d = new Date()) {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())), day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = t.getUTCFullYear(), w = Math.ceil(((t - Date.UTC(y, 0, 1)) / 864e5 + 1) / 7);
  return { year: y, week: w };
}
export function weekTheme(d = new Date()) {
  const { year, week } = isoWeek(d);
  return { year, week, name: THEMES[(year * 53 + week) % THEMES.length] };
}
export const themeCaption = (name, d) => "Weekly theme: " + weekTheme(d).name + (name ? " | " + name : "");
