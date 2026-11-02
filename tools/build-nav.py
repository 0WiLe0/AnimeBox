"""Синхронизирует боковое меню во всех внутренних страницах.

Меню хранится в tools/nav.html (шаблон). Скрипт подставляет его между
маркерами <!-- nav:start --> и <!-- nav:end --> (или заменяет старый <aside>)
и проставляет aria-current для текущей страницы.
Запуск: python tools/build-nav.py
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TEMPLATE = (ROOT / "tools" / "nav.html").read_text(encoding="utf-8")
PAGES = {"main.html": "main", "anime.html": "anime", "profile.html": "profile", "player.html": "player"}

for file, key in PAGES.items():
    path = ROOT / file
    html = path.read_text(encoding="utf-8")
    nav = TEMPLATE.replace(f'data-page="{key}"', f'data-page="{key}" aria-current="page"')
    block = f"<!-- nav:start -->\n{nav.strip()}\n<!-- nav:end -->"
    if "<!-- nav:start -->" in html:
        html = re.sub(r"<!-- nav:start -->.*?<!-- nav:end -->", lambda _: block, html, flags=re.S)
    else:
        html = re.sub(r"<aside>.*?</aside>", lambda _: block, html, count=1, flags=re.S)
    path.write_text(html, encoding="utf-8")
    print("nav ->", file)
