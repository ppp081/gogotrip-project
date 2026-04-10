#!/usr/bin/env python3
"""
Write cloudrun-env.json from .env for:
  gcloud run services update SERVICE --env-vars-file cloudrun-env.json

All values are JSON strings so gcloud never sees YAML int/bool quirks.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path


def parse_env(path: Path) -> dict[str, str]:
    out: dict[str, str] = {}
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("export "):
            line = line[7:].lstrip()
        if "=" not in line:
            continue
        key, _, val = line.partition("=")
        key = key.strip()
        val = val.strip()
        if len(val) >= 2 and val[0] == val[-1] and val[0] in "\"'":
            val = val[1:-1]
        if key:
            out[key] = val
    return out


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    src = root / ".env"
    dst = root / "cloudrun-env.json"
    if not src.is_file():
        print(f"Missing {src}", file=sys.stderr)
        sys.exit(1)
    data = parse_env(src)
    dst.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(data)} keys -> {dst}")


if __name__ == "__main__":
    main()
