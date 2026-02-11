'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Type,
  Square,
  Circle,
  Trash2,
  Download,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Copy,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Save,
  Loader2,
  Upload,
  Undo2,
  Redo2,
  LayoutTemplate,
  Triangle,
  Star,
  Minus,
  Palette,
  X,
  Wand2,
  Eraser,
  ImageOff,
  Replace,
  Expand,
  ZoomIn,
  Sparkles,
  PenTool,
  MessageSquare,
  ChevronRight,
  Paintbrush,
  Target,
  RefreshCw,
  Layers,
  Lock,
  Unlock,
  Group,
  Ungroup,
  Eye,
  EyeOff,
  Clipboard,
  ClipboardPaste,
  Grid3X3,
  SunDim,
  FolderOpen,
  Image,
  CheckCircle,
  AlertTriangle,
  Info,
  Maximize2
} from 'lucide-react';
import { TEMPLATES, TEMPLATE_CATEGORIES, Template, ANIMATIONS } from './templates';
import { edit, content } from '@/lib/api';
import toast from 'react-hot-toast';

interface EnhancedEditorProps {
  backgroundImage?: string;
  width?: number;
  height?: number;
  onSave?: (dataUrl: string) => void;
  onCanvaEdit?: () => void;
  initialLayers?: {
    logo?: string;
    text?: string;
  };
}

const FONTS = [
  'Arial', 'Helvetica', 'Verdana', 'Tahoma', 'Trebuchet MS',
  'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins',
  'Inter', 'Nunito', 'Raleway', 'Ubuntu', 'Source Sans Pro',
  'Times New Roman', 'Georgia', 'Garamond', 'Palatino',
  'Playfair Display', 'Merriweather', 'Lora', 'PT Serif',
  'Oswald', 'Bebas Neue', 'Anton', 'Archivo Black', 'Righteous',
  'Bangers', 'Pacifico', 'Lobster', 'Permanent Marker', 'Satisfy',
  'Courier New', 'Consolas', 'Monaco', 'Fira Code', 'JetBrains Mono'
];

const PRESET_COLORS = [
  '#FFFFFF', '#F3F4F6', '#D1D5DB', '#9CA3AF', '#6B7280',
  '#4B5563', '#374151', '#1F2937', '#111827', '#000000',
  '#FEE2E2', '#FECACA', '#FCA5A5', '#F87171', '#EF4444',
  '#DC2626', '#B91C1C', '#991B1B', '#7F1D1D',
  '#FFEDD5', '#FED7AA', '#FDBA74', '#FB923C', '#F97316',
  '#EA580C', '#C2410C', '#9A3412',
  '#FEF9C3', '#FEF08A', '#FDE047', '#FACC15', '#EAB308',
  '#CA8A04', '#A16207', '#854D0E',
  '#DCFCE7', '#BBF7D0', '#86EFAC', '#4ADE80', '#22C55E',
  '#16A34A', '#15803D', '#166534',
  '#CCFBF1', '#99F6E4', '#5EEAD4', '#2DD4BF', '#14B8A6',
  '#0D9488', '#0F766E', '#115E59',
  '#DBEAFE', '#BFDBFE', '#93C5FD', '#60A5FA', '#3B82F6',
  '#2563EB', '#1D4ED8', '#1E40AF',
  '#EDE9FE', '#DDD6FE', '#C4B5FD', '#A78BFA', '#8B5CF6',
  '#7C3AED', '#6D28D9', '#5B21B6',
  '#FCE7F3', '#FBCFE8', '#F9A8D4', '#F472B6', '#EC4899',
  '#DB2777', '#BE185D', '#9D174D',
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
];

// AI Tool types
type AITool = 'none' | 'erase' | 'inpaint';

interface CopyResult {
  headline?: string;
  subheadline?: string;
  body?: string;
  cta?: string;
  alternatives?: {
    headlines?: string[];
    ctas?: string[];
  };
}

interface PlacementSuggestion {
  placements: Array<{
    zone: string;
    x: number;
    y: number;
    maxWidth: number;
    alignment: string;
    reasoning: string;
  }>;
  colorSuggestions: {
    textColor: string;
    backgroundColor?: string;
    reasoning: string;
  };
}

const ADAPT_PRESETS = [
  { label: 'Portrait', width: 768, height: 1344 },
  { label: 'Landscape', width: 1344, height: 768 },
  { label: 'Square', width: 1024, height: 1024 },
  { label: 'Ultra-wide', width: 1536, height: 640 },
  { label: 'Menu Board', width: 896, height: 1152 },
];

