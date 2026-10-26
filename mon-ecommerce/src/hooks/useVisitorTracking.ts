"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes d'inactivite

function isExcludedPath(p: string | null): boolean {
  if (!p) return true;
  return (
    p.includes("/admin") ||
    p.startsWith("/admin") ||
    p.startsWith("/login") ||
    p.startsWith("/signup") ||
    p.startsWith("/auth") ||
    p.startsWith("/api")
  );
}

export function useVisitorTracking() {
  const sessionIdRef = useRef<string | null>(null);
  const pathname = usePathname();

  const getSessionId = () => {
    if (typeof window === "undefined") return null;

    const now = Date.now();
    const storedSessionId =
      sessionStorage.getItem("shopeazy_session_id") ||
      localStorage.getItem("shopeazy_session_id");
    const lastActivityStr = localStorage.getItem("shopeazy_session_last_activity");
    const lastActivity = lastActivityStr ? parseInt(lastActivityStr, 10) : 0;

    if (storedSessionId && now - lastActivity < SESSION_TIMEOUT_MS) {
      localStorage.setItem("shopeazy_session_last_activity", now.toString());
      sessionIdRef.current = storedSessionId;
      return storedSessionId;
    }

    const newSessionId = `sess_${now}_${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem("shopeazy_session_id", newSessionId);
    sessionStorage.setItem("shopeazy_session_id", newSessionId);
    localStorage.setItem("shopeazy_session_last_activity", now.toString());
    sessionIdRef.current = newSessionId;
    return newSessionId;
  };

  const track = async (type: "pageview" | "heartbeat") => {
    if (typeof window === "undefined") return;
    if (isExcludedPath(window.location.pathname)) return;

    const sessionId = getSessionId();
    if (!sessionId) return;

    try {
      await fetch("/api/visitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          path: window.location.pathname,
          type,
        }),
      });
    } catch (error) {
      console.error("Visitor tracking failed:", error);
    }
  };

  useEffect(() => {
    if (!isExcludedPath(pathname)) {
      track("pageview");
    }
  }, [pathname]);

  useEffect(() => {
    if (isExcludedPath(pathname)) return;

    const interval = setInterval(() => {
      if (!isExcludedPath(window.location.pathname)) {
        track("heartbeat");
      }
    }, 30 * 1000);

    const handleUnload = () => {
      if (isExcludedPath(window.location.pathname)) return;
      const sessionId = getSessionId();
      if (sessionId) {
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
  }, [pathname]);
}
