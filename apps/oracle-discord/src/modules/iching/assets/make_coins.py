# Science is Magic I Ching coin concept: yang (gold) + yin (purple) faces, flip GIF, hexagram mock.
import math, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont
OUT = sys.argv[1]
SS = 4
NAVY=(22,16,48); PURP=(46,30,104); PURP2=(70,48,150); GOLD=(226,176,74); GOLD_L=(250,222,140); GOLD_D=(150,104,34); TEAL=(102,224,200)
TRI=['111','110','101','100','011','010','001','000']  # bagua, top->bottom bits (1=yang)

def radial(size, c0, c1, center=(0.4,0.35)):
    im = Image.new('RGB',(size,size)); px=im.load()
    cx,cy=size*center[0],size*center[1]; R=size*0.75
    for y in range(size):
        for x in range(size):
            t=min(1,math.hypot(x-cx,y-cy)/R)
            px[x,y]=tuple(int(c0[i]+(c1[i]-c0[i])*t) for i in range(3))
    return im

def trigram(d, cx, cy, ang, w, h, col):
    # draw 3 bars rotated so they face the centre
    ca,sa=math.cos(ang),math.sin(ang)
    def rect(x0,y0,x1,y1):
        pts=[(x0,y0),(x1,y0),(x1,y1),(x0,y1)]
        d.polygon([(cx+px*ca-py*sa, cy+px*sa+py*ca) for px,py in pts], fill=col)
    gap=h*0.55
    for i,b in enumerate(TRI_CUR):
        y=(i-1)*(h+gap)
        if b=='1': rect(-w/2,y-h/2,w/2,y+h/2)
        else:
            rect(-w/2,y-h/2,-w*0.12,y+h/2); rect(w*0.12,y-h/2,w/2,y+h/2)

def star8(d,cx,cy,r,col):
    pts=[]
    for k in range(16):
        rr=r if k%2==0 else r*0.42; a=k*math.pi/8-math.pi/2
        pts.append((cx+rr*math.cos(a),cy+rr*math.sin(a)))
    d.polygon(pts,fill=col)

def coin(face, size=256):
    S=size*SS; c=S/2; R=S*0.47
    body = radial(S, GOLD_L, GOLD_D) if face=='yang' else radial(S, PURP2, NAVY)
    mask=Image.new('L',(S,S),0); ImageDraw.Draw(mask).ellipse([c-R,c-R,c+R,c+R],fill=255)
    im=Image.new('RGBA',(S,S),(0,0,0,0)); im.paste(body,(0,0),mask)
    d=ImageDraw.Draw(im)
    # outer navy outline + gold rim
    d.ellipse([c-R,c-R,c+R,c+R],outline=NAVY,width=int(S*0.025))
    r2=R*0.90; d.ellipse([c-r2,c-r2,c+r2,c+r2],outline=GOLD if face=='yin' else GOLD_D,width=int(S*0.018))
    if face=='yang':
        # SUN: 16 alternating long/short rays radiating from the hole, inner corona ring
        for k in range(16):
            a=k*math.pi/8; L=R*(0.80 if k%2==0 else 0.66); w=0.075 if k%2==0 else 0.05
            p=[(c+R*0.36*math.cos(a-w),c+R*0.36*math.sin(a-w)),(c+L*math.cos(a),c+L*math.sin(a)),(c+R*0.36*math.cos(a+w),c+R*0.36*math.sin(a+w))]
            d.polygon(p,fill=GOLD_D)
        rr=R*0.36; d.ellipse([c-rr,c-rr,c+rr,c+rr],fill=(244,206,110),outline=GOLD_D,width=int(S*0.014))
        for k in range(24):
            a=k*2*math.pi/24; x,y=c+R*0.84*math.cos(a),c+R*0.84*math.sin(a)
            d.ellipse([x-S*0.007,y-S*0.007,x+S*0.007,y+S*0.007],fill=GOLD_D)
    else:
        # MOON: dashed ring, big crescent wrapping the hole, stars, teal glints
        rr=R*0.80
        for k in range(48):
            a0=k*2*math.pi/48; d.arc([c-rr,c-rr,c+rr,c+rr],math.degrees(a0),math.degrees(a0)+3.5,fill=(150,130,200),width=int(S*0.008))
        m=Image.new('L',(S,S),0); md=ImageDraw.Draw(m); mr=R*0.62
        md.ellipse([c-mr,c-mr,c+mr,c+mr],fill=255)
        off=R*0.30; md.ellipse([c-mr+off,c-mr-off*0.55,c+mr+off,c+mr-off*0.55],fill=0)
        layer=Image.new('RGBA',(S,S),GOLD+(255,)); im.paste(layer,(0,0),m)
        edge=m.filter(ImageFilter.FIND_EDGES).point(lambda v:255 if v>40 else 0).filter(ImageFilter.MaxFilter(9))
        im.paste(Image.new('RGBA',(S,S),NAVY+(255,)),(0,0),edge)
        d=ImageDraw.Draw(im)
        for (fx,fy,fr,col) in [(0.30,-0.38,0.055,GOLD_L),(0.46,0.02,0.035,TEAL),(0.24,0.40,0.03,GOLD_L),(0.52,-0.20,0.022,TEAL)]:
            star8(d,c+R*fx,c+R*fy,S*fr,col)
    # square hole with raised rim
    h=S*0.10; rim=S*0.035
    d.rectangle([c-h-rim,c-h-rim,c+h+rim,c+h+rim],fill=GOLD if face=='yin' else GOLD_L,outline=NAVY,width=int(S*0.012))
    d.rectangle([c-h,c-h,c+h,c+h],fill=(0,0,0,0),outline=NAVY,width=int(S*0.012))
    # shine on gold
    if face=='yang':
        sh=Image.new('RGBA',(S,S),(0,0,0,0)); sd=ImageDraw.Draw(sh)
        sd.arc([c-R*0.86,c-R*0.86,c+R*0.86,c+R*0.86],200,250,fill=(255,250,220,170),width=int(S*0.02))
        im.alpha_composite(sh)
    return im.resize((size,size),Image.LANCZOS)

