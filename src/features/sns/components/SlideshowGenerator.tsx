'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, ChevronLeft, ChevronRight, Presentation, Sparkles, Image as ImageIcon, Save, Trash2, Library, GripVertical, Hash, List, Heart, MessageCircle, Share2, Music, ShieldCheck, Bookmark, Search, Grid, Layout, AlignLeft, AlignCenter, AlignRight, Palette, Plus, Minus, Type as FontIcon, Smartphone, Square, Monitor, Maximize, RectangleVertical, RectangleHorizontal } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { getSlideshowTemplatesAction, saveSlideshowTemplateAction, deleteSlideshowTemplateAction } from '@/features/member/actions/studio';
import { toast } from 'sonner';

interface SlideBlock {
  id: string;
  type: 'title' | 'text' | 'image' | 'quote' | 'list' | 'logo';
  name: string; // Placeholder name for AI
  description: string; // Description of the field
  align: 'left' | 'center' | 'right';
  content: string;
  color?: string; // Custom text color
  fontSize?: number; // Custom font size multiplier
  groupId?: string; // For grouping blocks together
}

interface SlideData {
  title: string;
  content: string;
  type: 'cover' | 'content' | 'cta';
  image?: string;
  blocks?: SlideBlock[]; // New: support for custom blocks
}

interface SlideshowGeneratorProps {
  title: string;
  overview?: string;
  content: string;
  authorName: string;
  authorImage?: string | null;
  onClose: () => void;
}

