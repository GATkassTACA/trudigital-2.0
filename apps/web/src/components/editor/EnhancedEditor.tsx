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
  RefreshCw
} from 'lucide-react';
import { TEMPLATES, TEMPLATE_CATEGORIES, Template } from './templates';
import { edit } from '@/lib/api';
import toast from 'react-hot-toast';

interface EnhancedEditorProps {
  backgroundImage?: string;
  width?: number;
  height?: number;
  onSave?: (dataUrl: string) => void;
  onCanvaEdit?: () => void;
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

export default function EnhancedEditor({
  backgroundImage,
  width = 1344,
  height = 768,
  onSave,
  onCanvaEdit
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

  // Mask drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [maskCtx, setMaskCtx] = useState<CanvasRenderingContext2D | null>(null);

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
      preserveObjectStacking: true
    });

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

  // Load background image
  useEffect(() => {
    if (!isLoaded || !fabricCanvasRef.current || !fabricRef.current || !backgroundImage) return;
    if (lastBackgroundRef.current === backgroundImage) return;
    lastBackgroundRef.current = backgroundImage;

    const fabric = fabricRef.current;
    const canvas = fabricCanvasRef.current;

    setImageLoading(true);

    const imgEl = document.createElement('img');
    imgEl.onload = () => {
      try {
        const scaleX = width / imgEl.width;
        const scaleY = height / imgEl.height;
        const FabricImage = fabric.FabricImage || fabric.Image;
        const bgImage = new FabricImage(imgEl);
        bgImage.set({ scaleX, scaleY, originX: 'left', originY: 'top' });
        canvas.backgroundImage = bgImage;
        canvas.renderAll();
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

  // Apply AI result to canvas
  const applyAIResult = useCallback((imageUrl: string) => {
    if (!fabricCanvasRef.current || !fabricRef.current) return;

    const fabric = fabricRef.current;
    const canvas = fabricCanvasRef.current;

    const imgEl = document.createElement('img');
    imgEl.onload = () => {
      const scaleX = width / imgEl.width;
      const scaleY = height / imgEl.height;
      const FabricImage = fabric.FabricImage || fabric.Image;
      const bgImage = new FabricImage(imgEl);
      bgImage.set({ scaleX, scaleY, originX: 'left', originY: 'top' });
      canvas.backgroundImage = bgImage;
      canvas.renderAll();
      saveState();
      lastBackgroundRef.current = imageUrl;
    };
    imgEl.src = imageUrl;
  }, [width, height, saveState]);

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
      })
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
      editable: true
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
      strokeWidth: 2
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

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fabricCanvasRef.current || !fabricRef.current) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const fabric = fabricRef.current;
      const FabricImage = fabric.FabricImage || fabric.Image;
      const imgEl = document.createElement('img');
      imgEl.onload = () => {
        const img = new FabricImage(imgEl, {
          left: width / 2 - imgEl.width / 4,
          top: height / 2 - imgEl.height / 4,
          scaleX: 0.5,
          scaleY: 0.5
        });
        fabricCanvasRef.current.add(img);
        fabricCanvasRef.current.setActiveObject(img);
        fabricCanvasRef.current.renderAll();
      };
      imgEl.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [width, height]);

  const applyTemplate = useCallback((template: Template) => {
    if (!fabricCanvasRef.current || !fabricRef.current) return;
    const fabric = fabricRef.current;
    const canvas = fabricCanvasRef.current;

    const objects = canvas.getObjects();
    objects.forEach((obj: any) => {
      if (!obj._isBackground) canvas.remove(obj);
    });

    template.elements.forEach((element) => {
      let obj;
      switch (element.type) {
        case 'text':
          obj = new fabric.Textbox(element.props.text || 'Text', { ...element.props, editable: true });
          break;
        case 'rect':
          obj = new fabric.Rect(element.props);
          break;
        case 'circle':
          obj = new fabric.Circle(element.props);
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

  // Keyboard shortcuts for delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't delete if user is typing in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedObject && !selectedObject._isBackground) {
        e.preventDefault();
        deleteSelected();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedObject, deleteSelected]);

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

          {/* Image Upload */}
          <div className="flex items-center gap-1 border-r border-gray-600 pr-3">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-gray-700 rounded-lg text-gray-300" title="Upload Image">
              <Upload className="w-5 h-5" />
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

          {/* Object Actions */}
          {selectedObject && !selectedObject._isBackground && (
            <div className="flex items-center gap-1 border-r border-gray-600 pr-3">
              <button onClick={duplicateSelected} className="p-2 hover:bg-gray-700 rounded-lg text-gray-300" title="Duplicate"><Copy className="w-4 h-4" /></button>
              <button onClick={bringForward} className="p-2 hover:bg-gray-700 rounded-lg text-gray-300" title="Bring Forward"><ChevronUp className="w-4 h-4" /></button>
              <button onClick={sendBackward} className="p-2 hover:bg-gray-700 rounded-lg text-gray-300" title="Send Backward"><ChevronDown className="w-4 h-4" /></button>
              <button onClick={deleteSelected} className="p-2 hover:bg-red-600 rounded-lg text-gray-300" title="Delete"><Trash2 className="w-4 h-4" /></button>
            </div>
          )}

          {/* Canvas Actions */}
          <div className="flex items-center gap-1 ml-auto">
            <button onClick={clearCanvas} className="p-2 hover:bg-gray-700 rounded-lg text-gray-300" title="Clear"><RotateCcw className="w-4 h-4" /></button>
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
        <div ref={containerRef} className="bg-gray-900 rounded-lg p-6 overflow-auto relative min-h-[500px]">
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
          Click to select • Double-click text to edit • Drag to move • Ctrl+Z to undo
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
    </div>
  );
}
