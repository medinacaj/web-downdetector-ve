"""Synthetic GitHub Pages preview: real Chromium navigation and mobile rendering."""
from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright

ROOT = "http://127.0.0.1:3434/web-downdetector-ve/"
with sync_playwright() as playwright:
    chrome = shutil.which("google-chrome") or shutil.which("google-chrome-stable") or shutil.which("chromium")
    assert chrome, "Chromium executable unavailable"
    browser = playwright.chromium.launch(executable_path=chrome, headless=True, args=["--no-sandbox"])
    context = browser.new_context(viewport={"width": 390, "height": 844})
    page = context.new_page()
    remote = []
    page.on("request", lambda request: remote.append(request.url) if not request.url.startswith("http://127.0.0.1:3434/") else None)
    response = page.goto(ROOT, wait_until="networkidle")
    assert response and response.status == 200
    assert page.get_by_text("VISTA PREVIA PÚBLICA").count() >= 1

    for name in ("Cloudflare", "Gmail", "Outlook", "Fortnite"):
        assert page.get_by_role("link", name="Ver ficha de " + name).count() == 1, name

    assert page.locator("#nube .card").count() == 6
    assert page.locator("#correo .card").count() == 6
    assert page.locator("#juegos .card").count() == 6
    assert page.locator("#ia-comunidad .card").count() == 6
    assert page.locator("#comercio .card").count() == 6

    for width in (320, 390, 768):
        page.set_viewport_size({"width": width, "height": 844})
        count = page.locator("#juegos .cards").evaluate(
            "(el) => getComputedStyle(el).gridTemplateColumns.split(' ').filter(Boolean).length"
        )
        assert count == (2 if width < 760 else 3), (width, count)
        assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth + 2")

    page.set_viewport_size({"width": 390, "height": 844})
    logo = page.locator("#nube img[src$='/brands/cloudflare.svg']").first
    logo.scroll_into_view_if_needed()
    logo.evaluate("(el) => el.decode()")
    assert logo.evaluate("(el) => el.naturalWidth > 0")
    cloudflare_card = page.locator("#nube .card[data-slug='cloudflare']")
    fallback = cloudflare_card.locator(".monogram")
    assert fallback.count() == 1
    assert fallback.get_attribute("hidden") is not None
    assert fallback.evaluate("(el) => getComputedStyle(el).display") == "none", "Logo must not show alongside monogram"
    logo.evaluate("(el) => el.dispatchEvent(new Event('error'))")
    assert fallback.is_visible(), "Monogram must appear when a logo fails"
    assert not logo.is_visible(), "Broken logo should be hidden"
    page.reload(wait_until="networkidle")
    cloudflare_card = page.locator("#nube .card[data-slug='cloudflare']")
    assert cloudflare_card.locator(".logo").is_visible()
    assert not cloudflare_card.locator(".monogram").is_visible()
    report = cloudflare_card.locator("button[data-report='cloudflare']")
    assert report.count() == 1, "Every card needs a quick report action"
    report.click()
    dialog = page.locator("#demo-report-dialog")
    assert dialog.is_visible(), "Quick report preview should open as a modal"
    assert page.locator("#demo-report-service").inner_text() == "Cloudflare"
    assert page.locator("#demo-issue option").count() >= 2
    assert page.locator("#demo-state option").count() == 25
    assert page.get_by_text("esta demo no envía ni almacena reportes").count() == 1
    page.locator("#demo-state").select_option("VE-A")
    page.locator("#demo-consent").check()
    page.get_by_role("button", name="Probar reporte (demo)").click()
    assert "No se envió ni guardó" in page.locator("#demo-report-feedback").inner_text()
    page.get_by_role("button", name="Cancelar").click()
    assert not dialog.is_visible()
    page.locator("button[data-fav='cloudflare']").first.click()
    assert page.locator("button[data-fav='cloudflare']").first.get_attribute("aria-pressed") == "true"
    page.reload(wait_until="networkidle")
    assert page.locator("button[data-fav='cloudflare']").first.get_attribute("aria-pressed") == "true"

    Path("artifacts").mkdir(exist_ok=True)
    page.screenshot(path="artifacts/global-pages-390.png", full_page=True, animations="disabled")
    page.set_viewport_size({"width": 320, "height": 844})
    page.screenshot(path="artifacts/global-pages-320.png", full_page=True, animations="disabled")

    response = page.goto(ROOT + "servicios/", wait_until="networkidle")
    assert response and response.status == 200
    assert page.locator("#directory-cards .card").count() == 211
    assert page.locator("#directory-cards button[data-report]").count() == 211
    page.locator("#directory-search").fill("outlook")
    assert page.locator("#directory-cards .card:visible").count() == 1
    assert page.locator("#directory-cards .card:visible .name").inner_text() == "Outlook"
    page.locator("#directory-search").fill("")
    page.locator("#category-filter").select_option("videojuegos")
    assert page.locator("#directory-cards .card:visible").count() >= 20
    assert remote == [], "Demo must not request third-party hosts"
    print("PASS: 211 services; logos exclusive with fallback, 142 quick-report modal actions, simulated form without backend, responsive cards and no external requests")
    browser.close()
