"use client";

import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { Heading } from "@/lib/headings";

type ReadingPosition = {
  id: string;
  url: string;
  title: string;
  scrollY: number;
  sectionId?: string;
  sectionTitle?: string;
  sectionOffset?: number;
  originId?: string;
  focusHref?: string;
  focusIndex?: number;
};

type NavigationContext = {
  origin?: ReadingPosition;
  commit: (route: string) => void;
  returnToOrigin: () => boolean;
};

const ReadingContext = createContext<NavigationContext>({
  commit: () => {},
  returnToOrigin: () => false,
});
const HISTORY_KEY = "blog29Reading";

function currentUrl() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

function routeOf(url: string) {
  return url.split("#")[0];
}

function routeKey(url: string) {
  const parsed = new URL(url, window.location.origin);
  const query = parsed.searchParams.toString();
  return `${parsed.pathname}${query ? `?${query}` : ""}`;
}

function activeHeading() {
  const headings = Array.from(
    document.querySelectorAll<HTMLElement>("[data-reading-heading]"),
  );
  let current: HTMLElement | undefined;
  for (const heading of headings) {
    if (heading.getBoundingClientRect().top > 150) break;
    current = heading;
  }
  return current;
}

function capturePosition(entry: ReadingPosition): ReadingPosition {
  const heading = activeHeading();
  return {
    ...entry,
    title:
      document.querySelector("main h1")?.textContent?.trim() || entry.title,
    scrollY: window.scrollY,
    sectionId: heading?.id,
    sectionTitle:
      heading?.getAttribute("data-heading-title") ||
      heading?.textContent?.trim(),
    sectionOffset: heading
      ? window.scrollY - (heading.getBoundingClientRect().top + window.scrollY)
      : undefined,
  };
}

function RouteObserver() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { commit } = useContext(ReadingContext);
  const query = searchParams.toString();
  useEffect(() => {
    commit(`${pathname}${query ? `?${query}` : ""}`);
  }, [pathname, query, commit]);
  return null;
}

/** Ephemeral, per-document memory: opening a URL or a new tab never inherits a made-up origin. */
export function ReadingHistoryProvider({ children }: { children: ReactNode }) {
  const entries = useRef(new Map<string, ReadingPosition>());
  const currentId = useRef<string | undefined>(undefined);
  const documentId = useRef("");
  const sequence = useRef(0);
  const pending = useRef<
    { sourceId: string; destination: string; startedAt: number } | undefined
  >(undefined);
  const restoring = useRef<string | undefined>(undefined);
  const restoreFrame = useRef(0);
  const [origin, setOrigin] = useState<ReadingPosition>();

  const snapshot = useCallback(() => {
    const entry = currentId.current
      ? entries.current.get(currentId.current)
      : undefined;
    if (!entry) return;
    const updated = capturePosition(entry);
    // popstate fires after the URL changes, so the existing entry keeps its own URL.
    if (routeKey(currentUrl()) === routeKey(entry.url))
      updated.url = currentUrl();
    entries.current.set(entry.id, updated);
    return updated;
  }, []);

  const commit = useCallback((route: string) => {
    if (routeKey(currentUrl()) !== route) return;
    if (!documentId.current) documentId.current = window.crypto.randomUUID();
    const marker = window.history.state?.[HISTORY_KEY] as string | undefined;
    const known = marker ? entries.current.get(marker) : undefined;
    const previous = currentId.current
      ? entries.current.get(currentId.current)
      : undefined;
    const navigation = pending.current;
    let entry: ReadingPosition;

    if (
      navigation &&
      navigation.destination === route &&
      Date.now() - navigation.startedAt < 30_000
    ) {
      entry = {
        id: `reading-${documentId.current}-${++sequence.current}`,
        url: currentUrl(),
        title:
          document.querySelector("main h1")?.textContent?.trim() ||
          document.title,
        scrollY: 0,
        originId: navigation.sourceId,
      };
      pending.current = undefined;
    } else if (known && routeKey(known.url) === route) {
      entry = known;
    } else if (
      previous &&
      routeKey(previous.url) === route &&
      !restoring.current
    ) {
      entry = previous;
    } else {
      entry = {
        id: `reading-${documentId.current}-${++sequence.current}`,
        url: currentUrl(),
        title:
          document.querySelector("main h1")?.textContent?.trim() ||
          document.title,
        scrollY: 0,
      };
      pending.current = undefined;
    }

    entries.current.set(entry.id, entry);
    currentId.current = entry.id;
    window.history.replaceState(
      { ...window.history.state, [HISTORY_KEY]: entry.id },
      "",
    );
    setOrigin(entry.originId ? entries.current.get(entry.originId) : undefined);

    if (restoring.current === entry.id) {
      restoring.current = undefined;
      cancelAnimationFrame(restoreFrame.current);
      // Let the restored route commit its content before restoring the reading offset.
      restoreFrame.current = requestAnimationFrame(() => {
        restoreFrame.current = requestAnimationFrame(() => {
          const heading = entry.sectionId
            ? document.getElementById(entry.sectionId)
            : null;
          const top =
            heading && entry.sectionOffset !== undefined
              ? heading.getBoundingClientRect().top +
                window.scrollY +
                entry.sectionOffset
              : entry.scrollY;
          const matches = entry.focusHref
            ? Array.from(
                document.querySelectorAll<HTMLAnchorElement>("a[href]"),
              ).filter((link) => link.getAttribute("href") === entry.focusHref)
            : [];
          const sourceLink = matches[entry.focusIndex ?? 0];
          const focusTarget = sourceLink?.getClientRects().length
            ? sourceLink
            : heading;
          if (focusTarget) {
            if (focusTarget === heading && !focusTarget.hasAttribute("tabindex"))
              focusTarget.setAttribute("tabindex", "-1");
            focusTarget.focus({ preventScroll: true });
          }
          window.scrollTo({ top: Math.max(0, top), behavior: "instant" });
        });
      });
    }
  }, []);

  useEffect(() => {
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    function onClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const element = event.target instanceof Element ? event.target : null;
      const anchor = element?.closest<HTMLAnchorElement>("a[href]");
      if (
        !anchor ||
        anchor.hasAttribute("download") ||
        anchor.hasAttribute("data-reading-return") ||
        anchor.dataset.readingPreview === "true"
      )
        return;
      if (anchor.target && anchor.target !== "_self") return;
      const destination = new URL(anchor.href, window.location.href);
      if (
        destination.origin !== window.location.origin ||
        !["http:", "https:"].includes(destination.protocol)
      )
        return;
      const route = routeKey(destination.href);
      const sourceRoute = routeKey(window.location.href);

      if (route === sourceRoute) {
        if (!destination.hash) return;
        let id: string;
        try {
          id = decodeURIComponent(destination.hash.slice(1));
        } catch {
          return;
        }
        const target = document.getElementById(id);
        if (!target) return;
        // In-page navigation changes the shareable anchor, never the history depth.
        event.preventDefault();
        window.history.replaceState(
          window.history.state,
          "",
          `${destination.pathname}${destination.search}${destination.hash}`,
        );
        const disclosure = anchor.closest("details");
        if (disclosure && !disclosure.contains(target)) disclosure.open = false;
        target.scrollIntoView({ block: "start", behavior: "instant" });
        if (!target.hasAttribute("tabindex"))
          target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
        return;
      }

      const source = snapshot();
      if (source) {
        source.focusHref = anchor.getAttribute("href") ?? undefined;
        source.focusIndex = Array.from(
          document.querySelectorAll<HTMLAnchorElement>("a[href]"),
        )
          .filter((link) => link.getAttribute("href") === source.focusHref)
          .indexOf(anchor);
        entries.current.set(source.id, source);
      }
      pending.current = source
        ? { sourceId: source.id, destination: route, startedAt: Date.now() }
        : undefined;
    }

    function onPopState(event: PopStateEvent) {
      snapshot();
      pending.current = undefined;
      const id = event.state?.[HISTORY_KEY] as string | undefined;
      restoring.current = id && entries.current.has(id) ? id : undefined;
      // The observer commits after Next renders. Same-route hash traversal needs no new render.
      if (currentId.current === id) commit(routeKey(currentUrl()));
    }

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
      window.history.scrollRestoration = previousRestoration;
      cancelAnimationFrame(restoreFrame.current);
    };
  }, [commit, snapshot]);

  const returnToOrigin = useCallback(() => {
    const current = currentId.current
      ? entries.current.get(currentId.current)
      : undefined;
    if (
      !current?.originId ||
      !entries.current.has(current.originId) ||
      window.history.state?.[HISTORY_KEY] !== current.id
    )
      return false;
    pending.current = undefined;
    window.history.back();
    return true;
  }, []);

  return (
    <ReadingContext.Provider value={{ origin, commit, returnToOrigin }}>
      <Suspense fallback={null}>
        <RouteObserver />
      </Suspense>
      {children}
    </ReadingContext.Provider>
  );
}

