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
  Image as ImageIcon,
  Upload,
  Undo2,
  Redo2,
  LayoutTemplate,
  Triangle,
  Star,
  Minus,
  ArrowRight,
  Palette,
  X
} from 'lucide-react';
import { TEMPLATES, TEMPLATE_CATEGORIES, Template } from './templates';

interface EnhancedEditorProps {
  backgroundImage?: string;
  width?: number;
  height?: number;
  onSave?: (dataUrl: string) => void;
  onCanvaEdit?: () => void;
}

const FONTS = [
  // Sans-serif
  'Arial', 'Helvetica', 'Verdana', 'Tahoma', 'Trebuchet MS',
  'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins',
  'Inter', 'Nunito', 'Raleway', 'Ubuntu', 'Source Sans Pro',
  // Serif
  'Times New Roman', 'Georgia', 'Garamond', 'Palatino',
  'Playfair Display', 'Merriweather', 'Lora', 'PT Serif',
  // Display
  'Oswald', 'Bebas Neue', 'Anton', 'Archivo Black', 'Righteous',
  'Bangers', 'Pacifico', 'Lobster', 'Permanent Marker', 'Satisfy',
  // Monospace
  'Courier New', 'Consolas', 'Monaco', 'Fira Code', 'JetBrains Mono'
];

const PRESET_COLORS = [
  // Grayscale
  '#FFFFFF', '#F3F4F6', '#D1D5DB', '#9CA3AF', '#6B7280',
  '#4B5563', '#374151', '#1F2937', '#111827', '#000000',
  // Red
  '#FEE2E2', '#FECACA', '#FCA5A5', '#F87171', '#EF4444',
  '#DC2626', '#B91C1C', '#991B1B', '#7F1D1D',
  // Orange
  '#FFEDD5', '#FED7AA', '#FDBA74', '#FB923C', '#F97316',
  '#EA580C', '#C2410C', '#9A3412',
  // Yellow
  '#FEF9C3', '#FEF08A', '#FDE047', '#FACC15', '#EAB308',
  '#CA8A04', '#A16207', '#854D0E',
  // Green
  '#DCFCE7', '#BBF7D0', '#86EFAC', '#4ADE80', '#22C55E',
  '#16A34A', '#15803D', '#166534',
  // Teal
  '#CCFBF1', '#99F6E4', '#5EEAD4', '#2DD4BF', '#14B8A6',
  '#0D9488', '#0F766E', '#115E59',
  // Blue
  '#DBEAFE', '#BFDBFE', '#93C5FD', '#60A5FA', '#3B82F6',
  '#2563EB', '#1D4ED8', '#1E40AF',
  // Purple
  '#EDE9FE', '#DDD6FE', '#C4B5FD', '#A78BFA', '#8B5CF6',
  '#7C3AED', '#6D28D9', '#5B21B6',
  // Pink
  '#FCE7F3', '#FBCFE8', '#F9A8D4', '#F472B6', '#EC4899',
  '#DB2777', '#BE185D', '#9D174D',
  // Brand colors
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
];

