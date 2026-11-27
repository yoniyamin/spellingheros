"""Draws the home-screen icons in icons/ (icon-180.png for iPhone, 192 and 512 for Android / the web manifest).
Run from the repository root:  python tools/make_icons.py
The content stays inside the middle 80%, so the 512 icon also works as a "maskable" (round-cropped) Android icon."""
import math, os
from PIL import Image, ImageDraw, ImageFont

def font(size):
    for f in ('C:/Windows/Fonts/comicbd.ttf', '/System/Library/Fonts/Supplemental/Comic Sans MS Bold.ttf',
              '/usr/share/fonts/truetype/msttcorefonts/comicbd.ttf', 'C:/Windows/Fonts/arialbd.ttf'):
        if os.path.exists(f):
            return ImageFont.truetype(f, size)
    return ImageFont.load_default()

def star(d, cx, cy, r, fill):
    pts = [(cx + (r if i % 2 == 0 else r * .45) * math.cos(-math.pi / 2 + i * math.pi / 5),
            cy + (r if i % 2 == 0 else r * .45) * math.sin(-math.pi / 2 + i * math.pi / 5)) for i in range(10)]
    d.polygon(pts, fill=fill)

def icon(n):
    S = 4 * n                                       # draw big, scale down = smooth edges
    im = Image.new('RGB', (S, S))
    top, bot = (183, 188, 248), (108, 114, 196)     # periwinkle gradient, like the game's sky
    px = im.load()
    for y in range(S):
        k = y / (S - 1)
        c = tuple(int(top[i] + (bot[i] - top[i]) * k) for i in range(3))
        for x in range(S):
            px[x, y] = c
    d = ImageDraw.Draw(im)
    # the badge: a white rounded square with the game's dark outline
    m = S * .17
    d.rounded_rectangle((m, m, S - m, S - m), radius=S * .14, fill=(244, 245, 255), outline=(45, 47, 107), width=int(S * .035))
    # "ABC" in red / yellow / green like the rainbow title
    f = font(int(S * .27))
    letters = [('A', (224, 36, 47)), ('B', (255, 159, 28)), ('C', (47, 191, 128))]
    widths = [d.textbbox((0, 0), ch, font=f)[2] for ch, _ in letters]
    x = S / 2 - (sum(widths) + S * .01 * 2) / 2
    for (ch, col), w in zip(letters, widths):
        d.text((x, S * .53), ch, font=f, fill=col, anchor='ls', stroke_width=int(S * .012), stroke_fill=(45, 47, 107))
        x += w + S * .01
    # a sword-slash underline and two sparkles
    d.rounded_rectangle((S * .3, S * .6, S * .7, S * .64), radius=S * .02, fill=(45, 47, 107))
    star(d, S * .5, S * .72, S * .07, (255, 210, 63))
    star(d, S * .73, S * .27, S * .045, (255, 255, 255))
    return im.resize((n, n), Image.LANCZOS)

os.makedirs('icons', exist_ok=True)
for n in (180, 192, 512):
    icon(n).save(f'icons/icon-{n}.png', optimize=True)
print('icons written')
