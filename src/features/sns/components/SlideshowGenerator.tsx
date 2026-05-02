'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, ChevronLeft, ChevronRight, Presentation, Sparkles, Image as ImageIcon, Save, Trash2, Library, GripVertical, Hash, List, Heart, MessageCircle, Share2, Music, ShieldCheck, Bookmark, Search, Grid, Layout } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { toPng } from 'html-to-image';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
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
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for prev, 1 for next
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [overlayOpacity, setOverlayOpacity] = useState(0.6);
  const [accentColor, setAccentColor] = useState('#3b82f6'); // Default Blue
  const [layout, setLayout] = useState<'center' | 'left' | 'split'>('center');
  const [fontFamily, setFontFamily] = useState<'sans' | 'serif' | 'display'>('display');
  const [platform, setPlatform] = useState<'tiktok' | 'instagram' | 'square'>('tiktok');
  const [device, setDevice] = useState<'none' | 'iphone14' | 'iphone13'>('none');
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
  const [savedTemplates, setSavedTemplates] = useState<any[]>([]);
  const [activeBlocks, setActiveBlocks] = useState<SlideBlock[]>([
    { id: '1', type: 'title', name: 'title', description: '', align: 'center', content: '' },
    { id: '2', type: 'text', name: 'content', description: '', align: 'left', content: '' }
  ]);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const slideRef = useRef<HTMLDivElement>(null);

  // Advanced logic to extract detailed sections from markdown
  const slides = useMemo(() => {
    const res: SlideData[] = [];
    
    // Fallback backgrounds if article has no images
    const fallbackImages = [
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1080',
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=1080',
      'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=1080',
      'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=1080',
    ];

    // Extract images: ![alt](url)
    const imageRegex = /!\[.*?\]\((.*?)\)/g;
    const images: string[] = [];
    let match;
    while ((match = imageRegex.exec(content)) !== null) {
      images.push(match[1]);
    }

    // Slide 1: Cover
    res.push({
      title: title,
      content: authorName,
      type: 'cover',
      image: images[0] || fallbackImages[0]
    });

    // Slide 2: Context / Overview
    if (overview) {
      res.push({
        title: 'Bối cảnh & Mục tiêu',
        content: overview.length > 300 ? overview.substring(0, 280) + '...' : overview,
        type: 'content',
        image: images[1] || fallbackImages[1]
      });
    }

    // Extract Sections (H2 + following paragraph)
    const sections = content.split(/\n(?=## )/);
    let slideCount = 0;

    sections.forEach((section) => {
      if (slideCount >= 5) return; // Limit to 5 detail slides

      const lines = section.trim().split('\n');
      if (lines.length < 2) return;

      const sectionTitle = lines[0].replace(/^##\s+/, '').trim();
      const sectionContent = lines.slice(1)
        .find(l => l.trim() && !l.startsWith('!') && !l.startsWith('#') && !l.startsWith('>'))
        ?.trim();

      if (sectionTitle && sectionContent && sectionTitle !== title) {
        res.push({
          title: sectionTitle,
          content: sectionContent.length > 250 ? sectionContent.substring(0, 240) + '...' : sectionContent,
          type: 'content',
          image: images[slideCount + 2] || fallbackImages[(slideCount + 2) % fallbackImages.length]
        });
        slideCount++;
      }
    });

    // Final Slide: CTA
    res.push({
      title: 'Học tập sâu hơn',
      content: 'Truy cập KS40 để khám phá trọn vẹn lộ trình tri thức này.',
      type: 'cta',
      image: fallbackImages[3]
    });

    return res;
  }, [title, overview, content, authorName]);

  const [editableSlides, setEditableSlides] = useState<SlideData[]>([]);

  useEffect(() => {
    if (slides.length > 0 && editableSlides.length === 0) {
      setEditableSlides(slides);
    }
  }, [slides, editableSlides.length]);

  const updateSlideContent = (index: number, field: 'title' | 'content', value: string) => {
    const newSlides = [...editableSlides];
    newSlides[index] = { ...newSlides[index], [field]: value };
    setEditableSlides(newSlides);
  };

  const currentSlideData = editableSlides[currentSlide] || slides[currentSlide];

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
    }),
  };

  const paginate = (newDirection: number) => {
    const newPage = currentSlide + newDirection;
    if (newPage >= 0 && newPage < slides.length) {
      setDirection(newDirection);
      setCurrentSlide(newPage);
    }
  };


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
        blocks: activeBlocks,
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
      setActiveBlocks(template.blocks);
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
      name: type === 'list' ? 'highlights' : type === 'logo' ? 'brand_logo' : type + '_' + (activeBlocks.length + 1),
      description: type === 'list' ? 'Danh sách điểm nổi bật' : '',
      align: type === 'title' || type === 'logo' ? 'center' : 'left',
      content: type === 'list' ? '- Mục tiêu chính 1\n- Lợi ích cốt lõi 2\n- Kết quả kỳ vọng 3' : type === 'logo' ? (authorName || 'YOUR BRAND') : ''
    };
    setActiveBlocks([...activeBlocks, newBlock]);
    toast.success(`Đã thêm khối ${type.toUpperCase()}`);
  };

  const removeBlock = (id: string) => {
    setActiveBlocks(activeBlocks.filter(b => b.id !== id));
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  const updateBlock = (id: string, updates: Partial<SlideBlock>) => {
    setActiveBlocks(activeBlocks.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Prevent deleting if the user is typing in an input or contentEditable
        const activeTag = document.activeElement?.tagName;
        const isEditing = 
          activeTag === 'INPUT' || 
          activeTag === 'TEXTAREA' || 
          document.activeElement?.getAttribute('contenteditable') === 'true' ||
          editingBlockId !== null;

        if (!isEditing && selectedBlockId) {
          removeBlock(selectedBlockId);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBlockId, activeBlocks, editingBlockId]);

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

  const handleDownload = async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    setGenerationProgress(0);
    const zip = new JSZip();
    const originalSlide = currentSlide;
    const originalSafeZone = showSafeZone;
    setShowSafeZone(false);

    try {
      // Iterate through all slides and capture them
      for (let i = 0; i < editableSlides.length; i++) {
        setGenerationProgress(Math.round(((i + 1) / editableSlides.length) * 100));
        setCurrentSlide(i);
        
        // Wait for state update and animation to settle
        await new Promise(resolve => setTimeout(resolve, 800));

        if (slideRef.current) {
          const dataUrl = await toPng(slideRef.current, {
            pixelRatio: 2,
            quality: 1,
            cacheBust: true,
          });
          
          const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
          zip.file(`ks40-slide-${i + 1}.png`, base64Data, { base64: true });
        }
      }

      const contentZip = await zip.generateAsync({ type: "blob" });
      saveAs(contentZip, `ks40-slideshow-${title.substring(0, 20)}.zip`);
      
      // Return to the original slide
      setCurrentSlide(originalSlide);
    } catch (error) {
      console.error('Lỗi khi tạo ảnh:', error);
      alert('Có lỗi xảy ra khi tạo bộ ảnh. Vui lòng thử lại.');
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
      setShowSafeZone(originalSafeZone);
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
          <h2 className="font-black text-xs uppercase tracking-tighter leading-none">Studio</h2>
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

          {/* Saved Frames / Templates Section */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Saved Frames</h4>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3">
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  placeholder="Tên khung mới..." 
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="flex-1 bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary/50 transition-colors placeholder:text-white/20"
                />
                <button 
                  onClick={handleSaveTemplate} 
                  disabled={isSavingTemplate || !templateName.trim()} 
                  className="h-8 px-3 bg-primary/20 text-primary hover:bg-primary hover:text-white rounded-lg flex items-center justify-center text-xs font-bold whitespace-nowrap transition-colors disabled:opacity-50 disabled:hover:bg-primary/20 disabled:hover:text-primary"
                >
                  Lưu Khung
                </button>
              </div>
              
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                {savedTemplates.length > 0 ? (
                  savedTemplates.map(t => (
                    <div key={t.id} onClick={() => applyTemplate(t)} className="group flex items-center justify-between p-2.5 bg-black/20 hover:bg-white/10 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-white/10">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Layout className="w-3.5 h-3.5 text-white/40 shrink-0 group-hover:text-primary transition-colors" />
                        <span className="text-xs text-white/80 truncate font-medium group-hover:text-white transition-colors">{t.name}</span>
                      </div>
                      <button onClick={(e) => handleDeleteTemplate(t.id, e)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-500 transition-colors p-1" title="Xoá khung này">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-[11px] text-white/30 italic">
                    Chưa có khung nào được lưu
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Blueprint Structure Section */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Active Blueprint</h4>

            <Reorder.Group axis="y" values={activeBlocks} onReorder={setActiveBlocks} className="space-y-3">
              {activeBlocks.map((block, index) => (
                <Reorder.Item key={block.id} value={block} className="p-4 bg-white/5 border border-white/5 rounded-[1.5rem] space-y-3 group cursor-grab active:cursor-grabbing">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-3.5 h-3.5 text-white/20" />
                      <span className="text-[9px] font-black text-primary uppercase">#{index + 1} {block.type}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg">
                      {(['left', 'center', 'right'] as const).map(a => (
                        <button key={a} onClick={() => updateBlock(block.id, { align: a })} className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${block.align === a ? 'bg-white/10 text-white' : 'text-white/20'}`}>
                          <div className={`w-2.5 h-0.5 bg-current rounded-full ${a === 'center' ? 'w-1.5' : a === 'right' ? 'ml-auto w-1.5' : 'mr-auto w-1.5'}`} />
                        </button>
                      ))}
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
        <div className="flex-1 relative flex items-center justify-center p-12 bg-black/20 overflow-hidden">
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Live Preview</span>
            <button
              onClick={() => {
                const modes = ['off', 'white', 'black', 'accent'] as const;
                setGridMode(modes[(modes.indexOf(gridMode) + 1) % modes.length]);
              }}
              className={`p-1.5 rounded-md transition-colors ${gridMode !== 'off' ? 'bg-primary/20 text-primary' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/70'}`}
              title={`Grid: ${gridMode}`}
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            {Object.keys(blockOffsets).length > 0 && (
              <button
                onClick={() => setBlockOffsets({})}
                className="text-[9px] font-black text-white/30 hover:text-white/60 uppercase tracking-wider transition-colors px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10"
              >
                ↺ Reset Layout
              </button>
            )}
          </div>
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div 
              key={currentSlide}
              ref={slideRef}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              className={`relative shadow-[0_50px_120px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col transition-all duration-700 ${
                fontFamily === 'serif' ? 'font-serif' : fontFamily === 'display' ? 'font-display' : 'font-sans'
              } ${
                platform === 'tiktok' ? 'aspect-[9/16] h-full max-h-[85vh]' : 
                platform === 'instagram' ? 'aspect-[4/5] h-full max-h-[80vh]' : 
                'aspect-square h-full max-h-[75vh]'
              } ${
                device !== 'none' ? 'rounded-[3.5rem] ring-[14px] ring-zinc-800' : 'rounded-[2.5rem] border border-white/5'
              }`}
            >
              {/* Notch/Island */}
              {device === 'iphone14' && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-b-[1.2rem] z-[110] flex items-center justify-center shadow-2xl">
                  <div className="w-10 h-1 bg-zinc-900 rounded-full" />
                </div>
              )}
              {device === 'iphone13' && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-[110]" />}

              {/* iOS Status Bar */}
              {device !== 'none' && (
                <div className="absolute top-0 left-0 right-0 h-10 z-[100] flex items-center justify-between px-8">
                  <div className="text-[11px] font-bold text-white/90">16:05</div>
                  <div className="flex items-center gap-1.5">
                    <div className="flex gap-0.5">
                      <div className="w-0.5 h-2 bg-white/90 rounded-full" />
                      <div className="w-0.5 h-2.5 bg-white/90 rounded-full" />
                      <div className="w-0.5 h-3 bg-white/90 rounded-full" />
                      <div className="w-0.5 h-3.5 bg-white/20 rounded-full" />
                    </div>
                    <div className="w-5 h-2.5 border border-white/20 rounded-[2px] relative flex items-center px-0.5">
                      <div className="w-full h-1.5 bg-white/90 rounded-[1px]" />
                    </div>
                  </div>
                </div>
              )}

              {/* Background */}
              {currentSlideData.image ? (
                <div className="absolute inset-0 z-0">
                  <img src={currentSlideData.image} alt="" className="w-full h-full object-cover scale-105" />
                  <div className="absolute inset-0 transition-all duration-500" style={{ background: `linear-gradient(to bottom, rgba(9,9,11,${overlayOpacity * 0.5}), rgba(9,9,11,${overlayOpacity}), rgba(9,9,11,${overlayOpacity * 1.2}))` }} />
                </div>
              ) : (
                <div className="absolute inset-0 z-0" style={{ background: currentSlideData.type === 'cover' ? `radial-gradient(circle at 0% 0%, ${accentColor} 0%, #1e1b4b 100%)` : currentSlideData.type === 'cta' ? `linear-gradient(135deg, #1e1b4b 0%, ${accentColor} 100%)` : 'linear-gradient(180deg, #18181b 0%, #09090b 100%)' }} />
              )}

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
                            <span className="bg-black/30 px-2 py-0.5 rounded text-[9px] font-bold text-white/70">
                              {currentSlide + 1} / {editableSlides.length || slides.length}
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
                <div className={`flex flex-col flex-1 ${layout === 'split' ? 'justify-end pb-32' : 'justify-center'} gap-6`}>
                  {activeBlocks.map((block) => {
                    const offset = blockOffsets[block.id] ?? { x: 0, y: 0 };
                    const hasMoved = offset.x !== 0 || offset.y !== 0;
                    return (
                      <motion.div
                        key={block.id + (offset.x === 0 && offset.y === 0 ? '-reset' : '')}
                        drag
                        dragMomentum={false}
                        onDragStart={() => setActiveDragId(block.id)}
                        onDragEnd={() => setActiveDragId(null)}
                        onDrag={(event, info) => {
                          setBlockOffsets(prev => ({
                            ...prev,
                            [block.id]: {
                              x: (prev[block.id]?.x || 0) + info.delta.x,
                              y: (prev[block.id]?.y || 0) + info.delta.y
                            }
                          }));
                        }}
                        onPointerDown={(e) => {
                          e.stopPropagation(); // Prevent bubbling to the canvas wrapper which clears selection
                          setSelectedBlockId(block.id);
                        }}
                        className={`relative w-full flex flex-col cursor-grab active:cursor-grabbing group/block touch-none ${block.align === 'center' ? 'items-center text-center' : block.align === 'right' ? 'items-end text-right' : 'items-start text-left'} ${selectedBlockId === block.id ? 'ring-1 ring-white/10 rounded-2xl p-1 -m-1' : ''}`}
                      >
                        {/* Floating Formatting Toolbar */}
                        <div 
                          className={`absolute -top-10 right-0 flex items-center gap-3 bg-zinc-900/90 backdrop-blur-xl px-2 py-1.5 rounded-xl transition-all shadow-2xl z-40 pointer-events-auto border border-white/10 translate-y-2 group-hover/block:translate-y-0 ${selectedBlockId === block.id ? 'opacity-100 translate-y-0' : 'opacity-0 group-hover/block:opacity-100'}`}
                          onPointerDown={(e) => e.stopPropagation()}
                        >
                          {/* Color Picker */}
                          <div className="flex items-center gap-1.5 pr-3 border-r border-white/10">
                            {['#ffffff', '#d4d4d8', '#a1a1aa', accentColor].map(c => (
                              <button 
                                key={c}
                                onClick={(e) => { e.stopPropagation(); updateBlock(block.id, { color: c }); }}
                                className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 shadow-inner ${block.color === c || (!block.color && c === '#ffffff') ? 'border-primary scale-110 ring-2 ring-primary/30' : 'border-white/10'}`}
                                style={{ backgroundColor: c }}
                                title="Change color"
                              />
                            ))}
                          </div>

                          {/* Alignment */}
                          <div className="flex items-center gap-1 border-r border-white/10 pr-3">
                            {(['left', 'center', 'right'] as const).map(a => (
                              <button 
                                key={a} 
                                onClick={(e) => { e.stopPropagation(); updateBlock(block.id, { align: a }); }} 
                                className={`w-6 h-6 rounded-md flex items-center justify-center transition-all hover:bg-white/20 ${block.align === a ? 'bg-primary text-white' : 'text-white/40'}`}
                                title={`Align ${a}`}
                              >
                                <div className="flex flex-col gap-[3px] w-3 pointer-events-none">
                                  <div className={`h-[2px] bg-current rounded-full ${a === 'center' ? 'w-full' : 'w-full'}`} />
                                  <div className={`h-[2px] bg-current rounded-full ${a === 'center' ? 'w-2 mx-auto' : a === 'right' ? 'w-2 ml-auto' : 'w-2'}`} />
                                  <div className={`h-[2px] bg-current rounded-full ${a === 'center' ? 'w-full' : 'w-full'}`} />
                                </div>
                              </button>
                            ))}
                          </div>

                          {/* Quick Reset Position */}
                          <button
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setBlockOffsets(prev => { const n = { ...prev }; delete n[block.id]; return n; }); 
                            }}
                            className={`w-6 h-6 rounded-md flex items-center justify-center transition-all hover:bg-white/20 ${hasMoved ? 'text-white' : 'text-white/20'}`}
                            title="Reset position to center flow"
                            disabled={!hasMoved}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="12" y1="8" x2="12" y2="16" />
                              <line x1="8" y1="12" x2="16" y2="12" />
                            </svg>
                          </button>

                        </div>

                        {block.type === 'title' && (
                          <h3 
                            className={`font-black leading-[1.15] tracking-tight break-words w-full outline-none transition-colors ${editingBlockId === block.id ? 'bg-white/10 rounded-xl px-2 -mx-2 shadow-[0_0_0_2px_rgba(255,255,255,0.2)]' : 'hover:bg-white/5 rounded-xl px-2 -mx-2'} ${currentSlide === 0 ? 'text-4xl sm:text-5xl' : 'text-2xl sm:text-3xl'}`} 
                            style={{ color: block.color || (currentSlide === 0 ? 'white' : accentColor) }}
                            contentEditable={editingBlockId === block.id}
                            suppressContentEditableWarning={true}
                            onBlur={(e) => {
                              setEditingBlockId(null);
                              updateSlideContent(currentSlide, 'title', e.currentTarget.innerText);
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
                            {isEditMode ? <span className="opacity-40 italic">{block.name.toUpperCase()}</span> : currentSlideData.title}
                          </h3>
                        )}
                        {block.type === 'text' && (
                          <p 
                            className={`leading-[1.5] w-full outline-none transition-colors ${editingBlockId === block.id ? 'bg-white/10 rounded-xl px-2 -mx-2 py-1 shadow-[0_0_0_2px_rgba(255,255,255,0.2)]' : 'hover:bg-white/5 rounded-xl px-2 -mx-2 py-1'} ${currentSlide === 0 ? 'text-base opacity-70' : 'text-lg sm:text-xl font-light'}`}
                            style={{ color: block.color || '#f4f4f5' }}
                            contentEditable={editingBlockId === block.id}
                            suppressContentEditableWarning={true}
                            onBlur={(e) => {
                              setEditingBlockId(null);
                              updateSlideContent(currentSlide, 'content', e.currentTarget.innerText);
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
                            {isEditMode ? <span className="opacity-40">AI content: {block.name}</span> : currentSlideData.content}
                          </p>
                        )}
                        {block.type === 'quote' && (
                          <div className={`py-4 border-l-4 pl-6 w-full ${block.align === 'center' ? 'border-l-0 border-t-4 pt-4 pl-0' : block.align === 'right' ? 'border-l-0 border-r-4 pr-6 pl-0' : ''}`} style={{ borderColor: accentColor }}>
                            <p 
                              className={`text-xl sm:text-2xl font-serif italic outline-none transition-colors ${editingBlockId === block.id ? 'bg-white/10 rounded-xl px-2 -mx-2 shadow-[0_0_0_2px_rgba(255,255,255,0.2)]' : 'hover:bg-white/5 rounded-xl px-2 -mx-2'}`}
                              style={{ color: block.color || 'rgba(255,255,255,0.9)' }}
                              contentEditable={editingBlockId === block.id}
                              suppressContentEditableWarning={true}
                              onBlur={(e) => {
                                setEditingBlockId(null);
                                updateSlideContent(currentSlide, 'content', e.currentTarget.innerText);
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
                              {isEditMode ? `Quote: ${block.name}` : currentSlideData.content}
                            </p>
                          </div>
                        )}
                        {block.type === 'list' && (
                          <div className="w-full space-y-3">
                            {isEditMode ? (
                              <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                  <div key={i} className="flex items-center gap-4">
                                    <div className="w-2 h-2 rounded-full bg-primary shrink-0 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                                    <span className="text-xl text-zinc-100 font-light tracking-wide">Mục nội dung mẫu {i} (Dữ liệu từ: {block.name})</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              currentSlideData.content.split('\n').filter(l => l.trim()).map((item, idx, arr) => (
                                <div key={idx} className="flex items-start gap-4">
                                  <div className="mt-2.5 w-2 h-2 rounded-full shrink-0 shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ backgroundColor: accentColor }} />
                                  <p 
                                    className={`text-lg sm:text-xl font-light leading-relaxed outline-none flex-1 transition-colors ${editingBlockId === block.id + '-' + idx ? 'bg-white/10 rounded-xl px-2 -mx-2 shadow-[0_0_0_2px_rgba(255,255,255,0.2)]' : 'hover:bg-white/5 rounded-xl px-2 -mx-2'}`}
                                    style={{ color: block.color || '#f4f4f5' }}
                                    contentEditable={editingBlockId === block.id + '-' + idx}
                                    suppressContentEditableWarning={true}
                                    onBlur={(e) => {
                                      setEditingBlockId(null);
                                      const newArr = [...arr];
                                      newArr[idx] = `- ${e.currentTarget.innerText}`;
                                      updateSlideContent(currentSlide, 'content', newArr.join('\n'));
                                    }}
                                    onDoubleClick={(e) => { 
                                      setEditingBlockId(block.id + '-' + idx); 
                                      setTimeout(() => { e.currentTarget.focus(); document.execCommand('selectAll', false, null); }, 10);
                                    }}
                                    onPointerDown={(e) => {
                                      if (editingBlockId === block.id + '-' + idx) {
                                        e.stopPropagation();
                                      }
                                    }}
                                  >
                                    {item.replace(/^-\s*/, '')}
                                  </p>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                        {block.type === 'logo' && (
                          <div className={`w-full flex flex-col ${block.align === 'center' ? 'items-center text-center' : block.align === 'right' ? 'items-end text-right' : 'items-start text-left'}`}>
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
                                {isEditMode && !block.content ? 'BRAND LOGO' : block.content}
                              </p>
                            </div>
                          </div>
                        )}

                        {block.type === 'logo' && (
                          <div className={`w-full flex flex-col ${block.align === 'center' ? 'items-center text-center' : block.align === 'right' ? 'items-end text-right' : 'items-start text-left'}`}>
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
                                {isEditMode && !block.content ? 'BRAND LOGO' : block.content}
                              </p>
                            </div>
                          </div>
                        )}

                        {block.type === 'image' && currentSlideData.image && <div className="max-w-full aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-2xl"><img src={currentSlideData.image} alt="" className="w-full h-full object-cover" /></div>}
                      </motion.div>
                    );
                  })}
                </div>
              </div>


            </motion.div>
          </AnimatePresence>


        </div>

        {/* Right Sidebar: Visual Design */}
        <div className="w-80 bg-zinc-900/40 backdrop-blur-3xl border-l border-white/5 flex flex-col z-40 overflow-hidden shadow-2xl">
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
            {/* Platform & Device */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Platform</span>
                <div className="flex gap-1 bg-white/5 p-1 rounded-2xl">
                  {(['tiktok', 'instagram', 'square'] as const).map(p => (
                    <button key={p} onClick={() => setPlatform(p)} className={`flex-1 h-9 rounded-xl flex items-center justify-center transition-all ${platform === p ? 'bg-white text-zinc-950 shadow-lg' : 'text-white/20'}`}>
                      {p === 'tiktok' && <Presentation className="w-4 h-4" />}
                      {p === 'instagram' && <Hash className="w-4 h-4" />}
                      {p === 'square' && <div className="w-3 h-3 border-2 border-current rounded-sm" />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Device</span>
                <div className="flex gap-1 bg-white/5 p-1 rounded-2xl">
                  {(['none', 'iphone14', 'iphone13'] as const).map(d => (
                    <button key={d} onClick={() => setDevice(d)} className={`flex-1 h-9 rounded-xl text-[8px] font-black transition-all ${device === d ? 'bg-white text-zinc-950 shadow-lg' : 'text-white/20'}`}>
                      {d === 'none' ? 'OFF' : d === 'iphone14' ? 'IP14' : 'IP13'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {/* Typography */}
            <div className="space-y-3">
              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Typography</span>
              <div className="flex gap-1 bg-white/5 p-1 rounded-2xl">
                {(['sans', 'serif', 'display'] as const).map(f => (
                  <button key={f} onClick={() => setFontFamily(f)} className={`flex-1 h-10 rounded-xl text-[9px] font-black transition-all ${fontFamily === f ? 'bg-white text-zinc-950 shadow-lg' : 'text-white/20'}`}>{f.toUpperCase()}</button>
                ))}
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
                  ↺ Reset Positions
                </button>
              )}
            </div>
          </div>
          {/* Export */}
          <div className="p-7 bg-black/60 backdrop-blur-3xl border-t border-white/5 flex flex-col">
            <button onClick={handleDownload} disabled={isGenerating} className="w-full h-16 bg-white text-zinc-950 rounded-[2rem] font-black text-sm flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-2xl">
              {isGenerating ? <span className="animate-spin w-5 h-5 border-2 border-zinc-900 border-t-transparent rounded-full" /> : <Download className="w-6 h-6" />}
              {isGenerating ? `EXPORTING ${generationProgress}%` : 'EXPORT COLLECTION'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