export default function EnhancedEditor({
  backgroundImage,
  width = 1344,
  height = 768,
  onSave,
  onCanvaEdit
}: EnhancedEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);

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

  // Save state for undo/redo
  const saveState = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    const json = JSON.stringify(fabricCanvasRef.current.toJSON());

    // Remove any states after current index
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(json);
    historyIndexRef.current = historyRef.current.length - 1;

    // Limit history
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

    const fabric = fabricRef.current;
    const canvas = new fabric.Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: '#1a1a1a',
      selection: true,
      preserveObjectStacking: true
    });

    fabricCanvasRef.current = canvas;

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

    // Initial state
    saveState();

    return () => {
      canvas.dispose();
      window.removeEventListener('resize', updateScale);
    };
  }, [isLoaded, width, height, saveState]);

  // Load background image
  useEffect(() => {
    if (!isLoaded || !fabricCanvasRef.current || !fabricRef.current || !backgroundImage) return;

    const fabric = fabricRef.current;
    const canvas = fabricCanvasRef.current;

    setImageLoading(true);
    console.log('Loading background image, fabric version:', fabric.version || 'unknown');

    // Create image element
    const imgEl = document.createElement('img');

    imgEl.onload = () => {
      console.log('Image element loaded:', imgEl.width, 'x', imgEl.height);

      try {
        // In Fabric.js v7, use setBackgroundImage with an Image element
        // Scale to fit canvas
        const scaleX = width / imgEl.width;
        const scaleY = height / imgEl.height;

        // Try using canvas.backgroundImage directly (Fabric v7 approach)
        const FabricImage = fabric.FabricImage || fabric.Image;

        // Create the fabric image
        const bgImage = new FabricImage(imgEl);
        bgImage.set({
          scaleX: scaleX,
          scaleY: scaleY,
          originX: 'left',
          originY: 'top'
        });

        // Set as background
        canvas.backgroundImage = bgImage;
        canvas.renderAll();

        console.log('Background set successfully via backgroundImage property');
        setImageLoading(false);
      } catch (err) {
        console.error('Error setting background:', err);

        // Alternative: try setBackgroundImage method if available
        try {
          if (canvas.setBackgroundImage) {
            const FabricImage = fabric.FabricImage || fabric.Image;
            const bgImage = new FabricImage(imgEl);

            canvas.setBackgroundImage(bgImage, () => {
              canvas.renderAll();
              console.log('Background set via setBackgroundImage');
              setImageLoading(false);
            }, {
              scaleX: width / imgEl.width,
              scaleY: height / imgEl.height
            });
          } else {
            setImageLoading(false);
          }
        } catch (err2) {
          console.error('Fallback also failed:', err2);
          setImageLoading(false);
        }
      }
    };

    imgEl.onerror = (err) => {
      console.error('Failed to load image element:', err);
      setImageLoading(false);
    };

    // Don't set crossOrigin for data URLs
    if (!backgroundImage.startsWith('data:')) {
      imgEl.crossOrigin = 'anonymous';
    }
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

  // Undo/Redo
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

  // Add elements
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
        shape = new fabric.Polygon(points, {
          ...baseProps,
          left: width / 2,
          top: height / 2
        });
        break;
    }

    if (shape) {
      canvas.add(shape);
      canvas.setActiveObject(shape);
      canvas.renderAll();
    }
  }, [width, height]);

  // Image upload
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

  // Apply template
  const applyTemplate = useCallback((template: Template) => {
    if (!fabricCanvasRef.current || !fabricRef.current) return;
    const fabric = fabricRef.current;
    const canvas = fabricCanvasRef.current;

    // Clear canvas except background
    const objects = canvas.getObjects();
    objects.forEach((obj: any) => {
      if (!obj._isBackground) canvas.remove(obj);
    });

    // Add template elements
    template.elements.forEach((element) => {
      let obj;
      switch (element.type) {
        case 'text':
          obj = new fabric.Textbox(element.props.text || 'Text', {
            ...element.props,
            editable: true
          });
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

  // Object actions
  const deleteSelected = useCallback(() => {
    if (!fabricCanvasRef.current || !selectedObject || selectedObject._isBackground) return;
    fabricCanvasRef.current.remove(selectedObject);
    fabricCanvasRef.current.renderAll();
    setSelectedObject(null);
  }, [selectedObject]);

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
    if (!fabricCanvasRef.current || !onSave) {
      console.error('Cannot save: canvas or onSave not available');
      return;
    }

    setIsSaving(true);

    try {
      console.log('Saving canvas...');
      const canvas = fabricCanvasRef.current;

      // Ensure canvas is fully rendered
      canvas.renderAll();

      // Get data URL with multiplier for quality
      const dataUrl = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 1
      });

      console.log('Generated dataUrl, length:', dataUrl?.length);
      console.log('DataUrl prefix:', dataUrl?.substring(0, 50));

      if (!dataUrl || dataUrl.length < 100) {
        console.error('Invalid dataUrl generated');
        alert('Failed to capture canvas. Please try again.');
        setIsSaving(false);
        return;
      }

      await onSave(dataUrl);
    } catch (error) {
      console.error('Error saving canvas:', error);
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
  const filteredTemplates = selectedCategory
    ? TEMPLATES.filter(t => t.category === selectedCategory)
    : TEMPLATES;

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="bg-gray-800 rounded-lg p-3 flex flex-wrap items-center gap-2">
        {/* Undo/Redo */}
        <div className="flex items-center gap-1 border-r border-gray-600 pr-3">
          <button onClick={undo} disabled={!canUndo} className="p-2 hover:bg-gray-700 rounded-lg text-gray-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed" title="Undo">
            <Undo2 className="w-5 h-5" />
          </button>
          <button onClick={redo} disabled={!canRedo} className="p-2 hover:bg-gray-700 rounded-lg text-gray-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed" title="Redo">
            <Redo2 className="w-5 h-5" />
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
          <button onClick={addText} className="p-2 hover:bg-gray-700 rounded-lg text-gray-300 hover:text-white" title="Add Text">
            <Type className="w-5 h-5" />
          </button>
          <button onClick={() => addShape('rect')} className="p-2 hover:bg-gray-700 rounded-lg text-gray-300 hover:text-white" title="Rectangle">
            <Square className="w-5 h-5" />
          </button>
          <button onClick={() => addShape('circle')} className="p-2 hover:bg-gray-700 rounded-lg text-gray-300 hover:text-white" title="Circle">
            <Circle className="w-5 h-5" />
          </button>
          <button onClick={() => addShape('triangle')} className="p-2 hover:bg-gray-700 rounded-lg text-gray-300 hover:text-white" title="Triangle">
            <Triangle className="w-5 h-5" />
          </button>
          <button onClick={() => addShape('star')} className="p-2 hover:bg-gray-700 rounded-lg text-gray-300 hover:text-white" title="Star">
            <Star className="w-5 h-5" />
          </button>
          <button onClick={() => addShape('line')} className="p-2 hover:bg-gray-700 rounded-lg text-gray-300 hover:text-white" title="Line">
            <Minus className="w-5 h-5" />
          </button>
        </div>

        {/* Image Upload */}
        <div className="flex items-center gap-1 border-r border-gray-600 pr-3">
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-gray-700 rounded-lg text-gray-300 hover:text-white" title="Upload Image">
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
              <button onClick={() => updateTextStyle('fontWeight', textOptions.fontWeight === 'bold' ? 'normal' : 'bold')} className={`p-2 rounded-lg ${textOptions.fontWeight === 'bold' ? 'bg-brand-500 text-white' : 'hover:bg-gray-700 text-gray-300'}`}>
                <Bold className="w-4 h-4" />
              </button>
              <button onClick={() => updateTextStyle('fontStyle', textOptions.fontStyle === 'italic' ? 'normal' : 'italic')} className={`p-2 rounded-lg ${textOptions.fontStyle === 'italic' ? 'bg-brand-500 text-white' : 'hover:bg-gray-700 text-gray-300'}`}>
                <Italic className="w-4 h-4" />
              </button>
              <button onClick={() => updateTextStyle('underline', !textOptions.underline)} className={`p-2 rounded-lg ${textOptions.underline ? 'bg-brand-500 text-white' : 'hover:bg-gray-700 text-gray-300'}`}>
                <Underline className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-1 border-r border-gray-600 pr-3">
              <button onClick={() => updateTextStyle('textAlign', 'left')} className={`p-2 rounded-lg ${textOptions.textAlign === 'left' ? 'bg-brand-500 text-white' : 'hover:bg-gray-700 text-gray-300'}`}>
                <AlignLeft className="w-4 h-4" />
              </button>
              <button onClick={() => updateTextStyle('textAlign', 'center')} className={`p-2 rounded-lg ${textOptions.textAlign === 'center' ? 'bg-brand-500 text-white' : 'hover:bg-gray-700 text-gray-300'}`}>
                <AlignCenter className="w-4 h-4" />
              </button>
              <button onClick={() => updateTextStyle('textAlign', 'right')} className={`p-2 rounded-lg ${textOptions.textAlign === 'right' ? 'bg-brand-500 text-white' : 'hover:bg-gray-700 text-gray-300'}`}>
                <AlignRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        {/* Colors */}
        {selectedObject && !selectedObject._isBackground && (
          <div className="relative flex items-center gap-1 border-r border-gray-600 pr-3">
            {/* Current color indicator */}
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="w-8 h-8 rounded border-2 border-gray-500 hover:border-white flex items-center justify-center"
              style={{ backgroundColor: textOptions.fill }}
              title="Pick color"
            >
              <Palette className="w-4 h-4 text-white drop-shadow-md" />
            </button>

            {/* Color palette dropdown */}
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-2 p-3 bg-gray-800 rounded-lg border border-gray-600 shadow-xl z-50 w-72">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-300 font-medium">Colors</span>
                  <button onClick={() => setShowColorPicker(false)} className="text-gray-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-10 gap-1 mb-3">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => { updateObjectColor(color); setShowColorPicker(false); }}
                      className="w-6 h-6 rounded border border-gray-600 hover:scale-110 hover:border-white transition"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-gray-700">
                  <span className="text-xs text-gray-400">Custom:</span>
                  <input
                    type="color"
                    value={textOptions.fill}
                    onChange={(e) => { updateObjectColor(e.target.value); }}
                    className="w-8 h-8 rounded cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={textOptions.fill}
                    onChange={(e) => { if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) updateObjectColor(e.target.value); }}
                    className="flex-1 bg-gray-700 text-white text-xs px-2 py-1 rounded"
                    placeholder="#FFFFFF"
                  />
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
              <Palette className="w-4 h-4" />
              Canva
            </button>
          )}
          {onSave && (
            <button
              onClick={saveToLibrary}
              disabled={isSaving}
              className="flex items-center gap-2 px-3 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save
                </>
              )}
            </button>
          )}
          <button onClick={exportCanvas} className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Templates Panel */}
      {showTemplates && (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white">Templates</h3>
            <button onClick={() => setShowTemplates(false)} className="p-1 hover:bg-gray-700 rounded">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1 rounded-full text-sm ${!selectedCategory ? 'bg-brand-500 text-white' : 'bg-gray-700 text-gray-300'}`}
            >
              All
            </button>
            {TEMPLATE_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-sm ${selectedCategory === cat ? 'bg-brand-500 text-white' : 'bg-gray-700 text-gray-300'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {filteredTemplates.map(template => (
              <button
                key={template.id}
                onClick={() => applyTemplate(template)}
                className="bg-gray-900 rounded-lg p-4 text-center hover:bg-gray-700 transition border border-gray-700 hover:border-brand-500"
              >
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
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 z-10">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-brand-400 animate-spin mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Loading image...</p>
            </div>
          </div>
        )}
        <div className="flex items-center justify-center" style={{ minHeight: `${height * scale + 20}px` }}>
          <div style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}>
            <canvas ref={canvasRef} className="border border-gray-700 rounded" />
          </div>
        </div>
      </div>

      <div className="text-sm text-gray-400 text-center">
        Click to select • Double-click text to edit • Drag to move • Ctrl+Z to undo
      </div>
    </div>
  );
}
