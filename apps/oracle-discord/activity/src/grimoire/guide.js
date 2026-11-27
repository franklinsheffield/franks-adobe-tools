// Herbalist's Grimoire study guides: one per level, covering what its questions ask (how to tell plants apart, where the
// folklore came from, how science tests a herb, and how to stay safe). Original text for Science is Magic.
// Markup is limited to <b> and <i>; rendered by room.js.

export const NOT_ADVICE = "Science is Magic games are for learning only. Nothing here is medical advice. Never eat, drink or rub on any plant because of a game: ask a doctor, pharmacist or qualified expert first.";
export const POISON_HELP = "If someone may have eaten a poisonous plant, call your local emergency number or poison centre now (in the US, Poison Help is 1-800-222-1222; in the UK, call 111, or 999 in an emergency). Keep a piece of the plant to show them, and don't wait for symptoms.";

export const GUIDES = {
  1: { title: "Kitchen garden study guide", sections: [
    { h: "How to read a plant", p: [
      "Botanists identify plants by <b>several features at once</b>, never just one. Look at the <b>leaves</b> (simple or split into leaflets, smooth or toothed edges, paired or alternate), the <b>flowers</b> (how many petals, what shape, how they are arranged), the <b>stem</b> and the <b>underground parts</b>.",
      "Smell is a real clue too. Rub a leaf: many herbs store their scent in tiny <b>oil glands</b> on the leaf surface.",
      "A pressed, labelled plant is called a <b>herbarium specimen</b>. Herbaria, like the one at Kew with about 7 million specimens, are libraries of plants that scientists still use to check identifications.",
    ] },
    { h: "Families in your kitchen", p: [
      "<b>Mint family (Lamiaceae)</b>: square stems, leaves in pairs, scented oils. Sage, rosemary, lavender, thyme and peppermint are all in it.",
      "<b>Carrot family (Apiaceae)</b>: flowers in flat umbrellas called <b>umbels</b>, often feathery leaves. Fennel, dill, parsley and carrot, but also <b>poison hemlock</b>, one of the deadliest plants in Europe. This family is the classic forager's trap.",
      "<b>Daisy family (Asteraceae)</b>: each 'flower' is really a head of many tiny florets. Chamomile, dandelion and marigold. Allergies often run across the whole family.",
      "<b>Ginger family</b>: ginger and turmeric, both from knobbly underground stems called <b>rhizomes</b>. <b>Onion family</b>: garlic, which grows from a bulb.",
    ] },
    { h: "Why herbs smell", p: [
      "Plants make scented oils mostly for <b>defence</b>: they put off insects, grazing animals and fungi. Some also attract pollinators.",
      "Some of the main compounds: <b>menthol</b> (peppermint), <b>thymol</b> (thyme), <b>linalool</b> (lavender), <b>anethole</b> (fennel), <b>allicin</b> (garlic, made only when it is crushed) and <b>curcumin</b>, the yellow of turmeric.",
    ] },
    { h: "Food amounts and medicine amounts", p: [
      "The doctor Paracelsus (1493–1541) wrote that everything is poison and nothing is without poison: <b>the dose makes the poison</b>. A pinch of sage in stuffing is food; a bottle of sage oil can cause seizures.",
      "<b>Essential oils</b> are hugely concentrated. Never swallow them, keep them away from babies and pets, and dilute them before they touch skin.",
      "Some garden plants are simply poisonous: <b>daffodil</b> bulbs look like onions, and <b>lily of the valley</b> leaves look like wild garlic. Both mix-ups have put people in hospital.",
    ] },
    { h: "Folklore in the kitchen", p: [
      "Old beliefs often came from something real. Rosemary's link to memory may come from its strong, lasting smell; garlic's power against evil, from its strong taste and long use as a food that keeps.",
      "Some came from the <b>Doctrine of Signatures</b>, the idea that a plant's look shows what it cures (spotted lungwort leaves for lungs). It has <b>no scientific basis</b>, though it sometimes led people to plants that were tested later.",
    ] },
    { h: "Staying safe", p: [NOT_ADVICE, POISON_HELP] },
  ] },
  2: { title: "Apothecary's meadow study guide", sections: [
    { h: "From folk remedy to medicine", p: [
      "<b>Dioscorides</b>, a Greek army doctor, wrote <i>De Materia Medica</i> around 50–70 CE, describing about 600 plants. It was copied and used for 1,500 years.",
      "<b>Hildegard of Bingen</b> (12th century) wrote on plants and healing; <b>Nicholas Culpeper</b>'s herbal of 1652 linked each herb to a planet, mixing medicine with astrology.",
      "Then came testing. <b>Edward Stone</b> tried willow bark on fever patients (1763). <b>William Withering</b> spent ten years testing foxglove (1785). <b>Friedrich Sertürner</b> isolated morphine from the opium poppy (about 1804), and chemists began pulling pure <b>active compounds</b> out of plants.",
      "In 1897 <b>Felix Hoffmann</b> at Bayer made acetylsalicylic acid, a gentler cousin of the salicin in willow bark: <b>aspirin</b>.",
    ] },
    { h: "How science tests a herb", p: [
      "1. Find the <b>active compound</b> and measure how much is in each product. Herbal products can vary wildly.",
      "2. Run a <b>randomised controlled trial</b>: people are randomly given the herb or a <b>placebo</b> (a dummy), and ideally neither they nor the researchers know which (<b>double-blind</b>).",
      "3. Combine many trials in a <b>systematic review</b>. Cochrane reviews are a well-known example.",
      "This game's evidence badges: <b>✅ Real effect, well studied</b> (works, and we know why), <b>🟡 Some evidence, not settled</b> (some trials positive, more needed), <b>❔ Little or no good evidence</b>.",
    ] },
    { h: "Natural is not the same as safe", p: [
      "<b>Interactions</b>: St John's wort speeds up liver enzymes and can make the pill, HIV drugs and transplant drugs fail.",
      "<b>Hidden toxins</b>: comfrey's pyrrolizidine alkaloids damage the liver; raw elder contains compounds that release cyanide.",
      "<b>Allergies</b>: daisy-family plants (chamomile, feverfew, echinacea, yarrow, calendula) can set off ragweed allergies.",
      "<b>Lookalikes</b>: before it flowers, deadly foxglove can be confused with comfrey. Always tell a doctor or pharmacist about any herbal product you take.",
    ] },
    { h: "Reading the meadow", p: [
      "<b>Foxglove</b>: a spire of speckled purple bells hanging to one side. <b>Comfrey</b>: curled clusters of small bells on hairy stems.",
      "<b>Elder</b>, <b>yarrow</b> and <b>valerian</b> all have flat or domed heads of tiny pale flowers, like the deadly carrot family. Leaves and stems tell them apart: elder is a shrub with leaflets in pairs, yarrow has feathery leaves, valerian is tall with leaves split into narrow leaflets.",
      "<b>St John's wort</b>: hold a leaf to the light and look for see-through dots. <b>Nettle</b>: you'll know.",
    ] },
    { h: "Staying safe", p: [NOT_ADVICE, POISON_HELP] },
  ] },
  3: { title: "Poison garden study guide", sections: [
    { h: "The dose makes the poison", p: [
      "Many of the deadliest plants gave us life-saving medicines, because a compound strong enough to kill is strong enough to change the body: <b>atropine</b> (deadly nightshade), <b>hyoscine</b> (henbane), <b>digoxin</b> (foxglove), <b>paclitaxel</b> (yew), <b>vincristine</b> (Madagascar periwinkle) and <b>morphine</b> (opium poppy).",
      "The difference is <b>purity and dose</b>. A doctor gives a measured amount of one pure compound; a raw plant has an unknown mix that changes from leaf to leaf and plant to plant.",
    ] },
    { h: "The nightshade family", p: [
      "<b>Solanaceae</b> includes deadly nightshade, mandrake, henbane and jimsonweed, and also tomatoes, potatoes, peppers, aubergines and tobacco.",
      "The poisonous ones are full of <b>tropane alkaloids</b>, which block <b>acetylcholine</b>, a nerve signal. Doctors' memory rhyme for the result: <i>hot as a hare, blind as a bat, dry as a bone, red as a beet, mad as a hatter</i>.",
    ] },
    { h: "Witches' flying ointments", p: [
      "Writers of the 1500s, such as Giambattista della Porta (1558), recorded 'witches' ointments' made with nightshade-family plants. Tropane alkaloids rubbed on skin can cause delirium and the feeling of flying.",
      "Historians are careful here: most accused 'witches' were ordinary people, and many confessions were made under torture. The recipes tell us what writers believed, not what accused people did.",
    ] },
    { h: "Sacred and magic herbs", p: [
      "<b>Pliny the Elder</b> (1st century CE) recorded Druids cutting mistletoe from oaks with a golden sickle, and Gaulish seers using vervain to cast lots.",
      "The Anglo-Saxon <b>Nine Herbs Charm</b> names mugwort first, 'the oldest of herbs'. Yarrow stalks are the traditional tool for casting the I Ching.",
      "Wormwood flavours absinthe. Its relative sweet wormwood led <b>Tu Youyou</b> to the malaria drug artemisinin, from a 4th-century Chinese recipe: a Nobel Prize in 2015.",
    ] },
    { h: "Poison garden rules", p: [
      "The <b>Poison Garden at Alnwick</b> in England, opened in 2005, keeps its plants behind locked gates; visitors may not touch, smell or taste them.",
      "Rules for real life: don't touch plants you don't know, wash your hands after gardening, wear gloves for monkshood and other toxic plants, keep children and pets away from berries, bulbs and clippings, and <b>never eat any wild plant</b> unless an expert has identified it. Carrot-family lookalikes kill foragers every year.",
      POISON_HELP,
    ] },
    { h: "Staying safe", p: [NOT_ADVICE] },
  ] },
};
