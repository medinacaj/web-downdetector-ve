#!/usr/bin/env python3
"""Real Chromium smoke test for PulsoVE service tiles on mobile."""
import shutil
import re
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
    assert page.get_by_text("Sin reportes recientes").count() == 12, "No fake sparklines in empty CI database"
    assert page.locator("section[aria-labelledby='home-services-title'] svg[role='img']").count() == 0

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

    link = page.get_by_role("link", name="Ver estado y reportes de CANTV")
    assert link.get_attribute("href") == "/servicios/cantv"
    assert page.get_by_text("Servicio en catálogo de demostración").count() == 12
    print("Mobile 320/390/768px: 2 columns, 12 real-data cards, no overflow, accessible favorites persist.")
    browser.close()
