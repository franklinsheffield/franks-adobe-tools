// Calendar Keeper study guides: one per calendar plus eclipses, covering everything the puzzles ask. Original text for
// Science is Magic. Markup is limited to <b>, <i>; rendered by room.js.
export const GUIDES = {
  maya: { emoji: "🌽", title: "Maya calendars study guide", sections: [
    { h: "Three counts running at once", p: [
      "The Maya kept several calendars side by side. The three that matter most: the <b>Tzolk'in</b> (260 days), the <b>Haab'</b> (365 days) and the <b>Long Count</b>, a running total of days from a fixed starting point.",
      "A full Maya date names all of them. The start of the current era, for example, is <b>13.0.0.0.0 4 Ajaw 8 Kumk'u</b>: Long Count, then Tzolk'in, then Haab'.",
    ] },
    { h: "The Tzolk'in: 13 numbers × 20 signs", p: [
      "Each day has a <b>number from 1 to 13</b> and one of <b>20 day signs</b> (Imix, Ik', Ak'bal, K'an … Ajaw). Both move on by one every day, like two meshed gears: 1 Imix, 2 Ik', 3 Ak'bal … 13 Ben, then 1 Ix.",
      "Because 13 and 20 share no factor, every number meets every sign exactly once: <b>13 × 20 = 260 days</b> before a day repeats.",
      "The count is still alive. <b>Daykeepers</b> (<i>aj q'ij</i>) among the K'iche' and other Maya in highland Guatemala keep it today for ceremonies and naming.",
    ] },
    { h: "The Haab': the 365-day year", p: [
      "<b>18 months of 20 days</b> (Pop, Wo, Sip … Kumk'u) = 360, plus <b>Wayeb'</b>, 5 extra days thought unlucky. 360 + 5 = <b>365</b>.",
      "Days are counted from <b>0</b>: the first day of a month is its ‘seating’, so the New Year is <b>0 Pop</b>. There is no leap day, so the Haab' drifts slowly against the seasons.",
    ] },
    { h: "The Calendar Round: 52 years", p: [
      "Run the Tzolk'in and Haab' together and a given pair (say 4 Ajaw 8 Kumk'u) only returns after the lowest number both 260 and 365 divide into: <b>18,980 days</b>, which is 73 Tzolk'in rounds or <b>52 Haab' years</b>.",
      "The Aztecs kept the same pair of calendars and ended each 52-year round with the <b>New Fire ceremony</b>: every fire was put out, and a new one drilled on a hilltop. The last was held in <b>1507</b>.",
    ] },
    { h: "The Long Count", p: [
      "Units: <b>1 k'in</b> = 1 day; <b>20 k'in</b> = 1 winal; <b>18 winal</b> = 1 tun (360 days); <b>20 tun</b> = 1 k'atun (7,200); <b>20 k'atun</b> = 1 b'ak'tun (144,000 days). It is written as five numbers, b'ak'tun first: 9.12.11.5.18.",
      "Using the widely accepted <b>GMT correlation</b> (day number 584,283), 13.0.0.0.0 fell on <b>11 August 3114 BCE</b>. The count reached 13.0.0.0.0 again on <b>21 December 2012</b>, the end of a b'ak'tun, not a prediction of the end of the world.",
    ] },
    { h: "How to count", p: [
      "To move a Tzolk'in date on by <b>n</b> days: add n to the number and wrap past 13; move the sign on n places and wrap past 20. After 13 days the number is back where it was; after 20 days the sign is.",
      "To move a Haab' date: count through 20-day months, and remember Wayeb' has only 5 days.",
    ] },
  ] },
  egypt: { emoji: "🏺", title: "Egyptian calendar study guide", sections: [
    { h: "The civil year: 365 days", p: [
      "Egypt's civil calendar had <b>12 months of 30 days</b> in <b>3 seasons</b> of four months, then <b>5 extra days</b>: 360 + 5 = <b>365</b>. It is one of the simplest calendars ever made.",
      "The seasons follow the Nile: <b>Akhet</b>, the flood; <b>Peret</b>, emergence, when the fields reappeared and crops grew; <b>Shemu</b>, harvest and low water.",
      "At first months were simply numbered, like ‘month 2 of Peret’. Names such as Thoth, Phaophi and Athyr came into everyday use later. The Greek forms are used here.",
    ] },
    { h: "The five days upon the year", p: [
      "The extra days were the <b>epagomenal days</b>, in Egyptian <i>heriu renpet</i>, ‘those upon the year’. They were celebrated as the birthdays of five gods: <b>Osiris, Horus (the Elder), Set, Isis and Nephthys</b>.",
      "Plutarch tells the myth: the sky goddess Nut was forbidden to give birth on any day of the year, so Thoth won five new days from the Moon in a game, and her children were born on them.",
    ] },
    { h: "Sirius and the wandering year", p: [
      "The ideal New Year, <b>Wepet Renpet</b> (‘opening of the year’), came with the <b>heliacal rising of Sirius</b> (Egyptian <i>Sopdet</i>): the first morning it is seen again just before dawn, in July, near the start of the flood.",
      "But the real year is about <b>365¼ days</b>. With no leap day, 1 Thoth slipped <b>one day earlier every 4 years</b>, ‘wandering’ through every season. It lines up with Sirius again only after about <b>365 × 4 = 1,460 years</b>: the <b>Sothic cycle</b>.",
      "The Roman writer <b>Censorinus</b> recorded that New Year's Day and Sirius's rising fell together in <b>139 CE</b>, and that 1 Thoth fell on 25 June in 238 CE. The Keeper's desk uses the same count Ptolemy used, from the Era of Nabonassar (747 BCE), and agrees with him.",
    ] },
    { h: "Fixing the drift", p: [
      "In <b>238 BCE</b> the <b>Canopus Decree</b> of Ptolemy III ordered a sixth epagomenal day every 4 years. It was not kept up.",
      "<b>Augustus</b> imposed the leap day in the <b>20s BCE</b>, creating the fixed <b>Alexandrian calendar</b>. Astronomers still preferred the old wandering year because its days were so easy to count: Ptolemy used it, and so, centuries later, did Copernicus.",
    ] },
    { h: "The calendar today: Coptic", p: [
      "The Alexandrian calendar lives on as the <b>Coptic calendar</b> of Egypt's Christians, with the same 30-day months (Thout, Paopi, Hathor …) and the five or six days of Pi Kogi Enavot. Its years count from <b>284 CE</b>, the Era of the Martyrs.",
      "Its New Year, <b>Nayrouz</b> (1 Thout), falls on <b>11 September</b>, or 12 September in the year before a Gregorian leap year.",
    ] },
    { h: "Star clocks", p: [
      "Egyptians also told the time of night by <b>36 decans</b>, star groups that each rise at dawn for about 10 days. Tables of them are painted inside coffin lids from about 2100 BCE. 36 × 10 = 360, the twelve months.",
    ] },
  ] },
  celtic: { emoji: "🔥", title: "Celtic calendar study guide", sections: [
    { h: "Counting by nights", p: [
      "Julius Caesar wrote in <i>The Gallic War</i> (book 6) that the Gauls <b>count time by nights, not days</b>, so a day begins at nightfall. English keeps a trace in <b>‘fortnight’</b>, fourteen nights.",
      "That's why the festivals begin on the evening before: <b>Samhain on the night of 31 October</b>, the night now called Halloween.",
    ] },
    { h: "The four fire festivals", p: [
      "Early medieval Irish texts name four festivals. Three still name months in modern Irish: Samhain (November), Bealtaine (May) and Lúnasa (August).",
      "<b>Samhain</b>, 1 November: summer's end, when herds came home and the dark half of the year began. <b>Imbolc</b>, 1 February: early spring and lambing, later the feast of St Brigid. <b>Bealtaine</b>, 1 May: the start of summer, when cattle were driven between bonfires to summer pasture. <b>Lughnasadh</b>, 1 August: the start of the harvest, with fairs and games linked to the god Lugh.",
    ] },
    { h: "Cross-quarter days and the Sun", p: [
      "The four festivals fall about halfway between the solstices and equinoxes, so they are called <b>cross-quarter days</b>.",
      "The exact midpoints are when the Sun reaches <b>315°</b> (Imbolc), <b>45°</b> (Bealtaine), <b>135°</b> (Lughnasadh) and <b>225°</b> (Samhain) along the ecliptic. Those land a few days after the calendar dates, around 4 February, 5 May, 7 August and 7 November, because the seasons are not equal in length.",
      "Ireland's sky-watching is far older than the Celts: at <b>Newgrange</b>, built about 3200 BCE, the winter-solstice sunrise shines through a roof box down the passage.",
    ] },
    { h: "The Coligny calendar", p: [
      "The only surviving Celtic calendar is a <b>bronze tablet</b> found in <b>1897</b> at <b>Coligny, France</b>, from the 2nd century CE. It is written in the <b>Gaulish language</b> in Latin letters.",
      "It is <b>lunisolar</b>: 12 months of 29 or 30 days, with an extra month added twice in a <b>5-year cycle of 62 months</b> to keep step with the Sun. Each month is split into two halves, and months are marked <b>MAT</b> (good) or <b>ANM</b> (not good). The first month is <b>Samonios</b>, which some scholars link to Samhain.",
    ] },
    { h: "What is modern", p: [
      "The <b>Celtic tree calendar</b> of 13 tree months comes from <b>Robert Graves's <i>The White Goddess</i> (1948)</b>, not from ancient sources. The Oracle's /celtic reading uses it as a modern tradition.",
      "The eight-festival <b>Wheel of the Year</b>, adding the solstices and equinoxes, was put together by modern pagans in the mid-20th century.",
    ] },
  ] },
  eclipses: { emoji: "🌘", title: "Eclipses study guide", sections: [
    { h: "Why eclipses are rare", p: [
      "A <b>solar eclipse</b> needs the Moon between Sun and Earth: only at <b>new moon</b>. A <b>lunar eclipse</b> needs the Earth between Sun and Moon: only at <b>full moon</b>.",
      "Most new and full moons miss, because the Moon's orbit is <b>tilted about 5°</b>. It crosses the Sun's path at two points, the <b>nodes</b>. Eclipses happen only when a new or full moon falls near a node.",
    ] },
    { h: "Eclipse seasons", p: [
      "The Sun passes a node about every <b>173 days</b>, half an <b>eclipse year</b> (346.6 days). Each pass opens an <b>eclipse season</b> about a month long, with at least one solar eclipse and often a lunar one too.",
      "Because the two kinds need opposite phases, they come <b>about two weeks apart</b> (half a 29.5-day lunar month). Successive solar eclipses are usually <b>6 lunar months (177 days)</b> apart, sometimes 5 (148 days), and occasionally just one month in the same season.",
    ] },
    { h: "The Saros", p: [
      "After <b>223 lunar months</b>, <b>6,585⅓ days</b> (about <b>18 years 11 days 8 hours</b>), the Sun, Moon and nodes line up almost exactly as before, so an eclipse very like the last one happens again. 223 lunar months is almost exactly 242 node-to-node months and 239 near-to-far months, so even the size of the Moon matches.",
      "The extra <b>8 hours</b> let the Earth turn a third further, so each solar eclipse lands about <b>120° of longitude west</b>. After <b>three Saros</b>, the <b>exeligmos</b> (about 54 years 33 days), the leftover hours add up to a whole day and the eclipse returns to nearly the same longitude.",
      "Example: the total eclipse that crossed North America on <b>8 April 2024</b> returns on <b>20 April 2042</b>, over the western Pacific and Asia.",
    ] },
    { h: "Who predicted them", p: [
      "<b>Babylonian</b> astronomers kept eclipse records for centuries and were using the 223-month pattern by the <b>6th century BCE</b>. The name ‘Saros’ was given only in <b>1691</b> by <b>Edmond Halley</b>, from a Byzantine dictionary, the Suda: a historical mix-up.",
      "The Greek <b>Antikythera mechanism</b> (2nd or 1st century BCE, found in a shipwreck in 1901) is a geared computer with a <b>Saros dial</b> and an <b>exeligmos dial</b>.",
      "The Maya <b>Dresden Codex</b> has an eclipse table of <b>405 lunar months</b> (about 33 years) in <b>69 steps</b>, mostly <b>177 days</b> with some <b>148</b>, marking times when an eclipse was possible.",
    ] },
    { h: "Eclipses in history (Level 4)", p: [
      "Because eclipse maths runs backwards as well as forwards, an eclipse in an old text can date it to the day. Herodotus's battle that stopped when ‘day turned to night’ is dated to <b>28 May 585 BCE</b>; an Assyrian eclipse of <b>15 June 763 BCE</b> anchors the dates of the ancient Near East.",
      "Historians write dates before 1582 in the <b>Julian calendar</b>, which drifted about 3 days every 400 years. By 1504 it was <b>10 days</b> behind, so Columbus's eclipse of 29 February 1504 is 10 March in our calendar. There is also <b>no year 0</b>: 1 BCE is followed by 1 CE, so astronomers write 1 BCE as year 0 and 585 BCE as year −584.",
      "Eclipses changed science too: <b>helium</b> was first seen in the Sun's light during the eclipse of 1868, and the eclipse of <b>29 May 1919</b> showed starlight bending around the Sun, as Einstein's general relativity predicted.",
    ] },
    { h: "Where the dates here come from", p: [
      "Every eclipse and Sun position in Calendar Keeper is worked out live from the orbits of the Earth and Moon (the open-source Astronomy Engine), so the answers are real eclipses, not lookups. Times are in Universal Time, so a date can differ by one day where you live.",
    ] },
  ] },
};
export const GUIDE_ORDER = ["maya", "egypt", "celtic", "eclipses"];
