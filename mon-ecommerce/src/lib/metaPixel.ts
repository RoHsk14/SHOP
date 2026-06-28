import { extractSubdomain } from "@/lib/host";

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

let _eventIdCounter = 0;

function generateEventId(): string {
  _eventIdCounter++;
  return `meta_${Date.now()}_${_eventIdCounter}`;
}

function getShopSlug(): string | null {
  if (typeof window === "undefined") return null;
  return extractSubdomain(window.location.host);
}

function trackCAPI(event_name: string, data?: Record<string, any>, eventId?: string) {
  const shopSlug = getShopSlug();
  const body: Record<string, any> = { event_name, event_data: data };
  if (shopSlug) body.shop_slug = shopSlug;
  if (eventId) body.event_id = eventId;

  fetch("/api/meta/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch((err) => {
    console.error("MetaPixel CAPI error:", err);
  });
}

export const pageview = () => {
  const eventId = generateEventId();
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "PageView", { eventID: eventId });
  }
  trackCAPI("PageView", undefined, eventId);
};

export const trackViewContent = (data?: Record<string, any>) => {
  const eventId = generateEventId();
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "ViewContent", { ...data, eventID: eventId });
  }
  trackCAPI("ViewContent", data, eventId);
};

export const trackAddToCart = (data?: Record<string, any>) => {
  const eventId = generateEventId();
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "AddToCart", { ...data, eventID: eventId });
  }
  trackCAPI("AddToCart", data, eventId);
};

export const trackInitiateCheckout = (data?: Record<string, any>) => {
  const eventId = generateEventId();
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "InitiateCheckout", { ...data, eventID: eventId });
  }
  trackCAPI("InitiateCheckout", data, eventId);
};

export const trackPurchase = (data?: Record<string, any>) => {
  const eventId = generateEventId();
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "Purchase", { ...data, eventID: eventId });
  }
  trackCAPI("Purchase", data, eventId);
};
