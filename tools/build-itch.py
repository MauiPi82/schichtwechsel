#!/usr/bin/env python3
"""Builds the itch.io package: index.html in the root, the game scripts, the fonts with their licences, LICENSE.
Tests, tools, docs and the store images stay out. Every file that index.html references must exist.
Usage: python3 tools/build-itch.py [--output build/schichtwechsel-itch.zip]"""
import argparse, os, re, shutil, sys, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--output', default='build/schichtwechsel-itch.zip')
    out = os.path.join(ROOT, ap.parse_args().output)
    html = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
    refs = re.findall(r'<script src="([^"]+)"', html) + re.findall(r'url\("(assets/[^"]+)"\)', html)
    files = ['index.html', 'LICENSE'] + refs + ['assets/fonts/' + f for f in os.listdir(os.path.join(ROOT, 'assets/fonts')) if f.startswith('OFL-')]
    missing = [f for f in files if not os.path.isfile(os.path.join(ROOT, f))]
    if missing:
        sys.exit('missing: ' + ', '.join(missing))
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for f in sorted(set(files)):
            z.write(os.path.join(ROOT, f), f)
    size = sum(os.path.getsize(os.path.join(ROOT, f)) for f in set(files))
    print(f'{out}: {len(set(files))} files, {size // 1024} KB unpacked, {os.path.getsize(out) // 1024} KB zipped')

if __name__ == '__main__':
    main()
