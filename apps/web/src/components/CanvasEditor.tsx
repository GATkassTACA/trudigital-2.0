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
  Loader2
} from 'lucide-react';

interface CanvasEditorProps {
  backgroundImage?: string;
  width?: number;
  height?: number;
  onSave?: (dataUrl: string) => void;
}

const FONTS = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Verdana',
  'Roboto',
  'Open Sans',
  'Montserrat'
];

const PRESET_COLORS = [
  '#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FF6600', '#9900FF',
  '#FF3366', '#33CC33', '#3366FF', '#FFCC00', '#CC0066'
];

export default function CanvasEditor({
  backgroundImage,
  width = 1344,
  height = 768,
  onSave
}: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricRef = useRef<any>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedObject, setSelectedObject] = useState<any>(null);
  const [textOptions, setTextOptions] = useState({
    fontFamily: 'Arial',
    fontSize: 48,
    fill: '#FFFFFF',
    fontWeight: 'normal',
    fontStyle: 'normal',
    underline: false,
    textAlign: 'left'
  });
  const [scale, setScale] = useState(1);
  const [bgLoaded, setBgLoaded] = useState(false);

  // Load fabric.js dynamically
  useEffect(() => {
    const loadFabric = async () => {
      if (typeof window === 'undefined') return;

      try {
        const fabricModule = await import('fabric');
        fabricRef.current = fabricModule;
        console.log('Fabric loaded:', Object.keys(fabricModule));
        setIsLoaded(true);
      } catch (err) {
        console.error('Failed to load fabric:', err);
      }
    };

    loadFabric();
  }, []);

  // Initialize canvas after fabric is loaded
  useEffect(() => {
    if (!isLoaded || !canvasRef.current || !fabricRef.current) return;

    const fabric = fabricRef.current;
    console.log('Initializing canvas with fabric:', fabric);

    // Fabric 7 uses Canvas directly
    const canvas = new fabric.Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: '#1a1a1a',
      selection: true,
      preserveObjectStacking: true
    });

    fabricCanvasRef.current = canvas;
    console.log('Canvas created:', canvas);

    // Selection events
    canvas.on('selection:created', (e: any) => {
      setSelectedObject(e.selected?.[0] || null);
      updateTextOptionsFromObject(e.selected?.[0]);
    });

    canvas.on('selection:updated', (e: any) => {
      setSelectedObject(e.selected?.[0] || null);
      updateTextOptionsFromObject(e.selected?.[0]);
    });

    canvas.on('selection:cleared', () => {
      setSelectedObject(null);
    });

    // Calculate scale to fit container
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth - 48;
        const newScale = Math.min(1, containerWidth / width);
        setScale(newScale);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);

    return () => {
      canvas.dispose();
      window.removeEventListener('resize', updateScale);
    };
  }, [isLoaded, width, height]);

  // Load background image - separate effect with explicit dependency
  useEffect(() => {
    if (!isLoaded || !fabricCanvasRef.current || !fabricRef.current || !backgroundImage) {
      console.log('Not ready to load bg:', { isLoaded, hasCanvas: !!fabricCanvasRef.current, hasFabric: !!fabricRef.current, backgroundImage: backgroundImage?.substring(0, 50) });
      return;
    }

    const fabric = fabricRef.current;
    const canvas = fabricCanvasRef.current;

    console.log('Loading background image...', backgroundImage.substring(0, 100));

    // Use FabricImage for fabric 7
    const FabricImage = fabric.FabricImage || fabric.Image;

    if (!FabricImage) {
      console.error('FabricImage not found in fabric module');
      return;
    }

    // Create HTML image element
    const imgEl = document.createElement('img');

    imgEl.onload = () => {
      console.log('Image element loaded:', imgEl.width, 'x', imgEl.height);

      try {
        // Create fabric image from the loaded element
        const fabricImage = new FabricImage(imgEl, {
          left: 0,
          top: 0,
          selectable: false,
          evented: false,
          originX: 'left',
          originY: 'top'
        });

        // Scale to fit canvas
        const scaleX = width / imgEl.width;
        const scaleY = height / imgEl.height;
        fabricImage.scale(Math.min(scaleX, scaleY));

        // Center if needed
        fabricImage.set({
          scaleX: scaleX,
          scaleY: scaleY
        });

        // Remove any existing background
        const objects = canvas.getObjects();
        objects.forEach((obj: any) => {
          if (obj._isBackground) {
            canvas.remove(obj);
          }
        });

        // Mark as background and add
        (fabricImage as any)._isBackground = true;
        canvas.add(fabricImage);
        canvas.sendObjectToBack(fabricImage);
        canvas.renderAll();

        setBgLoaded(true);
        console.log('Background image added successfully');
      } catch (err) {
        console.error('Error creating fabric image:', err);
      }
    };

    imgEl.onerror = (err) => {
      console.error('Failed to load image element:', err);
    };

    // Don't set crossOrigin for data URLs
    if (!backgroundImage.startsWith('data:')) {
      imgEl.crossOrigin = 'anonymous';
    }

    imgEl.src = backgroundImage;

  }, [isLoaded, backgroundImage, width, height, fabricCanvasRef.current]);

  const updateTextOptionsFromObject = (obj: any) => {
    if (obj && (obj.type === 'textbox' || obj.type === 'Textbox')) {
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

  const addText = useCallback(() => {
    if (!fabricCanvasRef.current || !fabricRef.current) return;
    const fabric = fabricRef.current;
    const canvas = fabricCanvasRef.current;

    const Textbox = fabric.Textbox || fabric.IText;

    const text = new Textbox('Your Text Here', {
      left: width / 2 - 100,
      top: height / 2 - 25,
      ...textOptions,
      width: 300,
      editable: true
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  }, [textOptions, width, height]);

  const addRectangle = useCallback(() => {
    if (!fabricCanvasRef.current || !fabricRef.current) return;
    const fabric = fabricRef.current;
    const canvas = fabricCanvasRef.current;

    const rect = new fabric.Rect({
      left: width / 2 - 75,
      top: height / 2 - 50,
      width: 150,
      height: 100,
      fill: 'rgba(255, 255, 255, 0.8)',
      stroke: '#000000',
      strokeWidth: 2,
      rx: 8,
      ry: 8
    });

    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.renderAll();
  }, [width, height]);

  const addCircle = useCallback(() => {
    if (!fabricCanvasRef.current || !fabricRef.current) return;
    const fabric = fabricRef.current;
    const canvas = fabricCanvasRef.current;

    const circle = new fabric.Circle({
      left: width / 2 - 50,
      top: height / 2 - 50,
      radius: 50,
      fill: 'rgba(255, 255, 255, 0.8)',
      stroke: '#000000',
      strokeWidth: 2
    });

    canvas.add(circle);
    canvas.setActiveObject(circle);
    canvas.renderAll();
  }, [width, height]);

  const deleteSelected = useCallback(() => {
    if (!fabricCanvasRef.current || !selectedObject) return;
    if (selectedObject._isBackground) return;

    fabricCanvasRef.current.remove(selectedObject);
    fabricCanvasRef.current.renderAll();
    setSelectedObject(null);
  }, [selectedObject]);

  const duplicateSelected = useCallback(() => {
    if (!fabricCanvasRef.current || !selectedObject) return;

    selectedObject.clone((cloned: any) => {
      cloned.set({
        left: (cloned.left || 0) + 20,
        top: (cloned.top || 0) + 20
      });
      fabricCanvasRef.current?.add(cloned);
      fabricCanvasRef.current?.setActiveObject(cloned);
      fabricCanvasRef.current?.renderAll();
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
    if (selectedObject.type !== 'textbox' && selectedObject.type !== 'Textbox') return;

    selectedObject.set(property, value);
    fabricCanvasRef.current.renderAll();
    setTextOptions(prev => ({ ...prev, [property]: value }));
  }, [selectedObject]);

  const updateObjectColor = useCallback((color: string) => {
    if (!fabricCanvasRef.current || !selectedObject) return;

    selectedObject.set('fill', color);
    fabricCanvasRef.current.renderAll();
    setTextOptions(prev => ({ ...prev, fill: color }));
  }, [selectedObject]);

  const exportCanvas = useCallback(() => {
    if (!fabricCanvasRef.current) return;

    const dataUrl = fabricCanvasRef.current.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 1
    });

    const link = document.createElement('a');
    link.download = `signage-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  }, []);

  const saveToLibrary = useCallback(() => {
    if (!fabricCanvasRef.current) {
      console.error('No canvas ref');
      return;
    }
    if (!onSave) {
      console.error('No onSave callback');
      return;
    }

    try {
      const dataUrl = fabricCanvasRef.current.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 1
      });

      console.log('Canvas exported, dataUrl length:', dataUrl?.length);
      onSave(dataUrl);
    } catch (err) {
      console.error('Failed to export canvas:', err);
    }
  }, [onSave]);

  const clearCanvas = useCallback(() => {
    if (!fabricCanvasRef.current) return;

    const objects = fabricCanvasRef.current.getObjects();
    objects.forEach((obj: any) => {
      if (!obj._isBackground) {
        fabricCanvasRef.current?.remove(obj);
      }
    });
    fabricCanvasRef.current.renderAll();
  }, []);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-800 rounded-lg">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-brand-400 animate-spin mx-auto mb-2" />
          <p className="text-gray-400">Loading editor...</p>
        </div>
      </div>
    );
  }

  const isTextSelected = selectedObject && (selectedObject.type === 'textbox' || selectedObject.type === 'Textbox');

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="bg-gray-800 rounded-lg p-3 flex flex-wrap items-center gap-2">
        {/* Add Elements */}
        <div className="flex items-center gap-1 border-r border-gray-600 pr-3">
          <button
            onClick={addText}
            className="p-2 hover:bg-gray-700 rounded-lg text-gray-300 hover:text-white transition"
            title="Add Text"
          >
            <Type className="w-5 h-5" />
          </button>
          <button
            onClick={addRectangle}
            className="p-2 hover:bg-gray-700 rounded-lg text-gray-300 hover:text-white transition"
            title="Add Rectangle"
          >
            <Square className="w-5 h-5" />
          </button>
          <button
            onClick={addCircle}
            className="p-2 hover:bg-gray-700 rounded-lg text-gray-300 hover:text-white transition"
            title="Add Circle"
          >
            <Circle className="w-5 h-5" />
          </button>
        </div>

        {/* Text Formatting */}
        {isTextSelected && (
          <>
            <div className="flex items-center gap-1 border-r border-gray-600 pr-3">
              <select
                value={textOptions.fontFamily}
                onChange={(e) => updateTextStyle('fontFamily', e.target.value)}
                className="bg-gray-700 text-white text-sm rounded px-2 py-1.5"
              >
                {FONTS.map(font => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </select>
              <input
                type="number"
                value={textOptions.fontSize}
                onChange={(e) => updateTextStyle('fontSize', Number(e.target.value))}
                className="bg-gray-700 text-white text-sm rounded px-2 py-1.5 w-16"
                min={8}
                max={200}
              />
            </div>

            <div className="flex items-center gap-1 border-r border-gray-600 pr-3">
              <button
                onClick={() => updateTextStyle('fontWeight', textOptions.fontWeight === 'bold' ? 'normal' : 'bold')}
                className={`p-2 rounded-lg transition ${textOptions.fontWeight === 'bold' ? 'bg-brand-500 text-white' : 'hover:bg-gray-700 text-gray-300'}`}
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                onClick={() => updateTextStyle('fontStyle', textOptions.fontStyle === 'italic' ? 'normal' : 'italic')}
                className={`p-2 rounded-lg transition ${textOptions.fontStyle === 'italic' ? 'bg-brand-500 text-white' : 'hover:bg-gray-700 text-gray-300'}`}
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                onClick={() => updateTextStyle('underline', !textOptions.underline)}
                className={`p-2 rounded-lg transition ${textOptions.underline ? 'bg-brand-500 text-white' : 'hover:bg-gray-700 text-gray-300'}`}
              >
                <Underline className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-1 border-r border-gray-600 pr-3">
              <button
                onClick={() => updateTextStyle('textAlign', 'left')}
                className={`p-2 rounded-lg transition ${textOptions.textAlign === 'left' ? 'bg-brand-500 text-white' : 'hover:bg-gray-700 text-gray-300'}`}
              >
                <AlignLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => updateTextStyle('textAlign', 'center')}
                className={`p-2 rounded-lg transition ${textOptions.textAlign === 'center' ? 'bg-brand-500 text-white' : 'hover:bg-gray-700 text-gray-300'}`}
              >
                <AlignCenter className="w-4 h-4" />
              </button>
              <button
                onClick={() => updateTextStyle('textAlign', 'right')}
                className={`p-2 rounded-lg transition ${textOptions.textAlign === 'right' ? 'bg-brand-500 text-white' : 'hover:bg-gray-700 text-gray-300'}`}
              >
                <AlignRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        {/* Color Picker */}
        {selectedObject && !selectedObject._isBackground && (
          <div className="flex items-center gap-1 border-r border-gray-600 pr-3">
            <div className="flex gap-1">
              {PRESET_COLORS.slice(0, 6).map(color => (
                <button
                  key={color}
                  onClick={() => updateObjectColor(color)}
                  className="w-6 h-6 rounded border border-gray-600 hover:scale-110 transition"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <input
              type="color"
              value={textOptions.fill}
              onChange={(e) => updateObjectColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer"
            />
          </div>
        )}

        {/* Object Actions */}
        {selectedObject && !selectedObject._isBackground && (
          <div className="flex items-center gap-1 border-r border-gray-600 pr-3">
            <button onClick={duplicateSelected} className="p-2 hover:bg-gray-700 rounded-lg text-gray-300 hover:text-white transition" title="Duplicate">
              <Copy className="w-4 h-4" />
            </button>
            <button onClick={bringForward} className="p-2 hover:bg-gray-700 rounded-lg text-gray-300 hover:text-white transition" title="Bring Forward">
              <ChevronUp className="w-4 h-4" />
            </button>
            <button onClick={sendBackward} className="p-2 hover:bg-gray-700 rounded-lg text-gray-300 hover:text-white transition" title="Send Backward">
              <ChevronDown className="w-4 h-4" />
            </button>
            <button onClick={deleteSelected} className="p-2 hover:bg-red-600 rounded-lg text-gray-300 hover:text-white transition" title="Delete">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Canvas Actions */}
        <div className="flex items-center gap-1 ml-auto">
          <button onClick={clearCanvas} className="p-2 hover:bg-gray-700 rounded-lg text-gray-300 hover:text-white transition" title="Clear All">
            <RotateCcw className="w-4 h-4" />
          </button>
          {onSave && (
            <button onClick={saveToLibrary} className="flex items-center gap-2 px-3 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition">
              <Save className="w-4 h-4" />
              Save
            </button>
          )}
          <button onClick={exportCanvas} className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="bg-gray-900 rounded-lg p-6 flex items-center justify-center overflow-auto">
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          <canvas ref={canvasRef} className="border border-gray-700 rounded" />
        </div>
      </div>

      {/* Status */}
      <div className="text-sm text-gray-400 text-center">
        {backgroundImage && !bgLoaded && 'Loading background image...'}
        {backgroundImage && bgLoaded && 'Background loaded. '}
        Click elements to select. Double-click text to edit. Drag to move.
      </div>
    </div>
  );
}
