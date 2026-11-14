import sys,time,json
from playwright.sync_api import sync_playwright
url=sys.argv[1]; out=sys.argv[2]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',headless=True,args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    def run(name,vp,mobile=False):
        ctx=b.new_context(viewport=vp,device_scale_factor=1,is_mobile=mobile,has_touch=mobile)
        pg=ctx.new_page(); logs=[]
        pg.on('console',lambda m: logs.append(m.type+': '+m.text)); pg.on('pageerror',lambda e: logs.append('PAGEERR '+str(e)))
        t0=time.time(); pg.goto(url); pg.wait_for_function('window.__atlasReady===true',timeout=120000)
        print(name,'ready in',round(time.time()-t0,1),'s'); pg.wait_for_timeout(2500)
        pg.screenshot(path=f'{out}/{name}-1-default.png')
        print(' fps(swiftshader):',pg.evaluate('window.__atlasFps'))
        if not mobile:
            # toggle skin off, click on a structure in centre-ish area
            pg.click('[data-toggle=skin]'); pg.wait_for_timeout(800)
            pg.screenshot(path=f'{out}/{name}-2-skin-off.png')
            # click on left cheek region (zygomaticus area) - try a few points until info panel appears
            W,H=vp['width'],vp['height']
            for (fx,fy) in [(0.52,0.58),(0.5,0.5),(0.55,0.62),(0.48,0.55),(0.45,0.45)]:
                pg.mouse.click(W*fx,H*fy); pg.wait_for_timeout(700)
                if pg.locator('[data-testid=info-name]').count(): break
            print(' selected:',pg.locator('[data-testid=info-name]').all_inner_texts())
            pg.screenshot(path=f'{out}/{name}-3-selected.png')
            pg.fill('input[placeholder^=Search]','facial nerve'); pg.wait_for_timeout(300)
            pg.locator('button:has-text("Facial nerve (CN VII) (left)")').first.click(); pg.wait_for_timeout(1800)
            pg.screenshot(path=f'{out}/{name}-4-search-facial-nerve.png')
            pg.click('button:has-text("Isolate both sides")'); pg.wait_for_timeout(800)
            pg.click('button:has-text("Front")'); pg.wait_for_timeout(1800)
            pg.screenshot(path=f'{out}/{name}-5-isolate.png')
            pg.click('button:has-text("Reset all")'); pg.wait_for_timeout(500)
            pg.fill('[data-opacity=muscles]','0') if False else None
            pg.locator('[data-opacity=muscles]').fill('0'); pg.locator('[data-opacity=skin]').fill('0'); pg.wait_for_timeout(1500)
            pg.click('button:has-text("Front")'); pg.wait_for_timeout(1800)
            pg.screenshot(path=f'{out}/{name}-6-deep-layers.png')
        else:
            pg.tap('body',position={'x':vp['width']*0.5,'y':vp['height']*0.5}); pg.wait_for_timeout(800)
            pg.screenshot(path=f'{out}/{name}-2-tap.png')
            pg.click('button:has-text("Layers")'); pg.wait_for_timeout(500)
            pg.screenshot(path=f'{out}/{name}-3-layers.png')
        print(' logs:',[l for l in logs if 'error' in l.lower() or 'PAGEERR' in l][:8])
        ctx.close()
    run('desktop',{'width':1440,'height':900})
    run('mobile',{'width':390,'height':844},True)
    b.close()