def bg(w,h):
    b=radial(max(w,h),(52,34,120),(14,10,30),(0.5,0.3)).crop((0,0,w,h)).convert('RGBA')
    d=ImageDraw.Draw(b)
    import random; random.seed(7)
    for _ in range(int(w*h/9000)):
        x,y=random.randrange(w),random.randrange(h); r=random.choice([1,1,2])
        d.ellipse([x-r,y-r,x+r,y+r],fill=(230,220,255,random.randint(90,220)))
    return b

yang=coin('yang'); yin=coin('yin')
yang.save(f'{OUT}/coin_yang.png'); yin.save(f'{OUT}/coin_yin.png')

# faces sheet
sh=bg(720,360); sh.alpha_composite(yang,(60,52)); sh.alpha_composite(yin,(404,52))
try: f=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',20)
except: f=ImageFont.load_default()
d=ImageDraw.Draw(sh)
d.text((188,320),'SUN  (yang, 3)',fill=GOLD_L,font=f,anchor='mm'); d.text((532,320),'MOON  (yin, 2)',fill=(200,190,255),font=f,anchor='mm')
sh.save(f'{OUT}/coin_faces.png')

# flip gif (128px, Discord-size), loops yang->yin->yang
frames=[]; N=36; base=bg(160,160)
for i in range(N):
    t=i/N; a=t*2*math.pi; sx=abs(math.cos(a)); face=yang if math.cos(a)>=0 else yin
    bob=int(-18*math.sin(math.pi*((t*2)%1)))
    fr=base.copy(); w=max(2,int(128*sx)); c=face.resize((128,128),Image.LANCZOS).resize((w,128),Image.LANCZOS)
    fr.alpha_composite(c,(80-w//2,16+bob//2)); frames.append(fr.convert('RGB').quantize(64))
frames[0].save(f'{OUT}/coin_flip.gif',save_all=True,append_images=frames[1:],duration=55,loop=0,disposal=2)

# hexagram mock: lines 1..6 bottom-up. example cast: 7,8,9,7,6,8 (9/6 = changing)
cast=[7,8,9,7,6,8]
W,H=880,640; m=bg(W,H); d=ImageDraw.Draw(m); small=None
for i,v in enumerate(cast):
    y=H-90-i*92; face=yang if v in (7,9) else yin
    cs=face.resize((76,76),Image.LANCZOS)
    if v in (6,9):
        g=Image.new('RGBA',(W,H),(0,0,0,0)); gd=ImageDraw.Draw(g)
        gd.ellipse([60-6,y-44,60+82,y+44],fill=TEAL+(150,)); m.alpha_composite(g.filter(ImageFilter.GaussianBlur(10)))
    m.alpha_composite(cs,(60,y-38))
    col=TEAL if v in (6,9) else GOLD
    if v in (7,9): d.rounded_rectangle([170,y-12,470,y+12],6,fill=col)
    else: d.rounded_rectangle([170,y-12,300,y+12],6,fill=col); d.rounded_rectangle([340,y-12,470,y+12],6,fill=col)
    lab={6:'old yin, changing',7:'young yang',8:'young yin',9:'old yang, changing'}[v]
    d.text((500,y),f'Line {i+1}  ·  {lab}',fill=(220,212,255),font=f,anchor='lm')
m.save(f'{OUT}/hexagram_mock.png')
print('ok')
