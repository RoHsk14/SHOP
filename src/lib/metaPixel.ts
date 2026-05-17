declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;

function trackCAPI(event_name: string, data?: Record<string, any>) {
  fetch("/api/meta/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event_name, event_data: data }),
    keepalive: true,
  }).catch(() => {});
}

export const pageview = () => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "PageView");
  }
  trackCAPI("PageView");
};

export const trackViewContent = (data?: Record<string, any>) => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "ViewContent", data);
  }
  trackCAPI("ViewContent", data);
};

export const trackAddToCart = (data?: Record<string, any>) => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "AddToCart", data);
  }
  trackCAPI("AddToCart", data);
};

export const trackInitiateCheckout = (data?: Record<string, any>) => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "InitiateCheckout", data);
  }
  trackCAPI("InitiateCheckout", data);
};

export const trackPurchase = (data?: Record<string, any>) => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "Purchase", data);
  }
  trackCAPI("Purchase", data);
};
