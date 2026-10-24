"use client";

import { createContext, useContext } from "react";

export interface EditorContextValue {
  isEditor: boolean;
  selectedSectionId: string | null;
  activeFieldKey: string | null;
  activeBlockId: string | null;
  onUpdateText: (sectionId: string, fieldKey: string, newValue: string, blockId?: string) => void;
  onFocusField: (sectionId: string, fieldKey: string, blockId?: string) => void;
  hoveredField: { sectionId: string; fieldKey: string; blockId?: string } | null;
  setHoveredField: (field: { sectionId: string; fieldKey: string; blockId?: string } | null) => void;
}

export const EditorContext = createContext<EditorContextValue>({
  isEditor: false,
  selectedSectionId: null,
  activeFieldKey: null,
  activeBlockId: null,
  onUpdateText: () => {},
  onFocusField: () => {},
  hoveredField: null,
  setHoveredField: () => {},
});

export function useEditor() {
  return useContext(EditorContext);
}

// Section Context to provide sectionId, settings, and blocks to all children
export interface SectionContextValue {
  sectionId: string;
  settings?: Record<string, any>;
  blocks?: Array<any>;
}

export const SectionContext = createContext<SectionContextValue | null>(null);

export function useSection() {
  return useContext(SectionContext);
}

// Block Context for child items (slides, FAQ items, testimonials, etc.)
export interface BlockContextValue {
  blockId: string;
  blockIndex?: number;
  blockSettings?: Record<string, any>;
}

export const BlockContext = createContext<BlockContextValue | null>(null);

export function useBlock() {
  return useContext(BlockContext);
}
