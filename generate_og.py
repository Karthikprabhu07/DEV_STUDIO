import os
from PIL import Image, ImageDraw, ImageFont

def create_og_image():
    width = 1200
    height = 630
    
    # Create image with dark background
    img = Image.new('RGB', (width, height), color='#0A0F1D')
    draw = ImageDraw.Draw(img)
    
    # We will try to load a font, if not default to basic
    try:
        # Just use default if no specific font is easily available across OS
        font_large = ImageFont.truetype("arial.ttf", 100)
        font_medium = ImageFont.truetype("arial.ttf", 60)
        font_small = ImageFont.truetype("arial.ttf", 40)
    except IOError:
        font_large = ImageFont.load_default()
        font_medium = font_large
        font_small = font_large

    # Draw mark
    mark_text = ">_"
    draw.text((150, 250), mark_text, font=font_large, fill='#2DD4BF')
    
    # Draw wordmark
    title_text = "DEVSTUDIO"
    draw.text((350, 250), title_text, font=font_large, fill='#FFFFFF')
    
    # Draw tagline
    tagline_text = "BUILD. SHIP. LEARN."
    draw.text((350, 400), tagline_text, font=font_medium, fill='#94A3B8')

    # Save
    out_path = os.path.join('c:\\Users\\devil\\.gemini\\antigravity-ide\\scratch\\devstudio\\public', 'og-image.png')
    img.save(out_path)
    print(f"Saved OG image to {out_path}")

if __name__ == '__main__':
    create_og_image()
