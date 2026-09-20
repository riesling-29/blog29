"""Offline unit/protocol tests. No real model or repository is contacted."""
from __future__ import annotations

from contextlib import redirect_stdout
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from io import StringIO
import json
from pathlib import Path
import sys
import threading
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "scripts" / "blog29"))
import check_draft as check
import tabby_smoke as smoke


def source():
    return {"id": "S1", "title": "Sample", "url": "https://example.org/doc",
            "file": None, "access": "read", "retrieved_at": "2026-09-12T22:00:00+09:00",
            "locator": "Section 1", "supports": ["Sample claim"]}


def call():
    return {"id": "call_1", "type": "function", "function": {
        "name": smoke.TOOL_NAME, "arguments": '{"label":"blog29"}'}}


def sse(events, done=True):
    raw = b": keepalive\n\n"
    for e in events:
        raw += ("data: " + json.dumps(e) + "\n\n").encode()
    if done:
        raw += b"data: [DONE]\n\n"
    return raw.splitlines(keepends=True)


class DraftTests(unittest.TestCase):
    def test_empty(self):
        self.assertEqual(check.check_text(" ")[0].code, "empty")

    def test_clean(self):
        self.assertEqual(check.check_text("# 제목\n\n보통 문장입니다.\n", True), [])

    def test_unclosed_fence(self):
        self.assertIn("unclosed-fence", [x.code for x in check.check_text("```python\npass\n")])

    def test_long_fence_embeds_short_fence(self):
        self.assertEqual(check.check_text("````md\n```\n[TODO]\n```\n````\n", True), [])

    def test_inline_markers_are_code(self):
        self.assertEqual(check.check_text("`<tool_call>`와 `[S1]`의 예입니다.", True), [])

    def test_publication_placeholder(self):
        self.assertEqual(check.check_text("[VERIFY]", True)[0].level, "error")
        self.assertEqual(check.check_text("[VERIFY]")[0].level, "warning")

    def test_secret_in_code_fence(self):
        f = check.check_text("```\n-----BEGIN PRIVATE KEY-----\n```\n", True)
        self.assertIn("secret-like", [x.code for x in f])

    def test_chat_citation(self):
        self.assertIn("chat-citation", [x.code for x in check.check_text("근거 citeturn1search1", True)])

    def test_sources_valid(self):
        self.assertEqual(check.check_sources({"schema_version": 1, "sources": [source()]}), [])

    def test_sources_duplicate(self):
        f = check.check_sources({"schema_version": 1, "sources": [source(), source()]})
        self.assertIn("source-id", [x.code for x in f])

    def test_sources_invalid_access_does_not_crash(self):
        s = source()
        s["access"] = []
        f = check.check_sources({"schema_version": 1, "sources": [s]})
        self.assertIn("source-access", [x.code for x in f])

    def test_sources_unavailable_is_warning(self):
        s = source()
        s["access"] = "unavailable"
        f = check.check_sources({"schema_version": 1, "sources": [s]}, True)
        self.assertEqual(f[0].code, "source-unread")

    def test_invalid_source_url(self):
        s = source()
        s["url"] = "file:///private.txt"
        f = check.check_sources({"schema_version": 1, "sources": [s]})
        self.assertIn("source-url", [x.code for x in f])


