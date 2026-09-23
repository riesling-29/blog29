"use client";

import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";
const key = "blog29-theme";
const eventName = "blog29-theme-change";

function snapshot(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}
function serverSnapshot(): Theme { return "light"; }
function subscribe(callback: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const syncPreference = () => {
    let saved: string | null = null;
    try { saved = localStorage.getItem(key); } catch { /* Storage may be unavailable. */ }
    document.documentElement.dataset.theme = saved === "light" || saved === "dark" ? saved : media.matches ? "dark" : "light";
    callback();
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key === key || event.key === null) syncPreference();
  };
  window.addEventListener(eventName, callback);
  window.addEventListener("storage", onStorage);
  media.addEventListener("change", syncPreference);
  return () => {
    window.removeEventListener(eventName, callback);
    window.removeEventListener("storage", onStorage);
    media.removeEventListener("change", syncPreference);
  };
}
function selectTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem(key, theme); } catch { /* Keep the theme for this page. */ }
  window.dispatchEvent(new Event(eventName));
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  return (
    <div className="theme-switch" role="group" aria-label="화면 테마">
      <button type="button" aria-pressed={theme === "light"} onClick={() => selectTheme("light")}>밝게</button>
      <button type="button" aria-pressed={theme === "dark"} onClick={() => selectTheme("dark")}>어둡게</button>
    </div>
  );
}
