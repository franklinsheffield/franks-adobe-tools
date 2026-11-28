import os, glob
from PIL import Image, ImageDraw, ImageFont
os.makedirs("out", exist_ok=True)
houses = [("or","Oracle",["crest","moon","orb"]),("al","Alchemist",["crest","stone","flask"]),("ob","Observatory",["crest","shard","astrolabe"]),("pa","Parlour",["crest","key","planchette"]),("sc","Scriptorium",["crest","scroll","inkpot"])]
def load(p): return Image.open(p).convert("RGBA").resize((128,128), Image.LANCZOS)
def to_gif_frame(im, pal_src=None):
    a = im.split()[3]
    rgb = Image.new("RGB", im.size, (0,0,0)); rgb.paste(im, mask=a)
    q = rgb.quantize(colors=255, method=Image.Quantize.MEDIANCUT) if pal_src is None else rgb.quantize(palette=pal_src, dither=Image.Dither.NONE)
    mask = a.point(lambda v: 255 if v < 110 else 0)
    q.paste(255, mask=mask); return q
def gif(frames, path):
    # shared palette from a strip of all frames
    strip = Image.new("RGB", (128*len(frames),128))
    for i,f in enumerate(frames):
        rgb = Image.new("RGB",(128,128)); rgb.paste(f, mask=f.split()[3]); strip.paste(rgb,(128*i,0))
    pal = strip.quantize(colors=255, method=Image.Quantize.MEDIANCUT)
    qs = [to_gif_frame(f, pal) for f in frames]
    qs[0].save(path, save_all=True, append_images=qs[1:], duration=80, loop=0, transparency=255, disposal=2, optimize=False)
    return os.path.getsize(path)
sizes = {}
for p, name, statics in houses:
    for s in statics:
        im = load(f"frames/{p}_{s}.png"); im.save(f"out/{p}_{s}.png", optimize=True); sizes[f"{p}_{s}.png"] = os.path.getsize(f"out/{p}_{s}.png")
    load(f"frames/{p}_cheer_still.png").save(f"out/{p}_cheer_still.png", optimize=True)
    for a in ["host","cheer"]:
        fr = [load(f) for f in sorted(glob.glob(f"frames/{p}_{a}_[0-9][0-9].png"))]
        sizes[f"{p}_{a}.gif"] = gif(fr, f"out/{p}_{a}.gif")
print({k:v for k,v in sizes.items() if k.endswith('gif')})
# contact sheet
cols = ["crest","host","%s","%s","cheer","cheer_still"]
cell=150; W=cell*6+170; H=cell*5+70
try: font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 13); big = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 15)
except: font = big = ImageFont.load_default()
for bg, fg, tag in [((30,31,34),(220,220,230),"dark"),((255,255,255),(40,40,50),"light")]:
    sh = Image.new("RGB",(W,H),bg); d = ImageDraw.Draw(sh)
    for j,h in enumerate(["crest","host (anim)","token","prop","cheer (anim)","cheer still"]): d.text((170+j*cell+10,20),h,fill=fg,font=big)
    for i,(p,name,statics) in enumerate(houses):
        y = 50+i*cell; d.text((14,y+55),name,fill=fg,font=big)
        files = [f"frames/{p}_crest.png", f"frames/{p}_host_06.png", f"frames/{p}_{statics[1]}.png", f"frames/{p}_{statics[2]}.png", f"frames/{p}_cheer_still.png", f"frames/{p}_cheer_still.png"]
        labels = [f"{p}_crest", f"{p}_host", f"{p}_{statics[1]}", f"{p}_{statics[2]}", f"{p}_cheer", f"{p}_cheer_still"]
        for j,(f,l) in enumerate(zip(files,labels)):
            im = load(f).resize((112,112), Image.LANCZOS) if j!=5 else load(f).resize((112,112))
            sh.paste(im,(170+j*cell+10,y),im); d.text((170+j*cell+12,y+116),":"+l+":",fill=fg,font=font)
    sh.save(f"out/sheet-{tag}.png")
