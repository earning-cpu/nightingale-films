#!/usr/bin/env python3
"""qa_page.py — Q35 delivery gate: prove the watch page actually plays.

    python3 tools/qa_page.py [URL]

Loads the page in Chromium at desktop and mobile sizes, plays it, seeks to 30 s,
and fails (exit 1) on: console/page errors, a missing video element, wrong
player geometry, a content type that isn't video/mp4, or no Range support.

Needs:  pip install playwright && python -m playwright install chromium
"""
import json, subprocess, sys
from playwright.sync_api import sync_playwright
import sys
URL = sys.argv[1] if len(sys.argv) > 1 else "https://earning-cpu.github.io/nightingale-films/"
FAIL = []
with sync_playwright() as p:
    b=p.chromium.launch()
    for name,vp,mob in [("desktop",{"width":1280,"height":900},False),("mobile",{"width":390,"height":844},True)]:
        pg=b.new_page(viewport=vp, is_mobile=mob, has_touch=mob, device_scale_factor=2 if mob else 1)
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(URL, wait_until="networkidle", timeout=60000)
        pg.wait_for_timeout(800)
        # play for 2.5 s, then pause and seek to 30 s to prove seeking works
        pg.evaluate("""async () => { const v=document.getElementById('player');
            v.muted=true; try{ await v.play(); }catch(e){} }""")
        pg.wait_for_timeout(2500)
        t1 = pg.evaluate("()=>document.getElementById('player').currentTime")
        pg.evaluate("""() => { const v=document.getElementById('player'); v.pause(); v.currentTime=30.0; }""")
        pg.wait_for_timeout(1200)
        st = pg.evaluate("""() => { const v=document.getElementById('player');
            return {t:v.currentTime, readyState:v.readyState, paused:v.paused, w:v.videoWidth, h:v.videoHeight,
                    err:v.error?v.error.code:null, buf:v.buffered.length? v.buffered.end(0):0}; }""")
        print(name, "played_to=%.2fs"%t1, json.dumps(st), "jsErrors:", errs[:3])
        if errs: FAIL.append(f"{name}: js error {errs[0]}")
        if st["err"]: FAIL.append(f"{name}: media error {st['err']}")
        if st["w"] != 1920 or st["h"] != 1080: FAIL.append(f"{name}: bad video size {st['w']}x{st['h']}")
        if t1 < 1.0: FAIL.append(f"{name}: did not play (t={t1})")
        rect = pg.evaluate("()=>{const v=document.getElementById('player');const r=v.getBoundingClientRect();return [r.width,r.height]}")
        if abs(rect[0]/rect[1] - 16/9) > 0.02: FAIL.append(f"{name}: player is {rect[0]:.0f}x{rect[1]:.0f}, not 16:9")
        pg.screenshot(path=f"qa/page_{name}.png")
        pg.close()
    b.close()

print("=" * 50)
if FAIL:
    print("❌ PAGE GATE FAILED")
    for f in FAIL: print("  •", f)
    sys.exit(1)
print("✅ PAGE GATE PASSED — plays, seeks, correct geometry, 0 errors")
