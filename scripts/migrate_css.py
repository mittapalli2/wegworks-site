#!/usr/bin/env python3
"""Extract inline CSS to external page CSS files."""

import re
import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSS_DIR = ROOT / 'css' / 'pages'

# Reference file for each page CSS type
CSS_SOURCES = {
    'home.css': 'index.html',
    'services.css': 'services/adobe-analytics/index.html',
    'blog-marketing.css': 'blog/adobe-analytics/index.html',
    'blog-technical.css': 'blog/aem/dispatcher-cache-invalidation-debugging/index.html',
    'contact.css': 'contact/index.html',
    'small-business.css': 'small-business/index.html',
    'about.css': 'about/index.html',
    '404.css': '404.html',
    'developers.css': 'developers/index.html',
    'blog-hub.css': 'blog/index.html',
}

TECHNICAL_HEADER = re.compile(r'<header\s+class="header"')

SERVICE_PAGES = {
    'services/index.html',
    'services/adobe-analytics/index.html',
    'services/adobe-experience-cloud/index.html',
    'services/salesforce/index.html',
    'services/marketing-automation/index.html',
    'services/segment-cdp/index.html',
}

PAGE_CSS_MAP = {
    'index.html': 'home.css',
    '404.html': '404.css',
    'contact/index.html': 'contact.css',
    'small-business/index.html': 'small-business.css',
    'about/index.html': 'about.css',
    'developers/index.html': 'developers.css',
    'blog/index.html': 'blog-hub.css',
}


def rel_path(path):
    return str(path.relative_to(ROOT))


def classify_blog_page(content):
    if TECHNICAL_HEADER.search(content):
        return 'blog-technical.css'
    return 'blog-marketing.css'


def get_page_css(rel, content):
    if rel in PAGE_CSS_MAP:
        return PAGE_CSS_MAP[rel]
    if rel in SERVICE_PAGES:
        return 'services.css'
    if rel.startswith('blog/') and rel.endswith('index.html') and rel != 'blog/index.html':
        return classify_blog_page(content)
    return None


def extract_style(content):
    m = re.search(r'<style>(.*?)</style>', content, re.DOTALL)
    return m.group(1).strip() if m else None


def extract_css_files():
    """Extract CSS from reference pages into css/pages/."""
    CSS_DIR.mkdir(parents=True, exist_ok=True)
    extracted = {}

    for css_file, html_rel in CSS_SOURCES.items():
        path = ROOT / html_rel
        content = path.read_text(encoding='utf-8')
        style = extract_style(content)
        if style:
            out = CSS_DIR / css_file
            out.write_text(style + '\n', encoding='utf-8')
            extracted[css_file] = hashlib.md5(style.encode()).hexdigest()
            print(f'Extracted {css_file} from {html_rel} ({len(style.splitlines())} lines)')
    return extracted


def update_html_file(path, css_file):
    content = path.read_text(encoding='utf-8')
    style = extract_style(content)
    if not style:
        return False

    css_name = css_file.replace('.css', '.min.css')
    page_link = f'<link rel="stylesheet" href="/css/pages/{css_name}">'

    # Remove inline style block
    content = re.sub(r'\n<style>.*?</style>', '', content, count=1, flags=re.DOTALL)

    # Insert page CSS before common.min.css (preserve cascade: page first, common overrides)
    if page_link not in content:
        content = re.sub(
            r'(<link rel="stylesheet" href="/css/common\.min\.css">)',
            page_link + r'\n\1',
            content
        )

    path.write_text(content, encoding='utf-8')
    return True


def minify_css():
    import subprocess
    for css_file in CSS_SOURCES:
        src = CSS_DIR / css_file
        dst = CSS_DIR / css_file.replace('.css', '.min.css')
        if src.exists():
            subprocess.run(
                ['npx', '--yes', 'lightningcss', '--minify', str(src), '-o', str(dst)],
                cwd=ROOT,
                check=True,
                capture_output=True,
            )
            print(f'Minified {css_file}')


def main():
    extract_css_files()

    updated = 0
    for path in ROOT.rglob('*.html'):
        rel = rel_path(path)
        if 'node_modules' in rel:
            continue
        content = path.read_text(encoding='utf-8')
        css_file = get_page_css(rel, content)
        if css_file and update_html_file(path, css_file):
            updated += 1
            print(f'Updated {rel} -> {css_file}')

    print(f'\nUpdated {updated} HTML files with external CSS')
    minify_css()


if __name__ == '__main__':
    main()
