#!/usr/bin/env python3
"""Real Chromium smoke test for PulsoVE service tiles on mobile."""
import shutil
from pathlib import Path
from playwright.sync_api import sync_playwright

chrome = shutil.which("google-chrome") or shutil.which("google-chrome-stable") or shutil.which("chromium")
if not chrome:
    raise SystemExit("Chrome is required for the responsive smoke test")

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(executable_path=chrome, headless=True, args=["--no-sandbox"])
    context = browser.new_context(viewport={"width": 390, "height": 844})
    page = context.new_page()
    response = page.goto("http://127.0.0.1:3000/", wait_until="networkidle", timeout=45000)
    assert response and response.status == 200, "Home must serve HTTP 200"

    grid = page.locator("section[aria-labelledby='home-services-title'] ul")
    cards = grid.locator(":scope > li")
    assert cards.count() == 12, "12 featured services must be shown"

    # The international catalogue is visible on the index, not just in seed files.
    global_section = page.locator("section[aria-labelledby='global-platforms-title']")
    assert global_section.count() == 1
    assert global_section.locator("ul > li").count() == 48, "48 global services must appear in the homepage"
    for name in ("Cloudflare", "Gmail", "Outlook", "Fortnite"):
        assert global_section.get_by_role("link", name="Ver estado y reportes de " + name).count() == 1
    assert global_section.locator("img[alt^='Logotipo identificativo de']").count() >= 15


    # Top stripes were the unwanted decoration. Rounded corners and a soft shadow remain.
    for card in grid.locator("article.service-tile").all():
        appearance = card.evaluate("""(el) => {
            const s = getComputedStyle(el);
            return {border:s.borderTopWidth, radius:s.borderTopLeftRadius, shadow:s.boxShadow, gradient:s.backgroundImage};
        }""")
        assert appearance["border"] == "0px", appearance
        assert appearance["radius"] == "13px", appearance
        assert appearance["shadow"] != "none", appearance
        assert appearance["gradient"] == "none", appearance

    # Each product category has a distinct editorial accent; it is not uptime status.
    telecom = page.locator('article.service-tile[data-category="telecomunicaciones"]').first
    banking = page.locator('article.service-tile[data-category="banca-y-pagos"]').first
    assert telecom.count() and banking.count()
    assert telecom.evaluate("(el) => getComputedStyle(el).getPropertyValue('--tile-accent')") != banking.evaluate("(el) => getComputedStyle(el).getPropertyValue('--tile-accent')")
    for article in grid.locator("article.service-tile").all():
        assert article.locator("[data-card-title]").first.is_visible()
        assert article.locator("[data-card-actions]").first.is_visible()
        assert article.locator("[data-card-actions]").evaluate("(el) => el.previousElementSibling?.tagName") == "A"

    # Logos come from a reviewed, self-hosted allowlist; the browser must
    # never receive a broken external logo or a third-party tracking request.
    logo_images = grid.locator('img[alt^="Logotipo identificativo de"]')
    card_brands = grid.locator("h3").all_inner_texts()
    logo_sources = logo_images.evaluate_all("(nodes) => nodes.map(el => el.getAttribute('src'))")
    print("BRAND CARD DEBUG:", {"names": card_brands, "logo_src": logo_sources}, flush=True)
    assert logo_images.count() >= 5, "Expected verified company logos instead of monograms"
    for i in range(logo_images.count()):
        img = logo_images.nth(i)
        img.scroll_into_view_if_needed()
        img.evaluate("(el) => el.loading = 'eager'")
        img.evaluate("(el) => el.decode()")
        assert img.evaluate("(el) => el.complete && el.naturalWidth > 0"), (
            "Company logo failed to load: " + str(img.get_attribute("src"))
        )

    # Integration tests may have created disposable reports. Validate each
    # card against its REAL numeric total, rather than assuming an empty DB.
    for index in range(cards.count()):
        card = cards.nth(index)
        count = int(card.locator("span.font-mono.font-semibold").inner_text())
        chart = card.locator("svg[role='img']")
        empty = card.get_by_text("Sin reportes recientes")
        if count == 0:
            assert chart.count() == 0, "Zero-report service cannot show a fabricated curve"
            assert empty.count() == 1, "Zero-report service must show an honest empty state"
        else:
            assert chart.count() == 1, "Recorded activity must have a sparkline"
            assert empty.count() == 0, "Activity cannot be labelled as empty"

    for width in (320, 390, 768):
        page.set_viewport_size({"width": width, "height": 844})
        grid_columns = grid.evaluate("(el) => getComputedStyle(el).gridTemplateColumns.split(' ').filter(Boolean).length")
        assert grid_columns == 2, f"Expected 2 columns at {width}px, got {grid_columns}"
        overflow = page.evaluate("document.documentElement.scrollWidth - window.innerWidth")
        assert overflow <= 2, f"Horizontal overflow at {width}px: {overflow}px"
        geometry = cards.evaluate_all("""(items) => items.map(item => {
          const card = item.querySelector('article');
          const box = (node) => {
            const r = node.getBoundingClientRect();
            return {left:r.left, right:r.right, top:r.top, bottom:r.bottom, width:r.width, height:r.height};
          };
          return {
            article:box(card),
            link:box(card.querySelector('a[aria-label^="Ver estado y reportes"]')),
            toolbar:box(card.querySelector('[data-card-actions]')),
            title:box(card.querySelector('[data-card-title]')),
            logo:box(card.querySelector('[data-card-logo]')),
            chart:box(card.querySelector('[data-card-trend]')),
            alert:box(card.querySelector('a[aria-label^="Reportar falla"]')),
            star:box(card.querySelector('button[aria-label*="favoritos"]'))
          };
        })""")
        for rect in geometry:
            assert rect["title"]["top"] >= rect["link"]["top"] - 1, (width, "title must begin full-width card", rect)
            assert rect["title"]["width"] >= rect["article"]["width"] - 42, (width, "title too narrow", rect)
            assert rect["title"]["bottom"] <= rect["logo"]["top"] + 1, (width, "title/logo collision", rect)
            assert rect["link"]["bottom"] <= rect["toolbar"]["top"] + 1, (width, "toolbar must be beneath details", rect)
            assert rect["toolbar"]["bottom"] <= rect["article"]["bottom"] + 1, (width, "actions escape card", rect)
            assert rect["logo"]["bottom"] <= rect["chart"]["top"] + 30, (width, "logo/chart collision")
            assert rect["alert"]["right"] + 1 <= rect["star"]["left"], (width, "buttons collide")
            assert rect["chart"]["width"] >= rect["article"]["width"] - 42, (width, "chart too narrow")
            assert abs(rect["chart"]["height"] - 60) <= 1, (width, "chart heights differ")
        assert max(x["chart"]["width"] for x in geometry) - min(x["chart"]["width"] for x in geometry) < 1, (
            width, "Charts in a row must have identical widths"
        )

    page.set_viewport_size({"width": 390, "height": 844})
    star = page.get_by_role("button", name="Añadir CANTV a favoritos")
    assert star.count() == 1
    star.click()
    selected = page.get_by_role("button", name="Quitar CANTV de favoritos")
    assert selected.get_attribute("aria-pressed") == "true"
    assert page.evaluate("JSON.parse(localStorage.getItem('pulsove:favorites:v1'))") == ["cantv"]
    page.reload(wait_until="networkidle")
    assert page.get_by_role("button", name="Quitar CANTV de favoritos").get_attribute("aria-pressed") == "true"

    # Keep visual evidence from the exact tested build, not mocked screenshots.
    Path("artifacts").mkdir(exist_ok=True)
    page.locator("section[aria-labelledby='home-services-title']").screenshot(
        path="artifacts/pulsove-home-390.png", animations="disabled"
    )
    page.set_viewport_size({"width": 320, "height": 844})
    page.locator("section[aria-labelledby='home-services-title']").screenshot(
        path="artifacts/pulsove-home-320.png", animations="disabled"
    )

    link = page.get_by_role("link", name="Ver estado y reportes de CANTV")
    assert link.get_attribute("href") == "/servicios/cantv"
    quick = page.get_by_role("link", name="Reportar falla de CANTV")
    assert quick.count() == 1
    assert quick.get_attribute("href") == "/servicios/cantv#reportar"
    assert "bg-red-600" in (quick.get_attribute("class") or ""), "Alert must have red danger styling"
    assert quick.evaluate("(el) => Math.round(el.getBoundingClientRect().width)") <= 40, "Quick report icon must be small"
    assert quick.inner_text().strip() == "!", "Exclamation icon should replace large report button"
    quick.click()
    page.wait_for_url("**/servicios/cantv*", timeout=30000)
    print("QUICK REPORT TARGET:", page.url, flush=True)
    assert page.url.split("#")[0].rstrip("/").endswith("/servicios/cantv")
    assert page.url.split("#")[-1] == "reportar", "Deep link must focus the form section"
    report_section = page.locator("#reportar")
    assert report_section.is_visible()
    assert report_section.get_by_role("heading", name="Reportar una falla de CANTV").count() == 1
    assert report_section.locator("select[name='issueTypeSlug']").count() == 1
    assert report_section.locator("select[name='stateCode']").count() == 1
    optional = report_section.locator("details")
    assert optional.count() == 1 and not optional.get_attribute("open")
    assert optional.get_by_text("Añadir detalles (opcional)").count() == 1
    assert report_section.locator("button[type='submit']").is_disabled()
    # Interactive, truthful service detail uses actual PostgreSQL buckets.
    assert page.get_by_role("heading", name="Acerca de la empresa y el servicio").count() == 1
    history = page.locator("section[aria-labelledby='history-chart-title']")
    assert history.count() == 1
    assert history.get_by_role("button", name="90d").count() == 1
    assert history.get_by_role("button", name="Barras").count() == 1
    assert history.get_by_role("button", name="Área").count() == 1
    assert history.get_by_text("Sin reportes registrados en este periodo").count() == 1
    history.get_by_role("button", name="90d").click()
    assert history.get_by_role("button", name="90d").get_attribute("aria-pressed") == "true"
    assert history.locator("select option").count() == 90
    history.get_by_role("button", name="Barras").click()
    assert history.get_by_role("button", name="Barras").get_attribute("aria-pressed") == "true"
    history.get_by_role("button", name="7d").click()
    assert history.locator("select option").count() == 7
    assert history.get_by_text("Sin observaciones de incidentes registrados").count() == 1
    for width in (320, 390, 768, 1280):
        page.set_viewport_size({"width": width, "height": 844})
        assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth + 2"), ("real detail overflow", width)


    print("Mobile cards responsive; quick report links to real protected service form; optional fields collapsed; favorites persist.")
    browser.close()
