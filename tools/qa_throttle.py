#!/usr/bin/env python3
"""qa_throttle.py — Q36: prove the film plays on a slow connection.

    python3 tools/qa_throttle.py [URL]

Simulates five links with CDP network emulation, plays 12 s at each, and fails
if playback falls more than 2 s behind real time or stalls more than twice.
"""
from playwright.sync_api import sync_playwright
import json, time, sys
URL="https://earning-cpu.github.io/nightingale-films/?v=2"
# (label, latency ms, down kbps)
CASES=[("Wifi 10 Mbps",20,10000),("4G 4 Mbps",80,4000),("3G 1.5 Mbps",150,1500),
       ("Slow 3G 750 kbps",300,750),("2G 350 kbps",500,350)]
FAILED=[]
with sync_playwright() as p:
    b=p.chromium.launch()
    for label,lat,kbps in CASES:
        ctx=b.new_context(viewport={"width":390,"height":844}, is_mobile=True, has_touch=True)
        pg=ctx.new_page()
        cdp=ctx.new_cdp_session(pg)
        cdp.send("Network.enable")
        cdp.send("Network.emulateNetworkConditions", {
            "offline":False,"latency":lat,
            "downloadThroughput":int(kbps*1024/8),"uploadThroughput":int(kbps*1024/8/2)})
        pg.goto(URL, wait_until="domcontentloaded", timeout=90000)
        pg.wait_for_timeout(1500)
        picked = pg.evaluate("()=>{const v=document.getElementById('player');return v.currentSrc.split('/').pop()|0}")
        # start playback and watch for stalls over 12 s
        pg.evaluate("async()=>{const v=document.getElementById('player');v.muted=true;try{await v.play()}catch(e){}}")
        stalls=0; pg.evaluate("()=>{window.__stalls=0;const v=document.getElementById('player');v.addEventListener('waiting',()=>window.__stalls++)}")
        t0=time.time()
        while time.time()-t0 < 12:
            pg.wait_for_timeout(1000)
        st=pg.evaluate("""()=>{const v=document.getElementById('player');
            return {t:+v.currentTime.toFixed(1), stalls:window.__stalls, ready:v.readyState,
                    src:v.currentSrc.split('/').pop(), buf:v.buffered.length?+v.buffered.end(v.buffered.length-1).toFixed(1):0,
                    err:v.error?v.error.code:null}}""")
        ok = st["t"] > 10 and st["stalls"] <= 2 and not st["err"]
        if not ok: FAILED.append(f"{label}: played {st['t']}s, {st['stalls']} stalls")
        print(f"{'PASS' if ok else 'FAIL'}  {label:18} src={st['src']:14} played={st['t']:5.1f}s stalls={st['stalls']} buffered_to={st['buf']}s err={st['err']}")
        pg.screenshot(path=f"qa/throttle_{kbps}kbps.png")
        ctx.close()
    b.close()
print("=" * 60)
if FAILED:
    print("❌ PLAYBACK GATE FAILED"); [print("  •", f) for f in FAILED]; sys.exit(1)
print("✅ PLAYBACK GATE PASSED — smooth from 10 Mbps down to 350 kbps")
