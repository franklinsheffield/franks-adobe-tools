import os, glob, sys
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, os.path.dirname(__file__))
OUT = sys.argv[1] if len(sys.argv) > 1 else "out2"
os.makedirs(OUT, exist_ok=True)
def load(p): return Image.open(p).convert("RGBA").resize((128,128), Image.LANCZOS)
def q(im, pal):
    a = im.split()[3]; rgb = Image.new("RGB", im.size, (0,0,0)); rgb.paste(im, mask=a)
    r = rgb.quantize(palette=pal, dither=Image.Dither.NONE); r.paste(255, mask=a.point(lambda v: 255 if v < 110 else 0)); return r
def gif(frames, path):
    strip = Image.new("RGB", (128*len(frames),128))
    for i,f in enumerate(frames):
        rgb = Image.new("RGB",(128,128)); rgb.paste(f, mask=f.split()[3]); strip.paste(rgb,(128*i,0))
    pal = strip.quantize(colors=255, method=Image.Quantize.MEDIANCUT)
    qs = [q(f, pal) for f in frames]
    qs[0].save(path, save_all=True, append_images=qs[1:], duration=80, loop=0, transparency=255, disposal=2, optimize=False)
names = sorted({os.path.basename(f)[:-4] for f in glob.glob("frames2/*.png") if not f[-7:-4].lstrip("_").isdigit() or not f[-7]=="_"})
statics = [n for n in names if not glob.glob(f"frames2/{n}_00.png") and not (n[-3]=="_" and n[-2:].isdigit())]
anims = sorted({os.path.basename(f)[:-7] for f in glob.glob("frames2/*_00.png")})
sizes = {}
for n in statics:
    load(f"frames2/{n}.png").save(f"{OUT}/{n}.png", optimize=True); sizes[n+".png"] = os.path.getsize(f"{OUT}/{n}.png")
for n in anims:
    gif([load(f) for f in sorted(glob.glob(f"frames2/{n}_[0-9][0-9].png"))], f"{OUT}/{n}.gif"); sizes[n+".gif"] = os.path.getsize(f"{OUT}/{n}.gif")
print(len(statics), "static,", len(anims), "animated; largest", max(sizes.values()), "bytes")
items = statics + anims
cols = 6; cell = 160; rows = (len(items)+cols-1)//cols
font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 12)
for bg, fg, tag in [((30,31,34),(220,220,230),"dark"),((255,255,255),(40,40,50),"light")]:
    sh = Image.new("RGB",(cols*cell, rows*cell+10), bg); d = ImageDraw.Draw(sh)
    for i,n in enumerate(items):
        x, y = (i%cols)*cell, (i//cols)*cell
        f = f"frames2/{n}.png" if n in statics else f"frames2/{n}_10.png"
        im = load(f).resize((112,112), Image.LANCZOS); sh.paste(im,(x+24,y+8),im)
        d.text((x+8,y+126),":"+n+":"+(" (a)" if n in anims else ""),fill=fg,font=font)
    sh.save(f"{OUT}/sheet-{tag}.png")
    # 22px chat-size strip
    sm = Image.new("RGB",(len(items)*28+8, 34), bg)
    for i,n in enumerate(items):
        f = f"frames2/{n}.png" if n in statics else f"frames2/{n}_10.png"
        im = load(f).resize((22,22), Image.LANCZOS); sm.paste(im,(6+i*28,6),im)
    sm.resize((sm.width*3, sm.height*3), Image.NEAREST).save(f"{OUT}/chat-size-{tag}.png")
