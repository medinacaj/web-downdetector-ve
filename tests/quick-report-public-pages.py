"""Verify the deployed GitHub Pages demo (no backend and no test reports sent)."""
import shutil
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = "https://medinacaj.github.io/web-downdetector-ve/"
chrome = shutil.which("google-chrome") or shutil.which("google-chrome-stable") or shutil.which("chromium")
assert chrome, "Chrome browser unavailable"

with sync_playwright() as playwright:
    browser=playwright.chromium.launch(executable_path=chrome,headless=True,args=["--no-sandbox"])
    context=browser.new_context(viewport={"width":390,"height":844})
    page=context.new_page()
    network=[]
    page.on("request",lambda req: network.append((req.method,req.url)))
    resp=page.goto(BASE,wait_until="networkidle",timeout=45000)
    assert resp and resp.status==200
    assert page.get_by_text("VISTA PREVIA PÚBLICA").count()>=1
    assert "142" in page.locator(".stats").inner_text()

    for name in ("Cloudflare","Gmail","Outlook","Fortnite"):
        assert page.get_by_role("link",name="Ver ficha de "+name).count()==1

    card=page.locator("#nube .card[data-slug='cloudflare']")
    logo=card.locator("img.logo")
    monogram=card.locator(".monogram")
    logo.scroll_into_view_if_needed()
    logo.evaluate("(el)=>el.decode()")
    assert logo.evaluate("(el)=>el.complete && el.naturalWidth>0")
    assert not monogram.is_visible(), "Monogram must remain hidden when the logo loaded"
    logo.evaluate("(el)=>el.dispatchEvent(new Event('error'))")
    assert not logo.is_visible() and monogram.is_visible(), "Fallback works only on actual logo failure"

    report=card.locator("button[data-report='cloudflare']")
    report.click()
    modal=page.locator("#demo-report-dialog")
    assert modal.is_visible()
    assert page.locator("#demo-report-service").inner_text()=="Cloudflare"
    assert page.locator("#demo-issue option").count()>=2
    page.locator("#demo-state").select_option("VE-A")
    page.locator("#demo-consent").check()
    page.get_by_role("button",name="Probar reporte (demo)").click()
    assert "No se envió ni guardó" in page.locator("#demo-report-feedback").inner_text()
    page.get_by_role("button",name="Cancelar").click()
    assert not modal.is_visible()
    assert all(method=="GET" for method,url in network), "Preview must not transmit reports"

    page.reload(wait_until="networkidle")
    assert card.locator("img.logo").is_visible() and not card.locator(".monogram").is_visible()
    Path("artifacts").mkdir(exist_ok=True)
    page.screenshot(path="artifacts/pulsove-public-logo-only-390.png",full_page=True,animations="disabled")
    page.set_viewport_size({"width":320,"height":844})
    assert page.evaluate("document.documentElement.scrollWidth<=window.innerWidth+2")
    page.screenshot(path="artifacts/pulsove-public-logo-only-320.png",full_page=True,animations="disabled")

    resp=page.goto(BASE+"servicios/",wait_until="networkidle",timeout=45000)
    assert resp and resp.status==200
    assert page.locator("#directory-cards .card").count()==142
    assert page.locator("#directory-cards button[data-report]").count()==142
    assert all(method=="GET" for method,url in network)
    print("PUBLIC VERIFIED: 142 cards, logo-only when available, error-only monogram, quick-report modal, no POST and mobile rendering")
    browser.close()
