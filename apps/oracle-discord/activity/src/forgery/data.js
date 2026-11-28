// The Forgery Desk: documents arrive claiming a date. Examine their ink, paper and words with UV lamp, loupe and
// dictionary; each test shows when that thing first existed. One feature too new for the date marks a forgery. The
// documents are made up for the game; every feature and every date is real.

/** Features a document can show. tool: uv | lens | dict. seen: what you notice. found: what the test shows. year: first known. */
export const FEATURES = [
  { id: "mauve", tool: "uv", seen: "Bright purple ink", found: "Mauveine, the first synthetic dye, made by William Perkin in 1856.", year: 1856 },
  { id: "brightener", tool: "uv", seen: "The paper glows bright blue under UV", found: "Optical brighteners, added to paper from about 1950.", year: 1950 },
  { id: "ballpoint", tool: "uv", seen: "A smooth, slightly greasy ink line", found: "Ballpoint ink. László Bíró patented his pen in 1938.", year: 1938 },
  { id: "tiwhite", tool: "uv", seen: "A brilliant white paint", found: "Titanium white, sold as a pigment from 1916.", year: 1916 },
  { id: "prussian", tool: "uv", seen: "A deep blue wash", found: "Prussian blue, the first modern synthetic pigment, from about 1706.", year: 1706 },
  { id: "irongall", tool: "uv", seen: "Brown-black ink, faded at the edges", found: "Iron gall ink, used from late antiquity into the 1900s.", year: 400 },
  { id: "emerald", tool: "uv", seen: "A vivid green paint", found: "Emerald green, a copper and arsenic pigment made from 1814.", year: 1814 },
  { id: "cobalt", tool: "uv", seen: "A bright blue paint", found: "Cobalt blue, found by Louis Jacques Thénard in 1802.", year: 1802 },
  { id: "woodpulp", tool: "lens", seen: "Paper of short brown fibres", found: "Wood-pulp paper. Friedrich Keller made paper from ground wood in 1844.", year: 1844 },
  { id: "watermark", tool: "lens", seen: "Faint chain lines and a watermark", found: "Rag paper with a watermark. The oldest known watermarks were made in Italy in 1282.", year: 1282 },
  { id: "typed", tool: "lens", seen: "Even, typed letters", found: "A typewriter. The first to sell well was the Sholes and Glidden of 1874.", year: 1874 },
  { id: "steelnib", tool: "lens", seen: "Fine split strokes from a stiff nib", found: "A steel nib. Mass production began in Birmingham in 1822.", year: 1822 },
  { id: "stamp", tool: "lens", seen: "A small black stamp with a young queen's head", found: "The Penny Black, the first adhesive postage stamp, 1840.", year: 1840 },
  { id: "tape", tool: "lens", seen: "A strip of clear sticky tape", found: "Clear cellulose tape, made by Richard Drew at 3M in 1930.", year: 1930 },
  { id: "pencil", tool: "lens", seen: "Pencil notes in the margin", found: "A graphite pencil. Conrad Gessner described one in 1565.", year: 1565 },
  { id: "printed", tool: "lens", seen: "A printed heading in neat type", found: "Printing with movable metal type, begun in Europe by Gutenberg about 1450.", year: 1450 },
  { id: "photo", tool: "lens", seen: "A photograph pinned to the page", found: "Photography. Daguerre's process was announced in 1839.", year: 1839 },
  { id: "scientist", tool: "dict", seen: "The word “scientist”", found: "Coined by William Whewell in 1833.", year: 1833 },
  { id: "ok", tool: "dict", seen: "The word “OK”", found: "First printed in a Boston newspaper in 1839.", year: 1839 },
  { id: "dinosaur", tool: "dict", seen: "The word “dinosaur”", found: "Coined by Richard Owen in 1842.", year: 1842 },
  { id: "robot", tool: "dict", seen: "The word “robot”", found: "From Karel Čapek's play R.U.R., written in 1920.", year: 1920 },
  { id: "teenager", tool: "dict", seen: "The word “teenager”", found: "First recorded in the early 1940s.", year: 1941 },
  { id: "serendipity", tool: "dict", seen: "The word “serendipity”", found: "Coined by Horace Walpole in 1754.", year: 1754 },
  { id: "electricity", tool: "dict", seen: "The word “electricity”", found: "First used in English by Thomas Browne in 1646.", year: 1646 },
  { id: "boycott", tool: "dict", seen: "The word “boycott”", found: "From Captain Charles Boycott, shunned by his Irish neighbours in 1880.", year: 1880 },
  { id: "agnostic", tool: "dict", seen: "The word “agnostic”", found: "Coined by Thomas Huxley in 1869.", year: 1869 },
  { id: "spectacles", tool: "dict", seen: "A mention of spectacles", found: "Eyeglasses were invented in Italy around 1286.", year: 1286 },
  { id: "newstyle", tool: "dict", seen: "A date marked “New Style”", found: "New Style means the Gregorian calendar, which began in 1582.", year: 1582 },
  { id: "metre", tool: "dict", seen: "A length given in metres", found: "The metre was set in France in 1793.", year: 1793 },
  { id: "zip", tool: "dict", seen: "A ZIP code in the address", found: "US ZIP codes began in 1963.", year: 1963 },
];
export const featureOf = (id) => FEATURES.find((f) => f.id === id);
export const TOOLS = { uv: { e: "🔦", name: "UV lamp" }, lens: { e: "🔍", name: "Loupe" }, dict: { e: "📖", name: "Dictionary" } };