export function ReturnToReading() {
  const { origin, returnToOrigin } = useContext(ReadingContext);
  if (!origin) return null;
  const href = origin.sectionId
    ? `${routeOf(origin.url)}#${encodeURIComponent(origin.sectionId)}`
    : origin.url;
  return (
    <a
      href={href}
      className="reading-return"
      data-reading-return
      onClick={(event) => {
        if (
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        )
          return;
        if (returnToOrigin()) event.preventDefault();
      }}
    >
      <span aria-hidden="true">↶</span>
      <span>
        <strong>읽던 곳으로</strong>
        <span>
          {origin.title}
          {origin.sectionTitle ? ` · ${origin.sectionTitle}` : ""}
        </span>
      </span>
    </a>
  );
}

export function HeadingNavigation({
  headings,
  label = "이 글의 목차",
}: {
  headings: Heading[];
  label?: string;
}) {
  const [active, setActive] = useState("");
  const navigation = useRef<HTMLElement>(null);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setActive(activeHeading()?.id || ""));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [headings]);
  useEffect(() => {
    const nav = navigation.current;
    const link = nav?.querySelector<HTMLElement>('[aria-current="location"]');
    const container = nav?.closest<HTMLElement>(".reading-side-toc") || nav;
    if (!link || !container || !container.clientHeight) return;
    const bounds = container.getBoundingClientRect();
    const position = link.getBoundingClientRect();
    if (position.top < bounds.top + 12)
      container.scrollTop -= bounds.top + 12 - position.top;
    else if (position.bottom > bounds.bottom - 12)
      container.scrollTop += position.bottom - bounds.bottom + 12;
  }, [active]);
  if (!headings.length)
    return (
      <p className="reading-empty-outline">
        이 자료는 목차 없이 이어서 읽습니다.
      </p>
    );
  return (
    <nav aria-label={label} className="reading-toc" ref={navigation}>
      <ol>
        {headings.map((heading) => (
          <li
            key={heading.id}
            className={heading.level > 2 ? "reading-toc-child" : undefined}
          >
            <a
              href={`#${encodeURIComponent(heading.id)}`}
              aria-current={active === heading.id ? "location" : undefined}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
