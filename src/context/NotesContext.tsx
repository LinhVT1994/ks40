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
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export function NotesProvider({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [scrollToNoteId, setScrollToNoteId] = useState<string | null>(null);
  const [currentArticleId, setCurrentArticleId] = useState<string | null>(null);
  const [currentArticleTitle, setCurrentArticleTitle] = useState<string | null>(null);

  const openSidebar = useCallback(() => setIsSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setIsSidebarOpen(prev => !prev), []);

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
