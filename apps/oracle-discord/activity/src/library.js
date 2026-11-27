// "Go and read a book": after a lost round, sometimes the current host pokes fun by recommending a real book that the
// Science is Magic server hosts in its 📚 library forums (titles copied from the forums on 2026-11-27). Each game has
// books on its subject; each host says it in their own voice. Shared by every House.
export const FORUMS = {
  arcana: { name: "📚・arcana", id: "1530612641159057568" },
  apothecary: { name: "📚・apothecary", id: "1532571853288116305" },
  martial: { name: "📚・martial-ways", id: "1532796824384045156" },
  hearth: { name: "📚・hearth", id: "1532799364207214592" },
  qigong: { name: "📚・qi-gong", id: "1543722574029004901" },
};
export const GUILD = "1530029383404884069";
/** Books on the server's shelves. short = how a host names it out loud. */
export const BOOKS = {
  silberer: { short: "Silberer's Hidden Symbolism of Alchemy and the Occult Arts (1914)", forum: "arcana" },
  sherman: { short: "Sherman's The Chemistry of Food and Nutrition", forum: "apothecary" },
  fernie: { short: "Fernie's Herbal Simples (1895)", forum: "apothecary" },
  daniel: { short: "Florence Daniel's Food Remedies", forum: "apothecary" },
  artofwar: { short: "The Art of War by Sun Tzu", forum: "martial" },
  besant: { short: "Annie Besant's Death and After? (1893)", forum: "arcana" },
  panchadasi: { short: "Clairvoyance and Occult Powers by Swami Panchadasi (1916)", forum: "arcana" },
  frazer: { short: "Frazer's The Golden Bough", forum: "arcana" },
  hall: { short: "Manly P. Hall's The Secret Teachings of All Ages (1928)", forum: "arcana" },
  emerald: { short: "The Emerald Tablet of Hermes Trismegistus", forum: "arcana" },
  mathers: { short: "Mathers' The Kabbalah Unveiled (1887)", forum: "arcana" },
  cambridge: { short: "The Cambridge Book of Magic, translated by Francis Young", forum: "arcana" },
  dreams: { short: "Miller's What's in a Dream (1901)", forum: "arcana" },
  blavatsky: { short: "Blavatsky's The Secret Doctrine, Vol. 1: Cosmogenesis (1888)", forum: "arcana" },
  reade: { short: "Reade's The Veil of Isis; or, Mysteries of the Druids (1861)", forum: "arcana" },
  kybalion: { short: "The Kybalion", forum: "arcana" },
  crystal: { short: "Sepharial's How to Read the Crystal", forum: "arcana" },
  tealeaves: { short: "The Art of Fortune Telling by Tea Leaves", forum: "arcana" },
};
/** Game room -> books on its subject. Rooms not listed get the general shelf. */
export const ROOM_BOOKS = {
  alchemy: ["silberer", "sherman"], bench: ["silberer", "sherman"], flametest: ["sherman", "silberer"], minerals: ["silberer", "sherman"], commissions: ["silberer", "sherman"], fireworks: ["sherman", "silberer"], leadgold: ["silberer", "sherman"],
  duel: ["artofwar", "sherman"], grimoire: ["fernie", "daniel"],
  seance: ["besant", "panchadasi"], casefiles: ["panchadasi", "besant"], workshop: ["panchadasi", "crystal"], bookings: ["besant", "panchadasi"], darkseance: ["besant", "panchadasi"], mentalist: ["panchadasi", "crystal"], phantasmagoria: ["besant", "crystal"], roguesgallery: ["besant", "panchadasi"],
  timeline: ["frazer", "hall"], decoder: ["emerald", "mathers"], cipherdesk: ["mathers", "emerald"], inscriptions: ["emerald", "mathers"], memory: ["cambridge", "dreams"],
  stars: ["blavatsky", "reade"], watch: ["blavatsky", "reade"], comet: ["blavatsky", "reade"], eclipse: ["blavatsky", "reade"], navigator: ["reade", "blavatsky"], messier: ["blavatsky", "reade"], starparty: ["reade", "blavatsky"], calendar: ["reade", "frazer"], rummy: ["artofwar", "blavatsky"],
};
const SHELF = ["kybalion", "hall", "crystal", "tealeaves"];
/** Each host's way of saying it. {book}, {forum}, {name}. */
export const POKES = {
  oracle: ["The cards have spoken, {name}: read {book}. It's waiting in #{forum}.", "Wrong, darling. {book} is in #{forum}. Just saying."],
  alchemist: ["Wrong result, {name}. Lab homework: {book}, in #{forum}.", "No reaction. Read {book} first. It's in #{forum}."],
  observatory: ["Clouded out, {name}. Tonight's reading: {book}, in #{forum}.", "Missed it. {book} is in #{forum}. Bring a red torch."],
  parlour: ["The spirits suggest {book}, darling. It's in #{forum}.", "Wrong! Even mediums studied. Try {book}, in #{forum}."],
  scriptorium: ["Not quite, {name}. Copy out {book}. It's shelved in #{forum}.", "A blot! The cure is {book}, in #{forum}."],
};
export const POKE_CHANCE = 0.3, POKE_GAP = 180000; // about 1 lost round in 3, and never twice within 3 minutes
let last = -Infinity;
/** After a lost round: a book poke in this host's voice, or null (most of the time). */
export function bookPoke(hostId, room, name = "traveller", { rand = Math.random, now = Date.now() } = {}) {
  if (now - last < POKE_GAP || rand() >= POKE_CHANCE) return null;
  const ids = ROOM_BOOKS[room] || SHELF, b = BOOKS[ids[Math.floor(rand() * ids.length)]], T = POKES[hostId] || POKES.oracle;
  last = now;
  return T[Math.floor(rand() * T.length)].replace("{book}", b.short).replace("{forum}", FORUMS[b.forum].name).replace(/\{name\}/g, name);
}
export const _resetPoke = () => { last = -Infinity; };
