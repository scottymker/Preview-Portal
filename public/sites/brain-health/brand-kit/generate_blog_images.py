#!/usr/bin/env python3
"""
Generate branded blog post thumbnail images for Brain Health and Chiropractic
Matches the exact style from the website
"""

from PIL import Image, ImageDraw
import os
import math

# Brand colors - exact match from site CSS
PRIMARY_NAVY = (26, 54, 93)      # #1a365d
ACCENT_BLUE = (49, 130, 206)     # #3182ce

# Image dimensions - matching site blog card ratio
WIDTH = 800
HEIGHT = 450

# Output directory
OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__)) + "/blog-images"

# Blog themes with icon types
BLOG_THEMES = [
    {"name": "brain-health", "icon": "brain"},
    {"name": "pots-dysautonomia", "icon": "heartbeat"},
    {"name": "concussion-recovery", "icon": "head"},
    {"name": "migraine-relief", "icon": "bolt"},
    {"name": "dizziness-vertigo", "icon": "sync"},
    {"name": "functional-neurology", "icon": "brain"},
    {"name": "chiropractic-care", "icon": "spine"},
    {"name": "patient-success", "icon": "star"},
    {"name": "wellness-tips", "icon": "leaf"},
    {"name": "research-updates", "icon": "book"},
]

def create_gradient(width, height, color1, color2):
    """Create diagonal gradient matching site style"""
    img = Image.new('RGBA', (width, height))

    for y in range(height):
        for x in range(width):
            # Diagonal gradient (135deg)
            ratio = (x + y) / (width + height)
            r = int(color1[0] + (color2[0] - color1[0]) * ratio)
            g = int(color1[1] + (color2[1] - color1[1]) * ratio)
            b = int(color1[2] + (color2[2] - color1[2]) * ratio)
            img.putpixel((x, y), (r, g, b, 255))

    return img

def draw_brain_icon(draw, cx, cy, size, color):
    """Draw brain icon similar to Font Awesome"""
    # Left hemisphere
    draw.ellipse([cx - size*0.9, cy - size*0.65, cx - size*0.05, cy + size*0.65],
                 outline=color, width=int(size*0.12))
    # Right hemisphere
    draw.ellipse([cx + size*0.05, cy - size*0.65, cx + size*0.9, cy + size*0.65],
                 outline=color, width=int(size*0.12))
    # Brain folds - left
    draw.arc([cx - size*0.75, cy - size*0.45, cx - size*0.2, cy + size*0.1],
             0, 180, fill=color, width=int(size*0.08))
    draw.arc([cx - size*0.7, cy - size*0.15, cx - size*0.25, cy + size*0.35],
             0, 180, fill=color, width=int(size*0.08))
    # Brain folds - right
    draw.arc([cx + size*0.2, cy - size*0.45, cx + size*0.75, cy + size*0.1],
             0, 180, fill=color, width=int(size*0.08))
    draw.arc([cx + size*0.25, cy - size*0.15, cx + size*0.7, cy + size*0.35],
             0, 180, fill=color, width=int(size*0.08))
    # Stem
    draw.line([cx, cy + size*0.5, cx, cy + size*0.85], fill=color, width=int(size*0.12))

def draw_heartbeat_icon(draw, cx, cy, size, color):
    """Draw heartbeat/pulse icon"""
    # Heart shape
    heart_size = size * 0.5
    # Left curve
    draw.arc([cx - heart_size, cy - heart_size*0.8, cx, cy + heart_size*0.2],
             0, 180, fill=color, width=int(size*0.1))
    # Right curve
    draw.arc([cx, cy - heart_size*0.8, cx + heart_size, cy + heart_size*0.2],
             0, 180, fill=color, width=int(size*0.1))
    # Point
    draw.line([cx - heart_size*0.9, cy, cx, cy + heart_size], fill=color, width=int(size*0.1))
    draw.line([cx + heart_size*0.9, cy, cx, cy + heart_size], fill=color, width=int(size*0.1))

    # Pulse line
    pulse_y = cy + size * 0.3
    points = [
        (cx - size, pulse_y),
        (cx - size*0.5, pulse_y),
        (cx - size*0.3, pulse_y - size*0.4),
        (cx, pulse_y + size*0.3),
        (cx + size*0.2, pulse_y - size*0.5),
        (cx + size*0.4, pulse_y),
        (cx + size, pulse_y),
    ]
    draw.line(points, fill=color, width=int(size*0.1))

def draw_head_icon(draw, cx, cy, size, color):
    """Draw head silhouette"""
    # Head circle
    draw.ellipse([cx - size*0.6, cy - size*0.7, cx + size*0.5, cy + size*0.5],
                 outline=color, width=int(size*0.1))
    # Impact stars
    for i, (dx, dy) in enumerate([(0.6, -0.5), (0.75, -0.2), (0.7, 0.1)]):
        star_x = cx + size * dx
        star_y = cy + size * dy
        star_size = size * 0.12
        draw.line([star_x - star_size, star_y, star_x + star_size, star_y], fill=color, width=int(size*0.06))
        draw.line([star_x, star_y - star_size, star_x, star_y + star_size], fill=color, width=int(size*0.06))

