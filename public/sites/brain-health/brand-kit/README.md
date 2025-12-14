# Brain Health and Chiropractic - Brand Kit

This folder contains all brand assets for Brain Health and Chiropractic website.

## Folder Structure

```
brand-kit/
├── README.md                 # This file
├── BRAND-GUIDE.md            # Complete brand guidelines (fonts, colors, usage)
├── logo.jpg                  # Primary logo
├── hero-background.png       # Hero section background with brain pattern
├── blog-images/              # Pre-made blog post thumbnails (800x450px)
│   ├── blog-01-brain-health.png
│   ├── blog-02-pots-dysautonomia.png
│   ├── blog-03-concussion-recovery.png
│   ├── blog-04-migraine-relief.png
│   ├── blog-05-dizziness-vertigo.png
│   ├── blog-06-functional-neurology.png
│   ├── blog-07-chiropractic-care.png
│   ├── blog-08-patient-success.png
│   ├── blog-09-wellness-tips.png
│   └── blog-10-research-updates.png
├── icons/                    # SVG icons (navy blue - for light backgrounds)
│   ├── brain.svg
│   ├── heart-pulse.svg
│   ├── head-concussion.svg
│   ├── lightning-migraine.svg
│   ├── spiral-vertigo.svg
│   ├── network-neurology.svg
│   ├── spine-chiropractic.svg
│   ├── star-success.svg
│   ├── leaf-wellness.svg
│   ├── book-research.svg
│   ├── certificate.svg
│   ├── phone.svg
│   ├── calendar.svg
│   ├── location.svg
│   ├── email.svg
│   └── white/                # White versions (for dark backgrounds)
│       └── [same icons in white]
├── fonts/                    # Font information
└── generate_blog_images.py   # Script to generate more blog images
```

## Quick Reference

### Colors (Hex Codes)

| Purpose          | Color         | Hex       |
|------------------|---------------|-----------|
| Primary Navy     | Dark Blue     | `#1a365d` |
| Primary Dark     | Darker Blue   | `#0f2544` |
| Accent Blue      | Medium Blue   | `#3182ce` |
| Button Blue      | Light Blue    | `#60a5fa` |
| Gold Accent      | Gold          | `#d69e2e` |
| Text Dark        | Near Black    | `#1a202c` |
| Text Light       | Gray          | `#718096` |

### Fonts

- **Headlines:** Playfair Display (Google Fonts)
- **Body Text:** Open Sans (Google Fonts)

### Blog Image Usage

1. Choose an image that matches your blog post topic
2. Upload to your CMS/blog platform
3. Rotate through the 10 images to keep variety
4. Images are 800x450px (16:9 ratio) - optimal for most blog platforms

### Icon Usage

- Use navy icons (`icons/*.svg`) on light/white backgrounds
- Use white icons (`icons/white/*.svg`) on dark/blue backgrounds
- SVG format scales to any size without quality loss

## Need More Assets?

Run the Python script to generate additional blog images:
```bash
python3 generate_blog_images.py
```

Edit the `BLOG_THEMES` list in the script to customize topics and icons.
