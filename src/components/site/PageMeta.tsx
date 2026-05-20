import * as React from "react";

interface PageMetaProps {
  description: string;
  noindex?: boolean;
  title: string;
}

function upsertMeta(
  selector: string,
  attribute: "content" | "name" | "property",
  value: string,
  fallbackAttributes?: Record<string, string>,
) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);

  if (!element) {
    element = document.createElement("meta");

    if (fallbackAttributes) {
      Object.entries(fallbackAttributes).forEach(([key, entryValue]) => {
        element?.setAttribute(key, entryValue);
      });
    }

    document.head.appendChild(element);
  }

  element.setAttribute(attribute, value);
}

function upsertLink(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector<HTMLLinkElement>(selector);

  if (!element) {
    element = document.createElement("link");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element?.setAttribute(key, value);
  });
}

export function PageMeta({ description, noindex = false, title }: PageMetaProps) {
  React.useEffect(() => {
    const absoluteImageUrl = `${window.location.origin}/og-card.png`;
    const canonicalUrl = `${window.location.origin}${window.location.pathname}${window.location.search}`;

    document.title = title;

    upsertLink('link[rel="canonical"]', {
      rel: "canonical",
      href: canonicalUrl,
    });
    upsertMeta('meta[name="description"]', "content", description, {
      name: "description",
    });
    upsertMeta('meta[name="robots"]', "content", noindex ? "noindex,nofollow" : "index,follow", {
      name: "robots",
    });
    upsertMeta('meta[name="theme-color"]', "content", "#050505", {
      name: "theme-color",
    });
    upsertMeta('meta[property="og:title"]', "content", title, {
      property: "og:title",
    });
    upsertMeta('meta[property="og:description"]', "content", description, {
      property: "og:description",
    });
    upsertMeta('meta[property="og:type"]', "content", "website", {
      property: "og:type",
    });
    upsertMeta('meta[property="og:url"]', "content", canonicalUrl, {
      property: "og:url",
    });
    upsertMeta('meta[property="og:image"]', "content", absoluteImageUrl, {
      property: "og:image",
    });
    upsertMeta('meta[name="twitter:card"]', "content", "summary_large_image", {
      name: "twitter:card",
    });
    upsertMeta('meta[name="twitter:title"]', "content", title, {
      name: "twitter:title",
    });
    upsertMeta('meta[name="twitter:description"]', "content", description, {
      name: "twitter:description",
    });
    upsertMeta('meta[name="twitter:image"]', "content", absoluteImageUrl, {
      name: "twitter:image",
    });
  }, [description, noindex, title]);

  return null;
}
