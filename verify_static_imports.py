#!/usr/bin/env python3
"""
verify_static_imports.py

Scans the repository for references to .png, .css, and .js files in HTML, CSS, JS, JSON, and text files.
Reports any broken references with the file path and line number.

Usage:
  python verify_static_imports.py [--root <path>] [--ext png,css,js] [--ignore <glob>] [--verbose]

Notes:
- Paths starting with http(s)://, //, data:, mailto:, tel:, or # are ignored.
- Root-relative paths (starting with /) are resolved from the repository root.
- Relative paths are resolved from the referencing file's directory.
- Query strings and hash fragments are ignored for existence checks.
- Exits with code 1 if any broken references are found; 0 otherwise.
"""
from __future__ import annotations
import argparse
import os
import re
import sys
from pathlib import Path
from typing import Iterable, List, Tuple, Dict, Set
from urllib.parse import unquote, urlparse

# File types to scan by default
DEFAULT_FILE_GLOBS = [
    "**/*.html", "**/*.htm",
    "**/*.js", "**/*.mjs", "**/*.cjs", "**/*.ts", "**/*.tsx",
    "**/*.css", "**/*.scss", "**/*.sass",
    "**/*.json", "**/*.md", "**/*.txt",
    "**/*.py"
]

# Patterns to find URLs/paths in different contexts
REGEX_PATTERNS = [
    # HTML attributes src/href
    re.compile(r"(?:src|href)\s*=\s*[\"']([^\"']+)[\"']", re.IGNORECASE),
    # CSS url(...)
    re.compile(r"url\(\s*[\"']?([^)'\"]+)[\"']?\s*\)", re.IGNORECASE),
    # JS import statements (static)
    re.compile(r"import\s+(?:[^'\"]+\s+from\s+)?['\"]([^'\"]+)['\"]", re.IGNORECASE),
    # JS dynamic import("...")
    re.compile(r"import\(\s*['\"]([^'\"]+)['\"]\s*\)", re.IGNORECASE),
    # JS/TS/CSS/JSON string literals with leading slash: '/path/file.ext'
    re.compile(r"['\"](/[^'\"]+\.[a-zA-Z0-9]+)['\"]"),
    # fetch("..."), new URL("...", import.meta.url)
    re.compile(r"(?:fetch|new\s+URL)\(\s*['\"]([^'\"]+)['\"]", re.IGNORECASE),
]

SKIP_SCHEMES = ("http://", "https://", "//", "data:", "mailto:", "tel:", "#")

def iter_files(root: Path, include_globs: Iterable[str], ignore_globs: Iterable[str]) -> Iterable[Path]:
    ignored: Set[Path] = set()
    for pattern in ignore_globs:
        for p in root.glob(pattern):
            ignored.add(p if p.is_dir() else p)

    for pattern in include_globs:
        for p in root.glob(pattern):
            if any(str(p).startswith(str(ig)) for ig in ignored):
                continue
            if p.is_file():
                yield p

def extract_candidates(text: str) -> List[str]:
    candidates: List[str] = []
    for rx in REGEX_PATTERNS:
        for m in rx.finditer(text):
            candidates.append(m.group(1))
    return candidates

def normalize_url(url: str) -> str:
    # Strip whitespace and quotes if any
    url = url.strip().strip('\"\'')
    # Remove query and hash
    url = url.split('#', 1)[0].split('?', 1)[0]
    url = unquote(url)
    return url

def should_skip(url: str) -> bool:
    if not url:
        return True
    if any(url.startswith(s) for s in SKIP_SCHEMES):
        return True
    # Protocol-relative (//) covered above, also skip javascript:
    if url.lower().startswith('javascript:'):
        return True
    return False

def resolve_path(ref_file: Path, root: Path, url: str) -> Path:
    # Root-relative
    if url.startswith('/'):
        return (root / url.lstrip('/')).resolve()
    # Absolute filesystem path (rare in web projects)
    p = Path(url)
    if p.is_absolute():
        return p
    # Relative to referencing file
    return (ref_file.parent / url).resolve()

def is_ext_interesting(url: str, exts: Set[str]) -> bool:
    lower = url.lower()
    for ext in exts:
        if lower.endswith('.' + ext):
            return True
    return False

from dataclasses import dataclass

@dataclass
class Finding:
    file: Path
    line_no: int
    raw: str
    url: str
    resolved: Path


def scan_file(path: Path, root: Path, exts: Set[str], verbose: bool) -> Tuple[List[Finding], List[Finding]]:
    """Returns (ok_refs, broken_refs) as lists of Finding."""
    ok: List[Finding] = []
    broken: List[Finding] = []

    try:
        text = path.read_text(encoding='utf-8', errors='ignore')
    except Exception as e:
        if verbose:
            print(f"WARN: Failed to read {path}: {e}")
        return ok, broken

    # For line numbers, work line-by-line
    lines = text.splitlines()

    for i, line in enumerate(lines, start=1):
        for candidate in extract_candidates(line):
            raw = candidate
            url = normalize_url(candidate)
            if should_skip(url):
                continue
            if not is_ext_interesting(url, exts):
                continue
            resolved = resolve_path(path, root, url)
            if resolved.exists():
                ok.append(Finding(path, i, raw, url, resolved))
            else:
                broken.append(Finding(path, i, raw, url, resolved))

    return ok, broken


def main():
    parser = argparse.ArgumentParser(description="Verify .png/.css/.js references across the project")
    parser.add_argument('--root', type=str, default=str(Path(__file__).parent.resolve()),
                        help='Project root to resolve root-relative paths (default: script directory)')
    parser.add_argument('--ext', type=str, default='png,css,js',
                        help='Comma-separated list of extensions to check (default: png,css,js)')
    parser.add_argument('--ignore', type=str, action='append', default=[
        '.git/**', 'node_modules/**', '.vscode/**', '.zencoder/**',
        '**/dist/**', '**/build/**', '**/.cache/**'
    ], help='Glob patterns to ignore (can be repeated)')
    parser.add_argument('--include', type=str, action='append', default=DEFAULT_FILE_GLOBS,
                        help='Glob patterns to include (can be repeated)')
    parser.add_argument('--verbose', action='store_true', help='Verbose logging')

    args = parser.parse_args()

    root = Path(args.root).resolve()
    if not root.exists():
        print(f"ERROR: Root path does not exist: {root}")
        return 2

    exts = {e.strip().lstrip('.').lower() for e in args.ext.split(',') if e.strip()}

    total_ok = 0
    total_broken = 0
    broken_details: List[Finding] = []

    if args.verbose:
        print(f"Scanning root: {root}")
        print(f"Extensions: {sorted(exts)}")

    for file_path in iter_files(root, args.include, args.ignore):
        ok, broken = scan_file(file_path, root, exts, args.verbose)
        total_ok += len(ok)
        total_broken += len(broken)
        broken_details.extend(broken)

    if total_broken:
        print("\nBroken references found:")
        for f in broken_details:
            # Display both the referenced URL and the resolved filesystem path
            print(f"- {f.file}:{f.line_no} -> '{f.url}' (resolved: {f.resolved})")
        print(f"\nSummary: OK={total_ok}, BROKEN={total_broken}")
        return 1
    else:
        print(f"All good. Checked references. Summary: OK={total_ok}, BROKEN=0")
        return 0

if __name__ == '__main__':
    sys.exit(main())