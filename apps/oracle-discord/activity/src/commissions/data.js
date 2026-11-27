// Commissions: step 3 of the Alchemist's House core loop (Cabinet -> Bench -> Commissions). Real clients ask for real
// Bench products, for the real jobs those products did. Each job's `wants` is a Discovery Bench product id.
// Tiers are the reputation ladder: Village -> Guild -> Royal Society.
export const TIERS = [
  { n: 1, id: "village", name: "Village", emoji: "🏘️", at: 0, rep: 1, pay: 8, stones: 1 },
  { n: 2, id: "guild", name: "Guild", emoji: "⚒️", at: 5, rep: 2, pay: 15, stones: 2 },
  { n: 3, id: "royal", name: "Royal Society", emoji: "👑", at: 15, rep: 3, pay: 25, stones: 3 },
];
const J = (id, tier, who, e, wants, ask, why) => ({ id, tier, who, e, wants, ask, why });
export const JOBS = [
  // Village
  J("v-cottage", 1, "The cottager", "🏡", "limewash", "My walls want a fresh coat before the frost.", "Limewash was the standard paint for cottages, barns and dairies for centuries; it is mildly antiseptic and lets old walls breathe."),
  J("v-mason", 1, "The mason", "🧱", "mortar", "I'm rebuilding the churchyard wall and I need mortar.", "Lime mortar held stone and brick together from Roman times until Portland cement took over in the 1800s."),
  J("v-laundry", 1, "The laundress", "🧺", "soap", "Wash day is tomorrow and I'm out of soap.", "Soap was boiled from fat and lye; the oldest known soap recipe is on a Babylonian clay tablet from about 2800 BCE."),
  J("v-vines", 1, "The vine grower", "🍇", "bordeaux", "Mildew is on my vines. The old men say there's a blue spray for it.", "Bordeaux mixture (copper sulfate and lime) was found to stop downy mildew on French vines in the 1880s, and is still used by organic growers."),
  J("v-clerk", 1, "The parish clerk", "📜", "ink", "The register needs ink that will last a hundred years.", "Iron gall ink was the main writing ink of Europe for over a thousand years; many old documents, including the US Declaration of Independence, are written in it."),
  J("v-tinker", 1, "The tinker", "🫖", "solder", "Half the village has leaking kettles. I need solder.", "Tin-lead solder melts at a low temperature, so tinkers could seal pots and kettles over a small fire."),
  J("v-painter", 1, "The sign painter", "🖌️", "ochre", "The inn wants a new sign, painted red.", "Red ochre is iron oxide from the earth, and one of the oldest pigments: people used it in cave art tens of thousands of years ago."),
  J("v-smith", 1, "The blacksmith", "⚒️", "steel", "Iron's too soft for a good scythe. Bring me steel.", "Steel is iron with a little carbon; it holds a sharp edge that plain wrought iron cannot."),
  J("v-inn", 1, "The innkeeper", "🍺", "pewter", "My tankards are bent. I need pewter to cast new ones.", "Pewter is mostly tin, sometimes hardened with antimony or copper; it was the everyday tableware of taverns for centuries."),
  J("v-cook", 1, "The cook", "🥒", "brine", "The cucumbers are in. Pickling brine, please.", "Salt brine draws water out and stops most rot, which is why pickling and salting kept food through the winter."),
  J("v-barber", 1, "The barber", "💈", "talcum", "My customers want powder after a shave.", "Talcum powder is ground talc, the softest mineral on the Mohs scale (1)."),
  // Guild
  J("g-bell", 2, "The bell founder", "🔔", "bronze", "The cathedral has ordered a new bell.", "Bell metal is bronze with about 22% tin: hard and ringing. Softer copper would thud."),
  J("g-horn", 2, "The instrument maker", "🎺", "brass", "Brass for a set of hunting horns, if you please.", "Brass (copper and zinc) is easy to hammer and bend, so it became the metal of horns and trumpets."),
  J("g-cast", 2, "The sculptor", "🗿", "cast", "I need a plaster cast of my clay model before it dries.", "Sculptors cast clay models in plaster of Paris to keep an exact copy; museums still hold plaster casts of famous statues."),
  J("g-glass", 2, "The glassmaker", "🍶", "glass", "Our forest furnace needs a batch of potash glass.", "Forest glass (Waldglas) was made in medieval Europe from sand and wood-ash potash, which gave it a greenish tint."),
  J("g-window", 2, "The window glazier", "🪟", "cobaltglass", "Deep blue glass for a church window.", "Cobalt oxide colours glass a deep blue; medieval stained glass used it, as did Egyptian glassmakers long before."),
  J("g-jeweller", 2, "The jeweller", "💍", "rouge", "Something fine to polish a silver chalice.", "Jeweller's rouge is very fine iron oxide; it polishes gold and silver to a mirror finish."),
  J("g-illum", 2, "The illuminator", "🎨", "vermilion", "Bright red for the capitals in a Book of Hours.", "Vermilion (mercury sulfide) was the prized red of medieval manuscripts. It is also toxic."),
  J("g-blue", 2, "The panel painter", "🖼️", "ablue", "Blue for the Virgin's robe, and not too dear.", "Azurite was the main blue of European painting in the Middle Ages, far cheaper than lapis-based ultramarine."),
  J("g-apoth", 2, "The apothecary", "⚗️", "glauber", "A purge salt for my shelves: the famous one.", "Johann Glauber described sodium sulfate in the 1600s and sold it as a laxative, his 'wonderful salt'."),
  J("g-lens", 2, "The lens grinder", "🔍", "emery", "Grit to rough out a telescope lens.", "Emery is a natural mix of corundum and iron oxides; its hardness made it the grinding powder of choice for lenses and gems."),
  J("g-pencil", 2, "The stationer", "✏️", "pencil", "Graphite leads, like the ones from Cumberland.", "A huge graphite deposit at Borrowdale in England, found around the 1560s, gave the world its first pencils."),
  // Royal Society
  J("r-mint", 3, "The Royal Mint assayer", "🪙", "regia", "We must test the purity of a gold coin.", "Aqua regia dissolves gold, which no single acid can; assayers and refiners used it to purify and test gold."),
  J("r-navy", 3, "The Navy Board", "⚓", "gunpowder", "Powder for the fleet's signal guns.", "Black powder (saltpetre, charcoal and sulfur) was the only gun propellant in the world until the late 1800s."),
  J("r-red", 3, "The Master of Fireworks", "🎆", "srcl2", "Crimson stars for the coronation fireworks.", "Strontium salts burn crimson; firework makers began using them in the 1800s and still do."),
  J("r-green", 3, "The Master of Fireworks", "🎇", "bacl2", "Now the green stars for the finale.", "Barium salts burn green, the colour you see in modern fireworks."),
  J("r-davy", 3, "The Royal Institution", "⚡", "na", "Mr Davy's lecture needs a sample of the new metal from soda.", "Humphry Davy isolated sodium by electrolysis in 1807, at the Royal Institution in London."),
  J("r-balloon", 3, "The balloonist", "🎈", "h2", "Enough inflammable air to fill a silk balloon.", "Jacques Charles flew the first hydrogen balloon in Paris in 1783, the same year as the first hot-air flights."),
  J("r-gilder", 3, "The royal gilder", "✨", "amalgam", "Gold amalgam to fire-gild the palace clock.", "Fire gilding painted gold-mercury amalgam on metal and heated it to drive off the mercury. The fumes poisoned many gilders."),
  J("r-surgeon", 3, "The surgeon", "🩺", "boric", "A mild antiseptic for dressing wounds.", "Joseph Lister, who pioneered antiseptic surgery, used boracic (boric) acid in his dressings."),
  J("r-etch", 3, "The instrument maker royal", "🌡️", "hf", "I must etch scales onto glass thermometers.", "Hydrogen fluoride is one of the few things that eats glass; it has been used to etch glass since the 1600s. It is extremely dangerous."),
  J("r-vitriol", 3, "The Society's laboratory", "🧪", "vitriol2", "Oil of vitriol for a season of experiments.", "Sulfuric acid became the most-made chemical of the industrial age; nations once measured industry by how much they made."),
];
export const job = (id) => JOBS.find((j) => j.id === id);
export const tierOf = (n) => TIERS[n - 1];
