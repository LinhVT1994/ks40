'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { type ArticleAnnotation } from '@/features/articles/actions/annotation';

interface NotesContextType {
  // Sidebar State
  isSidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;

  // Scratchpad State
  isScratchpadOpen: boolean;
  openScratchpad: (noteId?: string | null) => void;
  closeScratchpad: () => void;
  toggleScratchpad: () => void;

  // Current Context (Article info)
  currentArticleId: string | null;
  currentArticleTitle: string | null;
  setCurrentArticle: (id: string | null, title: string | null) => void;

  // Shared Data
  activeNoteId: string | null;
  scrollToNoteId: string | null;
  setScrollToNoteId: (id: string | null) => void;

  // Bulk Selection
  isSelectMode: boolean;
  selectedIds: Set<string>;
  enterSelectMode: () => void;
  exitSelectMode: () => void;
  toggleSelected: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export function NotesProvider({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [scrollToNoteId, setScrollToNoteId] = useState<string | null>(null);
  const [currentArticleId, setCurrentArticleId] = useState<string | null>(null);
  const [currentArticleTitle, setCurrentArticleTitle] = useState<string | null>(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const openSidebar = useCallback(() => setIsSidebarOpen(true), []);
  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
    setIsSelectMode(false);
    setSelectedIds(new Set());
  }, []);
  const toggleSidebar = useCallback(() => setIsSidebarOpen(prev => !prev), []);

  const enterSelectMode = useCallback(() => setIsSelectMode(true), []);
  const exitSelectMode = useCallback(() => {
    setIsSelectMode(false);
    setSelectedIds(new Set());
  }, []);
  const toggleSelected = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);
  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const openScratchpad = useCallback((noteId: string | null = null) => {
    setActiveNoteId(noteId);
    setIsScratchpadOpen(true);
  }, []);
  
  const closeScratchpad = useCallback(() => setIsScratchpadOpen(false), []);
  const toggleScratchpad = useCallback(() => setIsScratchpadOpen(prev => !prev), []);

  const setCurrentArticle = useCallback((id: string | null, title: string | null) => {
    setCurrentArticleId(id);
    setCurrentArticleTitle(title);
  }, []);

  return (
    <NotesContext.Provider value={{
      isSidebarOpen,
      openSidebar,
      closeSidebar,
      toggleSidebar,
      isScratchpadOpen,
      openScratchpad,
      closeScratchpad,
      toggleScratchpad,
      currentArticleId,
      currentArticleTitle,
      setCurrentArticle,
      activeNoteId,
      scrollToNoteId,
      setScrollToNoteId,
      isSelectMode,
      selectedIds,
      enterSelectMode,
      exitSelectMode,
      toggleSelected,
      selectAll,
      clearSelection,
    }}>
      {children}
    </NotesContext.Provider>
  );
}

export function useNotes() {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
}
