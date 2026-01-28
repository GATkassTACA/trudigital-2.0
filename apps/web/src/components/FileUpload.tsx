'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Loader2, Image as ImageIcon, Film } from 'lucide-react';
import { content } from '@/lib/api';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onUploadComplete?: (result: { url: string; content: any }) => void;
  onUploadStart?: () => void;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
  compact?: boolean;
}

export default function FileUpload({
  onUploadComplete,
  onUploadStart,
  accept = 'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm',
  maxSize = 50,
  className,
  compact = false
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`File too large. Maximum size is ${maxSize}MB`);
      return;
    }

    // Validate file type
    const allowedTypes = accept.split(',').map(t => t.trim());
    if (!allowedTypes.some(type => file.type === type || file.type.startsWith(type.replace('/*', '')))) {
      toast.error('Invalid file type');
      return;
    }

    // Show preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
    setFileName(file.name);

    // Upload
    setIsUploading(true);
    onUploadStart?.();

    try {
      const { data } = await content.uploadFile(file, file.name);

      if (data.success) {
        toast.success('File uploaded successfully');
        onUploadComplete?.({ url: data.blob.url, content: data.content });
      } else {
        toast.error(data.error || 'Upload failed');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [accept, maxSize, onUploadComplete, onUploadStart]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const clearPreview = useCallback(() => {
    setPreview(null);
    setFileName(null);
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  if (compact) {
    return (
      <div className={className}>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
        />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition disabled:opacity-50"
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {isUploading ? 'Uploading...' : 'Upload File'}
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
      />

      {preview ? (
        <div className="relative rounded-xl overflow-hidden bg-gray-800 border border-gray-700">
          <img src={preview} alt="Preview" className="w-full h-48 object-contain" />
          <button
            onClick={clearPreview}
            className="absolute top-2 right-2 p-1 bg-gray-900/80 hover:bg-gray-900 rounded-full"
          >
            <X className="w-4 h-4 text-white" />
          </button>
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            'relative flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed cursor-pointer transition',
            isDragging
              ? 'border-brand-500 bg-brand-500/10'
              : 'border-gray-600 hover:border-gray-500 bg-gray-800/50',
            isUploading && 'pointer-events-none opacity-50'
          )}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-10 h-10 text-brand-400 animate-spin mb-3" />
              <p className="text-gray-400">Uploading {fileName}...</p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-3">
                <ImageIcon className="w-8 h-8 text-gray-500" />
                <Film className="w-8 h-8 text-gray-500" />
              </div>
              <p className="text-white font-medium mb-1">
                Drop files here or click to upload
              </p>
              <p className="text-gray-500 text-sm">
                JPEG, PNG, WebP, GIF, MP4, WebM up to {maxSize}MB
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
