/* global process, console, URL */
import { mkdirSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const INDEXABLE_ROUTES = ["/", "/deals", "/historical-deals", "/explore", "/search", "/alerts", "/advisor", "/privacy", "/terms"];

export function productionOrigin(value) {
  try {
    const url = new URL(String(value ?? ""));
    if (url.protocol !== "https:" || ["localhost", "127.0.0.1", "0.0.0.0"].includes(url.hostname)) return undefined;
    return url.origin;
  } catch {
    return undefined;
  }
}

export function sitemapXml(origin) {
  const lastmod = new Date().toISOString().slice(0, 10);
  const entries = INDEXABLE_ROUTES.map((route) => `  <url><loc>${origin}${route}</loc><lastmod>${lastmod}</lastmod></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

export function robotsText(origin) {
  const sitemap = origin ? `\nSitemap: ${origin}/sitemap.xml\n` : "\n";
  return `User-agent: *\nAllow: /\nDisallow: /auth\nDisallow: /saved\nDisallow: /alerts/confirm\nDisallow: /alerts/unsubscribe\n${sitemap}`;
}

export function generateSeoAssets(outputDirectory, configuredUrl) {
  const origin = productionOrigin(configuredUrl);
  mkdirSync(outputDirectory, { recursive: true });
  writeFileSync(`${outputDirectory}/robots.txt`, robotsText(origin));
  if (origin) writeFileSync(`${outputDirectory}/sitemap.xml`, sitemapXml(origin));
  return { origin, sitemapGenerated: Boolean(origin) };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = generateSeoAssets("dist", process.env.VITE_PUBLIC_SITE_URL);
  if (result.sitemapGenerated) console.log(`SEO assets generated for ${result.origin}`);
  else console.warn("SEO sitemap skipped: VITE_PUBLIC_SITE_URL must be a non-local HTTPS origin.");
}
