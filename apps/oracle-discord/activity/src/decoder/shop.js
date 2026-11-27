// The Decoder's shelf in the Essence store: tablets, the surface each inscription is laid on in the Decoder.
// room.js attaches it as room.shop (with the try-on preview); main.js registers it with store.js registerShelf.
// Buying or using one sets prog.tablet, which room.js reads when the Decoder opens.

const T = (id, name, note, price, sample) => ({ id: "tab-" + id, kind: "tablet", name, note, price, sample });
export const tabletOf = (id) => String(id || "tab-starlit").replace(/^tab-/, "");
export const SHOP = {
  kind: "tablet", label: "🗝️ Decoder tablets",
  items: [
    T("starlit", "Starlit slate", "The Chamber's own night-sky table", 0, "r1"),
    T("birch", "Carved birch board", "Runes cut across pale wood grain, like most runes ever written", 60, "r4"),
    T("ochre", "Red-ochre runestone", "Grey granite with runes painted red, as carvers did", 90, "r3"),
    T("ogham", "Standing stone at dawn", "Lichen-spotted stone, chalk-white notches", 90, "o4"),
    T("papyrus", "Scribe's papyrus", "Black ink with red for headings, on woven reed", 100, "e2"),
    T("lapis", "Lapis tomb wall", "Deep blue with gold leaf, fit for a pharaoh", 120, "e4"),
    T("jade", "Jade stela", "Polished green jade, the Maya's most precious stone", 120, "m3"),
    T("bracteate", "Gold bracteate", "Stamped gold, like the charm pendants of the north", 150, "r2"),
  ],
  talk: {
    open: ["Tablets! The same old words read differently on wood, stone or gold. Scribes were very particular.", "Every script deserves a proper surface. Papyrus for gossip, granite for kings.", "Pick a tablet and the Decoder lays every inscription on it. The glyphs don't mind. Mostly."],
    tryon: ["The {item}… I can almost smell the carving dust.", "Ooh, the {item}. Champollion would have wept.", "Picture every rune and glyph on the {item}. Very scholarly. Very you.", "The {item} suits the old letters. They feel at home."],
    buy: ["The {item} is yours. The Decoder will use it from now on.", "Sold! Every inscription will be laid on the {item}.", "The {item}! A scribe's dream. Mind the edges."],
  },
};
