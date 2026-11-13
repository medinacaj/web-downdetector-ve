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
    # The complete seed catalogue is not synonymous with technical monitoring.
    assert page.get_by_text("Servicios en catálogo", exact=True).count() == 1
    assert page.get_by_text("Servicios monitoreados", exact=True).count() == 0
    assert page.get_by_text("señales técnicas cuando están disponibles", exact=False).count() >= 1
    assert page.get_by_text("Consulta:", exact=False).count() >= 1
    zero_incidents = page.locator("section.home-hero dt").filter(has_text="Incidentes activos").locator("xpath=following-sibling::dd")
    if zero_incidents.count() and zero_incidents.inner_text().strip() == "0":
        assert page.get_by_text("Sin incidentes activos registrados en PulsoVE.", exact=False).count() == 1


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
    # Ensure small category labels remain readable,
    # including the highlighted tile surface, without decorative top stripes.
    contrast_js = """(card) => {
      const channels = value => (value.match(/[0-9.]+/g) || []).slice(0, 3).map(Number);
      const luminance = value => {
        const rgb = channels(value).map(n => {
          const v = n / 255;
          return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
      };
      const foreground = luminance(getComputedStyle(card.querySelector('[data-card-title] p')).color);
      const background = luminance(getComputedStyle(card).backgroundColor);
      return (Math.max(foreground, background) + .05) / (Math.min(foreground, background) + .05);
    }"""
    for theme in ("light", "dark"):
        page.evaluate("(theme) => document.documentElement.classList.toggle('dark', theme === 'dark')", theme)
        page.wait_for_timeout(250)
        for article in grid.locator("article.service-tile").all():
            ratio = article.evaluate(contrast_js)
            assert ratio >= 4.5, ("Category label contrast", theme, round(ratio, 2))
    page.evaluate("document.documentElement.classList.remove('dark')")
    page.wait_for_timeout(250)

    # One native detail link is stretched over each whole tile. The small
    # redundant "Ver ficha" CTA is gone. Report and favorite remain separate
    # controls, not nested within that link.
    assert page.get_by_text("Ver ficha", exact=False).count() == 0
    for article in grid.locator("article.service-tile").all():
        assert article.locator("[data-card-title]").first.is_visible()
        assert article.locator("[data-card-actions]").first.is_visible()
        assert article.locator("[data-card-actions]").evaluate("(el) => el.previousElementSibling?.tagName") == "A"
        detail_link = article.locator('a[aria-label^="Ver estado y reportes"]')
        assert detail_link.count() == 1
        assert detail_link.evaluate("(el) => getComputedStyle(el, '::after').position") == "absolute"
        assert detail_link.evaluate("(el) => getComputedStyle(el, '::after').cursor") == "pointer"
        assert article.locator("[data-card-actions]").evaluate("(el) => getComputedStyle(el).pointerEvents") == "none"
        for control in article.locator("[data-card-actions] a, [data-card-actions] button").all():
            assert control.evaluate("(el) => getComputedStyle(el).pointerEvents") == "auto"
        assert article.locator('a a, a button, button a').count() == 0

    # Empty data is not an alert. The full text should stand on its own,
    # without a tiny question-mark glyph that looks like a rendering error.
    neutral = grid.get_by_text("Sin datos suficientes", exact=True)
    assert neutral.count() >= 1
    for label in neutral.all():
        assert label.locator("..").locator("svg").count() == 0

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

    # Regression contract for the requested soft corners and elevation at all
    # target widths. Never replace it with a colored border or top stripe.
    for width in (320, 390, 768, 1280):
        page.set_viewport_size({"width": width, "height": 844})
        article = grid.locator("article.service-tile").first
        appearance = article.evaluate("""(el) => {
            const style = getComputedStyle(el);
            return {
              top: style.borderTopWidth,
              radius: style.borderTopLeftRadius,
              shadow: style.boxShadow,
              image: style.backgroundImage,
            };
        }""")
        assert appearance["top"] == "0px", (width, appearance)
        assert appearance["radius"] == "13px", (width, appearance)
        assert appearance["shadow"] != "none", (width, appearance)
        assert appearance["image"] == "none", (width, appearance)
        assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth + 2"), width

    article = grid.locator("article.service-tile").first
    default_shadow = article.evaluate("(el) => getComputedStyle(el).boxShadow")
    article.hover()
    page.wait_for_timeout(300)
    raised_shadow = article.evaluate("(el) => getComputedStyle(el).boxShadow")
    assert raised_shadow != default_shadow, "Hover must provide tactile elevation"
    assert article.evaluate(contrast_js) >= 4.5, "Hover category label must retain contrast"
    article.locator('a[aria-label^="Ver estado y reportes"]').focus()
    assert article.evaluate("(el) => el.matches(':focus-within')"), "Keyboard focus must reach the card"
    page.evaluate("document.documentElement.classList.add('dark')")
    dark_shadow = article.evaluate("(el) => getComputedStyle(el).boxShadow")
    assert dark_shadow != "none", "Dark mode should keep depth"
    page.wait_for_timeout(250)
    assert article.evaluate(contrast_js) >= 4.5, "Dark hover category must retain contrast"
    page.evaluate("document.documentElement.classList.remove('dark')")

    page.set_viewport_size({"width": 390, "height": 844})
    star = page.get_by_role("button", name="Añadir CANTV a favoritos")
    assert star.count() == 1
    star.click()
    selected = page.get_by_role("button", name="Quitar CANTV de favoritos")
    assert selected.get_attribute("aria-pressed") == "true"
    assert page.evaluate("JSON.parse(localStorage.getItem('pulsove:favorites:v1'))") == ["cantv"]
    page.reload(wait_until="networkidle")
    assert page.get_by_role("button", name="Quitar CANTV de favoritos").get_attribute("aria-pressed") == "true"

    # Same-document storage writes do not trigger the browser's 'storage'
    # event. A second control (or another widget) can announce the change.
    page.evaluate("""() => {
      localStorage.setItem('pulsove:favorites:v1', JSON.stringify([]));
      window.dispatchEvent(new Event('pulsove:favorites:change'));
    }""")
    assert page.get_by_role("button", name="Añadir CANTV a favoritos").get_attribute("aria-pressed") == "false"
    page.get_by_role("button", name="Añadir CANTV a favoritos").click()
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

    for width in (768, 1280):
        page.set_viewport_size({"width": width, "height": 844})
        page.locator("section[aria-labelledby='home-services-title']").screenshot(
            path=f"artifacts/pulsove-home-{width}.png", animations="disabled"
        )

    page.set_viewport_size({"width": 390, "height": 844})
    link = page.get_by_role("link", name="Ver estado y reportes de CANTV")
    assert link.get_attribute("href") == "/servicios/cantv"
    # Click the empty lower-left part of the footer, outside both action
    # buttons. It must open the service even though the content link ends
    # above the footer. Verify real navigation, not just CSS declarations.
    first_article = link.locator("xpath=..")
    footer = first_article.locator("[data-card-actions]")
    footer_box = footer.bounding_box()
    assert footer_box is not None
    page.mouse.click(footer_box["x"] + 12, footer_box["y"] + footer_box["height"] / 2)
    page.wait_for_url("**/servicios/cantv", timeout=30000)
    assert page.get_by_role("heading", name="Acerca de la empresa y el servicio").count() == 1
    page.go_back(wait_until="networkidle")
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
    # A range brush with no plotted points is a non-functional control.
    # The date picker and keyboard interval navigation remain available.
    assert history.get_by_role("button", name="Explorar rango / zoom").is_disabled()
    previous = history.get_by_role("button", name="← Anterior")
    next_interval = history.get_by_role("button", name="Siguiente →")
    picker = history.locator("select")
    assert picker.input_value() == "23"
    assert next_interval.is_disabled()
    previous.click()
    assert picker.input_value() == "22"
    next_interval.click()
    assert picker.input_value() == "23"

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


    # Directory favorites use the same browser-local storage as home cards.
    # All directory entries can now be starred, including those not featured.
    directory = page.goto("http://127.0.0.1:3000/servicios", wait_until="networkidle", timeout=60000)
    assert directory and directory.status == 200
    only = page.locator("[data-favorites-only]")
    assert only.count() == 1
    assert only.get_attribute("aria-pressed") == "false"
    page.evaluate("""() => {
      localStorage.setItem('pulsove:favorites:v1', '[]');
      window.dispatchEvent(new Event('pulsove:favorites:change'));
    }""")
    assert "(0)" in only.inner_text()
    only.click()
    assert page.get_by_text("No hay favoritos en estos resultados").count() == 1
    page.get_by_role("button", name="Mostrar todos").click()
    assert only.get_attribute("aria-pressed") == "false"

    star = page.get_by_role("button", name="Añadir CANTV a favoritos")
    assert star.count() == 1
    star.click()
    assert "(1)" in only.inner_text()
    only.click()
    assert only.get_attribute("aria-pressed") == "true"
    assert page.locator("[data-directory-grid] > li").count() == 1
    assert "Mostrando 1 de" in page.locator("[data-directory-results]").inner_text()

    # The blank footer of a directory tile is also a native detail link,
    # but clicking its star must never navigate.
    tile = page.locator("[data-directory-grid] > li").first
    footer = tile.locator(".directory-favorite-action")
    area = footer.bounding_box()
    assert area is not None
    page.mouse.click(area["x"] + 8, area["y"] + area["height"] / 2)
    page.wait_for_url("**/servicios/cantv", timeout=30000)
    assert page.get_by_role("heading", name="Acerca de la empresa y el servicio").count() == 1

    page.goto("http://127.0.0.1:3000/servicios", wait_until="networkidle", timeout=60000)
    page.get_by_role("button", name="Lista", exact=True).click()
    assert page.locator("[data-directory-list] > li").count() >= 200
    only = page.locator("[data-favorites-only]")
    only.click()
    assert page.locator("[data-directory-list] > li").count() == 1
    page.get_by_role("button", name="Quitar CANTV de favoritos").click()
    assert page.get_by_text("No hay favoritos en estos resultados").count() == 1
    assert "(0)" in only.inner_text()
    page.get_by_role("button", name="Mostrar todos").click()
    assert page.locator("[data-directory-list] > li").count() >= 200
    for width in (320, 390, 768, 1280):
        page.set_viewport_size({"width": width, "height": 844})
        overflow = page.evaluate("document.documentElement.scrollWidth - innerWidth")
        if overflow > 2:
            offending = page.evaluate("""() => [...document.querySelectorAll('body *')]
              .filter(el => el.getBoundingClientRect().right > innerWidth + 2)
              .slice(0, 8).map(el => ({tag: el.tagName, className: String(el.className).slice(0, 120),
                right: Math.round(el.getBoundingClientRect().right)}))""")
            raise AssertionError(("directory horizontal overflow", width, overflow, offending))
    page.set_viewport_size({"width": 390, "height": 844})
    page.screenshot(path="artifacts/pulsove-directory-390.png", full_page=False, animations="disabled")

    print("Mobile cards responsive; quick report links to real protected service form; optional fields collapsed; favorites persist.")
    browser.close()
