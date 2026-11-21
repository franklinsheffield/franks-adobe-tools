"use strict";
// Palette + tone-map library. Colours are plain hex strings.

const PALETTES = [
  { id: "gameboy",   name: "Game Boy",            colors: ["#0F380F", "#306230", "#8BAC0F", "#9BBC0F"] },
  { id: "nokia",     name: "Nokia 3310",          colors: ["#43523D", "#C7F0D8"] },
  { id: "pico8",     name: "PICO-8 (16)",         colors: ["#000000", "#1D2B53", "#7E2553", "#008751", "#AB5236", "#5F574F", "#C2C3C7", "#FFF1E8", "#FF004D", "#FFA300", "#FFEC27", "#00E436", "#29ADFF", "#83769C", "#FF77A8", "#FFCCAA"] },
  { id: "sweetie16", name: "Sweetie 16",          colors: ["#1A1C2C", "#5D275D", "#B13E53", "#EF7D57", "#FFCD75", "#A7F070", "#38B764", "#257179", "#29366F", "#3B5DC9", "#41A6F6", "#73EFF7", "#F4F4F4", "#94B0C2", "#566C86", "#333C57"] },
  { id: "c64",       name: "Commodore 64",        colors: ["#000000", "#FFFFFF", "#68372B", "#70A4B2", "#6F3D86", "#588D43", "#352879", "#B8C76F", "#6F4F25", "#433900", "#9A6759", "#444444", "#6C6C6C", "#9AD284", "#6C5EB5", "#959595"] },
  { id: "apple2",    name: "Apple II",            colors: ["#000000", "#722640", "#40337F", "#E434FE", "#0E5940", "#808080", "#1B9AE5", "#BFB4FD", "#404B07", "#E46F1F", "#F1A6BF", "#1BCB01", "#BFCC80", "#8DD9BF", "#FFFFFF"] },
  { id: "ega16",     name: "EGA (16)",            colors: ["#000000", "#0000AA", "#00AA00", "#00AAAA", "#AA0000", "#AA00AA", "#AA5500", "#AAAAAA", "#555555", "#5555FF", "#55FF55", "#55FFFF", "#FF5555", "#FF55FF", "#FFFF55", "#FFFFFF"] },
  { id: "cga0",      name: "CGA palette 0",       colors: ["#000000", "#00AA00", "#AA0000", "#AA5500"] },
  { id: "cga1",      name: "CGA palette 1",       colors: ["#000000", "#55FFFF", "#FF55FF", "#FFFFFF"] },
  { id: "zx",        name: "ZX Spectrum",         colors: ["#000000", "#0000D7", "#D70000", "#D700D7", "#00D700", "#00D7D7", "#D7D700", "#D7D7D7"] },
  { id: "bw",        name: "Black & White",       colors: ["#000000", "#FFFFFF"] },
  { id: "newsprint", name: "Newsprint",           colors: ["#141414", "#6E6A63", "#BDB8AD", "#F2EFE6"] },
  { id: "sepia",     name: "Sepia",               colors: ["#2B1B0E", "#6B4A2B", "#B08A5A", "#E9D8B4"] },
  { id: "cyano",     name: "Cyanotype",           colors: ["#0B2A4A", "#1B5E8C", "#6FA8D6", "#E8F1F8"] },
  { id: "duonavy",   name: "Navy & Cream",        colors: ["#1B2A49", "#F4EBD0"] },
  { id: "riso5",     name: "Riso: Blue Pink Yellow Green Black", colors: ["#000000", "#0078BF", "#FF48B0", "#FFE800", "#00A95C"] },
  { id: "risowarm",  name: "Riso: Warm Set",      colors: ["#000000", "#FF6C2F", "#FF48B0", "#FFE800", "#765BA7"] },
  { id: "neon",      name: "Neon Night",          colors: ["#0D0221", "#FF2A6D", "#05D9E8", "#D1F7FF", "#F9C80E"] },
  { id: "pastel",    name: "Pastel",              colors: ["#F8EDEB", "#FFB5A7", "#FCD5CE", "#F9DCC4", "#FEC89A", "#D8E2DC"] },
  { id: "earth",     name: "Earth Tones",         colors: ["#2F1B0C", "#6F4E37", "#A47148", "#D9B38C", "#F2E8CF", "#606C38"] },
  { id: "sunset",    name: "Sunset",              colors: ["#2D0A31", "#6A0572", "#AB2B6E", "#F05A28", "#FFB830", "#FFF3B0"] },
  { id: "ocean",     name: "Ocean",               colors: ["#03045E", "#0077B6", "#00B4D8", "#90E0EF", "#CAF0F8"] },
  { id: "forest",    name: "Forest",              colors: ["#0B2B1D", "#1B4332", "#2D6A4F", "#52B788", "#B7E4C7", "#F1FAEE"] },
  { id: "terminal",  name: "Terminal Green",      colors: ["#000000", "#003B00", "#008F11", "#00FF41"] },
  { id: "amber",     name: "Amber CRT",           colors: ["#000000", "#3A1F00", "#A35A00", "#FFB000"] },
  { id: "vapor",     name: "Vaporwave",           colors: ["#2B0B3F", "#6A2C70", "#B83B5E", "#F08A5D", "#F9ED69", "#08D9D6"] },
  { id: "autumn",    name: "Autumn",              colors: ["#3D2B1F", "#8B4513", "#CD853F", "#DAA520", "#F5DEB3"] },
  { id: "screen6",   name: "Screen Print 6",      colors: ["#1A1A1A", "#E63946", "#F1FAEE", "#A8DADC", "#457B9D", "#FFB703"] },
  { id: "candy",     name: "Candy Shop",          colors: ["#2B2D42", "#EF233C", "#FF8FA3", "#FFD6E0", "#8D99AE", "#EDF2F4"] }
];

