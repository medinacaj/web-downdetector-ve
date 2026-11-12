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
    assert page.get_by_text("Servicio en catálogo de demostración").count() == 12
    print("Mobile 320/390/768px: 2 columns, 12 real-data cards, no overflow, no false curves; favorites persist.")
    browser.close()
