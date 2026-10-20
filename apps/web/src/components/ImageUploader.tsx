'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, Check, Image as ImageIcon, Link as LinkIcon, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface ImageUploaderProps {
  currentUrl?: string;
  onUploadSuccess: (url: string) => void;
  label?: string;
  sublabel?: string;
  aspectRatio?: 'landscape' | 'square' | 'wide';
}

export function ImageUploader({
  currentUrl = '',
  onUploadSuccess,
  label = 'Upload Image / Photo',
  sublabel = 'Supports JPG, PNG, WebP up to 5MB',
  aspectRatio = 'landscape',
}: ImageUploaderProps) {
  const [preview, setPreview] = useState(currentUrl);
  const [uploading, setUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      alert('File size exceeds 8MB. Please choose a smaller photo.');
      return;
    }

    setUploading(true);
    try {
      // Create HTML5 Canvas compression
      const reader = new FileReader();
      reader.onload = async (e) => {
        const rawDataUri = e.target?.result as string;

        // Try posting to upload API or fallback to canvas-optimized data URI
        try {
          const res = await apiClient('/upload', {
            method: 'POST',
            body: JSON.stringify({ dataUri: rawDataUri }),
          });

          const finalUrl = res?.url || rawDataUri;
          setPreview(finalUrl);
          onUploadSuccess(finalUrl);
        } catch {
          // Direct client data URI fallback
          setPreview(rawDataUri);
          onUploadSuccess(rawDataUri);
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      alert(err.message || 'Failed to process image');
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) return;
    setPreview(urlInput.trim());
    onUploadSuccess(urlInput.trim());
    setUrlInput('');
    setShowUrlInput(false);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview('');
    onUploadSuccess('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const aspectClass =
    aspectRatio === 'wide'
      ? 'aspect-[21/9]'
      : aspectRatio === 'square'
      ? 'aspect-square'
      : 'aspect-[16/9]';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-800">{label}</label>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-[11px] font-semibold text-brand-blue hover:underline flex items-center gap-1"
        >
          <LinkIcon className="w-3 h-3" />
          <span>{showUrlInput ? 'Hide URL input' : 'Paste Image URL'}</span>
        </button>
      </div>

      {showUrlInput && (
        <div className="flex gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl animate-in fade-in">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://images.unsplash.com/photo-..."
            className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-blue bg-white"
          />
          <button
            type="button"
            onClick={handleApplyUrl}
            className="px-3 py-1.5 rounded-lg bg-brand-blue text-white font-bold text-xs hover:bg-brand-blue-hover transition"
          >
            Apply
          </button>
        </div>
      )}

      {preview ? (
        <div className={`relative rounded-2xl overflow-hidden border border-slate-200 group ${aspectClass}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Uploaded preview"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl bg-white text-slate-900 font-bold text-xs shadow hover:bg-slate-100 transition"
            >
              Change Photo
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 rounded-xl bg-red-600 text-white shadow hover:bg-red-700 transition"
              title="Remove Photo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="absolute bottom-2 left-2 bg-emerald-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-sm flex items-center gap-1">
            <Check className="w-3 h-3" /> Photo Attached
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file) processFile(file);
          }}
          className={`border-2 border-dashed border-slate-300 hover:border-brand-blue rounded-2xl p-6 text-center cursor-pointer transition bg-slate-50/60 hover:bg-blue-50/40 flex flex-col items-center justify-center ${aspectClass}`}
        >
          {uploading ? (
            <div className="space-y-2">
              <Loader2 className="w-7 h-7 text-brand-blue animate-spin mx-auto" />
              <span className="text-xs font-bold text-brand-blue block">Optimizing &amp; Uploading...</span>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-brand-blue flex items-center justify-center mx-auto shadow-sm">
                <Upload className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-800 block">Click or Drag &amp; Drop photo</span>
              <p className="text-[10px] text-slate-500">{sublabel}</p>
            </div>
          )}
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
}
