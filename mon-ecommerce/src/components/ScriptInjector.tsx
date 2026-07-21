"use client";

import { useEffect, useRef } from "react";
import type { CustomScripts } from "@/lib/theme-config";

export default function ScriptInjector({ scripts }: { scripts?: CustomScripts }) {
  const headRef = useRef<HTMLDivElement | null>(null);
  const bodyStartRef = useRef<HTMLDivElement | null>(null);
  const bodyEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scripts?.head && headRef.current) {
      headRef.current.innerHTML = scripts.head;
    }
    if (scripts?.bodyStart && bodyStartRef.current) {
      bodyStartRef.current.innerHTML = scripts.bodyStart;
    }
    if (scripts?.bodyEnd && bodyEndRef.current) {
      bodyEndRef.current.innerHTML = scripts.bodyEnd;
    }
    return () => {
      if (headRef.current) headRef.current.innerHTML = "";
      if (bodyStartRef.current) bodyStartRef.current.innerHTML = "";
      if (bodyEndRef.current) bodyEndRef.current.innerHTML = "";
    };
  }, [scripts?.head, scripts?.bodyStart, scripts?.bodyEnd]);

  return (
    <>
      <div ref={headRef} style={{ display: "none" }} />
      <div ref={bodyStartRef} style={{ display: "none" }} />
      <div ref={bodyEndRef} style={{ display: "none" }} />
    </>
  );
}
