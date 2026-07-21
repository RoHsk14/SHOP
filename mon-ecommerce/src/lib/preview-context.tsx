"use client";

import { createContext, useContext } from "react";
import type { BrandAssets, NavMenu, SocialLinks } from "./theme-config";

export interface SectionActions {
  onDeleteSection?: (sectionId: string) => void;
  onDuplicateSection?: (sectionId: string) => void;
  onToggleSectionVisibility?: (sectionId: string) => void;
}

interface PreviewContextValue extends SectionActions {
  brand?: BrandAssets;
  shopName?: string;
  social?: SocialLinks;
  menus?: NavMenu[];
}

const PreviewContext = createContext<PreviewContextValue>({});

export function usePreview() {
  return useContext(PreviewContext);
}

export const PreviewProvider = PreviewContext.Provider;
