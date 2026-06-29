#!/usr/bin/env python3
"""Batch HTML migration: remove duplicate JS, wire external scripts, update favicons."""

import re
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

FAVICON = '<link rel="icon" type="image/jpeg" href="/images/fav/weg_works_logo.jpeg">\n<link rel="apple-touch-icon" href="/images/fav/weg_works_logo.jpeg">'

MOBILE_MENU_PATTERNS = [
    # Standalone mobile menu script block
    re.compile(
        r'\n<script>\s*(?://\s*Mobile nav[^\n]*\n)?'
        r'(?:const|var)\s+mobileToggle\s*=\s*document\.querySelector\([^)]+\);\s*'
        r'(?:const|var)\s+mobileMenu\s*=\s*document\.getElementById\([^)]+\);\s*'
        r'.*?</script>',
        re.DOTALL | re.IGNORECASE
    ),
    # Compact double-quote variant
    re.compile(
        r'\n<script>\s*'
        r'const mobileToggle = document\.querySelector\("\.mobile-toggle"\);\s*'
        r'const mobileMenu = document\.getElementById\("mobile-menu"\);\s*'
        r'if \(mobileToggle && mobileMenu\) \{[^}]+\}[^<]*'
        r'mobileMenu\.querySelectorAll\("a"\)\.forEach\([^)]+\)\s*=>\s*\{[^}]+\}\);\s*'
        r'\}\);\s*'
        r'\}\s*'
        r'</script>',
        re.DOTALL
    ),
]

FAVICON_PATTERNS = [
    re.compile(r'<link[^>]*rel="icon"[^>]*>\n?', re.IGNORECASE),
    re.compile(r'<link[^>]*rel="apple-touch-icon"[^>]*>\n?', re.IGNORECASE),
]

CONTACT_FORM_PAGES = {
    'index.html': ['home.js', 'contact-form.js'],
    'contact/index.html': ['contact-form.js'],
    'small-business/index.html': ['contact-form.js'],
}

SERVICE_PAGES = [
    'services/index.html',
    'services/adobe-analytics/index.html',
    'services/adobe-experience-cloud/index.html',
    'services/salesforce/index.html',
    'services/marketing-automation/index.html',
    'services/segment-cdp/index.html',
]


def find_html_files():
    for path in ROOT.rglob('*.html'):
        if 'node_modules' not in str(path):
            yield path


def rel_path(path):
    return str(path.relative_to(ROOT))


def remove_mobile_menu(content):
    """Remove mobile menu blocks from content."""
    changed = False

    # Pattern: standalone script with mobileToggle
    pattern = re.compile(
        r'\n<script>\s*'
        r'(?:(?://[^\n]*\n\s*)*)?'
        r'(?:const|var)\s+mobileToggle\s*=\s*document\.querySelector\([^)]+\);\s*'
        r'(?:const|var)\s+mobileMenu\s*=\s*document\.getElementById\([^)]+\);\s*'
        r'(?:if\s*\(mobileToggle\s*&&\s*mobileMenu\)\s*\{)?'
        r'.*?'
        r'(?:mobileMenu\.querySelectorAll\([^)]+\)\.forEach\([^)]+\)\s*=>\s*\{[^}]*\}\);\s*)?'
        r'(?:\}\s*)?'
        r'</script>',
        re.DOTALL
    )

    new_content, n = pattern.subn('', content)
    if n:
        changed = True
        content = new_content

    # Also remove mobile nav section from larger script blocks
    mobile_section = re.compile(
        r'\n?\s*//\s*Mobile nav[^\n]*\n'
        r'(?:const|var)\s+mobileToggle\s*=\s*document\.querySelector\([^)]+\);\s*'
        r'(?:const|var)\s+mobileMenu\s*=\s*document\.getElementById\([^)]+\);\s*'
        r'mobileToggle\.addEventListener\("click"[^;]+;\s*'
        r'mobileMenu\.querySelectorAll\("a"\)\.forEach\([^)]+\)\s*=>\s*\{[^}]*\}\);\s*'
        r'\}\);\s*',
        re.DOTALL
    )
    new_content, n = mobile_section.subn('\n', content)
    if n:
        changed = True
        content = new_content

    # Comment variant with if block
    mobile_if = re.compile(
        r'\n?\s*//\s*Mobile nav toggle\s*\n'
        r'\s*(?:const|var)\s+mobileToggle\s*=\s*document\.querySelector\([^)]+\);\s*'
        r'\s*(?:const|var)\s+mobileMenu\s*=\s*document\.getElementById\([^)]+\);\s*'
        r'\s*if\s*\(mobileToggle\s*&&\s*mobileMenu\)\s*\{[^}]+\}[^}]*\}\);\s*'
        r'\s*\}\)\s*;\s*'
        r'\s*\}\s*',
        re.DOTALL
    )
    new_content, n = mobile_if.subn('\n', content)
    if n:
        changed = True
        content = new_content

    return content, changed


