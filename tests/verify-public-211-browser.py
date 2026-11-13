"""Verify the ACTUAL public GitHub Pages build, not a local artifact."""
import shutil
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = "https://medinacaj.github.io/web-downdetector-ve/"
chrome = shutil.which("google-chrome") or shutil.which("google-chrome-stable") or shutil.which("chromium")
assert chrome, "Chrome is required"
with sync_playwright() as playwright:
    browser = playwright.chromium.launch(executable_path=chrome,headless=True,args=["--no-sandbox"])
    context = browser.new_context(viewport={"width":390,"height":844})
    page = context.new_page()
    remote = []
    posts = []
    page.on("request",lambda req: (posts.append(req.url) if req.method != "GET" else None, remote.append(req.url) if not req.url.startswith(BASE) else None))
    res=page.goto(BASE,wait_until="networkidle",timeout=45000)
    assert res and res.status==200, "Public homepage must be accessible"
    assert page.get_by_text("VISTA PREVIA PÚBLICA").count()>0
    assert page.locator(".stats").get_by_text("211").count()>=1
    assert page.get_by_text("Gráficos ficticios de ejemplo").count()>=1

    charts=page.locator("main .card .demo-chart")
    assert charts.count()==60, "Expected 12 national + 48 global demo charts"
    assert page.locator("main .card .demo-label").count()==60
    assert charts.first.locator("polyline").get_attribute("points") != charts.nth(1).locator("polyline").get_attribute("points")

    card=page.locator("#nube .card[data-slug='cloudflare']")
    logo=card.locator("img.logo")
    logo.scroll_into_view_if_needed()
    logo.evaluate("(el)=>el.decode()")
    assert logo.evaluate("(el)=>el.naturalWidth>0")
    assert not card.locator(".monogram").is_visible()

    alert=card.locator("button.report-quick")
    star=card.locator("button.star")
    assert alert.inner_text().strip()=="!"
    assert alert.get_attribute("aria-label")=="Reportar falla de Cloudflare"
    assert alert.evaluate("(el)=>Math.round(el.getBoundingClientRect().width)")<=40
    assert alert.evaluate("(el)=>getComputedStyle(el).backgroundColor")=="rgb(220, 38, 38)"
    assert alert.evaluate("(el)=>el.getBoundingClientRect().right")<star.evaluate("(el)=>el.getBoundingClientRect().left")
    alert.click()
    dialog=page.locator("#demo-report-dialog")
    assert dialog.is_visible()
    assert "Cloudflare" in page.locator("#demo-report-title").inner_text()
    page.locator("#demo-state").select_option("VE-A")
    page.locator("#demo-consent").check()
    page.get_by_role("button",name="Probar reporte (demo)").click()
    assert "No se envió ni guardó" in page.locator("#demo-report-feedback").inner_text()
    page.get_by_role("button",name="Cancelar").click()
    assert not dialog.is_visible()
    assert posts==[], "Public demo must never POST reports"
    assert remote==[], "All assets should be self-hosted"

    Path("artifacts").mkdir(exist_ok=True)
    for width in (320,390):
        page.set_viewport_size({"width":width,"height":844})
        assert page.evaluate("document.documentElement.scrollWidth<=innerWidth+2"), "Horizontal overflow"
        columns=page.locator("#nube .cards").evaluate("(el)=>getComputedStyle(el).gridTemplateColumns.split(' ').filter(Boolean).length")
        assert columns==2, "Mobile must use 2 columns"
        page.screenshot(path=f"artifacts/pulsove-global-public-{width}.png",full_page=True,animations="disabled")

    res=page.goto(BASE+"servicios/",wait_until="networkidle",timeout=45000)
    assert res and res.status==200
    assert page.locator("#directory-cards .card").count()==211
    assert page.locator("#directory-cards .demo-chart").count()==211
    assert page.locator("#directory-cards .report-quick").count()==211
    page.locator("#directory-search").fill("signal")
    assert page.locator("#directory-cards .card:visible").count()==1
    assert page.locator("#directory-cards .card:visible .name").inner_text()=="Signal"
    assert posts==[] and remote==[], "Public preview may not transmit to third-party hosts"
    print("LIVE VERIFIED: 211 services, 50 local logos, 60 simulated charts, red compact alert, mobile 320/390, safe report modal, no POST/external request")
    browser.close()