def draw_bolt_icon(draw, cx, cy, size, color):
    """Draw lightning bolt"""
    points = [
        (cx + size*0.1, cy - size*0.8),
        (cx - size*0.3, cy - size*0.05),
        (cx + size*0.05, cy - size*0.05),
        (cx - size*0.15, cy + size*0.8),
        (cx + size*0.35, cy + size*0.05),
        (cx + size*0.05, cy + size*0.05),
    ]
    draw.polygon(points, fill=color)

def draw_sync_icon(draw, cx, cy, size, color):
    """Draw circular arrows / sync icon for dizziness"""
    # Circular arrows
    draw.arc([cx - size*0.6, cy - size*0.6, cx + size*0.6, cy + size*0.6],
             45, 315, fill=color, width=int(size*0.12))
    # Arrow heads
    draw.polygon([
        (cx + size*0.35, cy - size*0.55),
        (cx + size*0.6, cy - size*0.35),
        (cx + size*0.55, cy - size*0.6),
    ], fill=color)
    draw.polygon([
        (cx - size*0.35, cy + size*0.55),
        (cx - size*0.6, cy + size*0.35),
        (cx - size*0.55, cy + size*0.6),
    ], fill=color)

def draw_spine_icon(draw, cx, cy, size, color):
    """Draw spine vertebrae"""
    for i in range(5):
        y_offset = (i - 2) * size * 0.35
        width_factor = 1 - abs(i - 2) * 0.15
        w = size * 0.35 * width_factor
        h = size * 0.12
        draw.ellipse([cx - w, cy + y_offset - h, cx + w, cy + y_offset + h],
                     outline=color, width=int(size*0.08))

def draw_star_icon(draw, cx, cy, size, color):
    """Draw 5-point star"""
    points = []
    for i in range(10):
        angle = i * math.pi / 5 - math.pi / 2
        r = size * 0.8 if i % 2 == 0 else size * 0.35
        points.append((cx + r * math.cos(angle), cy + r * math.sin(angle)))
    draw.polygon(points, fill=color)

def draw_leaf_icon(draw, cx, cy, size, color):
    """Draw leaf icon"""
    # Leaf outline
    draw.ellipse([cx - size*0.25, cy - size*0.8, cx + size*0.6, cy + size*0.3],
                 outline=color, width=int(size*0.1))
    # Stem
    draw.arc([cx - size*0.5, cy - size*0.2, cx + size*0.2, cy + size*0.9],
             180, 270, fill=color, width=int(size*0.1))
    # Center vein
    draw.line([cx + size*0.15, cy - size*0.5, cx, cy + size*0.4],
              fill=color, width=int(size*0.06))

def draw_book_icon(draw, cx, cy, size, color):
    """Draw open book"""
    # Book covers
    draw.rectangle([cx - size*0.8, cy - size*0.5, cx - size*0.05, cy + size*0.6],
                   outline=color, width=int(size*0.08))
    draw.rectangle([cx + size*0.05, cy - size*0.5, cx + size*0.8, cy + size*0.6],
                   outline=color, width=int(size*0.08))
    # Spine
    draw.line([cx, cy - size*0.5, cx, cy + size*0.6], fill=color, width=int(size*0.08))
    # Pages - left
    for i in range(3):
        y = cy - size*0.25 + i * size*0.25
        draw.line([cx - size*0.65, y, cx - size*0.2, y], fill=color, width=int(size*0.05))
    # Pages - right
    for i in range(3):
        y = cy - size*0.25 + i * size*0.25
        draw.line([cx + size*0.2, y, cx + size*0.65, y], fill=color, width=int(size*0.05))

def draw_icon(draw, icon_type, cx, cy, size, color):
    """Draw the appropriate icon"""
    icon_functions = {
        "brain": draw_brain_icon,
        "heartbeat": draw_heartbeat_icon,
        "head": draw_head_icon,
        "bolt": draw_bolt_icon,
        "sync": draw_sync_icon,
        "spine": draw_spine_icon,
        "star": draw_star_icon,
        "leaf": draw_leaf_icon,
        "book": draw_book_icon,
    }

    if icon_type in icon_functions:
        icon_functions[icon_type](draw, cx, cy, size, color)
    else:
        # Default to brain
        draw_brain_icon(draw, cx, cy, size, color)

def create_blog_image(theme, index):
    """Create a single blog post image matching site style"""

    # Create gradient background
    img = create_gradient(WIDTH, HEIGHT, PRIMARY_NAVY, ACCENT_BLUE)
    draw = ImageDraw.Draw(img)

    # Icon color - white at 30% opacity (matching site: rgba(255,255,255,0.3))
    icon_color = (255, 255, 255, 77)  # 77 = 255 * 0.3

    # Draw centered icon - large size
    draw_icon(draw, theme["icon"], WIDTH//2, HEIGHT//2, 100, icon_color)

    # Save image
    filename = f"{OUTPUT_DIR}/blog-{index+1:02d}-{theme['name']}.png"
    img.save(filename, 'PNG')
    print(f"Created: {filename}")

    return filename

def main():
    """Generate all blog images"""
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print("Generating branded blog post images...")
    print(f"Dimensions: {WIDTH}x{HEIGHT}px")
    print(f"Style: Diagonal gradient (#1a365d -> #3182ce) with 30% white icons")
    print("-" * 50)

    for i, theme in enumerate(BLOG_THEMES):
        create_blog_image(theme, i)

    print("-" * 50)
    print(f"Done! Created {len(BLOG_THEMES)} images in {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