/** Documents (made up for the game) and the year each claims. */
export const DOCS = [
  { id: "ledger", name: "A merchant's ledger", year: 1610 },
  { id: "philosopher", name: "A natural philosopher's letter", year: 1690 },
  { id: "surgeon", name: "A ship's surgeon's letter", year: 1805 },
  { id: "notebook", name: "A scientist's notebook", year: 1838 },
  { id: "explorer", name: "An explorer's journal", year: 1848 },
  { id: "soldier", name: "A soldier's letter home", year: 1863 },
  { id: "inventor", name: "An inventor's letter", year: 1885 },
  { id: "suffragette", name: "A suffragette's diary", year: 1912 },
  { id: "postcard", name: "A seaside postcard", year: 1925 },
  { id: "telegram", name: "A wartime telegram", year: 1944 },
  { id: "report", name: "A school report", year: 1958 },
];

/** Real forgeries caught by anachronism: shown after a round and in the Study. */
export const CASES = [
  { id: "donation", name: "The Donation of Constantine", fact: "In 1440 Lorenzo Valla showed this papal title deed was forged: its Latin was centuries too late for Constantine." },
  { id: "hitler", name: "The 'Hitler Diaries'", fact: "Bought by Stern magazine in 1983, then exposed within weeks: tests found paper whitener and threads made after the war." },
  { id: "vinland", name: "The Vinland Map", fact: "In 2021 Yale announced its map was a forgery: the ink contains titanium, not used in pigments before the 1920s." },
  { id: "ossian", name: "The poems of Ossian", fact: "James Macpherson's 'ancient Gaelic' epic of the 1760s was largely his own work, as critics such as Samuel Johnson argued." },
  { id: "salamander", name: "The Salamander Letter", fact: "Mark Hofmann forged this 1830 letter in the 1980s. Examiners later found his ink had cracked in a way that pointed to artificial ageing." },
];

/** Margin in years: genuine features are at least this much older than the claimed date, the slip this much newer. */
export const MARGIN = 5;
export const LEVELS = [
  { n: 1, name: "The junior examiner", what: "3 clues a document, every one forged", feats: 3, genuine: 0, tests: 10, mult: 1 },
  { n: 2, name: "The auction house", what: "4 clues, some documents genuine", feats: 4, genuine: 2, tests: 8, mult: 1.5 },
  { n: 3, name: "The national archive", what: "4 clues, some genuine, fewer tests", feats: 4, genuine: 2, tests: 5, mult: 2 },
];
export const ROUND = 5, REP = 3;