// Tonal ink sets: inks are stacked as tone bands (sorted light -> dark automatically)
const TONEMAPS = [
  { id: "duonavy",   name: "Navy Duotone on Cream",     inks: ["#7FA6C9", "#1B2A49"], paper: "#F4EBD0" },
  { id: "rb",        name: "Riso Pink + Blue",          inks: ["#FF48B0", "#0078BF"], paper: "#F5F0E6" },
  { id: "warm3",     name: "Warm Tri-tone",             inks: ["#FFE800", "#FF6C2F", "#6A1B3D"], paper: "#FBF4E6" },
  { id: "sunset3",   name: "Sunset Gradient",           inks: ["#FFB830", "#F05A28", "#AB2B6E", "#2D0A31"], paper: "#FFF6DC" },
  { id: "ocean3",    name: "Ocean Depth",               inks: ["#90E0EF", "#0077B6", "#03045E"], paper: "#F1FAFF" },
  { id: "forest3",   name: "Forest Floor",              inks: ["#B7E4C7", "#52B788", "#1B4332"], paper: "#F6FBF3" },
  { id: "sepia3",    name: "Sepia Photo",               inks: ["#D8B98A", "#8A6239", "#2B1B0E"], paper: "#F6EBD3" },
  { id: "neon4",     name: "Neon Night",                inks: ["#D1F7FF", "#05D9E8", "#FF2A6D", "#0D0221"], paper: "" },
  { id: "cyan3",     name: "Cyanotype",                 inks: ["#6FA8D6", "#1B5E8C", "#0B2A4A"], paper: "#E8F1F8" },
  { id: "ink1",      name: "Black on Transparent (2 weights)", inks: ["#8C8C8C", "#111111"], paper: "" },
  { id: "dtfpop",    name: "DTF Pop",                   inks: ["#FFD60A", "#FF2E63", "#3A0CA3"], paper: "" },
  { id: "vapor5",    name: "Vaporwave 5",               inks: ["#F9ED69", "#F08A5D", "#B83B5E", "#6A2C70", "#2B0B3F"], paper: "" },
  { id: "earth4",    name: "Earth 4",                   inks: ["#D9B38C", "#A47148", "#6F4E37", "#2F1B0C"], paper: "#F2E8CF" },
  { id: "candy3",    name: "Candy 3",                   inks: ["#FFD6E0", "#FF8FA3", "#EF233C"], paper: "#FFFFFF" },
  { id: "mono5",     name: "Greyscale 5 Inks",          inks: ["#D9D9D9", "#B0B0B0", "#808080", "#505050", "#181818"], paper: "#FFFFFF" },
  { id: "amber3",    name: "Amber Terminal",            inks: ["#A35A00", "#FFB000", "#FFE29A"], paper: "#000000" }
];

module.exports = { PALETTES, TONEMAPS };
