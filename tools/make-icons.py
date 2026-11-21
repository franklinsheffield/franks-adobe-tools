#!/usr/bin/env python3
"""Draws the suite icons: black tile, thin white stroke, white glyph with a
light-blue glow (plugin list), and plain glyphs for the panel tabs.
Run: python3 tools/make-icons.py   (needs Pillow)"""
import math, os
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GLOW = (143, 216, 255)
SS = 8  # supersampling

def glyph_dithers(d, s, c):
    n = 6
    for j in range(n):
        for i in range(n):
            t = (i + j) / (2 * (n - 1))
            r = s * 0.06 * (1.15 - t)
            if r < s * 0.012: continue
            x, y = s * (0.2 + 0.6 * i / (n - 1)), s * (0.2 + 0.6 * j / (n - 1))
            d.ellipse([x - r, y - r, x + r, y + r], fill=c)

def glyph_chrome(d, s, c):
    # liquid drop with reflective bands
    w = s * 0.045
    pts = []
    for k in range(200):
        a = 2 * math.pi * k / 200
        r = s * 0.27
        x = s * 0.5 + r * math.sin(a) * (1 - 0.25 * max(0, -math.cos(a)) ** 3)
        y = s * 0.58 - r * math.cos(a) * (1.0 + 0.55 * max(0, math.cos(a)) ** 2)
        pts.append((x, y))
    d.line(pts + [pts[0]], fill=c, width=int(w), joint="curve")
    for k, yy in enumerate([0.52, 0.62, 0.72]):
        wave = [(s * (0.33 + 0.34 * i / 40), s * yy + s * 0.025 * math.sin(i / 40 * math.pi * 2 + k)) for i in range(41)]
        d.line(wave, fill=c, width=int(w * 0.8), joint="curve")

def glyph_depth(d, s, c):
    w = int(s * 0.04)
    for k in range(4):
        rx, ry = s * (0.34 - k * 0.075), s * (0.27 - k * 0.06)
        cx, cy = s * (0.5 + k * 0.02), s * (0.52 - k * 0.025)
        pts = [(cx + rx * math.cos(a) * (1 + 0.08 * math.sin(3 * a + k)), cy + ry * math.sin(a) * (1 + 0.08 * math.cos(2 * a))) for a in [2 * math.pi * i / 120 for i in range(121)]]
        d.line(pts, fill=c, width=w, joint="curve")

def glyph_glow(d, s, c):
    w = int(s * 0.05)
    r = s * 0.2
    d.ellipse([s / 2 - r, s / 2 - r, s / 2 + r, s / 2 + r], outline=c, width=w)
    for k in range(8):
        a = math.pi * k / 4
        r1, r2 = s * 0.29, s * (0.37 if k % 2 == 0 else 0.33)
        d.line([(s / 2 + r1 * math.cos(a), s / 2 + r1 * math.sin(a)), (s / 2 + r2 * math.cos(a), s / 2 + r2 * math.sin(a))], fill=c, width=w)

def glyph_decomp(d, s, c):
    b = s * 0.1
    rows = [(0.2, 0), (0.32, 0.06), (0.44, -0.04), (0.56, 0.09), (0.68, 0.02)]
    for j, (y, off) in enumerate(rows):
        for i in range(5):
            if (i * 7 + j * 3) % 5 == 0: continue
            x = s * (0.2 + off) + i * b * 1.15
            if x + b > s * 0.86: continue
            d.rectangle([x, s * y, x + b, s * y + b], fill=c)

def glyph_crt(d, s, c):
    w = int(s * 0.045)
    d.rounded_rectangle([s * 0.16, s * 0.2, s * 0.84, s * 0.72], radius=s * 0.1, outline=c, width=w)
    for k in range(4):
        y = s * (0.31 + k * 0.095)
        d.line([(s * 0.27, y), (s * 0.73, y)], fill=c, width=int(w * 0.7))
    d.line([(s * 0.38, s * 0.84), (s * 0.62, s * 0.84)], fill=c, width=w)
    d.line([(s * 0.5, s * 0.72), (s * 0.5, s * 0.84)], fill=c, width=w)

TOOLS = {
    "dithers-brew": (glyph_dithers, "icon_D", "icon_N"),
    "chrometone": (glyph_chrome, "icon_C", "icon_CL"),
    "depthtone": (glyph_depth, "icon_C", "icon_CL"),
    "mobglow": (glyph_glow, "icon_C", "icon_CL"),
    "decompressor": (glyph_decomp, "icon_C", "icon_CL"),
    "crt-phaser": (glyph_crt, "icon_C", "icon_CL"),
}

def draw(glyph, size, color, tile):
    S = size * SS
    g = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    glyph(ImageDraw.Draw(g), S, color)
    if not tile:
        return g.resize((size, size), Image.LANCZOS)
    im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(im).rounded_rectangle([0, 0, S - 1, S - 1], radius=S // 5, fill=(0, 0, 0, 255))
    halo = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    gb = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    glyph(ImageDraw.Draw(gb), S, GLOW + (255,))
    halo = gb.filter(ImageFilter.GaussianBlur(S * 0.035))
    im = Image.alpha_composite(im, halo)
    im = Image.alpha_composite(im, halo)
    im = Image.alpha_composite(im, g)
    ImageDraw.Draw(im).rounded_rectangle([S * 0.02, S * 0.02, S * 0.98 - 1, S * 0.98 - 1], radius=S // 5, outline=(255, 255, 255, 220), width=max(SS, int(S * 0.018)))
    return im.resize((size, size), Image.LANCZOS)

for tool, (glyph, dark, light) in TOOLS.items():
    out = os.path.join(ROOT, "plugins", tool, "icons")
    for size, suf in [(23, ""), (46, "@2x")]:
        draw(glyph, size, (255, 255, 255, 255), False).save(os.path.join(out, dark + suf + ".png"))
        draw(glyph, size, (50, 50, 50, 255), False).save(os.path.join(out, light + suf + ".png"))
    for size, suf in [(48, ""), (96, "@2x")]:
        draw(glyph, size, (255, 255, 255, 255), True).save(os.path.join(out, "plugin" + suf + ".png"))
    print("icons:", tool)
