import sys,time
from playwright.sync_api import sync_playwright
url=sys.argv[1]; out=sys.argv[2]; only=sys.argv[3] if len(sys.argv)>3 else 'all'
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',headless=True,args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    def snap(pg,name,wait=2500):
        pg.wait_for_timeout(wait); pg.screenshot(path=f'{out}/{name}.png'); print('  shot',name)
    def search(pg,q,label):
        pg.fill('input[placeholder^=Search]',q); pg.wait_for_timeout(400)
        pg.locator(f'button:has-text("{label}")').first.click()
    def name(pg): return pg.locator('[data-testid=info-name]').all_inner_texts()
    if only in ('all','desktop'):
        ctx=b.new_context(viewport={'width':1440,'height':900}); pg=ctx.new_page(); logs=[]
        pg.on('console',lambda m: logs.append(m.type+': '+m.text) if m.type in('error','warning') else None); pg.on('pageerror',lambda e: logs.append('PAGEERR '+str(e)))
        t0=time.time(); pg.goto(url+'?quality=high'); pg.wait_for_function('window.__atlasReady===true',timeout=180000)
        print('desktop ready',round(time.time()-t0,1)); snap(pg,'v2-01-default-high',4000)
        pg.click('[data-toggle=skin]'); pg.click('[data-autorotate]')
        search(pg,'temporal branches','Temporal branches of facial nerve (left)'); snap(pg,'v2-02-branch-temporal',3500); print('  sel',name(pg))
        for sid,fn in [('facial_zygomatic_branches','03-branch-zygomatic'),('facial_buccal_branches','04-branch-buccal'),('facial_marginal_mandibular_branch','05-branch-marginal-mandibular'),('facial_cervical_branch','06-branch-cervical'),('facial_nerve','07-facial-trunk')]:
            pg.click(f'[data-branch="nerve.{sid}.l"]'); snap(pg,'v2-'+fn,3500); print('  sel',name(pg))
        pg.click('[data-testid=highlight-branches]'); pg.click('button:has-text("Left")'); snap(pg,'v2-08-highlight-all-branches',4000)
        pg.click('[data-testid=highlight-branches]')
        search(pg,'zygomaticus major','Zygomaticus major (left)'); snap(pg,'v2-09-muscle-markers-label',3500); print('  sel',name(pg))
        pg.click('[data-expr=smile]'); snap(pg,'v2-10-expression-smile',4000)
        pg.click('[data-expr=clench]'); snap(pg,'v2-11-expression-clench',3000)
        pg.click('[data-expr=clench]')
        pg.click('button:has-text("Reset all")'); pg.wait_for_timeout(800); pg.click('[data-autorotate]')
        pg.locator('[data-explode]').fill('70'); snap(pg,'v2-12-explode',4000)
        pg.locator('[data-explode]').fill('0'); pg.click('[data-toggle=skin]'); pg.click('[data-toggle=brain]'); pg.click('[data-toggle=muscles]'); pg.click('[data-toggle=bones]'); pg.click('button:has-text("Left")'); snap(pg,'v2-13-brain-sinuses',4000)
        print('  fps',pg.evaluate('window.__atlasFps')); print('  logs',logs[:6]); ctx.close()
    if only in ('all','mobile'):
        ctx=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True); pg=ctx.new_page(); logs=[]
        pg.on('pageerror',lambda e: logs.append('PAGEERR '+str(e)))
        t0=time.time(); pg.goto(url); pg.wait_for_function('window.__atlasReady===true',timeout=180000); print('mobile ready',round(time.time()-t0,1))
        snap(pg,'v2-m1-default-lite',3000)
        pg.click('[data-expr=smile]'); snap(pg,'v2-m2-expression',3000); pg.click('[data-expr=smile]')
        pg.fill('input[placeholder^=Search]','marginal'); pg.wait_for_timeout(400); pg.locator('button:has-text("Marginal mandibular branch of facial nerve (right)")').first.click(); snap(pg,'v2-m3-branch',3500)
        print('  sel',name(pg)); print('  quality btn',pg.locator('[data-quality]').count(), 'logs',logs[:5]); ctx.close()
    b.close()
