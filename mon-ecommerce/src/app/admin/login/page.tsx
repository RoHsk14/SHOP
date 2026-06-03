"use client";

import { useEffect } from "react";

export default function AdminLoginRedirect() {
  useEffect(() => {
    window.location.replace(`${window.location.origin}/login`);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-gray-200 border-t-emerald-600 rounded-full animate-spin" />
    </div>
  );
}
