import { useEffect } from "react";

const BRAND = "VidyaAI";

function upsertMeta(selector, attributes) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
}

function upsertLink(rel, href) {
  let element = document.head.querySelector(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement("link");
    element.rel = rel;
    document.head.appendChild(element);
  }
  element.href = href;
}

export default function SeoHead({
  title,
  description,
  path,
  image = "/brand/gyanix-ai-solutions-logo.png",
  robots = "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
  type = "website",
  schema = [],
}) {
  useEffect(() => {
    const canonical = new URL(path || window.location.pathname, window.location.origin).href;
    const imageUrl = new URL(image, window.location.origin).href;
    const fullTitle = title.includes(BRAND) ? title : `${title} | ${BRAND}`;

    document.title = fullTitle;
    document.documentElement.lang = "en-IN";
    upsertMeta('meta[name="description"]', { name: "description", content: description });
    upsertMeta('meta[name="robots"]', { name: "robots", content: robots });
    upsertMeta('meta[property="og:title"]', { property: "og:title", content: fullTitle });
    upsertMeta('meta[property="og:description"]', { property: "og:description", content: description });
    upsertMeta('meta[property="og:type"]', { property: "og:type", content: type });
    upsertMeta('meta[property="og:url"]', { property: "og:url", content: canonical });
    upsertMeta('meta[property="og:image"]', { property: "og:image", content: imageUrl });
    upsertMeta('meta[property="og:site_name"]', { property: "og:site_name", content: BRAND });
    upsertMeta('meta[property="og:locale"]', { property: "og:locale", content: "en_IN" });
    upsertMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: fullTitle });
    upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: description });
    upsertMeta('meta[name="twitter:image"]', { name: "twitter:image", content: imageUrl });
    upsertLink("canonical", canonical);

    document.querySelectorAll('script[data-vidyaai-schema="true"]').forEach((node) => node.remove());
    const entries = Array.isArray(schema) ? schema : [schema];
    entries.filter(Boolean).forEach((entry) => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.dataset.vidyaaiSchema = "true";
      script.textContent = JSON.stringify(entry);
      document.head.appendChild(script);
    });
  }, [description, image, path, robots, schema, title, type]);

  return null;
}