def remove_duplicate_common_js(content):
    """Remove header scroll and smooth scroll from index.html (handled by common.js)."""
    changed = False

    patterns = [
        re.compile(
            r'\n?\s*//\s*Header scroll\s*\n'
            r'const header = document\.getElementById\("header"\);\s*'
            r'window\.addEventListener\("scroll"[^}]+\}\);\s*',
            re.DOTALL
        ),
        re.compile(
            r'\n?\s*//\s*Smooth scroll\s*\n'
            r'document\.querySelectorAll\(\'a\[href\^="#"\]\'\)\.forEach\([^)]+\)\s*=>\s*\{[^}]+\}\);\s*'
            r'\}\);\s*',
            re.DOTALL
        ),
    ]

    for pat in patterns:
        new_content, n = pat.subn('\n', content)
        if n:
            changed = True
            content = new_content

    return content, changed


def extract_and_replace_scripts(content, rel):
    """Replace page-specific inline scripts with external file references."""
    changed = False
    scripts_to_add = []

    if rel == 'index.html':
        # Remove entire bottom script block content, replace with external refs
        form_block = re.compile(
            r'<script>\s*'
            r'//\s*Year\s*\n'
            r'.*?'
            r'function resetForm\(\)\s*\{[^}]+\}[^}]*\}\s*'
            r'</script>',
            re.DOTALL
        )
        if form_block.search(content):
            content = form_block.sub('', content)
            scripts_to_add = ['home.js', 'contact-form.js']
            changed = True

    elif rel == 'contact/index.html':
        block = re.compile(
            r'<script>\s*'
            r'//\s*Math CAPTCHA\s*\n'
            r'.*?'
            r'function resetForm\(\)\s*\{[^}]+\}[^}]*\}\s*'
            r'(?://\s*Mobile nav.*?)?'
            r'</script>',
            re.DOTALL
        )
        if block.search(content):
            content = block.sub('', content)
            scripts_to_add = ['contact-form.js']
            changed = True

    elif rel == 'small-business/index.html':
        block = re.compile(
            r'<script>\s*'
            r'(?://[^\n]*\n\s*)*'
            r'let captchaAnswer.*?'
            r'function resetForm\(\)\s*\{[^}]+\}[^}]*\}\s*'
            r'(?://\s*Mobile nav.*?)?'
            r'</script>',
            re.DOTALL
        )
        if block.search(content):
            content = block.sub('', content)
            scripts_to_add = ['contact-form.js']
            changed = True

    elif rel == 'blog/index.html':
        block = re.compile(
            r'<script>\s*function sortArticles\(sortBy\)\s*\{.*?</script>\s*',
            re.DOTALL
        )
        if block.search(content):
            content = block.sub('', content)
            scripts_to_add = ['blog.js']
            changed = True

    elif rel == 'developers/index.html':
        block = re.compile(
            r'<script>\s*function copyScript\(type\)\s*\{.*?</script>\s*',
            re.DOTALL
        )
        if block.search(content):
            content = block.sub('', content)
            scripts_to_add = ['developers.js']
            changed = True

    elif rel == 'about/index.html':
        block = re.compile(
            r'<script>\s*//\s*Year\s*\n.*?getFullYear\(\);\s*(?://\s*Mobile nav.*?)?</script>\s*',
            re.DOTALL
        )
        if block.search(content):
            content = block.sub('<script src="/js/home.js" defer></script>\n', content)
            changed = True

    if scripts_to_add:
        tags = '\n'.join(f'<script src="/js/{s}" defer></script>' for s in scripts_to_add)
        content = re.sub(
            r'(<script src="/js/common\.min\.js" defer></script>)',
            tags + r'\n\1',
            content
        )

    return content, changed


