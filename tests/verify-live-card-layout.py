"""Public Chrome verification for the actual published PulsoVE card alignment."""
import shutil
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = "https://medinacaj.github.io/web-downdetector-ve/"
chrome = shutil.which("google-chrome") or shutil.which("google-chrome-stable") or shutil.which("chromium")
assert chrome, "Chrome browser is required"

with sync_playwright() as playwright:
    browser=playwright.chromium.launch(executable_path=chrome,headless=True,args=["--no-sandbox"])
    context=browser.new_context(viewport={"width":390,"height":844})
    page=context.new_page()
    external=[]
    posts=[]
    page.on("request",lambda req: (posts.append(req.url) if req.method!="GET" else None,
                                    external.append(req.url) if not req.url.startswith(BASE) else None))
    response=page.goto(BASE,wait_until="networkidle",timeout=45000)
    assert response and response.status==200
    assert page.get_by_text("VISTA PREVIA PÚBLICA").count()>0
    assert page.locator("#nube .card").count()==6
    Path("artifacts").mkdir(exist_ok=True)

    for width,columns in ((320,2),(390,2),(768,3),(1280,6)):
        page.set_viewport_size({"width":width,"height":900})
        section=page.locator("#nube")
        measured=section.locator(".card").evaluate_all("""cards => cards.map(card => {
          const bounds = element => {
            const r=element.getBoundingClientRect();
            return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};
          };
          const node = selector => bounds(card.querySelector(selector));
          return {card:bounds(card), toolbar:node('.card-actions'),header:node('.card-header'),
                  logo:node('.logo-area'),signal:node('.signal'),graph:node('.demo-chart'),
                  link:node('.card-link'),alert:node('.report-quick'),star:node('.star')};
        })""")
        actual_columns=section.locator(".cards").evaluate(
            "(el) => getComputedStyle(el).gridTemplateColumns.split(' ').filter(Boolean).length"
        )
        assert actual_columns==columns,(width,actual_columns,columns)
        assert page.evaluate("document.documentElement.scrollWidth<=innerWidth+2"),"Horizontal overflow"
        for b in measured:
            assert b["toolbar"]["bottom"]<=b["header"]["top"]+1,(width,"Toolbar/title overlap")
            assert b["header"]["bottom"]<=b["logo"]["top"]+1,(width,"Title/logo overlap")
            assert b["logo"]["bottom"]<=b["signal"]["top"]+2,(width,"Logo/chart overlap")
            assert b["graph"]["width"]>=b["link"]["width"]-32,(width,"Chart cropped by excessive padding")
            assert b["alert"]["right"]+2<=b["star"]["left"],(width,"Action buttons overlap")
            assert b["star"]["right"]<=b["card"]["right"]+1
        assert max(b["card"]["height"] for b in measured)-min(b["card"]["height"] for b in measured)<2,(width,"Misaligned card heights")
        assert max(b["graph"]["width"] for b in measured)-min(b["graph"]["width"] for b in measured)<1,(width,"Inconsistent chart widths")
        assert max(b["graph"]["height"] for b in measured)-min(b["graph"]["height"] for b in measured)<1,(width,"Inconsistent chart heights")
        section.screenshot(path=f"artifacts/pulsove-card-layout-{width}.png",animations="disabled")

    page.set_viewport_size({"width":390,"height":844})
    card=page.locator("#nube .card[data-slug='cloudflare']")
    logo=card.locator("img.logo")
    logo.scroll_into_view_if_needed()
    logo.evaluate("(el)=>el.decode()")
    assert logo.evaluate("(el)=>el.naturalWidth>0")
    assert not card.locator(".monogram").is_visible()
    report=card.locator("button.report-quick")
    report.click()
    assert page.locator("#demo-report-dialog").is_visible()
    page.get_by_role("button",name="Cancelar").click()
    assert not page.locator("#demo-report-dialog").is_visible()

    response=page.goto(BASE+"servicios/",wait_until="networkidle",timeout=45000)
    assert response and response.status==200
    assert page.locator("#directory-cards .card").count()==211
    search=page.locator("#directory-search")
    search.fill("outlook")
    assert page.locator("#directory-cards .card:visible").count()==1
    assert page.locator("#directory-cards .card:visible .name").inner_text()=="Outlook"
    search.fill("")
    page.locator("#category-filter").select_option("videojuegos")
    assert page.locator("#directory-cards .card:visible").count()>=20
    assert posts==[],"Static demo may not send reports"
    assert external==[],"Assets must be self-hosted"
    print("PUBLIC LAYOUT PASS: aligned toolbar/logo/trend at 320/390/768/1280px; 211 catalogue entries; search and report preview functional")
    browser.close()
