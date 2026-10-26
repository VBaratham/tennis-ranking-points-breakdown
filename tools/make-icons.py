#!/usr/bin/env python3
"""Generate the extension icons and the store promo tile.

The mark is a literal one: a short stack of sorted rows with the top one
highlighted, i.e. the next block of points about to expire. Drawn at 8x and
downsampled so the small sizes stay clean.

Usage: python3 tools/make-icons.py
"""
from PIL import Image, ImageDraw, ImageFont
import os

BLUE = (11, 101, 194)
WHITE = (255, 255, 255)
AMBER = (245, 158, 11)
DIM = (168, 199, 232)

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ICON_DIR = os.path.join(HERE, "icons")
ASSET_DIR = os.path.join(HERE, "store-assets")


def rounded(size, radius, fill):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ImageDraw.Draw(img).rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=fill)
    return img


def make_icon(px):
    """Rows of decreasing width; the first is highlighted."""
    s = px * 8
    img = rounded(s, int(s * 0.22), BLUE)
    d = ImageDraw.Draw(img)

    # Four rows, the top one amber (expiring next), the rest white//dim.
    rows = [
        (0.78, AMBER),
        (0.62, WHITE),
        (0.46, WHITE),
        (0.30, DIM),
    ]
    pad_x = s * 0.17
    top = s * 0.23
    gap = s * 0.145
    height = s * 0.095
    for i, (width_frac, colour) in enumerate(rows):
        y = top + i * gap
        x1 = pad_x + (s - 2 * pad_x) * width_frac
        d.rounded_rectangle([pad_x, y, x1, y + height], radius=height / 2, fill=colour)

    return img.resize((px, px), Image.LANCZOS)


def load_font(size, bold=True):
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/Library/Fonts/Arial.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    return ImageFont.load_default()


def make_promo_tile(width=440, height=280):
    scale = 2
    w, h = width * scale, height * scale
    img = Image.new("RGB", (w, h), (246, 247, 249))
    d = ImageDraw.Draw(img)

    # Blue panel on the left carries the mark; text sits on the light field.
    panel_w = int(w * 0.34)
    d.rectangle([0, 0, panel_w, h], fill=BLUE)

    icon_px = int(118 * scale)
    icon = make_icon(icon_px)
    img.paste(icon, ((panel_w - icon_px) // 2, (h - icon_px) // 2), icon)

    title = load_font(int(24 * scale), bold=True)
    body = load_font(int(14 * scale), bold=False)

    x = panel_w + int(26 * scale)
    y = int(h * 0.27)
    d.text((x, y), "Tennis Ranking", font=title, fill=(22, 24, 29))
    d.text((x, y + int(30 * scale)), "Points Breakdown", font=title, fill=(22, 24, 29))
    d.text((x, y + int(74 * scale)),
           "Jump from any player on", font=body, fill=(107, 114, 128))
    d.text((x, y + int(93 * scale)),
           "live-tennis.eu to where their", font=body, fill=(107, 114, 128))
    d.text((x, y + int(112 * scale)),
           "ranking points come from.", font=body, fill=(107, 114, 128))

    return img.resize((width, height), Image.LANCZOS)


def main():
    os.makedirs(ICON_DIR, exist_ok=True)
    os.makedirs(ASSET_DIR, exist_ok=True)

    for px in (16, 48, 128):
        path = os.path.join(ICON_DIR, "icon-%d.png" % px)
        make_icon(px).save(path)
        print("wrote %s (%dx%d)" % (path, px, px))

    store_icon = os.path.join(ASSET_DIR, "store-icon-128.png")
    make_icon(128).save(store_icon)
    print("wrote %s (128x128)" % store_icon)

    tile = os.path.join(ASSET_DIR, "promo-tile-440x280.png")
    make_promo_tile().save(tile)
    print("wrote %s (440x280)" % tile)


if __name__ == "__main__":
    main()
