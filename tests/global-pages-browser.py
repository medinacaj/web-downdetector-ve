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
    for section in ("redes-globales", "entretenimiento", "juegos-nuevos"):
        assert page.locator("#" + section + " .card").count() == 6
    charts = page.locator("main .card .demo-chart")
    assert charts.count() == 60, "All 60 visible cards need illustrative charts"
    assert page.locator("main .card .demo-label").count() == 0, "No redundant demo label in cards"
    assert page.locator("main .card .notice").count() == 0, "No repeated disclaimer beneath each chart"
    assert page.locator(".banner").count() == 1, "One global static-preview disclosure"
    assert page.locator("#nube .card .name").first.is_visible()
    assert page.locator("#nube .card .card-cta").first.is_visible()
    assert page.locator("#nube .card .card-actions").first.is_visible()
    # The removed decoration is the colored line, not radius or shadow.
    borderless = page.locator("#nube .card").first
    assert borderless.evaluate("(el) => getComputedStyle(el).borderTopWidth") == "0px"
    assert borderless.evaluate("(el) => getComputedStyle(el).borderTopLeftRadius") == "13px"
    assert borderless.evaluate("(el) => getComputedStyle(el).boxShadow") != "none"
    colors = page.locator("#nube .card").first.evaluate("(el) => getComputedStyle(el).getPropertyValue('--plot').trim()")
    games_color = page.locator("#juegos .card").first.evaluate("(el) => getComputedStyle(el).getPropertyValue('--plot').trim()")
    assert colors != games_color, "Chart traces identify categories without decorative borders"
    assert page.locator("main .section-index").count() == 9, "Every homepage group needs its editorial number"
    for card in page.locator("#nube .card").all():
        appearance = card.evaluate("""(el) => {
          const s = getComputedStyle(el);
          return { border: s.borderTopWidth, radius: s.borderTopLeftRadius, shadow: s.boxShadow }
        }""")
        assert appearance["border"] == "0px", ("No colored top border", appearance)
        assert appearance["radius"] == "13px", ("Restore softly rounded cards", appearance)
        assert appearance["shadow"] != "none", ("Restore restrained depth", appearance)
    hero = page.locator(".wrap.hero").first
    assert hero.evaluate("(el) => getComputedStyle(el).borderTopWidth") == "0px"
    assert hero.evaluate("(el) => getComputedStyle(el).borderTopLeftRadius") == "16px"
    assert hero.evaluate("(el) => getComputedStyle(el).boxShadow") != "none"

    # Quick filters, search reset, keyboard search and display mode are real controls.
    page.get_by_role("button", name="Nube", exact=True).click()
    assert page.get_by_role("button", name="Nube", exact=True).get_attribute("aria-pressed") == "true"
    assert page.locator("main .card:visible").count() >= 6
    assert page.locator("#home-search-count").inner_text().endswith("servicios destacados")
    page.get_by_role("button", name="Todos", exact=True).click()
    assert page.locator("main .card:visible").count() == 60
    page.locator("#quicksearch").fill("zzzzsinresultados")
    assert page.locator("main .card:visible").count() == 0
    assert page.locator("#home-empty").is_visible()
    page.get_by_role("button", name="Limpiar").click()
    assert page.locator("main .card:visible").count() == 60
    page.locator("#quicksearch").blur()
    page.keyboard.press("/")
    assert page.locator("#quicksearch").evaluate("(el) => document.activeElement === el")
    page.locator("#quicksearch").fill("fortnite")
    assert page.locator("main .card:visible").count() >= 1
    page.keyboard.press("Escape")
    assert page.locator("main .card:visible").count() == 60
    theme = page.locator("#theme-toggle")
    assert page.locator("body").get_attribute("data-theme") == "light", "Light is the initial high-contrast presentation"
    theme.click()
    assert page.locator("body").get_attribute("data-theme") == "dark"
    assert theme.get_attribute("aria-pressed") == "false"
    page.reload(wait_until="networkidle")
    assert page.locator("body").get_attribute("data-theme") == "dark"
    page.locator("#theme-toggle").click()
    assert page.locator("body").get_attribute("data-theme") == "light"
    assert "ficticio" in charts.first.get_attribute("aria-label")
    assert charts.nth(0).locator("polyline").get_attribute("points") != charts.nth(1).locator("polyline").get_attribute("points")
    assert page.get_by_text("Gráficos ficticios de ejemplo").count() >= 1


    # Inspect real rendered geometry: actions may not occupy the chart column,
    # and the brand/chart bands must align across an entire grid row.
    for width in (320, 390, 768, 1280):
        page.set_viewport_size({"width": width, "height": 844})
        count = page.locator("#juegos .cards").evaluate(
            "(el) => getComputedStyle(el).gridTemplateColumns.split(' ').filter(Boolean).length"
        )
        assert count == (2 if width < 760 else (3 if width < 1060 else 6)), (width, count)
        assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth + 2"), f"Horizontal overflow: {width}"
        measurements = page.locator("#nube .card").evaluate_all("""(cards) => cards.map(card => {
          const rect = (selector) => {
            const el = selector === '.card' ? card : card.querySelector(selector);
            const r = el.getBoundingClientRect();
            return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
          };
          return {
            card: rect('.card'), toolbar: rect('.card-actions'),
            header: rect('.card-header'), logo: rect('.logo-area'),
            graph: rect('.demo-chart'), signal: rect('.signal'),
            link: rect('.card-link'), alert: rect('.report-quick'), star: rect('.star')
          };
        })""")
        for box in measurements:
            assert box["header"]["top"] >= box["link"]["top"] - 1, (width, "header should start in full-width link", box)
            assert box["header"]["bottom"] <= box["logo"]["top"] + 1, (width, "header/logo overlap", box)
            assert box["logo"]["bottom"] <= box["signal"]["top"] + 2, (width, "logo/chart overlap", box)
            assert box["link"]["bottom"] <= box["toolbar"]["top"] + 1, (width, "actions must be below card content", box)
            assert box["signal"]["bottom"] <= box["toolbar"]["top"] + 1, (width, "footer overlaps trend", box)
            assert box["graph"]["width"] >= box["link"]["width"] - 32, (width, "graph too narrow", box)
            assert box["alert"]["right"] + 2 <= box["star"]["left"], (width, "actions overlap", box)
            assert box["alert"]["top"] >= box["card"]["top"] - 1
            assert box["star"]["right"] <= box["card"]["right"] + 1
        assert max(b["graph"]["height"] for b in measurements) - min(b["graph"]["height"] for b in measurements) < 1
        assert max(b["graph"]["width"] for b in measurements) - min(b["graph"]["width"] for b in measurements) < 1
        assert max(b["card"]["height"] for b in measurements) - min(b["card"]["height"] for b in measurements) < 2

    page.set_viewport_size({"width": 390, "height": 844})
    logo = page.locator("#nube img[src$='/brands/cloudflare.svg']").first
    logo.scroll_into_view_if_needed()
    logo.evaluate("(el) => el.decode()")
    assert logo.evaluate("(el) => el.naturalWidth > 0")
    cloudflare_card = page.locator("#nube .card[data-slug='cloudflare']")
    example_line = cloudflare_card.locator("svg.demo-chart polyline").get_attribute("points")
    fallback = cloudflare_card.locator(".monogram")
    assert fallback.count() == 1
    assert fallback.get_attribute("hidden") is not None
    assert fallback.evaluate("(el) => getComputedStyle(el).display") == "none", "Logo must not show alongside monogram"
    logo.evaluate("(el) => el.dispatchEvent(new Event('error'))")
    assert fallback.is_visible(), "Monogram must appear when a logo fails"
    assert not logo.is_visible(), "Broken logo should be hidden"
    page.reload(wait_until="networkidle")
    cloudflare_card = page.locator("#nube .card[data-slug='cloudflare']")
    assert cloudflare_card.locator("svg.demo-chart polyline").get_attribute("points") == example_line, "Demo must be deterministic across reloads"
    assert cloudflare_card.locator(".logo").is_visible()
    assert not cloudflare_card.locator(".monogram").is_visible()
    report = cloudflare_card.locator("button[data-report='cloudflare']")
    assert report.count() == 1, "Every card needs a quick report action"
    assert report.inner_text() == "!", "Report must be a compact icon, not a large text button"
    assert report.evaluate("(el) => Math.round(el.getBoundingClientRect().width)") <= 40
    assert report.evaluate("(el) => getComputedStyle(el).backgroundColor") == "rgb(198, 41, 52)"
    star = cloudflare_card.locator("button[data-fav='cloudflare']")
    assert report.evaluate("(el) => el.getBoundingClientRect().right") < star.evaluate("(el) => el.getBoundingClientRect().left")

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
    # Every specifically reported missing brand must render a real local icon.
    priority_logos = ["aliexpress", "ebay", "minecraft", "amazon", "tumblr",
                      "youtube-music", "overwatch-2", "pokemon-go", "gta-online",
                      "brawl-stars", "among-us"]
    for slug in priority_logos:
        tile = page.locator("#directory-cards .card[data-slug='" + slug + "']")
        assert tile.count() == 1, slug
        img = tile.locator("img.logo")
        assert img.count() == 1, "No image mapped: " + slug
        assert img.get_attribute("src").endswith("/brands/" + slug + ".svg"), slug
        img.scroll_into_view_if_needed()
        img.evaluate("(el) => { el.loading = 'eager'; }")
        img.evaluate("(el) => el.decode()")
        assert img.evaluate("(el) => el.complete && el.naturalWidth > 0"), "Broken asset: " + slug
        assert tile.locator(".monogram").get_attribute("hidden") is not None
    # Community-sourced iconography must load locally and hide the fallback.
    for slug in ("pedidosya", "yango"):
        tile = page.locator("#directory-cards .card[data-slug='" + slug + "']")
        img = tile.locator("img.logo")
        assert img.count() == 1, "Reviewed community illustration missing: " + slug
        assert img.get_attribute("src").endswith("/brands/" + slug + ".svg")
        img.scroll_into_view_if_needed()
        img.evaluate("(el) => { el.loading = 'eager'; }")
        img.evaluate("(el) => el.decode()")
        assert img.evaluate("(el) => el.complete && el.naturalWidth > 0"), slug
        assert tile.locator(".monogram").get_attribute("hidden") is not None

    assert page.locator("#directory-cards button[data-report]").count() == 211
    assert page.locator("#directory-cards .demo-label").count() == 0
    assert page.locator("#directory-cards .notice").count() == 0
    page.locator("#directory-sort").select_option("category")
    cats = page.locator("#directory-cards .card").evaluate_all("(items) => items.map(item => item.dataset.category)")
    assert cats == sorted(cats), "Directory groups by category when selected"
    page.locator("#directory-sort").select_option("favorites")
    assert page.locator("#directory-cards .card").first.get_attribute("data-slug") == "cloudflare", "Favorited platform should be first"
    page.locator("#directory-sort").select_option("name")
    page.locator("#directory-search").fill("outlook")
    assert page.locator("#directory-cards .card:visible").count() == 1
    assert page.locator("#directory-cards .card:visible .name").inner_text() == "Outlook"
    page.locator("#directory-search").fill("")
    page.locator("#category-filter").select_option("videojuegos")
    assert page.locator("#directory-cards .card:visible").count() >= 20
    # Every service card should open a full independent profile, not filter the directory.
    page.locator("#directory-search").fill("")
    page.locator("#category-filter").select_option("")
    page.locator("#directory-cards .card[data-slug='outlook'] .card-link").click()
    assert page.url.endswith("/web-downdetector-ve/servicios/outlook/")
    assert page.get_by_role("heading", name="Outlook", exact=True).count() == 1
    assert "Microsoft" in page.locator(".profile-panel").first.inner_text()
    assert page.get_by_role("heading", name="Historial de incidentes", exact=True).count() == 1
    assert page.locator(".profile-chart svg").count() == 1
    assert page.get_by_role("heading", name="Acerca de la empresa y el servicio").count() == 1
    assert "correo" in page.locator(".profile-panel.profile-wide").first.inner_text().lower()
    assert page.locator("#demo-point option").count() == 24
    assert "puntos FICTICIOS" in page.locator("#demo-chart-readout").inner_text()
    old_plot = page.locator("#detail-chart").inner_html()
    page.locator("#demo-range").select_option("7d")
    assert page.locator("#demo-point option").count() == 7
    assert page.locator("#detail-chart").inner_html() != old_plot
    page.locator("#demo-mode").select_option("barras")
    assert page.locator("#detail-chart rect[fill='#50cbb9']").count() == 7
    page.locator("#demo-point").select_option("1")
    assert "Anotación ficticia" in page.locator("#demo-observation-text").inner_text()
    page.locator("#demo-range").select_option("90d")
    assert page.locator("#demo-point option").count() == 90
    before_hover = page.locator("#demo-chart-readout").inner_text()
    page.locator("#detail-chart").hover(position={"x": 20, "y": 70})
    assert page.locator("#demo-chart-readout").inner_text() != before_hover
    page.locator("#detail-chart").click(position={"x": 20, "y": 70})
    assert int(page.locator("#demo-point").input_value()) < 10, "Click near the chart start must select an early point"
    page.locator("#demo-mode").select_option("area")
    assert page.locator("#detail-chart path[fill='#2ab8a3']").count() == 1
    page.locator("#detail-chart").focus()
    page.keyboard.press("ArrowLeft")
    assert "puntos FICTICIOS" in page.locator("#demo-chart-readout").inner_text()
    page.locator("#demo-range").select_option("30d")
    assert page.locator("#demo-point option").count() == 30
    assert page.get_by_role("link", name="Consultar la fuente").count() == 1
    assert "datos simulados" in page.locator(".profile-panel.profile-wide").nth(1).inner_text()
    for width in (320, 390, 768, 1280):
        page.set_viewport_size({"width": width, "height": 844})
        assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth + 2"), ("detail overflow", width)
    page.get_by_role("link", name="Volver a los 211 servicios").click()
    assert page.url.endswith("/web-downdetector-ve/servicios/")
    assert page.locator("#directory-cards .card").count() == 211
    page.goto(ROOT + "servicios/cloudflare/", wait_until="networkidle")
    assert page.get_by_role("heading", name="Cloudflare", exact=True).count() == 1
    assert "Cloudflare, Inc." in page.locator(".profile-panel").first.inner_text()
    assert "Sin datos reales suficientes" in page.locator(".profile-panel").nth(1).inner_text()
    assert page.locator(".profile-tags span").count() >= 3
    assert remote == [], "Demo must not request third-party hosts"
    print("PASS: 211 services; logos exclusive with fallback, 211 quick-report modal actions, simulated form without backend, responsive cards and no external requests")
    browser.close()