export default function SlideshowGenerator({ 
  title, 
  overview, 
  content, 
  authorName, 
  authorImage,
  onClose 
}: SlideshowGeneratorProps) {
  const [overlayOpacity, setOverlayOpacity] = useState(0.6);
  const [accentColor, setAccentColor] = useState('#3b82f6'); // Default Blue
  const [layout, setLayout] = useState<'center' | 'left' | 'split'>('center');
  const [fontFamily, setFontFamily] = useState<'sans' | 'serif' | 'display'>('display');
  const [platform, setPlatform] = useState<'tiktok' | 'instagram' | 'facebook' | 'landscape'>('tiktok');
  const isEditMode = true; // Always locked in blueprint mode
  const [gridMode, setGridMode] = useState<'off' | 'white' | 'black' | 'accent'>('off');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [showSafeZone, setShowSafeZone] = useState(true);
  const [sidebarOffset, setSidebarOffset] = useState({ x: 0, y: 0 });
  const [bottomInfoOffset, setBottomInfoOffset] = useState({ x: 0, y: 0 });
  const [blockOffsets, setBlockOffsets] = useState<Record<string, { x: number, y: number }>>({});
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [selectedBlockIds, setSelectedBlockIds] = useState<string[]>([]);
  const [blockSizes, setBlockSizes] = useState<Record<string, { width?: number | string, height?: number | string }>>({});
  const [isResizing, setIsResizing] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{ startX: number, startY: number, endX: number, endY: number } | null>(null);
  const [savedTemplates, setSavedTemplates] = useState<any[]>([]);
  const [slides, setSlides] = useState<{ id: string, blocks: SlideBlock[], name?: string, description?: string }[]>([
    { 
      id: 'slide-1', 
      name: 'Trang Bìa',
      description: 'Dùng để mở đầu bài viết, tiêu đề lớn và hình ảnh ấn tượng.',
      blocks: [
        { id: '1', type: 'logo', name: 'Logo', content: 'BRAND', align: 'center', fontSize: 1, description: '' },
        { id: '2', type: 'title', name: 'title', description: '', align: 'center', content: 'Khám phá tri thức mới cùng KS40' },
        { id: '3', type: 'text', name: 'content', description: '', align: 'left', content: 'Nền tảng học tập và sáng tạo nội dung AI thế hệ mới.' },
      ]
    }
  ]);
  const [currentSlideId, setCurrentSlideId] = useState('slide-1');
  const currentSlide = slides.find(s => s.id === currentSlideId) || slides[0];
  const currentBlocks = currentSlide.blocks;

  const updateCurrentBlocks = (newBlocks: SlideBlock[]) => {
    setSlides(slides.map(s => s.id === currentSlideId ? { ...s, blocks: newBlocks } : s));
  };
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const slideRef = useRef<HTMLDivElement>(null);
  const blockRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const selectedBlocks = useMemo(() => currentBlocks.filter(b => selectedBlockIds.includes(b.id)), [currentBlocks, selectedBlockIds]);
  const selectedBlock = selectedBlocks.length === 1 ? selectedBlocks[0] : null;

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchTemplates();
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    setSidebarOffset({ x: 0, y: 0 });
    setBottomInfoOffset({ x: 0, y: 0 });
    setBlockOffsets({});
  }, [platform]);

  const fetchTemplates = async () => {
    const templates = await getSlideshowTemplatesAction();
    setSavedTemplates(templates);
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      toast.error('Vui lòng nhập tên Template');
      return;
    }

    try {
      setIsSavingTemplate(true);
      await saveSlideshowTemplateAction({
        name: templateName,
        layout,
        fontFamily,
        accentColor,
        overlayOpacity,
        blocks: slides.flatMap(s => s.blocks), // Adjust if you want to save all slides or just template structure
      });
      toast.success('Đã lưu Template thành công');
      setTemplateName('');
      setShowTemplateLibrary(false);
      fetchTemplates();
    } catch (error) {
      toast.error('Lỗi khi lưu Template');
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const applyTemplate = (template: any) => {
    setLayout(template.layout as any);
    setFontFamily(template.fontFamily as any);
    setAccentColor(template.accentColor);
    setOverlayOpacity(template.overlayOpacity);
    if (template.blocks) {
      setSlides([{ id: 'slide-1', blocks: template.blocks }]);
      setCurrentSlideId('slide-1');
    }
    toast.success(`Đã áp dụng Template: ${template.name}`);
  };

  const handleDeleteTemplate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteSlideshowTemplateAction(id);
      toast.success('Đã xóa Template');
      fetchTemplates();
    } catch (error) {
      toast.error('Lỗi khi xóa Template');
    }
  };

  const addBlock = (type: SlideBlock['type']) => {
    const newBlock: SlideBlock = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      name: type === 'list' ? 'highlights' : type === 'logo' ? 'brand_logo' : type + '_' + (currentBlocks.length + 1),
      description: type === 'list' ? 'Danh sách điểm nổi bật' : '',
      align: type === 'title' || type === 'logo' ? 'center' : 'left',
      content: type === 'list' ? '- Mục tiêu chính 1\n- Lợi ích cốt lõi 2\n- Kết quả kỳ vọng 3' : type === 'logo' ? (authorName || 'YOUR BRAND') : '',
      fontSize: 1
    };
    updateCurrentBlocks([...currentBlocks, newBlock]);
    toast.success(`Đã thêm khối ${type.toUpperCase()}`);
  };

  const updateSelectedBlocks = (updates: Partial<SlideBlock>) => {
    updateCurrentBlocks(currentBlocks.map(b => selectedBlockIds.includes(b.id) ? { ...b, ...updates } : b));
  };

  const removeBlock = (id: string) => {
    updateCurrentBlocks(currentBlocks.filter(b => b.id !== id));
    setSelectedBlockIds(prev => prev.filter(bid => bid !== id));
  };

  const removeSelectedBlocks = () => {
    updateCurrentBlocks(currentBlocks.filter(b => !selectedBlockIds.includes(b.id)));
    setSelectedBlockIds([]);
  };

  const updateBlock = (id: string, updates: Partial<SlideBlock>) => {
    updateCurrentBlocks(currentBlocks.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const groupSelectedBlocks = () => {
    if (selectedBlockIds.length < 2) return;
    const groupId = `group-${Date.now()}`;
    updateCurrentBlocks(currentBlocks.map(b => 
      selectedBlockIds.includes(b.id) ? { ...b, groupId } : b
    ));
    toast.success('Đã nhóm các khối lại');
  };

  const ungroupSelectedBlocks = () => {
    const groupIdsToClear = new Set(
      currentBlocks
        .filter(b => selectedBlockIds.includes(b.id) && b.groupId)
        .map(b => b.groupId)
    );
    
    updateCurrentBlocks(currentBlocks.map(b => 
      b.groupId && groupIdsToClear.has(b.groupId) ? { ...b, groupId: undefined } : b
    ));
    toast.success('Đã rã nhóm');
  };

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmd = e.metaKey || e.ctrlKey;
      
      // Grouping shortcuts
      if (isCmd && e.key === 'g') {
        e.preventDefault();
        if (e.shiftKey) {
          ungroupSelectedBlocks();
        } else {
          groupSelectedBlocks();
        }
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeTag = document.activeElement?.tagName;
        const isEditing = 
          activeTag === 'INPUT' || 
          activeTag === 'TEXTAREA' || 
          document.activeElement?.getAttribute('contenteditable') === 'true' ||
          editingBlockId !== null;

        if (!isEditing && (selectedBlockId || selectedBlockIds.length > 0)) {
          removeSelectedBlocks();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBlockId, selectedBlockIds, currentBlocks, editingBlockId]);

  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('canvas-area')) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setSelectionBox({ startX: x, startY: y, endX: x, endY: y });
      setSelectedBlockIds([]);
    }
  };

  const handleCanvasPointerMove = (e: React.PointerEvent) => {
    if (selectionBox) {
      const rect = e.currentTarget.getBoundingClientRect();
      setSelectionBox(prev => prev ? { ...prev, endX: e.clientX - rect.left, endY: e.clientY - rect.top } : null);
    }
  };

  const handleCanvasPointerUp = () => {
    if (selectionBox) {
      const boxRect = {
        left: Math.min(selectionBox.startX, selectionBox.endX),
        top: Math.min(selectionBox.startY, selectionBox.endY),
        right: Math.max(selectionBox.startX, selectionBox.endX),
        bottom: Math.max(selectionBox.startY, selectionBox.endY)
      };

      const newlySelectedIds: string[] = [];
      currentBlocks.forEach(block => {
        const el = blockRefs.current[block.id];
        if (el) {
          const blockRect = el.getBoundingClientRect();
          const canvasRect = containerRef.current?.getBoundingClientRect();
          if (canvasRect) {
            const relativeBlockRect = {
              left: blockRect.left - canvasRect.left,
              top: blockRect.top - canvasRect.top,
              right: blockRect.right - canvasRect.left,
              bottom: blockRect.bottom - canvasRect.top
            };

            const isInside = (
              relativeBlockRect.left < boxRect.right &&
              relativeBlockRect.right > boxRect.left &&
              relativeBlockRect.top < boxRect.bottom &&
              relativeBlockRect.bottom > boxRect.top
            );

            if (isInside) newlySelectedIds.push(block.id);
          }
        }
      });

      setSelectedBlockIds(newlySelectedIds);
      setSelectionBox(null);
    }
  };


  const startDrag = (
    e: React.PointerEvent,
    onDelta: (dx: number, dy: number) => void
  ) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    let lastX = e.clientX;
    let lastY = e.clientY;
    const onMove = (me: PointerEvent) => {
      onDelta(me.clientX - lastX, me.clientY - lastY);
      lastX = me.clientX;
      lastY = me.clientY;
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const handleResize = (e: React.PointerEvent, blockId: string, direction: 'br' | 'r' | 'b') => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const el = blockRefs.current[blockId];
    if (!el) return;
    
    const startWidth = el.offsetWidth;
    const startHeight = el.offsetHeight;
    const startFontSize = currentBlocks.find(b => b.id === blockId)?.fontSize || 1;

    const onMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      
      if (direction === 'br') {
        // Proportional scaling for corner handle
        const scaleFactor = Math.max(0.1, (startWidth + dx) / startWidth);
        updateBlock(blockId, { fontSize: startFontSize * scaleFactor });
      } else {
        // Linear resizing for edge handles
        setBlockSizes(prev => ({
          ...prev,
          [blockId]: {
            ...prev[blockId],
            width: direction === 'r' ? Math.max(50, startWidth + dx) : prev[blockId]?.width,
            height: direction === 'b' ? Math.max(20, startHeight + dy) : prev[blockId]?.height,
          }
        }));
      }
    };

    const onUp = () => {
      setIsResizing(false);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const addSlide = () => {
    const newId = `slide-${Date.now()}`;
    const newSlide = { 
      id: newId, 
      blocks: [], 
      name: `Slide ${slides.length + 1}`,
      description: ''
    };
    setSlides([...slides, newSlide]);
    setCurrentSlideId(newId);
  };

  const updateSlideMetadata = (id: string, updates: { name?: string, description?: string }) => {
    setSlides(slides.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteSlide = (id: string) => {
    if (slides.length <= 1) return;
    const newSlides = slides.filter(s => s.id !== id);
    setSlides(newSlides);
    if (currentSlideId === id) {
      setCurrentSlideId(newSlides[0].id);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex bg-zinc-950 overflow-hidden select-none font-sans text-white">
      {/* Studio Header */}
      <div className="absolute top-0 left-0 right-0 z-[100] p-4 flex items-center justify-between pointer-events-none transition-opacity duration-500 opacity-20 hover:opacity-100">
        <div className="flex items-center gap-2.5 pointer-events-auto">
          <div 
            className="w-8 h-8 rounded-xl flex items-center justify-center shadow-xl transition-all"
            style={{ backgroundColor: accentColor, boxShadow: `0 8px 20px ${accentColor}44` }}
          >
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h2 className="font-black text-xs uppercase tracking-tighter leading-none">TEMPLATE BUILDER</h2>
        </div>
        <div className="pointer-events-auto">
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all backdrop-blur-xl border border-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 1. LEFT SIDEBAR: Content Blueprint */}
      <div className="w-80 bg-zinc-900/40 backdrop-blur-3xl border-r border-white/5 flex flex-col z-40 overflow-hidden shadow-2xl">
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 custom-scrollbar">
          {/* Content Tools Section */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Content Tools</h4>
            <div className="flex items-center gap-2 bg-white/5 p-2 rounded-2xl border border-white/5">
              {(['title', 'text', 'list', 'image', 'quote', 'logo'] as const).map(type => (
                <button 
                  key={type}
                  onClick={() => addBlock(type)}
                  className="flex-1 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl transition-all group"
                  title={`Add ${type}`}
                >
                  <div className="text-white/40 group-hover:text-white transition-all scale-90 group-hover:scale-100">
                    {type === 'title' && <span className="font-black text-xs">H1</span>}
                    {type === 'text' && <span className="font-bold text-xs">¶</span>}
                    {type === 'list' && <List className="w-4 h-4" />}
                    {type === 'image' && <ImageIcon className="w-4 h-4" />}
                    {type === 'quote' && <span className="font-serif italic text-base">"</span>}
                    {type === 'logo' && <div className="w-4 h-4 rounded-md border-2 border-current flex items-center justify-center"><span className="text-[8px] font-black">B</span></div>}
                  </div>
                </button>
              ))}
            </div>
          </div>


          {/* Blueprint Structure Section */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Active Blueprint</h4>

            <Reorder.Group axis="y" values={currentBlocks} onReorder={updateCurrentBlocks} className="space-y-3">
              {currentBlocks.map((block, index) => (
                <Reorder.Item key={block.id} value={block} className="p-4 bg-white/5 border border-white/5 rounded-[1.5rem] space-y-3 group cursor-grab active:cursor-grabbing">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-3.5 h-3.5 text-white/20" />
                      <span className="text-[9px] font-black text-primary uppercase">#{index + 1} {block.type}</span>
                    </div>
                    <button onClick={() => removeBlock(block.id)} className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <input type="text" value={block.name} onChange={(e) => updateBlock(block.id, { name: e.target.value })} className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-1.5 text-[10px] font-mono" placeholder="AI Key" />
                    <input type="text" value={block.description} onChange={(e) => updateBlock(block.id, { description: e.target.value })} className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-1.5 text-[10px] text-white/40" placeholder="Description..." />
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        </div>
      </div>

      {/* 2. CENTER & RIGHT WRAPPER */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Center Canvas: Live Preview */}
        <div 
          ref={containerRef}
          className="flex-1 relative flex flex-col items-center bg-black/20 overflow-hidden canvas-area"
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={handleCanvasPointerMove}
          onPointerUp={handleCanvasPointerUp}
        >
          {/* Selection Box UI */}
          {selectionBox && (
            <div 
              className="absolute z-[100] border border-primary bg-primary/10 pointer-events-none rounded-sm"
              style={{
                left: Math.min(selectionBox.startX, selectionBox.endX),
                top: Math.min(selectionBox.startY, selectionBox.endY),
                width: Math.abs(selectionBox.endX - selectionBox.startX),
                height: Math.abs(selectionBox.endY - selectionBox.startY)
              }}
            />
          )}

          {/* Top Toolbar (Canva Style) */}
          <AnimatePresence>
            {selectedBlockIds.length > 0 && (
              <motion.div 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="absolute top-4 z-[100] flex items-center gap-1 p-1 bg-zinc-900/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl pointer-events-auto"
              >
                {/* Font Family Selector (Show if all are text-based or just for simplicity) */}
                <div className="flex items-center gap-1 px-2 border-r border-white/5">
                  <select 
                    value={fontFamily} 
                    onChange={(e: any) => setFontFamily(e.target.value)}
                    className="bg-transparent text-[11px] font-bold outline-none cursor-pointer hover:text-primary transition-colors"
                  >
                    <option value="display">Outfit</option>
                    <option value="sans">Inter</option>
                    <option value="serif">Playfair</option>
                  </select>
                </div>

                {/* Font Size Controls */}
                <div className="flex items-center gap-1 px-2 border-r border-white/5">
                  <button 
                    onClick={() => updateSelectedBlocks({ fontSize: Math.max(0.1, (selectedBlock?.fontSize || 1) - 0.1) })}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input 
                    type="number" 
                    value={Math.round((selectedBlock?.fontSize || 1) * 100)} 
                    onChange={(e) => updateSelectedBlocks({ fontSize: parseInt(e.target.value) / 100 })}
                    className="w-10 bg-transparent text-[11px] font-mono text-center outline-none"
                  />
                  <button 
                    onClick={() => updateSelectedBlocks({ fontSize: (selectedBlock?.fontSize || 1) + 0.1 })}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Color Picker Quick Toggle */}
                <div className="flex items-center gap-1 px-2 border-r border-white/5">
                  <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors relative group">
                    <Palette className="w-3.5 h-3.5" style={{ color: selectedBlock?.color || accentColor }} />
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 p-2 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl hidden group-hover:grid grid-cols-4 gap-1 w-32">
                      {['#ffffff', '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#000000'].map(c => (
                        <button 
                          key={c} 
                          onClick={() => updateSelectedBlocks({ color: c })}
                          className="w-6 h-6 rounded-md border border-white/10" 
                          style={{ backgroundColor: c }} 
                        />
                      ))}
                    </div>
                  </button>
                </div>

                {/* Alignment Controls */}
                <div className="flex items-center gap-1 px-2">
                  <button 
                    onClick={() => updateSelectedBlocks({ align: 'left' })}
                    className={`p-1.5 rounded-lg transition-colors ${selectedBlock?.align === 'left' ? 'bg-primary text-white' : 'hover:bg-white/10'}`}
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => updateSelectedBlocks({ align: 'center' })}
                    className={`p-1.5 rounded-lg transition-colors ${selectedBlock?.align === 'center' ? 'bg-primary text-white' : 'hover:bg-white/10'}`}
                  >
                    <AlignCenter className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => updateSelectedBlocks({ align: 'right' })}
                    className={`p-1.5 rounded-lg transition-colors ${selectedBlock?.align === 'right' ? 'bg-primary text-white' : 'hover:bg-white/10'}`}
                  >
                    <AlignRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Grouping Actions */}
                <div className="flex items-center gap-1 px-2 border-l border-white/5">
                  {selectedBlockIds.length >= 2 && !selectedBlocks.every(b => b.groupId && b.groupId === selectedBlocks[0].groupId) && (
                    <button 
                      onClick={groupSelectedBlocks}
                      className="p-1.5 hover:bg-white/10 text-white/40 hover:text-white rounded-lg transition-colors flex items-center gap-1.5"
                      title="Nhóm lại (Group)"
                    >
                      <Layout className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold">Group</span>
                    </button>
                  )}
                  {selectedBlocks.some(b => b.groupId) && (
                    <button 
                      onClick={ungroupSelectedBlocks}
                      className="p-1.5 hover:bg-white/10 text-white/40 hover:text-white rounded-lg transition-colors flex items-center gap-1.5"
                      title="Rã nhóm (Ungroup)"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold">Ungroup</span>
                    </button>
                  )}
                </div>

                {/* Delete Quick Action */}
                <div className="flex items-center gap-1 px-2 ml-1 border-l border-white/5">
                  <button 
                    onClick={removeSelectedBlocks}
                    className="p-1.5 hover:bg-red-500/20 text-white/40 hover:text-red-500 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {selectedBlockIds.length > 1 && (
                  <div className="px-3 border-l border-white/5 flex items-center">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{selectedBlockIds.length} items</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex-1 relative w-full flex items-center justify-center p-12 canvas-area">
            <div className="absolute bottom-6 right-6 z-20">
              <button
                onClick={() => {
                  const modes = ['off', 'white', 'black', 'accent'] as const;
                  setGridMode(modes[(modes.indexOf(gridMode) + 1) % modes.length]);
                }}
                className={`p-2.5 rounded-xl transition-all shadow-2xl backdrop-blur-xl border ${gridMode !== 'off' ? 'bg-primary border-primary text-white scale-110' : 'bg-zinc-900/80 border-white/10 text-white/40 hover:text-white hover:bg-zinc-800'}`}
                title={`Grid: ${gridMode}`}
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>

            <motion.div 
              ref={slideRef}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className={`relative shadow-[0_50px_120px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col transition-all duration-700 rounded-[2.5rem] border border-white/5 ${
                fontFamily === 'serif' ? 'font-serif' : fontFamily === 'display' ? 'font-display' : 'font-sans'
              } ${
                platform === 'tiktok' ? 'aspect-[9/16] h-full max-h-[85vh]' : 
                platform === 'instagram' ? 'aspect-[4/5] h-full max-h-[80vh]' : 
                platform === 'facebook' ? 'aspect-square h-full max-h-[75vh]' :
                platform === 'landscape' ? 'aspect-video h-full max-h-[60vh]' :
                'aspect-square h-full max-h-[75vh]'
              }`}
            >

              {/* Background */}
              <div className="absolute inset-0 z-0" style={{ background: `linear-gradient(135deg, #09090b 0%, ${accentColor}33 100%)` }} />

              {/* Platform Overlays (Safe Zones) */}
              <AnimatePresence>
                {showSafeZone && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-[50] pointer-events-none select-none"
                  >
                    {platform === 'tiktok' && (
                      <div className="absolute inset-0 flex flex-col text-white">

                        {/* ── TOP: search bar + slide counter ── */}
                        <div className="flex-none pt-9 px-3 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <ChevronLeft className="w-6 h-6 drop-shadow shrink-0" />
                            <div className="flex-1 h-8 bg-black/30 backdrop-blur-md rounded-full flex items-center px-3 gap-1.5 border border-white/10">
                              <Search className="w-3 h-3 text-white/50" />
                              <span className="text-[11px] text-white/30 flex-1">Find related content</span>
                              <span className="text-[11px] font-bold border-l border-white/10 pl-2">Search</span>
                            </div>
                          </div>
                          <div className="flex justify-end pr-1">
                            <span className="bg-black/30 px-2 py-0.5 rounded text-[9px] font-bold text-white/70 tracking-widest uppercase">
                              TEMPLATE
                            </span>
                          </div>
                        </div>

                        {/* ── MIDDLE spacer — right sidebar anchored to bottom-0 ── */}
                        <div className="flex-1 relative min-h-0">
                          <div
                            className="absolute right-2 bottom-0 flex flex-col items-center gap-3 pb-3 pointer-events-auto cursor-grab active:cursor-grabbing"
                            style={{ transform: `translate(${sidebarOffset.x}px, ${sidebarOffset.y}px)` }}
                            onPointerDown={(e) => startDrag(e, (dx, dy) => setSidebarOffset(p => ({ x: p.x + dx, y: p.y + dy })))}
                          >
                            {/* Drag handle pill */}
                            <div className="flex gap-[3px] mb-1 opacity-30 hover:opacity-70 transition-opacity">
                              <div className="w-[3px] h-3 bg-white rounded-full" />
                              <div className="w-[3px] h-3 bg-white rounded-full" />
                              <div className="w-[3px] h-3 bg-white rounded-full" />
                            </div>
                            {/* Author avatar removed */}
                            {/* Like */}
                            <div className="flex flex-col items-center gap-0.5 mt-1">
                              <Heart className="w-7 h-7 fill-white text-white drop-shadow-lg" />
                              <span className="text-[10px] font-bold drop-shadow">125.3K</span>
                            </div>
                            {/* Comment */}
                            <div className="flex flex-col items-center gap-0.5">
                              <MessageCircle className="w-7 h-7 fill-white text-white drop-shadow-lg" />
                              <span className="text-[10px] font-bold drop-shadow">1,234</span>
                            </div>
                            {/* Bookmark */}
                            <div className="flex flex-col items-center gap-0.5">
                              <Bookmark className="w-7 h-7 fill-yellow-400 text-yellow-400 drop-shadow-lg" />
                              <span className="text-[10px] font-bold drop-shadow">8,901</span>
                            </div>
                            {/* Share */}
                            <div className="flex flex-col items-center gap-0.5">
                              <Share2 className="w-7 h-7 fill-white text-white drop-shadow-lg" />
                              <span className="text-[10px] font-bold drop-shadow">2,456</span>
                            </div>
                            {/* Spinning vinyl disc */}
                            <div className="w-9 h-9 rounded-full border-[3px] border-zinc-600/80 animate-spin-slow overflow-hidden bg-zinc-800 flex items-center justify-center mt-1">
                              <div className="w-3.5 h-3.5 rounded-full bg-zinc-900" />
                            </div>
                          </div>
                        </div>

                        {/* ── BOTTOM INFO: username, caption, music ── */}
                        <div
                          className="flex-none px-3 pr-[18%] pb-2 space-y-1 bg-gradient-to-t from-black/50 via-black/20 to-transparent pt-2 pointer-events-auto cursor-grab active:cursor-grabbing"
                          style={{ transform: `translateY(${bottomInfoOffset.y}px)` }}
                          onPointerDown={(e) => startDrag(e, (_, dy) => setBottomInfoOffset(p => ({ x: 0, y: p.y + dy })))}
                        >
                          {/* Drag handle — centered pill */}
                          <div className="flex justify-center mb-1">
                            <div className="w-8 h-1 bg-white/25 hover:bg-white/50 transition-colors rounded-full" />
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[13px] font-bold drop-shadow">{authorName || 'Kỹ Sư 4.0'}</span>
                            <span className="bg-zinc-800/80 px-1.5 py-0.5 rounded text-[8px] text-white/80 font-black">Photo</span>
                            <span className="text-white/40 text-[10px]">· 2-26</span>
                          </div>
                          <div className="text-[11.5px] leading-[1.35] line-clamp-2 font-medium text-white/90 drop-shadow">
                            <span className="font-bold">{title}</span>
                            {overview ? `. ${overview.substring(0, 60)}...` : '. Khám phá tri thức cùng Kỹ Sư 4.0'}
                          </div>
                          <div className="text-[10px] font-semibold text-white/40">See translation</div>
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <Music className="w-3 h-3 text-white/70 shrink-0" />
                            <span className="text-[10px] text-white/60 truncate">Original sound – {authorName || 'Kỹ Sư 4.0'}</span>
                          </div>
                        </div>

                        {/* ── BOTTOM NAV BAR ── */}
                        <div className="flex-none h-12 bg-black/80 backdrop-blur-md border-t border-white/5 flex items-center justify-around px-3">
                          {/* Home — active */}
                          <div className="flex flex-col items-center gap-0.5">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
                            <span className="text-[8px] font-bold">Home</span>
                          </div>
                          {/* Friends */}
                          <div className="flex flex-col items-center gap-0.5 opacity-40">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                            <span className="text-[8px]">Friends</span>
                          </div>
                          {/* Create */}
                          <div className="relative w-10 h-7 shrink-0">
                            <div className="absolute inset-0 bg-[#69c9d0] rounded-[6px] translate-x-[3px]" />
                            <div className="absolute inset-0 bg-[#ee1d52] rounded-[6px] -translate-x-[3px]" />
                            <div className="absolute inset-0 bg-white rounded-[5px] flex items-center justify-center">
                              <span className="text-zinc-900 font-black text-lg leading-none">+</span>
                            </div>
                          </div>
                          {/* Inbox */}
                          <div className="flex flex-col items-center gap-0.5 opacity-40">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
                            <span className="text-[8px]">Inbox</span>
                          </div>
                          {/* Profile */}
                          <div className="flex flex-col items-center gap-0.5 opacity-40">
                            <div className="w-5 h-5 rounded-full overflow-hidden bg-zinc-700">
                              <img src={authorImage || "https://api.dicebear.com/7.x/avataaars/svg?seed=KS40"} alt="" className="w-full h-full object-cover" />
                            </div>
                            <span className="text-[8px]">Profile</span>
                          </div>
                        </div>

                      </div>
                    )}

                    {platform === 'instagram' && (
                      <div className="absolute inset-0 flex flex-col justify-between">
                        <div className="p-4 flex items-center justify-between pt-8 bg-gradient-to-b from-black/40 to-transparent">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-purple-600 p-[1.5px]">
                              <div className="w-full h-full rounded-full border-2 border-black bg-zinc-800" />
                            </div>
                            <span className="text-white text-[13px] font-bold">ks40_trithuc</span>
                          </div>
                        </div>
                        <div className="p-4 pb-12 bg-gradient-to-t from-black/60 to-transparent">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <Heart className="w-6 h-6 text-white" />
                              <MessageCircle className="w-6 h-6 text-white" />
                              <Share2 className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-white text-[13px] font-bold">12,450 likes</div>
                            <div className="text-white text-[13px]"><span className="font-bold mr-2">ks40_trithuc</span>Cùng tối ưu hóa nội dung SNS với KS40 Studio...</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Design Grid (Dense Math Grid perfectly centered) */}
              <AnimatePresence>
                {gridMode !== 'off' && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
                  >
                    {(() => {
                      const hexToRgba = (hex: string, alpha: number) => {
                        const h = hex.replace('#', '');
                        const r = parseInt(h.substring(0, 2), 16) || 0;
                        const g = parseInt(h.substring(2, 4), 16) || 0;
                        const b = parseInt(h.substring(4, 6), 16) || 0;
                        return `rgba(${r},${g},${b},${alpha})`;
                      };
                      const smallColor = gridMode === 'white' ? 'rgba(255,255,255,0.05)' : gridMode === 'black' ? 'rgba(0,0,0,0.05)' : hexToRgba(accentColor, 0.1);
                      const largeColor = gridMode === 'white' ? 'rgba(255,255,255,0.1)' : gridMode === 'black' ? 'rgba(0,0,0,0.1)' : hexToRgba(accentColor, 0.2);
                      
                      return (
                        <>
                          <div 
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[2000px] h-[2000px] bg-center bg-[size:20px_20px]" 
                            style={{ backgroundImage: `linear-gradient(${smallColor} 1px, transparent 1px), linear-gradient(90deg, ${smallColor} 1px, transparent 1px)` }}
                          />
                          <div 
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[2000px] h-[2000px] bg-center bg-[size:100px_100px]" 
                            style={{ backgroundImage: `linear-gradient(${largeColor} 1px, transparent 1px), linear-gradient(90deg, ${largeColor} 1px, transparent 1px)` }}
                          />
                        </>
                      );
                    })()}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Smart Guides (Visible during drag when near origin) */}
              <AnimatePresence>
                {activeDragId && (
                  <>
                    {/* Vertical Guide (x ≈ 0) */}
                    {Math.abs(blockOffsets[activeDragId]?.x || 0) < 10 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-full bg-red-500/80 z-[60] shadow-[0_0_8px_rgba(239,68,68,0.8)] pointer-events-none" />
                    )}
                    {/* Horizontal Guide (y ≈ 0) */}
                    {Math.abs(blockOffsets[activeDragId]?.y || 0) < 10 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute top-1/2 -translate-y-1/2 left-0 w-full h-[1px] bg-red-500/80 z-[60] shadow-[0_0_8px_rgba(239,68,68,0.8)] pointer-events-none" />
                    )}
                  </>
                )}
              </AnimatePresence>

              {/* Content */}
              <div 
                className="flex-1 flex flex-col min-h-0 relative z-10 pt-32 px-8 sm:px-10"
                onPointerDown={() => setSelectedBlockId(null)}
              >
                <div 
                  className={`flex flex-col flex-1 !items-start ${layout === 'split' ? 'justify-end pb-32' : 'justify-start'} gap-6 canvas-area`}
                  onPointerDown={() => setSelectedBlockIds([])}
                >
                  {currentBlocks.map((block) => {
                    const offset = blockOffsets[block.id] ?? { x: 0, y: 0 };
                    const size = blockSizes[block.id] ?? {};
                    const isSelected = selectedBlockIds.includes(block.id);
                    
                    return (
                      <motion.div
                        key={block.id}
                        ref={el => { blockRefs.current[block.id] = el; }}
                        drag={!isResizing}
                        dragMomentum={false}
                        style={{ 
                          x: offset.x, 
                          y: 0, // Force Y transform to 0 so marginTop handles the layout
                          marginTop: offset.y,
                          width: size.width ?? 'fit-content',
                          minWidth: size.width ? undefined : '100%',
                          height: size.height ?? 'auto',
                          transformOrigin: 'top left',
                          marginRight: 'auto',
                          marginLeft: 0,
                          alignSelf: 'flex-start',
                          flexShrink: 0,
                          flexGrow: 0,
                          display: 'flex'
                        }}
                        onDragStart={() => {
                          setActiveDragId(block.id);
                          // Ensure whole group is selected if dragging a group member
                          if (block.groupId && !selectedBlockIds.includes(block.id)) {
                            const groupMemberIds = currentBlocks.filter(b => b.groupId === block.groupId).map(b => b.id);
                            setSelectedBlockIds(groupMemberIds);
                          }
                        }}
                        onDragEnd={() => setActiveDragId(null)}
                        onDrag={(e, info) => {
                          const delta = { x: info.delta.x, y: info.delta.y };
                          const idsToMove = selectedBlockIds.includes(block.id) ? selectedBlockIds : [block.id];
                          
                          setBlockOffsets(prev => {
                            const next = { ...prev };
                            idsToMove.forEach(id => {
                              next[id] = {
                                x: (prev[id]?.x || 0) + delta.x,
                                y: (prev[id]?.y || 0) + delta.y
                              };
                            });
                            return next;
                          });
                        }}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          if (e.shiftKey) {
                            setSelectedBlockIds(prev => prev.includes(block.id) ? prev.filter(id => id !== block.id) : [...prev, block.id]);
                          } else {
                            if (block.groupId) {
                              const groupMemberIds = currentBlocks.filter(b => b.groupId === block.groupId).map(b => b.id);
                              setSelectedBlockIds(groupMemberIds);
                            } else {
                              setSelectedBlockIds([block.id]);
                            }
                          }
                          setEditingBlockId(null);
                        }}
                        className={`relative flex flex-col cursor-grab active:cursor-grabbing group/block touch-none ${block.align === 'center' ? 'items-center text-center' : block.align === 'right' ? 'items-end text-right' : 'items-start text-left'} ${isSelected ? 'ring-2 ring-primary rounded-2xl bg-primary/5' : ''}`}
                      >
                        {/* Resize Handles */}
                        {isSelected && (
                          <>
                            {/* Bottom Right Handle */}
                            <div 
                              className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary border-2 border-zinc-900 rounded-full z-50 cursor-nwse-resize shadow-lg hover:scale-125 transition-transform"
                              onPointerDown={(e) => handleResize(e, block.id, 'br')}
                            />
                            {/* Right Edge Handle */}
                            <div 
                              className="absolute top-1/2 -right-1 -translate-y-1/2 w-1.5 h-8 bg-primary/50 hover:bg-primary rounded-full z-50 cursor-ew-resize transition-all"
                              onPointerDown={(e) => handleResize(e, block.id, 'r')}
                            />
                            {/* Bottom Edge Handle */}
                            <div 
                              className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1.5 bg-primary/50 hover:bg-primary rounded-full z-50 cursor-ns-resize transition-all"
                              onPointerDown={(e) => handleResize(e, block.id, 'b')}
                            />
                          </>
                        )}
                        {block.type === 'title' && (
                          <h3 
                            className={`font-black leading-[1.15] tracking-tight break-words w-full outline-none transition-colors ${editingBlockId === block.id ? 'bg-white/10 rounded-xl px-2 shadow-[0_0_0_2px_rgba(255,255,255,0.2)]' : 'hover:bg-white/5 rounded-xl px-2'} text-5xl sm:text-7xl`} 
                            style={{ color: block.color || 'white', zoom: block.fontSize || 1 }}
                            contentEditable={editingBlockId === block.id}
                            suppressContentEditableWarning={true}
                            onBlur={(e) => {
                              setEditingBlockId(null);
                              updateBlock(block.id, { content: e.currentTarget.innerText });
                            }}
                            onDoubleClick={(e) => { 
                              setEditingBlockId(block.id); 
                              setTimeout(() => { e.currentTarget.focus(); document.execCommand('selectAll', false, null); }, 10);
                            }}
                            onPointerDown={(e) => {
                              if (editingBlockId === block.id) {
                                e.stopPropagation();
                              }
                            }}
                          >
                            <span className="opacity-40 italic">{block.name.toUpperCase() || 'TITLE'}</span>
                          </h3>
                        )}
                        {block.type === 'text' && (
                          <p 
                            className={`leading-[1.5] w-full outline-none transition-colors ${editingBlockId === block.id ? 'bg-white/10 rounded-xl px-2 py-1 shadow-[0_0_0_2px_rgba(255,255,255,0.2)]' : 'hover:bg-white/5 rounded-xl px-2 py-1'} text-xl sm:text-2xl font-light`}
                            style={{ color: block.color || '#f4f4f5', zoom: block.fontSize || 1 }}
                            contentEditable={editingBlockId === block.id}
                            suppressContentEditableWarning={true}
                            onBlur={(e) => {
                              setEditingBlockId(null);
                              updateBlock(block.id, { content: e.currentTarget.innerText });
                            }}
                            onDoubleClick={(e) => { 
                              setEditingBlockId(block.id); 
                              setTimeout(() => { e.currentTarget.focus(); document.execCommand('selectAll', false, null); }, 10);
                            }}
                            onPointerDown={(e) => {
                              if (editingBlockId === block.id) {
                                e.stopPropagation();
                              }
                            }}
                          >
                            <span className="opacity-40">AI content: {block.name || 'content'}</span>
                          </p>
                        )}
                        {block.type === 'quote' && (
                          <div className={`py-4 border-l-4 pl-6 w-full ${block.align === 'center' ? 'border-l-0 border-t-4 pt-4 pl-0' : block.align === 'right' ? 'border-l-0 border-r-4 pr-6 pl-0' : ''}`} style={{ borderColor: accentColor }}>
                            <p 
                              className={`text-2xl sm:text-4xl font-serif italic outline-none transition-colors ${editingBlockId === block.id ? 'bg-white/10 rounded-xl px-2 -mx-2 shadow-[0_0_0_2px_rgba(255,255,255,0.2)]' : 'hover:bg-white/5 rounded-xl px-2 -mx-2'}`}
                              style={{ color: block.color || 'rgba(255,255,255,0.9)', zoom: block.fontSize || 1 }}
                              contentEditable={editingBlockId === block.id}
                              suppressContentEditableWarning={true}
                              onBlur={(e) => {
                                setEditingBlockId(null);
                                updateBlock(block.id, { content: e.currentTarget.innerText });
                              }}
                              onDoubleClick={(e) => { 
                                setEditingBlockId(block.id); 
                                setTimeout(() => { e.currentTarget.focus(); document.execCommand('selectAll', false, null); }, 10);
                              }}
                              onPointerDown={(e) => {
                                if (editingBlockId === block.id) {
                                  e.stopPropagation();
                                }
                              }}
                            >
                              Quote: {block.name || 'quote'}
                            </p>
                          </div>
                        )}
                        {block.type === 'list' && (
                          <div className="w-full space-y-3" style={{ zoom: block.fontSize || 1 }}>
                            <div className="space-y-4">
                              {[1, 2, 3].map(i => (
                                <div key={i} className="flex items-start gap-4">
                                  <div className="mt-2.5 w-2 h-2 rounded-full shrink-0 shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ backgroundColor: accentColor }} />
                                  <span className="text-xl sm:text-2xl text-white/90 leading-[1.4] font-light">
                                    Mục nội dung mẫu {i} (Dữ liệu từ: {block.name || 'danh sách'})
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {block.type === 'logo' && (
                          <div className={`w-full flex flex-col ${block.align === 'center' ? 'items-center text-center' : block.align === 'right' ? 'items-end text-right' : 'items-start text-left'}`} style={{ zoom: block.fontSize || 1 }}>
                            <div className={`inline-flex flex-col ${block.align === 'center' ? 'items-center' : block.align === 'right' ? 'items-end' : 'items-start'} transition-colors ${editingBlockId === block.id ? 'bg-white/10 rounded-2xl p-4 -m-4 shadow-[0_0_0_2px_rgba(255,255,255,0.2)]' : 'hover:bg-white/5 rounded-2xl p-4 -m-4'}`}>
                              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black shadow-lg mb-3" style={{ backgroundColor: accentColor, color: '#fff' }}>
                                {(block.content || 'B')[0].toUpperCase()}
                              </div>
                              <p 
                                className="text-sm sm:text-base font-bold tracking-[0.2em] uppercase outline-none"
                                style={{ color: block.color || 'rgba(255,255,255,0.9)' }}
                                contentEditable={editingBlockId === block.id}
                                suppressContentEditableWarning={true}
                                onBlur={(e) => {
                                  setEditingBlockId(null);
                                  updateBlock(block.id, { content: e.currentTarget.innerText });
                                }}
                                onDoubleClick={(e) => { 
                                  setEditingBlockId(block.id); 
                                  setTimeout(() => { e.currentTarget.focus(); document.execCommand('selectAll', false, null); }, 10);
                                }}
                                onPointerDown={(e) => {
                                  if (editingBlockId === block.id) {
                                    e.stopPropagation();
                                  }
                                }}
                              >
                                {block.content || 'BRAND LOGO'}
                              </p>
                            </div>
                          </div>
                        )}

                        {block.type === 'image' && <div className="w-full h-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-white/5 flex items-center justify-center"><ImageIcon className="w-12 h-12 text-white/20" /></div>}
                      </div>
                    </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>

        {/* Bottom Slide Navigator */}
        <div className="h-20 bg-zinc-900/40 backdrop-blur-3xl border-t border-white/5 flex items-center px-3 gap-3 overflow-x-auto custom-scrollbar z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.3)]">
            {slides.map((slide, index) => (
              <div key={slide.id} className="flex flex-col gap-1.5 min-w-[80px]">
                <div 
                  onClick={() => setCurrentSlideId(slide.id)}
                  className={`group relative flex-none w-20 aspect-video rounded-md border transition-all cursor-pointer overflow-hidden ${currentSlideId === slide.id ? 'border-primary shadow-[0_0_8px_rgba(59,130,246,0.3)]' : 'border-white/5 hover:border-white/10'}`}
                >
                  <div className="absolute inset-0 bg-black/10 flex items-center justify-center group-hover:bg-black/5 transition-colors">
                    <span className={`text-[8px] font-black transition-colors ${currentSlideId === slide.id ? 'text-primary' : 'text-white/10 group-hover:text-white/30'}`}>{index + 1}</span>
                  </div>
                  
                  {/* Dynamic Mini Preview Map */}
                  <div className="absolute inset-1.5 flex flex-col gap-0.5 pointer-events-none">
                    {slide.blocks.slice(0, 5).map((block) => (
                      <div 
                        key={block.id}
                        className={`rounded-full transition-colors ${block.type === 'logo' ? 'opacity-40' : 'bg-white/10 group-hover:bg-white/20'}`}
                        style={{ 
                          height: block.type === 'title' ? '2px' : '1px',
                          width: block.type === 'title' ? '60%' : block.type === 'logo' ? '15%' : '40%',
                          backgroundColor: block.type === 'logo' ? accentColor : undefined,
                          alignSelf: block.align === 'center' ? 'center' : block.align === 'right' ? 'flex-end' : 'flex-start'
                        }}
                      />
                    ))}
                  </div>

                  {/* Delete button */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteSlide(slide.id); }}
                    className="absolute top-0 right-0 w-3.5 h-3.5 bg-black/60 text-white/20 hover:bg-red-500 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10"
                  >
                    <X className="w-2 h-2" />
                  </button>
                </div>
                <span className={`text-[7px] font-medium truncate text-center transition-colors ${currentSlideId === slide.id ? 'text-primary' : 'text-white/30'}`}>
                  {slide.name || `Slide ${index + 1}`}
                </span>
              </div>
            ))}
            <button 
              onClick={addSlide}
              className="flex-none w-8 h-8 rounded-md bg-white/5 hover:bg-white/10 border border-dashed border-white/10 flex items-center justify-center text-white/20 hover:text-white transition-all group"
            >
              <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </button>
          </div>

        {/* Right Sidebar: Visual Design */}
        <div className="w-80 bg-zinc-900/40 backdrop-blur-3xl border-l border-white/5 flex flex-col overflow-y-auto custom-scrollbar p-6 space-y-8">
          
          {/* Slide Metadata Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Presentation className="w-4 h-4" />
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Thông tin Slide</h4>
            </div>
            
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] text-white/40 uppercase font-bold px-1">Tên Frame / Mục đích</label>
                <input 
                  type="text"
                  value={currentSlide.name || ''}
                  onChange={(e) => updateSlideMetadata(currentSlideId, { name: e.target.value })}
                  placeholder="Ví dụ: Trang Bìa, Giải thích..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors placeholder:text-white/10"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-white/40 uppercase font-bold px-1">Hướng dẫn cho AI</label>
                <textarea 
                  value={currentSlide.description || ''}
                  onChange={(e) => updateSlideMetadata(currentSlideId, { description: e.target.value })}
                  placeholder="Ví dụ: Chỉ đưa tối đa 3 ý chính, tập trung vào con số..."
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors placeholder:text-white/10 resize-none"
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-white/5" />
          
          {/* Canvas Setup Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Maximize className="w-4 h-4" />
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Kích thước Slide</h4>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'tiktok', label: '9:16', icon: <Smartphone className="w-4 h-4" />, sub: 'Story' },
                { id: 'instagram', label: '4:5', icon: <RectangleVertical className="w-4 h-4" />, sub: 'Portrait' },
                { id: 'facebook', label: '1:1', icon: <Square className="w-4 h-4" />, sub: 'Square' },
                { id: 'landscape', label: '16:9', icon: <RectangleHorizontal className="w-4 h-4" />, sub: 'HD' }
              ].map(p => (
                <button 
                  key={p.id}
                  onClick={() => setPlatform(p.id as any)}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all gap-1.5 ${platform === p.id ? 'bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'}`}
                >
                  {p.icon}
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black">{p.label}</span>
                    <span className="text-[7px] uppercase font-bold opacity-40">{p.sub}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>


          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Visual Design</h4>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(59,130,246,0.3)]">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-wider">Blueprint</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-7 flex flex-col gap-8 custom-scrollbar">
            {/* Global Design */}
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Global Design</span>
                <div className="flex gap-1.5">
                  {['#3b82f6', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6'].map(color => (
                    <button key={color} onClick={() => setAccentColor(color)} className={`w-4 h-4 rounded-full transition-all ${accentColor === color ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-zinc-900' : 'opacity-40'}`} style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <ImageIcon className="w-4 h-4 text-white/20" />
                <input type="range" min="0.2" max="0.9" step="0.05" value={overlayOpacity} onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))} className="flex-1 h-1.5 accent-primary bg-white/5 rounded-full appearance-none cursor-pointer" />
              </div>
            </div>
            {/* Safe Zone Toggle */}
            <div className="space-y-2">
              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Safe Zone Overlay</span>
              <button
                onClick={() => setShowSafeZone(!showSafeZone)}
                className={`w-full h-12 rounded-[1.2rem] flex items-center justify-between px-5 transition-all ${showSafeZone ? 'bg-primary/10 border border-primary/20 text-primary' : 'bg-white/5 border border-white/5 text-white/40'}`}
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase">Guide Overlays</span>
                </div>
                <div className={`w-8 h-4 rounded-full relative transition-all ${showSafeZone ? 'bg-primary' : 'bg-white/10'}`}>
                  <div className={`absolute top-1 w-2 h-2 rounded-full bg-white transition-all ${showSafeZone ? 'right-1' : 'left-1'}`} />
                </div>
              </button>
              {showSafeZone && (sidebarOffset.x !== 0 || sidebarOffset.y !== 0 || bottomInfoOffset.y !== 0) && (
                <button
                  onClick={() => { setSidebarOffset({ x: 0, y: 0 }); setBottomInfoOffset({ x: 0, y: 0 }); }}
                  className="w-full text-[9px] font-black text-white/30 hover:text-white/60 uppercase tracking-widest py-1 transition-colors"
                >
                  Reset Positions
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
