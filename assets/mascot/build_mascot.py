"""Build the explainer-video-maker mascot: a voxel (Minecraft-style) Clawd holding a clapperboard.

Usage:
    python build_mascot.py            # writes mascot.svg (no dependencies)
                                      # and mascot.png too if Pillow is installed

The model is a set of colored unit cubes. Each cube's visible faces (top, front, right)
are projected with a 3/4 dimetric camera, shaded per face, given a little per-block
color noise, and drawn back-to-front on a transparent background.
"""

import math
import random
from pathlib import Path

OUT_DIR = Path(__file__).parent
SCALE = 22          # pixels per voxel edge in the SVG
PNG_SIZE = 1024     # longest edge of the PNG
SEED = 7

ORANGE = (217, 119, 87)     # Claude clay orange
EYE = (31, 30, 29)
SLATE = (43, 43, 46)
CHALK = (242, 240, 234)

# Face brightness: top is lit, front is mid, right side is in shade.
SHADE = {"top": 1.12, "front": 0.94, "right": 0.72}


def build_model():
    """Return {(x, y, z): rgb}. +x right, +y toward the viewer, +z up."""
    v = {}

    def box(x0, x1, y0, y1, z0, z1, color):
        for x in range(x0, x1 + 1):
            for y in range(y0, y1 + 1):
                for z in range(z0, z1 + 1):
                    v[(x, y, z)] = color

    # Body
    box(0, 11, 0, 5, 2, 9, ORANGE)
    # Eyes on the front face, two blocks tall
    for x in (3, 8):
        for z in (6, 7):
            v[(x, 5, z)] = EYE
    # Left arm: short stub
    box(-2, -1, 2, 3, 4, 5, ORANGE)
    # Right arm: raised, holding the clapperboard
    box(12, 12, 2, 3, 5, 6, ORANGE)
    box(13, 13, 2, 3, 6, 7, ORANGE)
    # Legs: front and back rows of four
    for x in (1, 4, 7, 10):
        for y in (1, 4):
            box(x, x, y, y, 0, 1, ORANGE)

    # Clapperboard: slate with chalk lines, striped bar, and an open striped clapper
    box(14, 20, 3, 3, 5, 10, SLATE)
    box(15, 19, 3, 3, 9, 9, CHALK)
    box(15, 17, 3, 3, 7, 7, CHALK)
    for x in range(14, 21):
        v[(x, 3, 11)] = CHALK if x % 2 else SLATE
    v[(14, 3, 12)] = SLATE                      # hinge
    for x in range(14, 21):
        v[(x, 3, 13 + (x - 14) // 3)] = SLATE if x % 2 else CHALK
    return v


# --- projection -------------------------------------------------------------

YAW = math.radians(28)       # small yaw so the front face reads widest
PITCH = math.radians(30)
EX = (math.cos(YAW), math.sin(YAW) * math.sin(PITCH))
EY = (-math.sin(YAW), math.cos(YAW) * math.sin(PITCH))
EZ = (0.0, -math.cos(PITCH))


def project(x, y, z):
    return (x * EX[0] + y * EY[0] + z * EZ[0], x * EX[1] + y * EY[1] + z * EZ[1])


def faces(model):
    """Yield (depth, face_name, base_color, jitter, corners3d) for every visible face."""
    rng = random.Random(SEED)
    out = []
    for (x, y, z), color in model.items():
        jitter = rng.uniform(0.94, 1.05)
        if (x, y, z + 1) not in model:
            out.append(("top", color, jitter,
                        [(x, y, z + 1), (x + 1, y, z + 1), (x + 1, y + 1, z + 1), (x, y + 1, z + 1)]))
        if (x, y + 1, z) not in model:
            out.append(("front", color, jitter,
                        [(x, y + 1, z), (x + 1, y + 1, z), (x + 1, y + 1, z + 1), (x, y + 1, z + 1)]))
        if (x + 1, y, z) not in model:
            out.append(("right", color, jitter,
                        [(x + 1, y, z), (x + 1, y + 1, z), (x + 1, y + 1, z + 1), (x + 1, y, z + 1)]))
    # Painter's order: farthest first. The camera looks from +x, +y, +z, so sort by the
    # face centre's distance along that direction.
    view = (math.sin(YAW), math.cos(YAW), math.tan(PITCH))

    def depth(f):
        cs = f[3]
        cx = sum(c[0] for c in cs) / 4
        cy = sum(c[1] for c in cs) / 4
        cz = sum(c[2] for c in cs) / 4
        return cx * view[0] + cy * view[1] + cz * view[2]

    out.sort(key=depth)
    return out


def shade(color, face, jitter):
    k = SHADE[face] * jitter
    return tuple(max(0, min(255, round(c * k))) for c in color)


def edge(color):
    return tuple(round(c * 0.78) for c in color)


def hexc(c):
    return "#%02x%02x%02x" % c


def layout(model, scale, pad):
    fs = faces(model)
    pts = [project(*c) for f in fs for c in f[3]]
    minx = min(p[0] for p in pts)
    miny = min(p[1] for p in pts)
    maxx = max(p[0] for p in pts)
    maxy = max(p[1] for p in pts)
    w = (maxx - minx) * scale + 2 * pad
    h = (maxy - miny) * scale + 2 * pad

    def to_px(c):
        px, py = project(*c)
        return ((px - minx) * scale + pad, (py - miny) * scale + pad)

    polys = []
    for name, color, jitter, corners in fs:
        fill = shade(color, name, jitter)
        polys.append(([to_px(c) for c in corners], fill, edge(fill)))
    return w, h, polys


def write_svg(model, path):
    w, h, polys = layout(model, SCALE, pad=SCALE)
    lines = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.0f} {h:.0f}" '
             f'width="{w:.0f}" height="{h:.0f}" shape-rendering="crispEdges">',
             "<title>Clawd, director of explainer-video-maker</title>"]
    sw = SCALE * 0.06
    for pts, fill, stroke in polys:
        d = " ".join(f"{x:.2f},{y:.2f}" for x, y in pts)
        lines.append(f'<polygon points="{d}" fill="{hexc(fill)}" stroke="{hexc(stroke)}" '
                     f'stroke-width="{sw:.2f}" stroke-linejoin="round"/>')
    lines.append("</svg>")
    path.write_text("\n".join(lines), encoding="utf-8")


def write_png(model, path):
    from PIL import Image, ImageDraw

    ss = 4  # supersample, then downscale for clean edges
    w0, h0, _ = layout(model, 1, 0)
    scale = (PNG_SIZE - 2 * 40) / max(w0, h0) * ss
    pad = 40 * ss
    w, h, polys = layout(model, scale, pad)
    img = Image.new("RGBA", (round(w), round(h)), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    lw = max(1, round(scale * 0.06))
    for pts, fill, stroke in polys:
        draw.polygon(pts, fill=fill + (255,))
        draw.line(pts + [pts[0]], fill=stroke + (255,), width=lw, joint="curve")
    img = img.resize((round(w / ss), round(h / ss)), Image.LANCZOS)
    img.save(path)


def main():
    model = build_model()
    write_svg(model, OUT_DIR / "mascot.svg")
    print("wrote", OUT_DIR / "mascot.svg")
    try:
        write_png(model, OUT_DIR / "mascot.png")
        print("wrote", OUT_DIR / "mascot.png")
    except ImportError:
        print("Pillow not installed; skipped mascot.png (pip install pillow)")


if __name__ == "__main__":
    main()
