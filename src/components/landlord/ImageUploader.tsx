'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Upload, X, Star, Loader2, ImagePlus } from 'lucide-react';
import { landlordAPI } from '../../lib/api';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

interface AptImage {
  id: string; url: string; thumbnail_url: string; is_primary: boolean;
}

interface Props {
  listingId: string;
  images:    AptImage[];
  onChange:  (images: AptImage[]) => void;
}

export default function ImageUploader({ listingId, images, onChange }: Props) {
  const inputRef          = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previews,  setPreviews]  = useState<{ file: File; url: string }[]>([]);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (images.length + arr.length > 10) {
      toast.error('Maximum 10 images allowed.'); return;
    }
    const newPreviews = arr.map(f => ({ file: f, url: URL.createObjectURL(f) }));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removePreview = (idx: number) => {
    setPreviews(prev => {
      URL.revokeObjectURL(prev[idx].url);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const uploadAll = async () => {
    if (previews.length === 0) return;
    setUploading(true);
    try {
      const res = await landlordAPI.uploadImages(listingId, previews.map(p => p.file));
      onChange([...images, ...res.data.data]);
      previews.forEach(p => URL.revokeObjectURL(p.url));
      setPreviews([]);
      toast.success(`${res.data.data.length} image(s) uploaded!`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (img: AptImage) => {
    try {
      await landlordAPI.deleteImage(listingId, img.id);
      onChange(images.filter(i => i.id !== img.id));
      toast.success('Image removed.');
    } catch {
      toast.error('Failed to remove image.');
    }
  };

  const setPrimary = async (img: AptImage) => {
    try {
      await landlordAPI.setPrimaryImage(listingId, img.id);
      onChange(images.map(i => ({ ...i, is_primary: i.id === img.id })));
      toast.success('Cover image updated.');
    } catch {
      toast.error('Failed to update cover image.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Uploaded images */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {images.map(img => (
            <div key={img.id} className="relative group rounded-xl overflow-hidden aspect-square bg-surface-100 dark:bg-navy-800">
              <Image src={img.thumbnail_url || img.url} alt="" fill className="object-cover" />
              {img.is_primary && (
                <div className="absolute top-1.5 left-1.5 bg-amber-500 rounded-full p-1">
                  <Star size={10} className="text-white fill-white" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!img.is_primary && (
                  <button onClick={() => setPrimary(img)}
                    className="w-7 h-7 bg-amber-500 rounded-full flex items-center justify-center hover:bg-amber-600 transition-colors"
                    title="Set as cover">
                    <Star size={12} className="text-white" />
                  </button>
                )}
                <button onClick={() => deleteImage(img)}
                  className="w-7 h-7 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  title="Delete">
                  <X size={12} className="text-white" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Previews (not yet uploaded) */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {previews.map((p, i) => (
            <div key={i} className="relative rounded-xl overflow-hidden aspect-square bg-surface-100 dark:bg-navy-800 ring-2 ring-amber-400 ring-dashed">
              <Image src={p.url} alt="" fill className="object-cover opacity-70" />
              <button onClick={() => removePreview(i)}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <X size={11} className="text-white" />
              </button>
              <div className="absolute bottom-1 inset-x-1 bg-black/60 rounded text-center">
                <span className="text-white text-xs">Pending</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-2">
        <input ref={inputRef} type="file" multiple accept="image/*"
          className="hidden" onChange={e => handleFiles(e.target.files)} />

        <button type="button" onClick={() => inputRef.current?.click()}
          disabled={images.length + previews.length >= 10}
          className="btn-secondary flex-1 py-2.5 justify-center text-sm disabled:opacity-40">
          <ImagePlus size={15} /> Add Photos
        </button>

        {previews.length > 0 && (
          <button type="button" onClick={uploadAll} disabled={uploading}
            className="btn-primary px-5 py-2.5 justify-center text-sm">
            {uploading
              ? <><Loader2 size={15} className="animate-spin" /> Uploading…</>
              : <><Upload size={15} /> Upload {previews.length}</>}
          </button>
        )}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        className={cn(
          'border-2 border-dashed rounded-xl p-6 text-center transition-colors',
          'border-surface-200 dark:border-navy-700 hover:border-amber-400 dark:hover:border-amber-600',
          'text-navy-400 dark:text-navy-500 text-sm cursor-pointer'
        )}
        onClick={() => inputRef.current?.click()}>
        <Upload size={20} className="mx-auto mb-2 opacity-50" />
        <p>Drag & drop photos here, or click to select</p>
        <p className="text-xs mt-1">{images.length + previews.length}/10 images · Max 5MB each</p>
      </div>
    </div>
  );
}
