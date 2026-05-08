"use client";

import { useEffect, useRef } from "react";

export function useVisitorTracking() {
  const sessionIdRef = useRef<string | null>(null);

  const getSessionId = () => {
    if (sessionIdRef.current) return sessionIdRef.current;
    
    if (typeof window !== "undefined") {
      let sessionId = localStorage.getItem("session_id");
      if (!sessionId) {
        sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem("session_id", sessionId);
      }
      sessionIdRef.current = sessionId;
      return sessionId;
    }
    return null;
  };

  const trackVisit = async () => {
    const sessionId = getSessionId();
    if (!sessionId) return;

    try {
      await fetch("/api/visitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          path: window.location.pathname,
        }),
      });
    } catch (error) {
      console.error("Visitor tracking failed:", error);
    }
  };

  useEffect(() => {
    // Track initial visit
    trackVisit();

    // Heartbeat every 30 seconds
    const interval = setInterval(trackVisit, 30 * 1000);

    // Mark offline when leaving
    const handleUnload = () => {
      const sessionId = getSessionId();
      if (sessionId) {
        // Use sendBeacon for reliability
        const blob = new Blob(
          [JSON.stringify({ session_id: sessionId, is_online: false })],
          { type: "application/json" }
        );
        navigator.sendBeacon("/api/visitors/offline", blob);
      }
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, []);

  return { trackVisit };
}
