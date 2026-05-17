"use client";

import { useEffect } from "react";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";

export default function VisitorTracker() {
  useVisitorTracking();
  return null;
}
