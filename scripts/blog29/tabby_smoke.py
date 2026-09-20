#!/usr/bin/env python3
"""Read-only OpenAI-compatible protocol probe. Python 3.10+, stdlib only.

Sends tiny synthetic prompts to the chosen server. No shell tools, repository
files, git writes, or deployments are executed. Function results are mocked.
A pass tests this protocol sample, not Hermes or long-form writing quality.
"""
from __future__ import annotations

import argparse
import ipaddress
import json
import os
import secrets
import sys
import time
from typing import Any, Iterable
from urllib import error, parse, request

MAX_RESPONSE_BYTES = 8 * 1024 * 1024
TOOL_NAME = "get_probe_code"
TOOL = {
    "type": "function",
    "function": {
        "name": TOOL_NAME,
        "description": "Return the current diagnostic code for a label.",
        "parameters": {
            "type": "object",
            "properties": {"label": {"type": "string", "enum": ["blog29"]}},
            "required": ["label"],
            "additionalProperties": False,
        },
    },
}


class ProbeError(RuntimeError):
    """A failed protocol check, with no credential-bearing payload."""


class NoRedirect(request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise ProbeError("HTTP redirect refused; use the server's final base URL.")


def validate_base_url(value: str, allow_remote: bool = False) -> str:
    u = parse.urlsplit(value)
    if u.scheme not in {"http", "https"} or not u.hostname:
        raise ProbeError("Base URL must be an http(s) URL including /v1.")
    if u.username or u.password or u.query or u.fragment:
        raise ProbeError("Do not put credentials, query parameters, or fragments in the URL.")
    local = u.hostname.lower() == "localhost"
    try:
        local = local or ipaddress.ip_address(u.hostname).is_loopback
    except ValueError:
        pass
    if not local and not allow_remote:
        raise ProbeError("Non-loopback endpoint refused. Review it, then use --allow-remote.")
    if not u.path.rstrip("/").endswith("/v1"):
        raise ProbeError("Use an API base URL ending in /v1, not /chat/completions.")
    return value.rstrip("/")


def parse_sse(lines: Iterable[bytes]) -> dict[str, Any]:
    """Reassemble OpenAI-style content and indexed tool-call argument deltas."""
    message: dict[str, Any] = {"role": "assistant", "content": ""}
    calls: dict[int, dict[str, Any]] = {}
    finish = None
    size = 0
    data_lines: list[str] = []
    done = False

    def consume(data: str) -> None:
        nonlocal finish, done
        if data == "[DONE]":
            done = True
            return
        try:
            event = json.loads(data)
        except json.JSONDecodeError as exc:
            raise ProbeError("Malformed JSON in an SSE data event.") from exc
        if not isinstance(event, dict):
            raise ProbeError("SSE event must be a JSON object.")
        if "error" in event:
            raise ProbeError("Server returned an error inside the SSE stream.")
        for choice in event.get("choices", []):
            if choice.get("index", 0) != 0:
                continue
            finish = choice.get("finish_reason") or finish
            delta = choice.get("delta") or {}
            content = delta.get("content")
            if content is not None:
                if not isinstance(content, str):
                    raise ProbeError("Non-string content delta in text-only probe.")
                message["content"] += content
            for part in delta.get("tool_calls") or []:
                index = part.get("index", 0)
                if not isinstance(index, int):
                    raise ProbeError("Tool-call index must be an integer.")
                c = calls.setdefault(index, {
                    "id": "", "type": "function",
                    "function": {"name": "", "arguments": ""},
                })
                if part.get("id"):
                    if not c["id"]:
                        c["id"] = part["id"]
                    elif c["id"] != part["id"]:
                        raise ProbeError("Tool-call ID changed within one stream.")
                if part.get("type") and part["type"] != "function":
                    raise ProbeError("Unexpected tool type.")
                fn = part.get("function") or {}
                for key in ("name", "arguments"):
                    value = fn.get(key)
                    if value is not None:
                        if not isinstance(value, str):
                            raise ProbeError("Function deltas must contain strings.")
                        c["function"][key] += value

    for line in lines:
        size += len(line)
        if size > MAX_RESPONSE_BYTES:
            raise ProbeError("Response exceeded diagnostic size limit.")
        text = line.decode("utf-8").rstrip("\r\n")
        if not text:
            if data_lines:
                consume("\n".join(data_lines))
                data_lines.clear()
                if done:
                    break
        elif text.startswith("data:"):
            data_lines.append(text[5:].lstrip(" "))
        # SSE comments/keepalives and other fields are intentionally ignored.
    if data_lines and not done:
        consume("\n".join(data_lines))
    if not done and finish is None:
        raise ProbeError("SSE stream ended without a finish reason or [DONE].")
    if calls:
        message["tool_calls"] = [calls[i] for i in sorted(calls)]
    return {"choices": [{"message": message, "finish_reason": finish}]}


class Client:
    def __init__(self, base: str, key: str, timeout: float):
        self.base, self.key, self.timeout = base, key, timeout
        # Avoid environment proxy surprises and credential-bearing redirects.
        self.opener = request.build_opener(request.ProxyHandler({}), NoRedirect())

    def call(self, path: str, body: dict[str, Any] | None = None) -> dict[str, Any]:
        headers = {"Accept": "application/json"}
        if self.key:
            headers["Authorization"] = "Bearer " + self.key
        payload = None
        if body is not None:
            payload = json.dumps(body).encode("utf-8")
            headers["Content-Type"] = "application/json"
            if body.get("stream"):
                headers["Accept"] = "text/event-stream"
        req = request.Request(self.base + path, data=payload, headers=headers)
        started = time.monotonic()
        try:
            with self.opener.open(req, timeout=self.timeout) as response:
                if body and body.get("stream"):
                    if "text/event-stream" not in response.headers.get("Content-Type", ""):
                        raise ProbeError("Streaming request did not return text/event-stream.")
                    def bounded_lines():
                        for line in response:
                            if time.monotonic() - started > self.timeout:
                                raise ProbeError("Streaming diagnostic time budget exceeded.")
                            yield line
                    return parse_sse(bounded_lines())
                raw = response.read(MAX_RESPONSE_BYTES + 1)
                if len(raw) > MAX_RESPONSE_BYTES:
                    raise ProbeError("Response exceeded diagnostic size limit.")
                data = json.loads(raw)
                if not isinstance(data, dict):
                    raise ProbeError("API response is not a JSON object.")
                if "error" in data:
                    raise ProbeError("Server returned an API error object.")
                return data
        except error.HTTPError as exc:
            # Body/headers are deliberately not printed; they may echo secrets.
            raise ProbeError(f"HTTP {exc.code}. Inspect the local server log with secrets redacted.") from exc
        except error.URLError as exc:
            raise ProbeError("Connection failed; check host, port, API key, and server availability.") from exc
        except (TimeoutError, OSError) as exc:
            raise ProbeError("Connection timed out or failed; review --timeout and the server log.") from exc
        except (json.JSONDecodeError, UnicodeDecodeError) as exc:
            raise ProbeError("Server response is not valid UTF-8 JSON/SSE.") from exc


def get_message(response: dict[str, Any]) -> dict[str, Any]:
    try:
        choice = response["choices"][0]
        message = choice["message"]
    except (KeyError, IndexError, TypeError) as exc:
        raise ProbeError("Response has no choices[0].message.") from exc
    if not isinstance(choice, dict):
        raise ProbeError("Choice is not an object.")
    if choice.get("finish_reason") == "length":
        raise ProbeError("Output token limit reached; increase --max-tokens or review thinking settings.")
    if not isinstance(message, dict):
        raise ProbeError("Assistant message is not an object.")
    return message


def validate_tool_call(message: dict[str, Any]) -> dict[str, Any]:
    calls = message.get("tool_calls") or []
    if len(calls) != 1:
        raise ProbeError("Expected one structured tool_calls entry; text/XML alone does not pass.")
    call = calls[0]
    if not isinstance(call, dict) or not isinstance(call.get("id"), str) or not call["id"]:
        raise ProbeError("Tool call has no non-empty string ID.")
    fn = call.get("function") or {}
    if call.get("type") != "function" or fn.get("name") != TOOL_NAME:
        raise ProbeError("Tool call has an unexpected type or function name.")
    try:
        args = json.loads(fn["arguments"])
    except (KeyError, TypeError, json.JSONDecodeError) as exc:
        raise ProbeError("Tool arguments are not a JSON string.") from exc
    if args != {"label": "blog29"}:
        raise ProbeError("Tool arguments do not match the diagnostic schema.")
    return call


def run_probe(client: Client, model: str, max_tokens: int, thinking: bool) -> None:
    common = {
        "model": model, "max_tokens": max_tokens,
        "temperature": 1.0 if thinking else 0.7,
        "top_p": 0.95 if thinking else 0.8,
        "chat_template_kwargs": {"enable_thinking": thinking},
    }
    simple = get_message(client.call("/chat/completions", {
        **common, "stream": False,
        "messages": [{"role": "user", "content": "Reply with exactly BLOG29_OK."}],
    }))
    if "BLOG29_OK" not in (simple.get("content") or ""):
        raise ProbeError("Plain-chat diagnostic marker missing from final content.")
    print("PASS plain chat")

    for stream in (False, True):
        label = "stream" if stream else "non-stream"
        history: list[dict[str, Any]] = [
            {"role": "system", "content": (
                "Use the provided diagnostic tool when asked. After its result, "
                "return only the code field from that result; do not call the tool again."
            )},
            {"role": "user", "content": "Call get_probe_code once with label blog29, then report its code."},
        ]
        first = get_message(client.call("/chat/completions", {
            **common, "stream": stream, "messages": history,
            "tools": [TOOL], "tool_choice": "auto",
        }))
        tool_call = validate_tool_call(first)
        print(f"PASS {label} structured tool call + JSON arguments")
        code = "BLOG29_" + secrets.token_hex(6).upper()
        # The only 'execution' is a mock result made here; no external tool runs.
        history.append({
            "role": "assistant", "content": first.get("content") or None,
            "tool_calls": [tool_call],
        })
        history.append({
            "role": "tool", "tool_call_id": tool_call["id"],
            "content": json.dumps({"code": code}),
        })
        final = get_message(client.call("/chat/completions", {
            **common, "stream": stream, "messages": history,
            "tools": [TOOL], "tool_choice": "auto",
        }))
        if final.get("tool_calls") or code not in (final.get("content") or ""):
            raise ProbeError(f"{label}: tool-result round trip failed.")
        print(f"PASS {label} tool-result round trip")


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--base-url", default="http://127.0.0.1:5000/v1")
    ap.add_argument("--model", help="Exact ID returned by /v1/models")
    ap.add_argument("--list-models", action="store_true")
    ap.add_argument("--allow-remote", action="store_true")
    ap.add_argument("--timeout", type=float, default=180.0)
    ap.add_argument("--max-tokens", type=int, default=2048)
    ap.add_argument("--thinking", action="store_true", help="Probe thinking mode instead of non-thinking")
    ap.add_argument("--repeat", type=int, default=1)
    args = ap.parse_args(argv)
    if args.timeout <= 0 or args.max_tokens <= 0 or args.repeat <= 0:
        ap.error("timeout, max-tokens, and repeat must be positive")
    try:
        base = validate_base_url(args.base_url, args.allow_remote)
        client = Client(base, os.environ.get("TABBY_API_KEY", ""), args.timeout)
        data = client.call("/models")
        records = data.get("data")
        if not isinstance(records, list):
            raise ProbeError("/v1/models response has no data array.")
        ids = [item["id"] for item in records if isinstance(item, dict) and isinstance(item.get("id"), str)]
        if args.list_models:
            print(json.dumps(ids, ensure_ascii=False, indent=2))
            return 0 if ids else 1
        model = args.model
        if model is None and len(ids) == 1:
            model = ids[0]
        if model is None:
            raise ProbeError("Select --model from --list-models output; no model was guessed.")
        if model not in ids:
            raise ProbeError("Requested model ID is absent from /v1/models.")
        for index in range(args.repeat):
            print(f"Probe {index + 1}/{args.repeat}; thinking={args.thinking}")
            run_probe(client, model, args.max_tokens, args.thinking)
        print("PASS protocol sample only. Hermes execution and writing quality remain untested.")
        return 0
    except ProbeError as exc:
        print(f"FAIL: {exc}", file=sys.stderr)
        return 1
    except KeyboardInterrupt:
        print("Cancelled; no real tools or Git writes were executed.", file=sys.stderr)
        return 130


if __name__ == "__main__":
    raise SystemExit(main())