class ProtocolTests(unittest.TestCase):
    def test_loopback(self):
        self.assertEqual(smoke.validate_base_url("http://127.0.0.1:5000/v1/"), "http://127.0.0.1:5000/v1")
        smoke.validate_base_url("http://[::1]:5000/v1")

    def test_remote_requires_optin(self):
        with self.assertRaises(smoke.ProbeError):
            smoke.validate_base_url("https://example.org/v1")

    def test_credentials_rejected(self):
        with self.assertRaises(smoke.ProbeError):
            smoke.validate_base_url("http://user:secret@localhost:5000/v1")

    def test_api_suffix(self):
        with self.assertRaises(smoke.ProbeError):
            smoke.validate_base_url("http://localhost:5000/chat/completions")

    def test_sse_reassembly(self):
        events = [
            {"choices": [{"index": 0, "delta": {"role": "assistant", "tool_calls": [{
                "index": 0, "id": "call_1", "type": "function", "function": {
                    "name": smoke.TOOL_NAME, "arguments": '{"label":'}}]}}]},
            {"choices": [{"index": 0, "delta": {"tool_calls": [{
                "index": 0, "function": {"arguments": '"blog29"}'}}]}}]},
            {"choices": [{"index": 0, "delta": {}, "finish_reason": "tool_calls"}]},
            {"choices": [], "usage": {"total_tokens": 1}},
        ]
        m = smoke.get_message(smoke.parse_sse(sse(events)))
        self.assertEqual(smoke.validate_tool_call(m), call())

    def test_sse_unicode(self):
        e = [{"choices": [{"delta": {"content": "안녕하세요"}, "finish_reason": "stop"}]}]
        self.assertEqual(smoke.get_message(smoke.parse_sse(sse(e)))["content"], "안녕하세요")

    def test_incomplete_sse(self):
        with self.assertRaises(smoke.ProbeError):
            smoke.parse_sse(sse([{"choices": [{"delta": {"content": "hello"}}]}], done=False))

    def test_xml_text_does_not_pass(self):
        with self.assertRaises(smoke.ProbeError):
            smoke.validate_tool_call({"content": "<tool_call>...</tool_call>"})

    def test_bad_tool_arguments(self):
        c = call()
        c["function"]["arguments"] = '{"label":"wrong"}'
        with self.assertRaises(smoke.ProbeError):
            smoke.validate_tool_call({"tool_calls": [c]})

    def test_truncation_detected(self):
        with self.assertRaises(smoke.ProbeError):
            smoke.get_message({"choices": [{"message": {}, "finish_reason": "length"}]})


class FakeHandler(BaseHTTPRequestHandler):
    """Synthetic API fixture, not TabbyAPI."""
    def log_message(self, *args):
        pass

    def do_GET(self):
        body = json.dumps({"data": [{"id": "fake-model"}]}).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        data = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        if data["messages"][-1]["role"] == "tool":
            msg = {"role": "assistant", "content": json.loads(data["messages"][-1]["content"])["code"]}
            finish = "stop"
        elif data.get("tools"):
            msg = {"role": "assistant", "content": None, "tool_calls": [call()]}
            finish = "tool_calls"
        else:
            msg = {"role": "assistant", "content": "BLOG29_OK"}
            finish = "stop"
        if data.get("stream"):
            delta = {k: v for k, v in msg.items()}
            if delta.get("tool_calls"):
                delta["tool_calls"] = [{"index": 0, **c} for c in delta["tool_calls"]]
            events = [{"choices": [{"index": 0, "delta": delta, "finish_reason": None}]},
                      {"choices": [{"index": 0, "delta": {}, "finish_reason": finish}]}]
            raw = b"".join(sse(events))
            mime = "text/event-stream"
        else:
            raw = json.dumps({"choices": [{"message": msg, "finish_reason": finish}]}).encode()
            mime = "application/json"
        self.send_response(200)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)


class LocalFixtureTests(unittest.TestCase):
    def test_http_protocol_roundtrip(self):
        server = ThreadingHTTPServer(("127.0.0.1", 0), FakeHandler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            c = smoke.Client(f"http://127.0.0.1:{server.server_port}/v1", "dummy-test-key", 5)
            self.assertEqual(c.call("/models")["data"][0]["id"], "fake-model")
            with redirect_stdout(StringIO()) as output:
                smoke.run_probe(c, "fake-model", 256, False)
            self.assertEqual(output.getvalue().count("PASS"), 5)
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=2)


if __name__ == "__main__":
    unittest.main()
