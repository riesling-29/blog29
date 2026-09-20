#!/usr/bin/env python3
"""Small, read-only draft hygiene checker. Python 3.10+, stdlib only.

NOT a YAML/MDX parser, fact checker, complete secret scanner, or publish gate.
Exit 0 = no detected errors (warnings may remain), 1 = errors, 2 = input error.
"""
from __future__ import annotations

import argparse
from dataclasses import asdict, dataclass
import json
from pathlib import Path
import re
import sys
from typing import Any
from urllib.parse import urlsplit


@dataclass(frozen=True)
class Finding:
    level: str
    line: int
    code: str
    message: str


SECRET_PATTERNS = [
    re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    re.compile(r"\bgh[pousr]_[A-Za-z0-9]{30,}\b"),
    re.compile(r"\bgithub_pat_[A-Za-z0-9_]{30,}\b"),
    re.compile(r"\bAKIA[0-9A-Z]{16}\b"),
]


def check_text(text: str, publication: bool = False) -> list[Finding]:
    out: list[Finding] = []
    if not text.strip():
        return [Finding("error", 1, "empty", "원고가 비어 있습니다.")]
    fence_char, fence_len, fence_line = "", 0, 0
    for number, line in enumerate(text.splitlines(), 1):
        # Secret-like strings are checked even inside code fences. Never echo them.
        if any(p.search(line) for p in SECRET_PATTERNS):
            out.append(Finding("error", number, "secret-like", "키/토큰 형태가 감지되었습니다. 실제 비밀인지 검토하세요."))
        fence = re.match(r"^ {0,3}(`{3,}|~{3,})(.*)$", line)
        if fence:
            run, tail = fence.groups()
            if not fence_char:
                fence_char, fence_len, fence_line = run[0], len(run), number
            elif run[0] == fence_char and len(run) >= fence_len and not tail.strip():
                fence_char, fence_len = "", 0
            continue
        if fence_char:
            continue
        # Skip inline code for prose markers. Inline code may legitimately discuss them.
        prose = re.sub(r"`+[^`\n]*`+", "", line)
        level = "error" if publication else "warning"
        if re.search(r"\[(?:VERIFY|NEEDS_SOURCE|TODO|TBD|확인필요)\]|\b(?:TODO|TBD)\b", prose, re.I):
            out.append(Finding(level, number, "placeholder", "미해결 placeholder가 남아 있습니다."))
        if re.search(r"\[S\d+\]", prose):
            out.append(Finding(level, number, "internal-source-id", "내부 출처 ID를 실제 인용으로 바꾸세요."))
        if re.search(r"(?:cite|filecite)|turn\d+(?:search|view|file)\d+", prose):
            out.append(Finding(level, number, "chat-citation", "채팅 전용 인용 마커를 실제 링크/출처로 바꾸세요."))
        if re.search(r"</?(?:think|tool_call|function)(?:\s|>|=)", prose):
            out.append(Finding(level, number, "model-artifact", "본문 밖의 모델/도구 마커인지 검토하세요."))
        if "![](" in prose:
            out.append(Finding("warning", number, "empty-alt", "이미지 대체 텍스트가 비어 있습니다."))
        if re.search(r"(?:localhost|127\.0\.0\.1|\.blog29-work/)", prose):
            out.append(Finding("warning", number, "local-reference", "독자가 접근할 수 없는 로컬 참조인지 검토하세요."))
    if fence_char:
        out.append(Finding("error", fence_line, "unclosed-fence", "코드 펜스가 닫히지 않았습니다."))
    return out


def check_sources(data: Any, publication: bool = False) -> list[Finding]:
    out: list[Finding] = []
    if not isinstance(data, dict) or data.get("schema_version") != 1 or not isinstance(data.get("sources"), list):
        return [Finding("error", 0, "source-schema", "sources.json은 schema_version: 1과 sources 배열을 가져야 합니다.")]
    ids: set[str] = set()
    for index, source in enumerate(data["sources"], 1):
        label = f"출처 레코드 {index}"
        if not isinstance(source, dict):
            out.append(Finding("error", 0, "source-record", f"{label}: 객체가 아닙니다."))
            continue
        sid = source.get("id")
        if not isinstance(sid, str) or not re.fullmatch(r"S[1-9]\d*", sid) or sid in ids:
            out.append(Finding("error", 0, "source-id", f"{label}: 유효하고 고유한 S번호가 필요합니다."))
        if isinstance(sid, str):
            ids.add(sid)
        for field in ("title", "locator"):
            if not isinstance(source.get(field), str) or not source[field].strip():
                out.append(Finding("error", 0, "source-field", f"{label}: {field}이 필요합니다."))
        url, file = source.get("url"), source.get("file")
        if not url and not file:
            out.append(Finding("error", 0, "source-location", f"{label}: URL 또는 파일 위치가 필요합니다."))
        if url:
            try:
                parsed = urlsplit(url)
                valid = parsed.scheme in {"http", "https"} and bool(parsed.netloc)
            except (ValueError, TypeError, AttributeError):
                valid = False
            if not valid:
                out.append(Finding("error", 0, "source-url", f"{label}: 올바른 HTTP(S) URL이 아닙니다."))
        access = source.get("access")
        if not isinstance(access, str) or access not in {"read", "snippet_only", "unavailable", "user_provided"}:
            out.append(Finding("error", 0, "source-access", f"{label}: access 값이 잘못되었습니다."))
        elif access in {"snippet_only", "unavailable"}:
            out.append(Finding("warning", 0, "source-unread", f"{label}: 직접 읽지 못한 자료를 핵심 사실의 단독 근거로 쓰지 마세요."))
        if access == "read" and not source.get("retrieved_at"):
            out.append(Finding("error", 0, "source-time", f"{label}: 읽은 자료의 확인 시각이 필요합니다."))
        supports = source.get("supports")
        if not isinstance(supports, list) or not supports or not all(isinstance(x, str) and x.strip() for x in supports):
            out.append(Finding("error", 0, "source-supports", f"{label}: 지지하는 주장 목록이 필요합니다."))
    if publication and not data["sources"]:
        out.append(Finding("warning", 0, "no-sources", "출처 목록이 비었습니다. 사실 주장이 있다면 근거를 확인하세요."))
    return out


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("draft", type=Path)
    ap.add_argument("--sources", type=Path)
    ap.add_argument("--publication", action="store_true")
    ap.add_argument("--json", action="store_true", dest="as_json")
    args = ap.parse_args(argv)
    try:
        out = check_text(args.draft.read_text(encoding="utf-8-sig"), args.publication)
        if args.sources:
            data = json.loads(args.sources.read_text(encoding="utf-8-sig"))
            out += check_sources(data, args.publication)
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        print(f"입력 오류: {type(exc).__name__}. 파일 경로와 UTF-8/JSON 형식을 확인하세요.", file=sys.stderr)
        return 2
    errors = sum(x.level == "error" for x in out)
    warnings = sum(x.level == "warning" for x in out)
    if args.as_json:
        print(json.dumps({"errors": errors, "warnings": warnings, "findings": [asdict(x) for x in out],
                          "scope": "heuristic hygiene only; not MDX compilation or fact verification"}, ensure_ascii=False, indent=2))
    else:
        for item in out:
            print(f"{item.level.upper()} L{item.line} [{item.code}] {item.message}")
        print(f"검출 결과: 오류 {errors}, 경고 {warnings}. 사실 검증·MDX 빌드·배포 검증은 별도입니다.")
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
