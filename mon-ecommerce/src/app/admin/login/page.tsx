"use client";

import { useEffect } from "react";

export default function AdminLoginRedirect() {
  useEffect(() => {
    window.location.replace(`${window.location.origin}/login`);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-zinc-800 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  );
}