export default function EnhancedEditor({
  backgroundImage,
  width = 1344,
  height = 768,
  onSave,
  onCanvaEdit,
  initialLayers
}: EnhancedEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const initializedRef = useRef(false);
  const currentDimensionsRef = useRef({ width: 0, height: 0 });
  const lastBackgroundRef = useRef<string | undefined>(undefined);
  const initialLayersAddedRef = useRef(false);

  // Basic state
  const [isLoaded, setIsLoaded] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [selectedObject, setSelectedObject] = useState<any>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [textOptions, setTextOptions] = useState({
    fontFamily: 'Arial',
    fontSize: 48,
    fill: '#FFFFFF',
    fontWeight: 'normal' as string,
    fontStyle: 'normal' as string,
    underline: false,
    textAlign: 'left'
  });
  const [scale, setScale] = useState(1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // AI Tools state
  const [showAIMenu, setShowAIMenu] = useState(false);
  const [aiTool, setAITool] = useState<AITool>('none');
  const [aiLoading, setAILoading] = useState(false);
  const [aiLoadingMessage, setAILoadingMessage] = useState('');
  const [brushSize, setBrushSize] = useState(30);
  const [inpaintPrompt, setInpaintPrompt] = useState('');

  // Copy Assist state
  const [showCopyAssist, setShowCopyAssist] = useState(false);
  const [copyContext, setCopyContext] = useState('');
  const [copyTone, setCopyTone] = useState('professional');
  const [copyResult, setCopyResult] = useState<CopyResult | null>(null);
  const [placementSuggestions, setPlacementSuggestions] = useState<PlacementSuggestion | null>(null);
  const [copyLoading, setCopyLoading] = useState(false);

  // AI Design Critic state
  const [showCritique, setShowCritique] = useState(false);
  const [critiqueLoading, setCritiqueLoading] = useState(false);
  const [critiqueResult, setCritiqueResult] = useState<{
    score: number;
    issues: Array<{
      severity: 'error' | 'warning' | 'info';
      category: string;
      message: string;
      suggestion: string;
    }>;
    summary: string;
  } | null>(null);

  // Responsive Adaptation state
  const [showAdaptMenu, setShowAdaptMenu] = useState(false);
  const [adaptLoading, setAdaptLoading] = useState(false);

  // Mask drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [maskCtx, setMaskCtx] = useState<CanvasRenderingContext2D | null>(null);

  // Drag and drop state
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Layers panel state
  const [showLayers, setShowLayers] = useState(false);
  const [canvasObjects, setCanvasObjects] = useState<any[]>([]);

  // Effects state
  const [showEffects, setShowEffects] = useState(false);
  const [objectOpacity, setObjectOpacity] = useState(100);
  const [shadowEnabled, setShadowEnabled] = useState(false);
  const [shadowBlur, setShadowBlur] = useState(10);
  const [shadowOffsetX, setShadowOffsetX] = useState(5);
  const [shadowOffsetY, setShadowOffsetY] = useState(5);
  const [shadowColor, setShadowColor] = useState('rgba(0,0,0,0.5)');

  // Animation state
  const [objectAnimation, setObjectAnimation] = useState<string>('none');
  const [animationDuration, setAnimationDuration] = useState(1000);
  const [showAnimationPreview, setShowAnimationPreview] = useState(false);

  // Snap to grid state
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(20);

  // Clipboard state
  const clipboardRef = useRef<any>(null);

  // Content Library browser state
  const [showLibrary, setShowLibrary] = useState(false);
  const [libraryContent, setLibraryContent] = useState<any[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);

  // Load fabric.js
  useEffect(() => {
    const loadFabric = async () => {
      if (typeof window === 'undefined') return;
      const fabricModule = await import('fabric');
      fabricRef.current = fabricModule;
      setIsLoaded(true);
    };
    loadFabric();
  }, []);

  // Initialize mask canvas
  useEffect(() => {
    if (maskCanvasRef.current && aiTool !== 'none') {
      const ctx = maskCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, width, height);
        setMaskCtx(ctx);
      }
    }
  }, [aiTool, width, height]);

  // Save state for undo/redo
  const saveState = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    const json = JSON.stringify(fabricCanvasRef.current.toJSON());
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(json);
    historyIndexRef.current = historyRef.current.length - 1;
    if (historyRef.current.length > 50) {
      historyRef.current.shift();
      historyIndexRef.current--;
    }
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
  }, []);

  // Initialize canvas
  useEffect(() => {
    if (!isLoaded || !canvasRef.current || !fabricRef.current) return;

    const dimensionsChanged =
      currentDimensionsRef.current.width !== width ||
      currentDimensionsRef.current.height !== height;

    if (initializedRef.current && !dimensionsChanged && fabricCanvasRef.current) {
      const updateScale = () => {
        if (containerRef.current) {
          const containerWidth = containerRef.current.offsetWidth - 48;
          setScale(Math.min(1, containerWidth / width));
        }
      };
      updateScale();
      return;
    }

    if (fabricCanvasRef.current && dimensionsChanged) {
      fabricCanvasRef.current.dispose();
      fabricCanvasRef.current = null;
      initializedRef.current = false;
    }

    const fabric = fabricRef.current;
    const canvas = new fabric.Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: '#1a1a1a',
      selection: true,
      preserveObjectStacking: true,
      // Enable better control styling globally
      controlsAboveOverlay: true
    });

    // Configure default object controls styling (Fabric v7)
    if (fabric.Object) {
      fabric.Object.prototype.set({
        cornerSize: 20,
        cornerColor: '#00d4ff',
        cornerStrokeColor: '#ffffff',
        borderColor: '#00d4ff',
        borderScaleFactor: 2,
        transparentCorners: false,
        cornerStyle: 'circle',
        hasControls: true,
        hasBorders: true,
        padding: 10
      });
    }

    // Ensure controls are visible above scaled canvas
    canvas.controlsAboveOverlay = true;

    fabricCanvasRef.current = canvas;
    initializedRef.current = true;
    currentDimensionsRef.current = { width, height };

    canvas.on('selection:created', (e: any) => {
      setSelectedObject(e.selected?.[0] || null);
      updateTextOptionsFromObject(e.selected?.[0]);
    });

    canvas.on('selection:updated', (e: any) => {
      setSelectedObject(e.selected?.[0] || null);
      updateTextOptionsFromObject(e.selected?.[0]);
    });

    canvas.on('selection:cleared', () => setSelectedObject(null));
    canvas.on('object:modified', saveState);
    canvas.on('object:added', saveState);

    // Snap to grid on object moving
    canvas.on('object:moving', (e: any) => {
      const obj = e.target;
      // Snap to 20px grid
      obj.set({
        left: Math.round(obj.left / 20) * 20,
        top: Math.round(obj.top / 20) * 20
      });
    });

    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth - 48;
        setScale(Math.min(1, containerWidth / width));
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    saveState();

    return () => {
      window.removeEventListener('resize', updateScale);
    };
  }, [isLoaded, width, height, saveState]);

  // Load generated image as a resizable object (not locked background)
  useEffect(() => {
    if (!isLoaded || !fabricCanvasRef.current || !fabricRef.current || !backgroundImage) return;
    if (lastBackgroundRef.current === backgroundImage) return;
    lastBackgroundRef.current = backgroundImage;

    const fabric = fabricRef.current;
    const canvas = fabricCanvasRef.current;

    setImageLoading(true);

    // Remove any existing generated image
    const existingGenerated = canvas.getObjects().find((obj: any) => obj._isGeneratedImage);
    if (existingGenerated) {
      canvas.remove(existingGenerated);
    }

    const imgEl = document.createElement('img');
    imgEl.onload = () => {
      try {
        // Scale to fit canvas while maintaining aspect ratio
        const scaleX = width / imgEl.width;
        const scaleY = height / imgEl.height;
        const scale = Math.min(scaleX, scaleY);

        const FabricImage = fabric.FabricImage || fabric.Image;
        const bgImage = new FabricImage(imgEl, {
          left: (width - imgEl.width * scale) / 2,
          top: (height - imgEl.height * scale) / 2,
          scaleX: scale,
          scaleY: scale,
          originX: 'left',
          originY: 'top'
        });

        // Mark as generated image and make it resizable
        bgImage.set({
          _isGeneratedImage: true,
          hasControls: true,
          hasBorders: true,
          lockUniScaling: true,
          selectable: true,
          evented: true,
          cornerSize: 20,
          cornerColor: '#ff6b6b',
          cornerStrokeColor: '#ffffff',
          borderColor: '#ff6b6b',
          borderScaleFactor: 2,
          transparentCorners: false,
          cornerStyle: 'circle',
          padding: 10
        });

        canvas.add(bgImage);
        canvas.sendObjectToBack(bgImage);
        bgImage.setCoords();
        canvas.requestRenderAll();
        setImageLoading(false);
      } catch (err) {
        console.error('Error setting background:', err);
        setImageLoading(false);
      }
    };
    imgEl.onerror = () => setImageLoading(false);
    if (!backgroundImage.startsWith('data:')) imgEl.crossOrigin = 'anonymous';
    imgEl.src = backgroundImage;
  }, [isLoaded, backgroundImage, width, height]);

  const updateTextOptionsFromObject = (obj: any) => {
    if (obj?.type === 'textbox' || obj?.type === 'Textbox') {
      setTextOptions({
        fontFamily: obj.fontFamily || 'Arial',
        fontSize: obj.fontSize || 48,
        fill: obj.fill || '#FFFFFF',
        fontWeight: obj.fontWeight || 'normal',
        fontStyle: obj.fontStyle || 'normal',
        underline: obj.underline || false,
        textAlign: obj.textAlign || 'left'
      });
    }
  };

  // Get canvas as base64
  const getCanvasBase64 = useCallback(() => {
    if (!fabricCanvasRef.current) return '';
    return fabricCanvasRef.current.toDataURL({ format: 'png', quality: 1 });
  }, []);

  // Get mask as base64
  const getMaskBase64 = useCallback(() => {
    if (!maskCanvasRef.current) return '';
    return maskCanvasRef.current.toDataURL('image/png');
  }, []);

  // Apply AI result to canvas (as resizable object)
  const applyAIResult = useCallback((imageUrl: string) => {
    if (!fabricCanvasRef.current || !fabricRef.current) return;

    const fabric = fabricRef.current;
    const canvas = fabricCanvasRef.current;

    // Remove existing generated image
    const existingGenerated = canvas.getObjects().find((obj: any) => obj._isGeneratedImage);
    if (existingGenerated) {
      canvas.remove(existingGenerated);
    }

    const imgEl = document.createElement('img');
    imgEl.onload = () => {
      const scaleX = width / imgEl.width;
      const scaleY = height / imgEl.height;
      const scale = Math.min(scaleX, scaleY);

      const FabricImage = fabric.FabricImage || fabric.Image;
      const bgImage = new FabricImage(imgEl, {
        left: (width - imgEl.width * scale) / 2,
        top: (height - imgEl.height * scale) / 2,
        scaleX: scale,
        scaleY: scale,
        originX: 'left',
        originY: 'top'
      });

      bgImage.set({
        _isGeneratedImage: true,
        hasControls: true,
        hasBorders: true,
        lockUniScaling: true,
        selectable: true,
        evented: true,
        cornerSize: 20,
        cornerColor: '#ff6b6b',
        cornerStrokeColor: '#ffffff',
        borderColor: '#ff6b6b',
        borderScaleFactor: 2,
        transparentCorners: false,
        cornerStyle: 'circle',
        padding: 10
      });

      canvas.add(bgImage);
      canvas.sendObjectToBack(bgImage);
      bgImage.setCoords();
      canvas.requestRenderAll();
      saveState();
      lastBackgroundRef.current = imageUrl;
    };
    imgEl.src = imageUrl;
  }, [width, height, saveState]);

  // Add initial layers (logo + text) from Auto-Design
  useEffect(() => {
    if (!isLoaded || !fabricCanvasRef.current || !fabricRef.current || !initialLayers || initialLayersAddedRef.current) {
      return;
    }

    // Wait a bit for background to fully render
    const timer = setTimeout(() => {
      const canvas = fabricCanvasRef.current;
      const fabric = fabricRef.current;
      if (!canvas || !fabric) return;

      initialLayersAddedRef.current = true;

      // Add logo if provided
      if (initialLayers.logo) {
        const FabricImage = fabric.FabricImage || fabric.Image;
        const logoEl = document.createElement('img');
        logoEl.crossOrigin = 'anonymous';
        logoEl.onload = () => {
          // Scale logo to ~15% of canvas width
          const targetWidth = width * 0.15;
          const scale = targetWidth / logoEl.width;

          const logoImg = new FabricImage(logoEl, {
            left: 40,
            top: 40,
            scaleX: scale,
            scaleY: scale,
            originX: 'left',
            originY: 'top'
          });

          logoImg.set({
            _isLogoImage: true,
            hasControls: true,
            hasBorders: true,
            lockUniScaling: true,
            selectable: true,
            evented: true,
            cornerSize: 15,
            cornerColor: '#10b981',
            cornerStrokeColor: '#ffffff',
            borderColor: '#10b981',
            transparentCorners: false,
            cornerStyle: 'circle',
            padding: 8
          });

          canvas.add(logoImg);
          logoImg.setCoords();
          canvas.requestRenderAll();
          saveState();
        };
        logoEl.src = initialLayers.logo;
      }

      // Add text if provided
      if (initialLayers.text) {
        const FabricText = fabric.IText || fabric.Text;
        const textObj = new FabricText(initialLayers.text, {
          left: width / 2,
          top: height / 2,
          originX: 'center',
          originY: 'center',
          fontFamily: 'Arial',
          fontSize: Math.min(width / 10, 72),
          fontWeight: 'bold',
          fill: '#FFFFFF',
          textAlign: 'center',
          shadow: new fabric.Shadow({
            color: 'rgba(0,0,0,0.8)',
            blur: 10,
            offsetX: 2,
            offsetY: 4
          })
        });

        textObj.set({
          hasControls: true,
          hasBorders: true,
          selectable: true,
          evented: true,
          cornerSize: 12,
          cornerColor: '#f59e0b',
          cornerStrokeColor: '#ffffff',
          borderColor: '#f59e0b',
          transparentCorners: false,
          cornerStyle: 'circle',
          padding: 8
        });

        canvas.add(textObj);
        canvas.bringObjectToFront(textObj);
        textObj.setCoords();
        canvas.requestRenderAll();
        saveState();
      }

      if (initialLayers.logo || initialLayers.text) {
        toast.success('Logo and text added as separate layers - drag to reposition!');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [isLoaded, initialLayers, width, height, saveState]);

  // AI Tool handlers
  const handleRemoveBackground = async () => {
    setAILoading(true);
    setAILoadingMessage('Removing background...');
    try {
      const imageBase64 = getCanvasBase64();
      const response = await edit.removeBackground(imageBase64);
      if (response.data.success) {
        applyAIResult(response.data.image.url);
        toast.success('Background removed!');
      } else {
        toast.error(response.data.error || 'Failed to remove background');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to remove background');
    } finally {
      setAILoading(false);
      setAILoadingMessage('');
    }
  };

  const handleUpscale = async () => {
    setAILoading(true);
    setAILoadingMessage('Upscaling 4x (this may take a moment)...');
    try {
      const imageBase64 = getCanvasBase64();
      const response = await edit.upscale(imageBase64, 'fast');
      if (response.data.success) {
        // Download upscaled image since it's larger than canvas
        const link = document.createElement('a');
        link.download = `upscaled-${Date.now()}.png`;
        link.href = response.data.image.url;
        link.click();
        toast.success('Image upscaled 4x and downloaded!');
      } else {
        toast.error(response.data.error || 'Failed to upscale');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to upscale');
    } finally {
      setAILoading(false);
      setAILoadingMessage('');
    }
  };

  const handleSearchReplace = async () => {
    const searchPrompt = prompt('What do you want to find?');
    if (!searchPrompt) return;
    const replacePrompt = prompt('What do you want to replace it with?');
    if (!replacePrompt) return;

    setAILoading(true);
    setAILoadingMessage(`Replacing "${searchPrompt}" with "${replacePrompt}"...`);
    try {
      const imageBase64 = getCanvasBase64();
      const response = await edit.searchReplace(imageBase64, searchPrompt, replacePrompt);
      if (response.data.success) {
        applyAIResult(response.data.image.url);
        toast.success('Objects replaced!');
      } else {
        toast.error(response.data.error || 'Failed to search/replace');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to search/replace');
    } finally {
      setAILoading(false);
      setAILoadingMessage('');
    }
  };

  const handleReplaceBackground = async () => {
    const bgPrompt = prompt('Describe the new background:');
    if (!bgPrompt) return;

    setAILoading(true);
    setAILoadingMessage('Generating new background...');
    try {
      const imageBase64 = getCanvasBase64();
      const response = await edit.replaceBackground(imageBase64, bgPrompt);
      if (response.data.success) {
        applyAIResult(response.data.image.url);
        toast.success('Background replaced!');
      } else {
        toast.error(response.data.error || 'Failed to replace background');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to replace background');
    } finally {
      setAILoading(false);
      setAILoadingMessage('');
    }
  };

  const handleOutpaint = async (direction: 'left' | 'right' | 'up' | 'down') => {
    setAILoading(true);
    setAILoadingMessage(`Extending image ${direction}...`);
    try {
      const imageBase64 = getCanvasBase64();
      const response = await edit.outpaint(imageBase64, direction, 256);
      if (response.data.success) {
        applyAIResult(response.data.image.url);
        toast.success(`Image extended ${direction}!`);
      } else {
        toast.error(response.data.error || 'Failed to extend');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to extend image');
    } finally {
      setAILoading(false);
      setAILoadingMessage('');
    }
  };

  const handleErase = async () => {
    if (aiTool !== 'erase') return;
    setAILoading(true);
    setAILoadingMessage('AI is erasing selected areas...');
    try {
      const imageBase64 = getCanvasBase64();
      const maskBase64 = getMaskBase64();
      const response = await edit.erase(imageBase64, maskBase64);
      if (response.data.success) {
        applyAIResult(response.data.image.url);
        toast.success('Objects erased!');
        setAITool('none');
        clearMask();
      } else {
        toast.error(response.data.error || 'Failed to erase');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to erase');
    } finally {
      setAILoading(false);
      setAILoadingMessage('');
    }
  };

  const handleInpaint = async () => {
    if (aiTool !== 'inpaint' || !inpaintPrompt) {
      toast.error('Please enter what you want to generate');
      return;
    }
    setAILoading(true);
    setAILoadingMessage('AI is generating content...');
    try {
      const imageBase64 = getCanvasBase64();
      const maskBase64 = getMaskBase64();
      const response = await edit.inpaint(imageBase64, maskBase64, inpaintPrompt);
      if (response.data.success) {
        applyAIResult(response.data.image.url);
        toast.success('Content generated!');
        setAITool('none');
        setInpaintPrompt('');
        clearMask();
      } else {
        toast.error(response.data.error || 'Failed to generate');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to generate');
    } finally {
      setAILoading(false);
      setAILoadingMessage('');
    }
  };

  const clearMask = () => {
    if (maskCtx) {
      maskCtx.fillStyle = 'black';
      maskCtx.fillRect(0, 0, width, height);
    }
  };

  // Mask drawing handlers
  const handleMaskMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (aiTool === 'none' || !maskCtx) return;
    setIsDrawing(true);
    drawOnMask(e);
  };

  const handleMaskMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !maskCtx) return;
    drawOnMask(e);
  };

  const handleMaskMouseUp = () => {
    setIsDrawing(false);
  };

  const drawOnMask = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!maskCtx || !maskCanvasRef.current) return;
    const rect = maskCanvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    maskCtx.fillStyle = 'white';
    maskCtx.beginPath();
    maskCtx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    maskCtx.fill();
  };

  // Copy Assist handlers
  const handleGenerateCopy = async () => {
    if (!copyContext) {
      toast.error('Please describe what the signage is for');
      return;
    }
    setCopyLoading(true);
    try {
      const response = await edit.copywriter(copyContext, copyTone);
      if (response.data.success) {
        setCopyResult(response.data.copy);
        toast.success('Copy generated!');
      }
    } catch (error: any) {
      toast.error('Failed to generate copy');
    } finally {
      setCopyLoading(false);
    }
  };

  const handleSuggestPlacement = async () => {
    setCopyLoading(true);
    try {
      const imageBase64 = getCanvasBase64();
      const response = await edit.suggestPlacement(imageBase64, width, height);
      if (response.data.success) {
        setPlacementSuggestions(response.data.suggestions);
        toast.success('Placement suggestions ready!');
      }
    } catch (error: any) {
      toast.error('Failed to analyze image');
    } finally {
      setCopyLoading(false);
    }
  };

  // AI Design Critic handler
  const handleCritique = async () => {
    setCritiqueLoading(true);
    setShowCritique(true);
    try {
      const imageBase64 = getCanvasBase64();
      const response = await edit.designCritique(imageBase64, width, height);
      if (response.data.success) {
        setCritiqueResult(response.data.critique);
        toast.success('Design analysis complete!');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to analyze design');
    } finally {
      setCritiqueLoading(false);
    }
  };

  // Responsive Adaptation handler
  const handleAdapt = async (targetWidth: number, targetHeight: number) => {
    setAdaptLoading(true);
    setShowAdaptMenu(false);
    try {
      const imageBase64 = getCanvasBase64();
      const canvasJson = fabricCanvasRef.current?.toJSON(['data']);
      const response = await edit.adaptLayout({
        image: imageBase64,
        canvasJson,
        sourceWidth: width,
        sourceHeight: height,
        targetWidth,
        targetHeight
      });
      if (response.data.success) {
        const canvas = fabricCanvasRef.current;
        const fabric = fabricRef.current;
        if (!canvas || !fabric) return;

        // Load the adapted background
        const bgUrl = response.data.backgroundImage;
        const bgDataUrl = bgUrl.startsWith('data:') ? bgUrl : `data:image/png;base64,${bgUrl}`;

        // Clear canvas and set new dimensions
        canvas.clear();
        canvas.setDimensions({ width: targetWidth, height: targetHeight });

        // Add background image
        const img = await fabric.FabricImage.fromURL(bgDataUrl);
        img.scaleToWidth(targetWidth);
        img.scaleToHeight(targetHeight);
        img.set({ selectable: false, evented: false, data: { _isBackground: true } });
        canvas.add(img);
        canvas.sendObjectToBack(img);

        // Apply repositioned overlays if returned
        if (response.data.adaptedLayout?.elements) {
          const originalObjects = canvasJson?.objects || [];
          for (let i = 0; i < response.data.adaptedLayout.elements.length; i++) {
            const adapted = response.data.adaptedLayout.elements[i];
            const original = originalObjects.filter((o: any) => o.type !== 'image' || !o.data?._isBackground)[i];
            if (!original) continue;

            if (original.type === 'textbox' || original.type === 'i-text') {
              const textObj = new fabric.Textbox(adapted.text || original.text, {
                left: adapted.left,
                top: adapted.top,
                width: adapted.width || original.width,
                fontSize: adapted.fontSize || original.fontSize,
                fontFamily: original.fontFamily || 'Arial',
                fill: original.fill || '#ffffff',
                fontWeight: original.fontWeight,
                fontStyle: original.fontStyle,
                textAlign: original.textAlign,
              });
              canvas.add(textObj);
            } else if (original.type === 'rect') {
              const rect = new fabric.Rect({
                left: adapted.left,
                top: adapted.top,
                width: adapted.width || original.width,
                height: adapted.height || original.height,
                fill: original.fill,
                rx: original.rx,
                ry: original.ry,
                opacity: original.opacity,
              });
              canvas.add(rect);
            } else if (original.type === 'circle') {
              const circle = new fabric.Circle({
                left: adapted.left,
                top: adapted.top,
                radius: original.radius ? original.radius * ((adapted.scaleX || 1)) : (adapted.width || 50) / 2,
                fill: original.fill,
                opacity: original.opacity,
              });
              canvas.add(circle);
            } else if (original.type === 'triangle') {
              const tri = new fabric.Triangle({
                left: adapted.left,
                top: adapted.top,
                width: adapted.width || original.width,
                height: adapted.height || original.height,
                fill: original.fill,
                opacity: original.opacity,
              });
              canvas.add(tri);
            }
          }
        }

        canvas.renderAll();
        toast.success(`Adapted to ${targetWidth}x${targetHeight}!`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to adapt design');
    } finally {
      setAdaptLoading(false);
    }
  };

  const addTextFromCopy = (text: string, isHeadline: boolean = false) => {
    if (!fabricCanvasRef.current || !fabricRef.current) return;
    const fabric = fabricRef.current;

    const placement = placementSuggestions?.placements?.[0];
    const colors = placementSuggestions?.colorSuggestions;

    const textObj = new fabric.Textbox(text, {
      left: placement ? (placement.x / 100) * width : width / 2 - 100,
      top: placement ? (placement.y / 100) * height : height / 2,
      fontSize: isHeadline ? 64 : 32,
      fontFamily: isHeadline ? 'Montserrat' : 'Open Sans',
      fontWeight: isHeadline ? 'bold' : 'normal',
      fill: colors?.textColor || '#FFFFFF',
      textAlign: placement?.alignment || 'center',
      width: placement ? (placement.maxWidth / 100) * width : 400,
      editable: true,
      shadow: colors?.backgroundColor ? undefined : new fabric.Shadow({
        color: 'rgba(0,0,0,0.5)',
        blur: 4,
        offsetX: 2,
        offsetY: 2
      }),
      // Controls
      hasControls: true,
      hasBorders: true,
      cornerSize: 12,
      cornerColor: '#00d4ff',
      cornerStrokeColor: '#00d4ff',
      borderColor: '#00d4ff',
      transparentCorners: false,
      cornerStyle: 'circle'
    });

    fabricCanvasRef.current.add(textObj);
    fabricCanvasRef.current.setActiveObject(textObj);
    fabricCanvasRef.current.renderAll();
    toast.success('Text added to canvas');
  };

  // Standard editor functions
  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0 || !fabricCanvasRef.current) return;
    historyIndexRef.current--;
    fabricCanvasRef.current.loadFromJSON(JSON.parse(historyRef.current[historyIndexRef.current]), () => {
      fabricCanvasRef.current.renderAll();
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(true);
    });
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1 || !fabricCanvasRef.current) return;
    historyIndexRef.current++;
    fabricCanvasRef.current.loadFromJSON(JSON.parse(historyRef.current[historyIndexRef.current]), () => {
      fabricCanvasRef.current.renderAll();
      setCanUndo(true);
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
    });
  }, []);

  const addText = useCallback(() => {
    if (!fabricCanvasRef.current || !fabricRef.current) return;
    const fabric = fabricRef.current;
    const text = new fabric.Textbox('Your Text', {
      left: width / 2 - 100,
      top: height / 2 - 25,
      ...textOptions,
      width: 300,
      editable: true,
      // Controls
      hasControls: true,
      hasBorders: true,
      cornerSize: 12,
      cornerColor: '#00d4ff',
      cornerStrokeColor: '#00d4ff',
      borderColor: '#00d4ff',
      transparentCorners: false,
      cornerStyle: 'circle'
    });
    fabricCanvasRef.current.add(text);
    fabricCanvasRef.current.setActiveObject(text);
    fabricCanvasRef.current.renderAll();
  }, [textOptions, width, height]);

  const addShape = useCallback((shapeType: string) => {
    if (!fabricCanvasRef.current || !fabricRef.current) return;
    const fabric = fabricRef.current;
    const canvas = fabricCanvasRef.current;

    let shape;
    const baseProps = {
      left: width / 2 - 50,
      top: height / 2 - 50,
      fill: 'rgba(255, 255, 255, 0.8)',
      stroke: '#000000',
      strokeWidth: 2,
      // Controls
      hasControls: true,
      hasBorders: true,
      cornerSize: 12,
      cornerColor: '#00d4ff',
      cornerStrokeColor: '#00d4ff',
      borderColor: '#00d4ff',
      transparentCorners: false,
      cornerStyle: 'circle'
    };

    switch (shapeType) {
      case 'rect':
        shape = new fabric.Rect({ ...baseProps, width: 150, height: 100, rx: 8, ry: 8 });
        break;
      case 'circle':
        shape = new fabric.Circle({ ...baseProps, radius: 50 });
        break;
      case 'triangle':
        shape = new fabric.Triangle({ ...baseProps, width: 100, height: 100 });
        break;
      case 'line':
        shape = new fabric.Line([50, 50, 200, 50], {
          left: width / 2 - 75,
          top: height / 2,
          stroke: '#ffffff',
          strokeWidth: 4
        });
        break;
      case 'star':
        const points = [];
        const outerRadius = 50;
        const innerRadius = 25;
        for (let i = 0; i < 10; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          const angle = (Math.PI / 5) * i - Math.PI / 2;
          points.push({ x: radius * Math.cos(angle), y: radius * Math.sin(angle) });
        }
        shape = new fabric.Polygon(points, { ...baseProps, left: width / 2, top: height / 2 });
        break;
    }

    if (shape) {
      canvas.add(shape);
      canvas.setActiveObject(shape);
      canvas.renderAll();
    }
  }, [width, height]);

  // Add image to canvas as a resizable/movable object
  const addImageToCanvas = useCallback((dataUrl: string, dropX?: number, dropY?: number) => {
    if (!fabricCanvasRef.current || !fabricRef.current) return;

    const fabric = fabricRef.current;
    const FabricImage = fabric.FabricImage || fabric.Image;
    const imgEl = document.createElement('img');
    imgEl.onload = () => {
      // Scale image to fit reasonably (max 50% of canvas)
      const maxW = width * 0.5;
      const maxH = height * 0.5;
      let scaleX = 1;
      let scaleY = 1;
      if (imgEl.width > maxW || imgEl.height > maxH) {
        const ratio = Math.min(maxW / imgEl.width, maxH / imgEl.height);
        scaleX = ratio;
        scaleY = ratio;
      }

      const img = new FabricImage(imgEl, {
        left: dropX ?? (width / 2 - (imgEl.width * scaleX) / 2),
        top: dropY ?? (height / 2 - (imgEl.height * scaleY) / 2),
        scaleX,
        scaleY
      });

      // Enable all controls for resize/rotate (Fabric v7)
      // lockUniScaling: true = maintain aspect ratio by default
      img.set({
        hasControls: true,
        hasBorders: true,
        lockUniScaling: true,
        lockScalingX: false,
        lockScalingY: false,
        lockRotation: false,
        selectable: true,
        evented: true,
        cornerSize: 20,
        cornerColor: '#00d4ff',
        cornerStrokeColor: '#ffffff',
        borderColor: '#00d4ff',
        borderScaleFactor: 2,
        transparentCorners: false,
        cornerStyle: 'circle',
        padding: 10
      });

      fabricCanvasRef.current.add(img);
      fabricCanvasRef.current.setActiveObject(img);
      img.setCoords();
      fabricCanvasRef.current.requestRenderAll();
      toast.success('Image added - drag corners to resize');
    };
    imgEl.src = dataUrl;
  }, [width, height]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fabricCanvasRef.current || !fabricRef.current) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      addImageToCanvas(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [addImageToCanvas]);

  // Fetch content library
  const fetchLibrary = useCallback(async () => {
    setLibraryLoading(true);
    try {
      const response = await content.list();
      // Filter to only images
      const images = (response.data.content || []).filter(
        (item: any) => item.type === 'IMAGE'
      );
      setLibraryContent(images);
    } catch (error) {
      console.error('Failed to fetch library:', error);
      toast.error('Failed to load content library');
    } finally {
      setLibraryLoading(false);
    }
  }, []);

  // Open library browser
  const openLibrary = useCallback(() => {
    setShowLibrary(true);
    fetchLibrary();
  }, [fetchLibrary]);

  // Add image from library to canvas
  const addFromLibrary = useCallback((item: any) => {
    if (!item.url) return;

    // Handle relative URLs (local dev) vs absolute URLs (production)
    const imageUrl = item.url.startsWith('/')
      ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${item.url}`
      : item.url;

    addImageToCanvas(imageUrl);
    setShowLibrary(false);
    toast.success(`Added "${item.name}" to canvas`);
  }, [addImageToCanvas]);

  // Drag and drop handlers for canvas
  const handleCanvasDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  }, []);

  const handleCanvasDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  }, []);

  const handleCanvasDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(f => f.type.startsWith('image/'));

    if (!imageFile) {
      toast.error('Please drop an image file');
      return;
    }

    // Calculate drop position relative to canvas
    const rect = containerRef.current?.getBoundingClientRect();
    let dropX = width / 2;
    let dropY = height / 2;

    if (rect) {
      const containerCenterX = rect.left + rect.width / 2;
      const containerCenterY = rect.top + rect.height / 2;
      const canvasOffsetX = (e.clientX - containerCenterX) / scale;
      const canvasOffsetY = (e.clientY - containerCenterY) / scale;
      dropX = width / 2 + canvasOffsetX;
      dropY = height / 2 + canvasOffsetY;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      addImageToCanvas(event.target?.result as string, dropX, dropY);
    };
    reader.readAsDataURL(imageFile);
  }, [addImageToCanvas, width, height, scale]);

  const applyTemplate = useCallback((template: Template) => {
    if (!fabricCanvasRef.current || !fabricRef.current) return;
    const fabric = fabricRef.current;
    const canvas = fabricCanvasRef.current;

    const objects = canvas.getObjects();
    objects.forEach((obj: any) => {
      if (!obj._isBackground) canvas.remove(obj);
    });

    const controlProps = {
      hasControls: true,
      hasBorders: true,
      cornerSize: 12,
      cornerColor: '#00d4ff',
      cornerStrokeColor: '#00d4ff',
      borderColor: '#00d4ff',
      transparentCorners: false,
      cornerStyle: 'circle'
    };

    template.elements.forEach((element) => {
      let obj;
      switch (element.type) {
        case 'text':
          obj = new fabric.Textbox(element.props.text || 'Text', { ...element.props, ...controlProps, editable: true });
          break;
        case 'rect':
          obj = new fabric.Rect({ ...element.props, ...controlProps });
          break;
        case 'circle':
          obj = new fabric.Circle({ ...element.props, ...controlProps });
          break;
      }
      if (obj) canvas.add(obj);
    });

    canvas.renderAll();
    setShowTemplates(false);
    saveState();
  }, [saveState]);

  const deleteSelected = useCallback(() => {
    if (!fabricCanvasRef.current || !selectedObject || selectedObject._isBackground) return;
    fabricCanvasRef.current.remove(selectedObject);
    fabricCanvasRef.current.renderAll();
    setSelectedObject(null);
    saveState();
  }, [selectedObject, saveState]);

  const duplicateSelected = useCallback(() => {
    if (!fabricCanvasRef.current || !selectedObject) return;
    selectedObject.clone((cloned: any) => {
      cloned.set({ left: (cloned.left || 0) + 20, top: (cloned.top || 0) + 20 });
      fabricCanvasRef.current.add(cloned);
      fabricCanvasRef.current.setActiveObject(cloned);
      fabricCanvasRef.current.renderAll();
    });
  }, [selectedObject]);

  const bringForward = useCallback(() => {
    if (!fabricCanvasRef.current || !selectedObject) return;
    fabricCanvasRef.current.bringObjectForward(selectedObject);
    fabricCanvasRef.current.renderAll();
  }, [selectedObject]);

  const sendBackward = useCallback(() => {
    if (!fabricCanvasRef.current || !selectedObject) return;
    fabricCanvasRef.current.sendObjectBackwards(selectedObject);
    fabricCanvasRef.current.renderAll();
  }, [selectedObject]);

  // Copy to clipboard
  const copySelected = useCallback(() => {
    if (!fabricCanvasRef.current || !selectedObject) return;
    selectedObject.clone((cloned: any) => {
      clipboardRef.current = cloned;
      toast.success('Copied to clipboard');
    });
  }, [selectedObject]);

  // Paste from clipboard
  const pasteFromClipboard = useCallback(() => {
    if (!fabricCanvasRef.current || !clipboardRef.current) return;
    clipboardRef.current.clone((cloned: any) => {
      cloned.set({
        left: (cloned.left || 0) + 20,
        top: (cloned.top || 0) + 20,
        evented: true
      });
      fabricCanvasRef.current.add(cloned);
      fabricCanvasRef.current.setActiveObject(cloned);
      fabricCanvasRef.current.requestRenderAll();
      saveState();
      toast.success('Pasted');
    });
  }, [saveState]);

  // Update layers list
  const updateLayersList = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    const objects = fabricCanvasRef.current.getObjects().map((obj: any, index: number) => ({
      id: index,
      type: obj.type || 'object',
      name: obj._isGeneratedImage ? 'Generated Image' :
            obj.type === 'textbox' || obj.type === 'Textbox' ? `Text: "${(obj.text || '').slice(0, 15)}..."` :
            obj.type === 'image' || obj.type === 'Image' ? 'Imported Image' :
            obj.type?.charAt(0).toUpperCase() + obj.type?.slice(1) || 'Object',
      visible: obj.visible !== false,
      locked: obj.lockMovementX && obj.lockMovementY,
      object: obj
    }));
    setCanvasObjects(objects.reverse()); // Reverse so top layer shows first
  }, []);

  // Update layers when panel opens or selection changes
  useEffect(() => {
    if (showLayers) {
      updateLayersList();
    }
  }, [showLayers, selectedObject, updateLayersList]);

  // Lock/unlock selected object
  const toggleLock = useCallback(() => {
    if (!fabricCanvasRef.current || !selectedObject) return;
    const isLocked = selectedObject.lockMovementX && selectedObject.lockMovementY;
    selectedObject.set({
      lockMovementX: !isLocked,
      lockMovementY: !isLocked,
      lockScalingX: !isLocked,
      lockScalingY: !isLocked,
      lockRotation: !isLocked,
      hasControls: isLocked,
      selectable: true
    });
    fabricCanvasRef.current.requestRenderAll();
    updateLayersList();
    toast.success(isLocked ? 'Object unlocked' : 'Object locked');
  }, [selectedObject, updateLayersList]);

  // Toggle object visibility
  const toggleVisibility = useCallback((obj: any) => {
    if (!fabricCanvasRef.current) return;
    obj.set('visible', !obj.visible);
    fabricCanvasRef.current.requestRenderAll();
    updateLayersList();
  }, [updateLayersList]);

  // Select object from layers panel
  const selectFromLayers = useCallback((obj: any) => {
    if (!fabricCanvasRef.current) return;
    fabricCanvasRef.current.setActiveObject(obj);
    fabricCanvasRef.current.requestRenderAll();
  }, []);

  // Group selected objects
  const groupSelected = useCallback(() => {
    if (!fabricCanvasRef.current || !fabricRef.current) return;
    const activeSelection = fabricCanvasRef.current.getActiveObject();
    if (!activeSelection || activeSelection.type !== 'activeSelection') {
      toast.error('Select multiple objects to group (Shift+click)');
      return;
    }
    const fabric = fabricRef.current;
    const group = new fabric.Group(activeSelection.getObjects(), {
      cornerSize: 20,
      cornerColor: '#00d4ff',
      cornerStrokeColor: '#ffffff',
      borderColor: '#00d4ff',
      transparentCorners: false,
      cornerStyle: 'circle'
    });
    fabricCanvasRef.current.discardActiveObject();
    activeSelection.getObjects().forEach((obj: any) => fabricCanvasRef.current.remove(obj));
    fabricCanvasRef.current.add(group);
    fabricCanvasRef.current.setActiveObject(group);
    fabricCanvasRef.current.requestRenderAll();
    saveState();
    toast.success('Objects grouped');
  }, [saveState]);

  // Ungroup selected group
  const ungroupSelected = useCallback(() => {
    if (!fabricCanvasRef.current || !selectedObject || selectedObject.type !== 'group') {
      toast.error('Select a group to ungroup');
      return;
    }
    const items = selectedObject.getObjects();
    selectedObject._restoreObjectsState();
    fabricCanvasRef.current.remove(selectedObject);
    items.forEach((obj: any) => {
      fabricCanvasRef.current.add(obj);
    });
    fabricCanvasRef.current.discardActiveObject();
    fabricCanvasRef.current.requestRenderAll();
    saveState();
    toast.success('Group ungrouped');
  }, [selectedObject, saveState]);

  // Update opacity
  const updateOpacity = useCallback((value: number) => {
    if (!fabricCanvasRef.current || !selectedObject) return;
    setObjectOpacity(value);
    selectedObject.set('opacity', value / 100);
    fabricCanvasRef.current.requestRenderAll();
  }, [selectedObject]);

  // Update shadow
  const updateShadow = useCallback(() => {
    if (!fabricCanvasRef.current || !selectedObject || !fabricRef.current) return;
    const fabric = fabricRef.current;
    if (shadowEnabled) {
      selectedObject.set('shadow', new fabric.Shadow({
        color: shadowColor,
        blur: shadowBlur,
        offsetX: shadowOffsetX,
        offsetY: shadowOffsetY
      }));
    } else {
      selectedObject.set('shadow', null);
    }
    fabricCanvasRef.current.requestRenderAll();
  }, [selectedObject, shadowEnabled, shadowBlur, shadowOffsetX, shadowOffsetY, shadowColor]);

  // Apply shadow when settings change
  useEffect(() => {
    updateShadow();
  }, [shadowEnabled, shadowBlur, shadowOffsetX, shadowOffsetY, shadowColor, updateShadow]);

  // Update effect state when selection changes
  useEffect(() => {
    if (selectedObject) {
      setObjectOpacity(Math.round((selectedObject.opacity ?? 1) * 100));
      const shadow = selectedObject.shadow;
      if (shadow) {
        setShadowEnabled(true);
        setShadowBlur(shadow.blur || 10);
        setShadowOffsetX(shadow.offsetX || 5);
        setShadowOffsetY(shadow.offsetY || 5);
        setShadowColor(shadow.color || 'rgba(0,0,0,0.5)');
      } else {
        setShadowEnabled(false);
      }
    }
  }, [selectedObject]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const isMod = e.ctrlKey || e.metaKey;

      // Delete
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedObject && !selectedObject._isBackground) {
        e.preventDefault();
        deleteSelected();
      }
      // Copy (Ctrl/Cmd + C)
      else if (isMod && e.key === 'c' && selectedObject) {
        e.preventDefault();
        copySelected();
      }
      // Paste (Ctrl/Cmd + V)
      else if (isMod && e.key === 'v') {
        e.preventDefault();
        pasteFromClipboard();
      }
      // Duplicate (Ctrl/Cmd + D)
      else if (isMod && e.key === 'd' && selectedObject) {
        e.preventDefault();
        duplicateSelected();
      }
      // Undo (Ctrl/Cmd + Z)
      else if (isMod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Redo (Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y)
      else if ((isMod && e.shiftKey && e.key === 'z') || (isMod && e.key === 'y')) {
        e.preventDefault();
        redo();
      }
      // Group (Ctrl/Cmd + G)
      else if (isMod && e.key === 'g' && !e.shiftKey) {
        e.preventDefault();
        groupSelected();
      }
      // Ungroup (Ctrl/Cmd + Shift + G)
      else if (isMod && e.shiftKey && e.key === 'G') {
        e.preventDefault();
        ungroupSelected();
      }
      // Lock/Unlock (Ctrl/Cmd + L)
      else if (isMod && e.key === 'l' && selectedObject) {
        e.preventDefault();
        toggleLock();
      }
      // Bring Forward (])
      else if (e.key === ']' && selectedObject) {
        e.preventDefault();
        bringForward();
      }
      // Send Backward ([)
      else if (e.key === '[' && selectedObject) {
        e.preventDefault();
        sendBackward();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedObject, deleteSelected, copySelected, pasteFromClipboard, duplicateSelected, undo, redo, groupSelected, ungroupSelected, toggleLock, bringForward, sendBackward]);

  const updateTextStyle = useCallback((property: string, value: any) => {
    if (!fabricCanvasRef.current || !selectedObject) return;
    selectedObject.set(property, value);
    fabricCanvasRef.current.renderAll();
    setTextOptions((prev) => ({ ...prev, [property]: value }));
  }, [selectedObject]);

  const updateObjectColor = useCallback((color: string) => {
    if (!fabricCanvasRef.current || !selectedObject) return;
    selectedObject.set('fill', color);
    fabricCanvasRef.current.renderAll();
    setTextOptions((prev) => ({ ...prev, fill: color }));
  }, [selectedObject]);

  const exportCanvas = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    const dataUrl = fabricCanvasRef.current.toDataURL({ format: 'png', quality: 1 });
    const link = document.createElement('a');
    link.download = `signage-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  }, []);

  const saveToLibrary = useCallback(async () => {
    if (!fabricCanvasRef.current || !onSave) return;
    setIsSaving(true);
    try {
      const canvas = fabricCanvasRef.current;
      canvas.renderAll();
      const dataUrl = canvas.toDataURL({ format: 'png', quality: 1, multiplier: 1 });
      if (!dataUrl || dataUrl.length < 100) {
        alert('Failed to capture canvas');
        setIsSaving(false);
        return;
      }
      await onSave(dataUrl);
    } catch (error) {
      alert('Failed to save: ' + (error as Error).message);
    } finally {
      setIsSaving(false);
    }
  }, [onSave]);

  const clearCanvas = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    const objects = fabricCanvasRef.current.getObjects();
    objects.forEach((obj: any) => {
      if (!obj._isBackground) fabricCanvasRef.current.remove(obj);
    });
    fabricCanvasRef.current.renderAll();
  }, []);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-800 rounded-lg">
        <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
      </div>
    );
  }

  const isTextSelected = selectedObject?.type === 'textbox' || selectedObject?.type === 'Textbox';
  const filteredTemplates = selectedCategory ? TEMPLATES.filter(t => t.category === selectedCategory) : TEMPLATES;

  return (
    <div className="relative">
      {/* Main Editor */}
      <div className="flex flex-col gap-4">
        {/* Toolbar */}
        <div className="bg-gray-800 rounded-lg p-3 flex flex-wrap items-center gap-2">
          {/* Undo/Redo */}
          <div className="flex items-center gap-1 border-r border-gray-600 pr-3">
            <button onClick={undo} disabled={!canUndo} className="p-2 hover:bg-gray-700 rounded-lg text-gray-300 hover:text-white disabled:opacity-30" title="Undo">
              <Undo2 className="w-5 h-5" />
            </button>
            <button onClick={redo} disabled={!canRedo} className="p-2 hover:bg-gray-700 rounded-lg text-gray-300 hover:text-white disabled:opacity-30" title="Redo">
              <Redo2 className="w-5 h-5" />
            </button>
          </div>

          {/* AI Tools */}
          <div className="relative flex items-center gap-1 border-r border-gray-600 pr-3">
            <button
              onClick={() => setShowAIMenu(!showAIMenu)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${showAIMenu ? 'bg-purple-600 text-white' : 'bg-purple-600/20 text-purple-400 hover:bg-purple-600/40'}`}
            >
              <Wand2 className="w-4 h-4" />
              <span className="text-sm font-medium">AI Tools</span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {showAIMenu && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-gray-800 rounded-lg border border-gray-600 shadow-xl z-50 p-2">
                <div className="text-xs text-gray-400 px-2 py-1 font-medium">Quick Actions</div>
                <button onClick={() => { handleRemoveBackground(); setShowAIMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-700 rounded-lg text-left">
                  <ImageOff className="w-4 h-4 text-purple-400" />
                  <div>
                    <div className="text-sm text-white">Remove Background</div>
                    <div className="text-xs text-gray-400">Get transparent PNG</div>
                  </div>
                </button>
                <button onClick={() => { handleSearchReplace(); setShowAIMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-700 rounded-lg text-left">
                  <Replace className="w-4 h-4 text-purple-400" />
                  <div>
                    <div className="text-sm text-white">Search & Replace</div>
                    <div className="text-xs text-gray-400">Find and swap objects</div>
                  </div>
                </button>
                <button onClick={() => { handleReplaceBackground(); setShowAIMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-700 rounded-lg text-left">
                  <RefreshCw className="w-4 h-4 text-purple-400" />
                  <div>
                    <div className="text-sm text-white">Replace Background</div>
                    <div className="text-xs text-gray-400">Generate new background</div>
                  </div>
                </button>
                <button onClick={() => { handleUpscale(); setShowAIMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-700 rounded-lg text-left">
                  <ZoomIn className="w-4 h-4 text-purple-400" />
                  <div>
                    <div className="text-sm text-white">Upscale 4x</div>
                    <div className="text-xs text-gray-400">Increase resolution</div>
                  </div>
                </button>

                <div className="border-t border-gray-700 my-2" />
                <div className="text-xs text-gray-400 px-2 py-1 font-medium">Extend Image</div>
                <div className="grid grid-cols-4 gap-1 px-2">
                  <button onClick={() => { handleOutpaint('left'); setShowAIMenu(false); }} className="p-2 hover:bg-gray-700 rounded text-gray-300" title="Extend Left">
                    <ChevronRight className="w-4 h-4 rotate-180" />
                  </button>
                  <button onClick={() => { handleOutpaint('up'); setShowAIMenu(false); }} className="p-2 hover:bg-gray-700 rounded text-gray-300" title="Extend Up">
                    <ChevronRight className="w-4 h-4 -rotate-90" />
                  </button>
                  <button onClick={() => { handleOutpaint('down'); setShowAIMenu(false); }} className="p-2 hover:bg-gray-700 rounded text-gray-300" title="Extend Down">
                    <ChevronRight className="w-4 h-4 rotate-90" />
                  </button>
                  <button onClick={() => { handleOutpaint('right'); setShowAIMenu(false); }} className="p-2 hover:bg-gray-700 rounded text-gray-300" title="Extend Right">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="border-t border-gray-700 my-2" />
                <div className="text-xs text-gray-400 px-2 py-1 font-medium">Brush Tools</div>
                <button onClick={() => { setAITool('erase'); setShowAIMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-700 rounded-lg text-left">
                  <Eraser className="w-4 h-4 text-red-400" />
                  <div>
                    <div className="text-sm text-white">AI Erase</div>
                    <div className="text-xs text-gray-400">Paint over areas to remove</div>
                  </div>
                </button>
                <button onClick={() => { setAITool('inpaint'); setShowAIMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-700 rounded-lg text-left">
                  <Paintbrush className="w-4 h-4 text-green-400" />
                  <div>
                    <div className="text-sm text-white">AI Fill</div>
                    <div className="text-xs text-gray-400">Paint area, describe content</div>
                  </div>
                </button>

                <div className="border-t border-gray-700 my-2" />
                <div className="text-xs text-gray-400 px-2 py-1 font-medium">Analysis</div>
                <button onClick={() => { handleCritique(); setShowAIMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-700 rounded-lg text-left">
                  <CheckCircle className="w-4 h-4 text-yellow-400" />
                  <div>
                    <div className="text-sm text-white">AI Design Critic</div>
                    <div className="text-xs text-gray-400">Check readability, contrast & composition</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Copy Assist Toggle */}
          <div className="flex items-center gap-1 border-r border-gray-600 pr-3">
            <button
              onClick={() => setShowCopyAssist(!showCopyAssist)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${showCopyAssist ? 'bg-green-600 text-white' : 'bg-green-600/20 text-green-400 hover:bg-green-600/40'}`}
            >
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm font-medium">Copy Assist</span>
            </button>
          </div>

          {/* Templates */}
          <div className="flex items-center gap-1 border-r border-gray-600 pr-3">
            <button onClick={() => setShowTemplates(!showTemplates)} className={`p-2 rounded-lg transition ${showTemplates ? 'bg-brand-500 text-white' : 'hover:bg-gray-700 text-gray-300'}`} title="Templates">
              <LayoutTemplate className="w-5 h-5" />
            </button>
          </div>

          {/* Add Elements */}
          <div className="flex items-center gap-1 border-r border-gray-600 pr-3">
            <button onClick={addText} className="p-2 hover:bg-gray-700 rounded-lg text-gray-300" title="Add Text"><Type className="w-5 h-5" /></button>
            <button onClick={() => addShape('rect')} className="p-2 hover:bg-gray-700 rounded-lg text-gray-300" title="Rectangle"><Square className="w-5 h-5" /></button>
            <button onClick={() => addShape('circle')} className="p-2 hover:bg-gray-700 rounded-lg text-gray-300" title="Circle"><Circle className="w-5 h-5" /></button>
            <button onClick={() => addShape('triangle')} className="p-2 hover:bg-gray-700 rounded-lg text-gray-300" title="Triangle"><Triangle className="w-5 h-5" /></button>
            <button onClick={() => addShape('star')} className="p-2 hover:bg-gray-700 rounded-lg text-gray-300" title="Star"><Star className="w-5 h-5" /></button>
            <button onClick={() => addShape('line')} className="p-2 hover:bg-gray-700 rounded-lg text-gray-300" title="Line"><Minus className="w-5 h-5" /></button>
          </div>

          {/* Image Import/Overlay */}
          <div className="flex items-center gap-1 border-r border-gray-600 pr-3">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded-lg text-gray-300" title="Upload new image">
              <Upload className="w-5 h-5" />
              <span className="text-sm">Upload</span>
            </button>
            <button onClick={openLibrary} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${showLibrary ? 'bg-brand-500 text-white' : 'hover:bg-gray-700 text-gray-300'}`} title="Browse content library">
              <FolderOpen className="w-5 h-5" />
              <span className="text-sm">Library</span>
            </button>
          </div>

          {/* Text Formatting */}
          {isTextSelected && (
            <>
              <div className="flex items-center gap-1 border-r border-gray-600 pr-3">
                <select value={textOptions.fontFamily} onChange={(e) => updateTextStyle('fontFamily', e.target.value)} className="bg-gray-700 text-white text-sm rounded px-2 py-1.5">
                  {FONTS.map(font => <option key={font} value={font}>{font}</option>)}
                </select>
                <input type="number" value={textOptions.fontSize} onChange={(e) => updateTextStyle('fontSize', Number(e.target.value))} className="bg-gray-700 text-white text-sm rounded px-2 py-1.5 w-16" min={8} max={200} />
              </div>
              <div className="flex items-center gap-1 border-r border-gray-600 pr-3">
                <button onClick={() => updateTextStyle('fontWeight', textOptions.fontWeight === 'bold' ? 'normal' : 'bold')} className={`p-2 rounded-lg ${textOptions.fontWeight === 'bold' ? 'bg-brand-500 text-white' : 'hover:bg-gray-700 text-gray-300'}`}><Bold className="w-4 h-4" /></button>
                <button onClick={() => updateTextStyle('fontStyle', textOptions.fontStyle === 'italic' ? 'normal' : 'italic')} className={`p-2 rounded-lg ${textOptions.fontStyle === 'italic' ? 'bg-brand-500 text-white' : 'hover:bg-gray-700 text-gray-300'}`}><Italic className="w-4 h-4" /></button>
                <button onClick={() => updateTextStyle('underline', !textOptions.underline)} className={`p-2 rounded-lg ${textOptions.underline ? 'bg-brand-500 text-white' : 'hover:bg-gray-700 text-gray-300'}`}><Underline className="w-4 h-4" /></button>
              </div>
              <div className="flex items-center gap-1 border-r border-gray-600 pr-3">
                <button onClick={() => updateTextStyle('textAlign', 'left')} className={`p-2 rounded-lg ${textOptions.textAlign === 'left' ? 'bg-brand-500 text-white' : 'hover:bg-gray-700 text-gray-300'}`}><AlignLeft className="w-4 h-4" /></button>
                <button onClick={() => updateTextStyle('textAlign', 'center')} className={`p-2 rounded-lg ${textOptions.textAlign === 'center' ? 'bg-brand-500 text-white' : 'hover:bg-gray-700 text-gray-300'}`}><AlignCenter className="w-4 h-4" /></button>
                <button onClick={() => updateTextStyle('textAlign', 'right')} className={`p-2 rounded-lg ${textOptions.textAlign === 'right' ? 'bg-brand-500 text-white' : 'hover:bg-gray-700 text-gray-300'}`}><AlignRight className="w-4 h-4" /></button>
              </div>
            </>
          )}

          {/* Colors */}
          {selectedObject && !selectedObject._isBackground && (
            <div className="relative flex items-center gap-1 border-r border-gray-600 pr-3">
              <button onClick={() => setShowColorPicker(!showColorPicker)} className="w-8 h-8 rounded border-2 border-gray-500 hover:border-white flex items-center justify-center" style={{ backgroundColor: textOptions.fill }} title="Pick color">
                <Palette className="w-4 h-4 text-white drop-shadow-md" />
              </button>
              {showColorPicker && (
                <div className="absolute top-full left-0 mt-2 p-3 bg-gray-800 rounded-lg border border-gray-600 shadow-xl z-50 w-72">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-300 font-medium">Colors</span>
                    <button onClick={() => setShowColorPicker(false)} className="text-gray-400 hover:text-white"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="grid grid-cols-10 gap-1 mb-3">
                    {PRESET_COLORS.map(color => (
                      <button key={color} onClick={() => { updateObjectColor(color); setShowColorPicker(false); }} className="w-6 h-6 rounded border border-gray-600 hover:scale-110 hover:border-white transition" style={{ backgroundColor: color }} />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-700">
                    <span className="text-xs text-gray-400">Custom:</span>
                    <input type="color" value={textOptions.fill} onChange={(e) => updateObjectColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer bg-transparent" />
                    <input type="text" value={textOptions.fill} onChange={(e) => { if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) updateObjectColor(e.target.value); }} className="flex-1 bg-gray-700 text-white text-xs px-2 py-1 rounded" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Clipboard */}
          <div className="flex items-center gap-1 border-r border-gray-600 pr-3">
            <button onClick={copySelected} disabled={!selectedObject} className="p-2 hover:bg-gray-700 rounded-lg text-gray-300 disabled:opacity-30" title="Copy (Ctrl+C)"><Clipboard className="w-4 h-4" /></button>
            <button onClick={pasteFromClipboard} className="p-2 hover:bg-gray-700 rounded-lg text-gray-300" title="Paste (Ctrl+V)"><ClipboardPaste className="w-4 h-4" /></button>
          </div>

          {/* Object Actions */}
          {selectedObject && !selectedObject._isBackground && (
            <div className="flex items-center gap-1 border-r border-gray-600 pr-3">
              <button onClick={duplicateSelected} className="p-2 hover:bg-gray-700 rounded-lg text-gray-300" title="Duplicate (Ctrl+D)"><Copy className="w-4 h-4" /></button>
              <button onClick={bringForward} className="p-2 hover:bg-gray-700 rounded-lg text-gray-300" title="Bring Forward (])"><ChevronUp className="w-4 h-4" /></button>
              <button onClick={sendBackward} className="p-2 hover:bg-gray-700 rounded-lg text-gray-300" title="Send Backward ([)"><ChevronDown className="w-4 h-4" /></button>
              <button onClick={toggleLock} className="p-2 hover:bg-gray-700 rounded-lg text-gray-300" title="Lock/Unlock (Ctrl+L)">
                {selectedObject?.lockMovementX ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              </button>
              <button onClick={deleteSelected} className="p-2 hover:bg-red-600 rounded-lg text-gray-300" title="Delete"><Trash2 className="w-4 h-4" /></button>
            </div>
          )}

          {/* Effects (when object selected) */}
          {selectedObject && !selectedObject._isBackground && (
            <div className="flex items-center gap-1 border-r border-gray-600 pr-3">
              <button onClick={() => setShowEffects(!showEffects)} className={`p-2 rounded-lg ${showEffects ? 'bg-orange-600 text-white' : 'hover:bg-gray-700 text-gray-300'}`} title="Effects (Opacity, Shadow)">
                <SunDim className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Group/Ungroup */}
          <div className="flex items-center gap-1 border-r border-gray-600 pr-3">
            <button onClick={groupSelected} className="p-2 hover:bg-gray-700 rounded-lg text-gray-300" title="Group (Ctrl+G)"><Group className="w-4 h-4" /></button>
            <button onClick={ungroupSelected} className="p-2 hover:bg-gray-700 rounded-lg text-gray-300" title="Ungroup (Ctrl+Shift+G)"><Ungroup className="w-4 h-4" /></button>
          </div>

          {/* Layers & Grid */}
          <div className="flex items-center gap-1 border-r border-gray-600 pr-3">
            <button onClick={() => { setShowLayers(!showLayers); if (!showLayers) updateLayersList(); }} className={`p-2 rounded-lg ${showLayers ? 'bg-blue-600 text-white' : 'hover:bg-gray-700 text-gray-300'}`} title="Layers Panel">
              <Layers className="w-5 h-5" />
            </button>
            <button onClick={() => setSnapToGrid(!snapToGrid)} className={`p-2 rounded-lg ${snapToGrid ? 'bg-green-600 text-white' : 'hover:bg-gray-700 text-gray-300'}`} title={`Snap to Grid: ${snapToGrid ? 'ON' : 'OFF'}`}>
              <Grid3X3 className="w-5 h-5" />
            </button>
          </div>

          {/* Canvas Actions */}
          <div className="flex items-center gap-1 ml-auto">
            <button onClick={clearCanvas} className="p-2 hover:bg-gray-700 rounded-lg text-gray-300" title="Clear"><RotateCcw className="w-4 h-4" /></button>

            {/* Responsive Adapt */}
            <div className="relative">
              <button
                onClick={() => setShowAdaptMenu(!showAdaptMenu)}
                disabled={adaptLoading}
                className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg"
                title="Adapt design to different screen sizes"
              >
                {adaptLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Maximize2 className="w-4 h-4" />}
                Adapt
              </button>
              {showAdaptMenu && (
                <div className="absolute top-full right-0 mt-1 bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-2 min-w-[200px] z-50">
                  <div className="text-xs text-gray-400 px-2 py-1 font-medium">Adapt to size</div>
                  {ADAPT_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => handleAdapt(preset.width, preset.height)}
                      disabled={width === preset.width && height === preset.height}
                      className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-700 rounded-lg text-left disabled:opacity-30"
                    >
                      <span className="text-sm text-white">{preset.label}</span>
                      <span className="text-xs text-gray-400">{preset.width}x{preset.height}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {onCanvaEdit && (
              <button onClick={onCanvaEdit} className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                <Palette className="w-4 h-4" />Canva
              </button>
            )}
            {onSave && (
              <button onClick={saveToLibrary} disabled={isSaving} className="flex items-center gap-2 px-3 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-lg">
                {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : <><Save className="w-4 h-4" />Save</>}
              </button>
            )}
            <button onClick={exportCanvas} className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg">
              <Download className="w-4 h-4" />Export
            </button>
          </div>
        </div>

        {/* AI Tool Mode Bar */}
        {aiTool !== 'none' && (
          <div className="bg-purple-900/30 border border-purple-500/50 rounded-lg p-3 flex items-center gap-4">
            <div className="flex items-center gap-2">
              {aiTool === 'erase' ? <Eraser className="w-5 h-5 text-red-400" /> : <Paintbrush className="w-5 h-5 text-green-400" />}
              <span className="text-white font-medium">
                {aiTool === 'erase' ? 'AI Erase Mode' : 'AI Fill Mode'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">Brush:</span>
              <input type="range" min={5} max={100} value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-24" />
              <span className="text-white text-sm w-8">{brushSize}px</span>
            </div>
            {aiTool === 'inpaint' && (
              <input
                type="text"
                placeholder="What should appear here?"
                value={inpaintPrompt}
                onChange={(e) => setInpaintPrompt(e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-1.5 text-white text-sm"
              />
            )}
            <button onClick={clearMask} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm">
              Clear Mask
            </button>
            <button
              onClick={aiTool === 'erase' ? handleErase : handleInpaint}
              className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium"
            >
              Apply {aiTool === 'erase' ? 'Erase' : 'Fill'}
            </button>
            <button onClick={() => { setAITool('none'); clearMask(); }} className="p-1.5 hover:bg-gray-700 rounded-lg text-gray-400">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Templates Panel */}
        {showTemplates && (
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">Templates</h3>
              <button onClick={() => setShowTemplates(false)} className="p-1 hover:bg-gray-700 rounded"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="flex gap-2 mb-4">
              <button onClick={() => setSelectedCategory(null)} className={`px-3 py-1 rounded-full text-sm ${!selectedCategory ? 'bg-brand-500 text-white' : 'bg-gray-700 text-gray-300'}`}>All</button>
              {TEMPLATE_CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3 py-1 rounded-full text-sm ${selectedCategory === cat ? 'bg-brand-500 text-white' : 'bg-gray-700 text-gray-300'}`}>{cat}</button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {filteredTemplates.map(template => (
                <button key={template.id} onClick={() => applyTemplate(template)} className="bg-gray-900 rounded-lg p-4 text-center hover:bg-gray-700 transition border border-gray-700 hover:border-brand-500">
                  <div className="text-4xl mb-2">{template.thumbnail}</div>
                  <div className="text-sm text-white">{template.name}</div>
                  <div className="text-xs text-gray-500">{template.category}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Canvas */}
        <div
          ref={containerRef}
          className={`bg-gray-900 rounded-lg p-6 overflow-auto relative min-h-[500px] transition-all ${isDraggingOver ? 'ring-4 ring-brand-500 ring-opacity-50 bg-brand-900/20' : ''}`}
          onDragOver={handleCanvasDragOver}
          onDragLeave={handleCanvasDragLeave}
          onDrop={handleCanvasDrop}
        >
          {/* Drop overlay */}
          {isDraggingOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-brand-900/40 z-30 pointer-events-none rounded-lg border-2 border-dashed border-brand-400">
              <div className="text-center">
                <Upload className="w-12 h-12 text-brand-400 mx-auto mb-2" />
                <p className="text-brand-300 font-medium text-lg">Drop image here</p>
                <p className="text-brand-400/70 text-sm">Image will be added as an overlay</p>
              </div>
            </div>
          )}
          {(imageLoading || aiLoading) && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 z-20">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-2" />
                <p className="text-gray-300">{aiLoadingMessage || 'Loading...'}</p>
              </div>
            </div>
          )}
          <div className="flex items-center justify-center relative" style={{ minHeight: `${height * scale + 20}px` }}>
            <div style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }} className="relative">
              <canvas ref={canvasRef} className="border border-gray-700 rounded" />
              {/* Mask Canvas Overlay */}
              {aiTool !== 'none' && (
                <canvas
                  ref={maskCanvasRef}
                  width={width}
                  height={height}
                  className="absolute top-0 left-0 border border-purple-500 rounded cursor-crosshair"
                  style={{ opacity: 0.5, mixBlendMode: 'screen' }}
                  onMouseDown={handleMaskMouseDown}
                  onMouseMove={handleMaskMouseMove}
                  onMouseUp={handleMaskMouseUp}
                  onMouseLeave={handleMaskMouseUp}
                />
              )}
            </div>
          </div>
        </div>

        <div className="text-sm text-gray-400 text-center">
          Ctrl+C/V: Copy/Paste • Ctrl+Z/Y: Undo/Redo • Ctrl+D: Duplicate • Ctrl+G: Group • [ ]: Layer order • Delete: Remove
        </div>
      </div>

      {/* Copy Assist Sidebar - Overlay Panel */}
      {showCopyAssist && (
        <div className="absolute top-0 right-0 w-80 bg-gray-800 rounded-lg p-4 flex flex-col gap-4 max-h-[calc(100vh-200px)] overflow-y-auto shadow-2xl border border-gray-700 z-30">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-green-400" />
              Copy Assist
            </h3>
            <button onClick={() => setShowCopyAssist(false)} className="p-1 hover:bg-gray-700 rounded">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Context Input */}
          <div>
            <label className="text-sm text-gray-400 block mb-1">What is this signage for?</label>
            <textarea
              value={copyContext}
              onChange={(e) => setCopyContext(e.target.value)}
              placeholder="e.g., Summer sale at coffee shop, 20% off all drinks"
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm resize-none"
              rows={3}
            />
          </div>

          {/* Tone Select */}
          <div>
            <label className="text-sm text-gray-400 block mb-1">Tone</label>
            <select
              value={copyTone}
              onChange={(e) => setCopyTone(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="professional">Professional</option>
              <option value="playful">Playful</option>
              <option value="urgent">Urgent</option>
              <option value="luxurious">Luxurious</option>
              <option value="friendly">Friendly</option>
            </select>
          </div>

          {/* Generate Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleGenerateCopy}
              disabled={copyLoading || !copyContext}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-sm"
            >
              {copyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Generate Copy
            </button>
            <button
              onClick={handleSuggestPlacement}
              disabled={copyLoading}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm"
              title="Analyze image for text placement"
            >
              <Target className="w-4 h-4" />
            </button>
          </div>

          {/* Results */}
          {copyResult && (
            <div className="space-y-3 pt-3 border-t border-gray-700">
              <div className="text-sm text-gray-400 font-medium">Generated Copy</div>

              {copyResult.headline && (
                <div className="bg-gray-900 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-purple-400 font-medium">HEADLINE</span>
                    <button onClick={() => addTextFromCopy(copyResult.headline!, true)} className="text-xs text-green-400 hover:text-green-300">+ Add</button>
                  </div>
                  <p className="text-white font-semibold">{copyResult.headline}</p>
                </div>
              )}

              {copyResult.subheadline && (
                <div className="bg-gray-900 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-blue-400 font-medium">SUBHEADLINE</span>
                    <button onClick={() => addTextFromCopy(copyResult.subheadline!)} className="text-xs text-green-400 hover:text-green-300">+ Add</button>
                  </div>
                  <p className="text-gray-200">{copyResult.subheadline}</p>
                </div>
              )}

              {copyResult.cta && (
                <div className="bg-gray-900 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-orange-400 font-medium">CALL TO ACTION</span>
                    <button onClick={() => addTextFromCopy(copyResult.cta!)} className="text-xs text-green-400 hover:text-green-300">+ Add</button>
                  </div>
                  <p className="text-white font-bold">{copyResult.cta}</p>
                </div>
              )}

              {copyResult.body && (
                <div className="bg-gray-900 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400 font-medium">BODY</span>
                    <button onClick={() => addTextFromCopy(copyResult.body!)} className="text-xs text-green-400 hover:text-green-300">+ Add</button>
                  </div>
                  <p className="text-gray-300 text-sm">{copyResult.body}</p>
                </div>
              )}

              {/* Alternatives */}
              {copyResult.alternatives?.headlines && copyResult.alternatives.headlines.length > 0 && (
                <div className="pt-2">
                  <div className="text-xs text-gray-500 mb-2">Alternative Headlines</div>
                  {copyResult.alternatives.headlines.map((h, i) => (
                    <button key={i} onClick={() => addTextFromCopy(h, true)} className="w-full text-left text-sm text-gray-400 hover:text-white py-1 px-2 hover:bg-gray-700 rounded">
                      {h}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Placement Suggestions */}
          {placementSuggestions && (
            <div className="space-y-3 pt-3 border-t border-gray-700">
              <div className="text-sm text-gray-400 font-medium">Placement Suggestions</div>

              <div className="bg-gray-900 rounded-lg p-3">
                <div className="text-xs text-blue-400 font-medium mb-2">RECOMMENDED COLORS</div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded border border-gray-600" style={{ backgroundColor: placementSuggestions.colorSuggestions.textColor }} />
                  <span className="text-gray-300 text-sm">{placementSuggestions.colorSuggestions.textColor}</span>
                </div>
                <p className="text-gray-500 text-xs mt-2">{placementSuggestions.colorSuggestions.reasoning}</p>
              </div>

              {placementSuggestions.placements.map((p, i) => (
                <div key={i} className="bg-gray-900 rounded-lg p-3">
                  <div className="text-xs text-purple-400 font-medium mb-1">ZONE: {p.zone.toUpperCase()}</div>
                  <p className="text-gray-400 text-sm">{p.reasoning}</p>
                  <p className="text-gray-500 text-xs mt-1">Position: {p.x}% from left, {p.y}% from top</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI Design Critique Panel - Overlay */}
      {showCritique && (
        <div className="absolute top-0 right-0 w-80 bg-gray-800 rounded-lg p-4 flex flex-col gap-4 max-h-[calc(100vh-200px)] overflow-y-auto shadow-2xl border border-gray-700 z-30">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-yellow-400" />
              Design Critique
            </h3>
            <button onClick={() => setShowCritique(false)} className="p-1 hover:bg-gray-700 rounded">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {critiqueLoading && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
              <p className="text-sm text-gray-400">Analyzing your design...</p>
            </div>
          )}

          {critiqueResult && !critiqueLoading && (
            <>
              {/* Score Badge */}
              <div className="flex items-center gap-3">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${
                  critiqueResult.score >= 80 ? 'bg-green-600/20 text-green-400 border-2 border-green-500' :
                  critiqueResult.score >= 60 ? 'bg-yellow-600/20 text-yellow-400 border-2 border-yellow-500' :
                  'bg-red-600/20 text-red-400 border-2 border-red-500'
                }`}>
                  {critiqueResult.score}
                </div>
                <div className="flex-1">
                  <div className={`text-sm font-medium ${
                    critiqueResult.score >= 80 ? 'text-green-400' :
                    critiqueResult.score >= 60 ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {critiqueResult.score >= 80 ? 'Great Design' :
                     critiqueResult.score >= 60 ? 'Needs Improvement' :
                     'Major Issues'}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{critiqueResult.summary}</p>
                </div>
              </div>

              {/* Issues List */}
              {critiqueResult.issues.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs text-gray-400 font-medium">Issues Found ({critiqueResult.issues.length})</div>
                  {critiqueResult.issues.map((issue, i) => (
                    <div key={i} className="bg-gray-900 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        {issue.severity === 'error' ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        ) : issue.severity === 'warning' ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                        ) : (
                          <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        )}
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          issue.severity === 'error' ? 'bg-red-900/50 text-red-300' :
                          issue.severity === 'warning' ? 'bg-yellow-900/50 text-yellow-300' :
                          'bg-blue-900/50 text-blue-300'
                        }`}>
                          {issue.category}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300">{issue.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{issue.suggestion}</p>
                    </div>
                  ))}
                </div>
              )}

              {critiqueResult.issues.length === 0 && (
                <div className="text-center py-4">
                  <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No issues found! Your design looks great.</p>
                </div>
              )}

              {/* Re-analyze button */}
              <button
                onClick={handleCritique}
                disabled={critiqueLoading}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Re-analyze
              </button>
            </>
          )}
        </div>
      )}

      {/* Layers Panel - Left Side */}
      {showLayers && (
        <div className="absolute top-0 left-0 w-64 bg-gray-800 rounded-lg p-4 flex flex-col gap-3 max-h-[calc(100vh-200px)] overflow-y-auto shadow-2xl border border-gray-700 z-30">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-400" />
              Layers
            </h3>
            <button onClick={() => setShowLayers(false)} className="p-1 hover:bg-gray-700 rounded">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <div className="text-xs text-gray-500">Click to select • Eye to toggle visibility</div>
          <div className="space-y-1">
            {canvasObjects.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">No objects on canvas</p>
            ) : (
              canvasObjects.map((item, index) => (
                <div
                  key={index}
                  onClick={() => selectFromLayers(item.object)}
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition ${
                    selectedObject === item.object ? 'bg-blue-600/30 border border-blue-500' : 'hover:bg-gray-700 border border-transparent'
                  }`}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleVisibility(item.object); }}
                    className="p-1 hover:bg-gray-600 rounded"
                  >
                    {item.visible ? <Eye className="w-4 h-4 text-gray-300" /> : <EyeOff className="w-4 h-4 text-gray-500" />}
                  </button>
                  <span className={`flex-1 text-sm truncate ${item.visible ? 'text-white' : 'text-gray-500'}`}>
                    {item.name}
                  </span>
                  {item.locked && <Lock className="w-3 h-3 text-yellow-500" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Effects Panel - Below Layers or standalone */}
      {showEffects && selectedObject && (
        <div className="absolute top-0 left-72 w-64 bg-gray-800 rounded-lg p-4 flex flex-col gap-4 shadow-2xl border border-gray-700 z-30">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-white flex items-center gap-2">
              <SunDim className="w-5 h-5 text-orange-400" />
              Effects
            </h3>
            <button onClick={() => setShowEffects(false)} className="p-1 hover:bg-gray-700 rounded">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Opacity */}
          <div>
            <label className="text-sm text-gray-400 block mb-2">Opacity: {objectOpacity}%</label>
            <input
              type="range"
              min={0}
              max={100}
              value={objectOpacity}
              onChange={(e) => updateOpacity(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Shadow */}
          <div className="space-y-3 pt-3 border-t border-gray-700">
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={shadowEnabled}
                onChange={(e) => setShadowEnabled(e.target.checked)}
                className="rounded"
              />
              Drop Shadow
            </label>

            {shadowEnabled && (
              <div className="space-y-3 pl-2">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Blur: {shadowBlur}px</label>
                  <input
                    type="range"
                    min={0}
                    max={50}
                    value={shadowBlur}
                    onChange={(e) => setShadowBlur(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">X: {shadowOffsetX}</label>
                    <input
                      type="range"
                      min={-30}
                      max={30}
                      value={shadowOffsetX}
                      onChange={(e) => setShadowOffsetX(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Y: {shadowOffsetY}</label>
                    <input
                      type="range"
                      min={-30}
                      max={30}
                      value={shadowOffsetY}
                      onChange={(e) => setShadowOffsetY(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Shadow Color</label>
                  <input
                    type="color"
                    value={shadowColor.startsWith('rgba') ? '#000000' : shadowColor}
                    onChange={(e) => setShadowColor(e.target.value)}
                    className="w-full h-8 rounded cursor-pointer bg-transparent"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Animation */}
          <div className="space-y-3 pt-3 border-t border-gray-700">
            <label className="text-sm text-gray-300 font-medium flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-purple-400" />
              Animation
            </label>
            <select
              value={objectAnimation}
              onChange={(e) => {
                setObjectAnimation(e.target.value);
                if (selectedObject) {
                  selectedObject.set('animation', e.target.value);
                  if (e.target.value !== 'none' && ANIMATIONS[e.target.value as keyof typeof ANIMATIONS]) {
                    setAnimationDuration(ANIMATIONS[e.target.value as keyof typeof ANIMATIONS].duration);
                  }
                }
              }}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg text-sm border border-gray-600 focus:border-brand-500"
            >
              <option value="none">No Animation</option>
              {Object.entries(ANIMATIONS).map(([key, anim]) => (
                <option key={key} value={key}>{anim.name}</option>
              ))}
            </select>

            {objectAnimation !== 'none' && (
              <div>
                <label className="text-xs text-gray-500 block mb-1">Duration: {animationDuration}ms</label>
                <input
                  type="range"
                  min={200}
                  max={3000}
                  step={100}
                  value={animationDuration}
                  onChange={(e) => {
                    const dur = Number(e.target.value);
                    setAnimationDuration(dur);
                    if (selectedObject) {
                      selectedObject.set('animationDuration', dur);
                    }
                  }}
                  className="w-full"
                />
              </div>
            )}

            {objectAnimation !== 'none' && (
              <button
                onClick={() => setShowAnimationPreview(true)}
                className="w-full px-3 py-2 bg-purple-500/20 text-purple-300 rounded-lg text-sm hover:bg-purple-500/30 transition flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Preview Animation
              </button>
            )}
            <p className="text-xs text-gray-500">
              Animations play when content appears on displays
            </p>
          </div>
        </div>
      )}

      {/* Animation Preview Modal */}
      {showAnimationPreview && selectedObject && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Animation Preview</h3>
              <button
                onClick={() => setShowAnimationPreview(false)}
                className="p-2 hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div
              className="bg-gray-900 rounded-lg h-48 flex items-center justify-center overflow-hidden"
              key={`${objectAnimation}-${Date.now()}`}
            >
              <div
                className="text-4xl font-bold text-white"
                style={{
                  animation: objectAnimation === 'fade' ? `fadeIn ${animationDuration}ms forwards` :
                             objectAnimation === 'slide' ? `slideIn ${animationDuration}ms forwards` :
                             objectAnimation === 'zoom' ? `zoomIn ${animationDuration}ms forwards` :
                             objectAnimation === 'bounce' ? `bounce ${animationDuration}ms ease` : 'none',
                  opacity: objectAnimation === 'fade' ? 0 : 1,
                  transform: objectAnimation === 'slide' ? 'translateX(-100%)' :
                             objectAnimation === 'zoom' ? 'scale(0)' : 'none'
                }}
              >
                {selectedObject.type === 'i-text' || selectedObject.type === 'text' ? selectedObject.text : '●'}
              </div>
            </div>
            <p className="text-gray-400 text-sm mt-4 text-center">
              {ANIMATIONS[objectAnimation as keyof typeof ANIMATIONS]?.name || 'Select an animation'} - {animationDuration}ms
            </p>
            <button
              onClick={() => setShowAnimationPreview(false)}
              className="w-full mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Animation Keyframes */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        @keyframes zoomIn {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }
        @keyframes bounce {
          0%, 20%, 53%, 100% { transform: translateY(0); }
          40% { transform: translateY(-30px); }
          70% { transform: translateY(-15px); }
          90% { transform: translateY(-4px); }
        }
      `}</style>

      {/* Content Library Panel */}
      {showLibrary && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[600px] max-w-[90vw] bg-gray-800 rounded-lg p-4 shadow-2xl border border-gray-700 z-40">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-brand-400" />
              Content Library
            </h3>
            <button onClick={() => setShowLibrary(false)} className="p-1 hover:bg-gray-700 rounded">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <p className="text-sm text-gray-400 mb-4">Click an image to add it as an overlay</p>

          {libraryLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
            </div>
          ) : libraryContent.length === 0 ? (
            <div className="text-center py-12">
              <Image className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No images in your library yet</p>
              <p className="text-gray-500 text-sm mt-1">Upload images in the Content section first</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3 max-h-[400px] overflow-y-auto">
              {libraryContent.map((item) => (
                <button
                  key={item.id}
                  onClick={() => addFromLibrary(item)}
                  className="group relative aspect-square bg-gray-900 rounded-lg overflow-hidden border-2 border-transparent hover:border-brand-500 transition"
                >
                  <img
                    src={item.url.startsWith('/') ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${item.url}` : item.url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-end p-2">
                    <span className="text-white text-xs truncate w-full">{item.name}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