def update_favicon(content):
    """Replace favicon links with canonical favicon."""
    changed = False
    for pat in FAVICON_PATTERNS:
        new_content, n = pat.subn('', content)
        if n:
            changed = True
            content = new_content

    # Insert favicon after charset/viewport if not present
    if 'weg_works_logo.jpeg' not in content:
        insert_after = re.search(
            r'(<meta content="width=device-width[^>]*>\s*\n)',
            content
        )
        if insert_after:
            pos = insert_after.end()
            content = content[:pos] + '\n' + FAVICON + '\n' + content[pos:]
            changed = True

    return content, changed


def fix_faq_onclick(content):
    if 'faq-question' in content and 'onclick="this.parentElement.classList.toggle' in content:
        content = re.sub(
            r'\s*onclick="this\.parentElement\.classList\.toggle\(\'active\'\)"',
            '',
            content
        )
        if 'faq.js' not in content:
            content = re.sub(
                r'(<script src="/js/common\.min\.js" defer></script>)',
                r'<script src="/js/faq.js" defer></script>\n\1',
                content
            )
        return content, True
    return content, False


def fix_developers_mobile_toggle(content):
    if 'onclick="document.querySelector' in content and 'mobile-menu' in content:
        content = re.sub(
            r'\s*onclick="document\.querySelector\(\'\.mobile-menu\'\)\.classList\.toggle\(\'active\'\)"',
            '',
            content
        )
        return content, True
    return content, False


def add_contact_form_attrs(content, rel):
    """Add data attributes for contact form reset behavior."""
    changed = False
    if rel == 'contact/index.html' and 'data-form-display' not in content:
        content = content.replace(
            'class="contact-form"',
            'class="contact-form" data-form-source="Contact Page" data-form-display="flex"'
        )
        changed = True
    return content, changed


def clean_empty_scripts(content):
    """Remove empty script tags left behind."""
    content = re.sub(r'\n<script>\s*</script>\n', '\n', content)
    content = re.sub(r'\n{3,}', '\n\n', content)
    return content


def process_file(path):
    rel = rel_path(path)
    content = path.read_text(encoding='utf-8')
    original = content
    changes = []

    content, c = update_favicon(content)
    if c: changes.append('favicon')

    content, c = remove_mobile_menu(content)
    if c: changes.append('mobile-menu')

    if rel == 'index.html':
        content, c = remove_duplicate_common_js(content)
        if c: changes.append('dup-common-js')

    content, c = extract_and_replace_scripts(content, rel)
    if c: changes.append('extract-js')

    content, c = fix_faq_onclick(content)
    if c: changes.append('faq')

    content, c = fix_developers_mobile_toggle(content)
    if c: changes.append('dev-mobile')

    content, c = add_contact_form_attrs(content, rel)
    if c: changes.append('form-attrs')

    content = clean_empty_scripts(content)

    if content != original:
        path.write_text(content, encoding='utf-8')
        return changes
    return None


def main():
    updated = 0
    for path in find_html_files():
        changes = process_file(path)
        if changes:
            updated += 1
            print(f'{rel_path(path)}: {", ".join(changes)}')
    print(f'\nUpdated {updated} files')


if __name__ == '__main__':
    main()
