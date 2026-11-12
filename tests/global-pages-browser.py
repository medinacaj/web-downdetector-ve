"""Synthetic GitHub Pages preview: real Chromium navigation and mobile rendering."""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = "http://127.0.0.1:3434/web-downdetector-ve/"
with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True, args=["--no-sandbox"])
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
    assert page.locator("#directory-cards .card").count() == 142
    page.locator("#directory-search").fill("outlook")
    assert page.locator("#directory-cards .card:visible").count() == 1
    assert page.locator("#directory-cards .card:visible .name").inner_text() == "Outlook"
    page.locator("#directory-search").fill("")
    page.locator("#category-filter").select_option("videojuegos")
    assert page.locator("#directory-cards .card:visible").count() >= 20
    assert remote == [], "Demo must not request third-party hosts"
    print("PASS: 142 services, Cloudflare/Gmail/Outlook/Fortnite, all groups, 320/390/768 responsive, local image and favorite, directory filters, zero remote requests")
    browser.close()
