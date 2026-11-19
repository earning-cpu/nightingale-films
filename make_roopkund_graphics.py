#!/usr/bin/env python3
import os, cv2, numpy as np
from PIL import Image, ImageDraw, ImageFont

FONT_DEV = "assets/NotoSansDevanagari-Bold.ttf"
W, H = 1920, 1080

def get_font(size):
    try:
        return ImageFont.truetype(FONT_DEV, size)
    except Exception:
        return ImageFont.load_default()

def create_title_card():
    # Dark textured gradient background
    img = np.zeros((H, W, 3), dtype=np.uint8)
    for y in range(H):
        val = int(12 + 18 * np.sin(np.pi * y / H))
        img[y, :] = [int(val*1.2), val, int(val*0.8)]
    
    # Add subtle vignette & noise
    noise = np.random.randint(0, 15, (H, W, 3), dtype=np.uint8)
    img = cv2.add(img, noise)
    
    pil = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
    draw = ImageDraw.Draw(pil)
    
    f_sub = get_font(42)
    f_main = get_font(84)
    f_loc = get_font(36)
    
    # Subtitle
    draw.text((W//2, 380), "हिमालय का सबसे बड़ा अनसुलझा रहस्य", font=f_sub, fill=(200, 220, 255), anchor="mm")
    # Main Title
    draw.text((W//2, 500), "रूपकुंड: 1200 साल पुराना कंकाल कांड", font=f_main, fill=(255, 204, 0), anchor="mm")
    # Coordinates / Alt
    draw.text((W//2, 620), "ऊंचाई: 16,500 फीट • चमोली, उत्तराखंड • 100% सच्ची घटना", font=f_loc, fill=(255, 60, 60), anchor="mm")
    
    res = cv2.cvtColor(np.array(pil), cv2.COLOR_RGB2BGR)
    cv2.imwrite("public/img/roopkund_title_card.jpg", res)
    print("Created roopkund_title_card.jpg")

def create_skull_scan_hud():
    # Base is roopkund_skull_fracture.jpg
    base = cv2.imread("public/img/roopkund_skull_fracture.jpg")
    base = cv2.resize(base, (W, H))
    
    # Apply cold forensic tint
    overlay = base.copy()
    cv2.circle(overlay, (W//2, H//2 - 40), 120, (0, 0, 255), 3) # circle fracture
    cv2.circle(overlay, (W//2, H//2 - 40), 180, (0, 255, 255), 1)
    
    # Crosshairs
    cv2.line(overlay, (W//2 - 220, H//2 - 40), (W//2 + 220, H//2 - 40), (0, 255, 255), 1)
    cv2.line(overlay, (W//2, H//2 - 260), (W//2, H//2 + 180), (0, 255, 255), 1)
    
    # Scan text
    cv2.putText(overlay, "CRANIAL FORENSIC ANALYSIS [AI-SCAN]", (W//2 - 260, H//2 - 190), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
    cv2.putText(overlay, "TRAUMA: CIRCULAR BLUNT DEPRESSION FRACTURE", (W//2 - 260, H//2 + 140), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 200, 255), 2)
    cv2.putText(overlay, "PROJECTILE: ~23cm HAILSTONE (SPHERICAL ICE)", (W//2 - 260, H//2 + 180), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 100, 255), 2)
    cv2.putText(overlay, "WEAPON INJURY: NEGATIVE (ZERO EDGED BLADES)", (W//2 - 260, H//2 + 220), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (100, 255, 100), 2)

    res = cv2.addWeighted(overlay, 0.9, base, 0.1, 0)
    cv2.imwrite("public/img/roopkund_skull_scan_hud.jpg", res)
    print("Created roopkund_skull_scan_hud.jpg")

def create_timeline_graph():
    img = np.zeros((H, W, 3), dtype=np.uint8)
    for y in range(H):
        val = int(18 + 14 * np.cos(np.pi * y / H))
        img[y, :] = [val, int(val*1.1), int(val*1.3)]
        
    pil = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
    draw = ImageDraw.Draw(pil)
    
    f_h = get_font(56)
    f_b = get_font(38)
    f_s = get_font(30)
    
    draw.text((W//2, 180), "नेचर (NATURE) 2019: DNA जांच का सबसे बड़ा खुलासा", font=f_h, fill=(0, 220, 255), anchor="mm")
    
    # Box 1: 850 CE
    draw.rectangle([(250, 320), (850, 720)], outline=(100, 200, 100), width=4, fill=(20, 40, 25))
    draw.text((550, 380), "ग्रुप A: भारतीय तीर्थयात्री", font=f_b, fill=(120, 255, 120), anchor="mm")
    draw.text((550, 460), "समय: ~850 ईस्वी (1200 साल पहले)", font=f_s, fill=(220, 220, 220), anchor="mm")
    draw.text((550, 530), "कंकाल संख्या: 23 लोग", font=f_s, fill=(220, 220, 220), anchor="mm")
    draw.text((550, 600), "उत्पत्ति: दक्षिण एशिया (भारत)", font=f_s, fill=(255, 204, 0), anchor="mm")
    draw.text((550, 670), "मृत्यु: 9-इंच के जानलेवा ओले", font=f_s, fill=(255, 100, 100), anchor="mm")

    # Box 2: 1800 CE
    draw.rectangle([(1070, 320), (1670, 720)], outline=(0, 180, 255), width=4, fill=(20, 30, 50))
    draw.text((1370, 380), "ग्रुप B: भूमध्यसागरीय यात्री", font=f_b, fill=(0, 220, 255), anchor="mm")
    draw.text((1370, 460), "समय: ~1800 ईस्वी (200 साल पहले)", font=f_s, fill=(220, 220, 220), anchor="mm")
    draw.text((1370, 530), "कंकाल संख्या: 14 लोग", font=f_s, fill=(220, 220, 220), anchor="mm")
    draw.text((1370, 600), "उत्पत्ति: ग्रीस और क्रीट (यूरोप)", font=f_s, fill=(255, 204, 0), anchor="mm")
    draw.text((1370, 670), "रहस्य: 5000 KM दूर यहां क्यों आए?", font=f_s, fill=(255, 80, 80), anchor="mm")

    # Center Gap indicator
    draw.text((W//2, 830), "⚠️ दोनों गुटों के बीच 1,000 साल का फासला था!", font=f_b, fill=(255, 50, 50), anchor="mm")
    draw.text((W//2, 900), "वैज्ञानिक आज तक इस रहस्य को नहीं सुलझा पाए हैं।", font=f_s, fill=(200, 200, 200), anchor="mm")

    res = cv2.cvtColor(np.array(pil), cv2.COLOR_RGB2BGR)
    cv2.imwrite("public/img/roopkund_timeline_graph.jpg", res)
    print("Created roopkund_timeline_graph.jpg")

def create_outro_card():
    img = np.zeros((H, W, 3), dtype=np.uint8)
    for y in range(H):
        val = int(10 + 12 * np.sin(np.pi * y / H))
        img[y, :] = [int(val*1.4), int(val*0.8), int(val*0.6)]
        
    pil = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
    draw = ImageDraw.Draw(pil)
    
    f_h = get_font(68)
    f_m = get_font(42)
    f_s = get_font(32)
    
    draw.text((W//2, 380), "NIGHTINGALE FILMS", font=f_h, fill=(255, 255, 255), anchor="mm")
    draw.text((W//2, 480), "असली कहानियां • ऐतिहासिक रहस्य • विज्ञान की कसौटी", font=f_m, fill=(255, 204, 0), anchor="mm")
    draw.text((W//2, 590), "आपकी क्या राय है? कमेंट में बताएं!", font=f_m, fill=(200, 220, 255), anchor="mm")
    draw.text((W//2, 680), "लाइक और सब्सक्राइब करें", font=f_s, fill=(255, 80, 80), anchor="mm")

    res = cv2.cvtColor(np.array(pil), cv2.COLOR_RGB2BGR)
    cv2.imwrite("public/img/roopkund_outro_card.jpg", res)
    print("Created roopkund_outro_card.jpg")

if __name__ == "__main__":
    create_title_card()
    create_skull_scan_hud()
    create_timeline_graph()
    create_outro_card()
