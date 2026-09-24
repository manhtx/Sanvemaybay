import { useEffect } from "react";
import { useLocation } from "react-router";
import { getRouteMetadata } from "../lib/routeMetadata";

function upsertMeta(selector: string, attributes: Record<string, string>, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    Object.entries(attributes).forEach(([name, value]) => element?.setAttribute(name, value));
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function upsertCanonical(href: string) {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!element) {
    element = document.createElement("link");
    element.rel = "canonical";
    document.head.appendChild(element);
  }
  element.href = href;
}

export function RouteMetadata() {
  const { pathname } = useLocation();

  useEffect(() => {
    const metadata = getRouteMetadata(pathname);
    const configuredOrigin = import.meta.env.VITE_PUBLIC_SITE_URL?.replace(/\/$/, "");
    const origin = configuredOrigin || window.location.origin;
    const canonicalUrl = new URL(pathname, `${origin}/`).toString();

    document.title = metadata.title;
    upsertMeta('meta[name="description"]', { name: "description" }, metadata.description);
    upsertMeta('meta[name="robots"]', { name: "robots" }, metadata.indexable ? "index,follow" : "noindex,nofollow");
    upsertMeta('meta[property="og:title"]', { property: "og:title" }, metadata.title);
    upsertMeta('meta[property="og:description"]', { property: "og:description" }, metadata.description);
    upsertMeta('meta[property="og:url"]', { property: "og:url" }, canonicalUrl);
    upsertCanonical(canonicalUrl);
  }, [pathname]);

  return null;
}
