import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, ChevronLeft, ChevronRight, Loader2, Trash2, StickyNote } from 'lucide-react';
import { db } from '@/lib/firebase';
import {
  collection, addDoc, getDocs, deleteDoc, doc, query, orderBy,
} from 'firebase/firestore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Resize + compress the image to a base64 JPEG small enough for Firestore (<900 KB)
function compressImage(file, maxDim = 900, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export default function ProgressPhotos({ userId }) {
  const [saving, setSaving] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  // Upload-preview modal state
  const [preview, setPreview] = useState(null);   // { base64, file }
  const [notes, setNotes] = useState('');
  const fileRef = useRef();
  const qc = useQueryClient();

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['progress-photos', userId],
    queryFn: async () => {
      const snap = await getDocs(
        query(collection(db, 'users', userId, 'progressPhotos'), orderBy('date', 'desc'))
      );
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },
    enabled: !!userId,
  });

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }

    try {
      const base64 = await compressImage(file);
      setPreview({ base64 });
      setNotes('');
    } catch {
      toast.error('Could not read image');
    }
  }

  async function handleSave() {
    if (!preview) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'users', userId, 'progressPhotos'), {
        base64: preview.base64,
        date: new Date().toISOString(),
        notes: notes.trim(),
      });
      qc.invalidateQueries({ queryKey: ['progress-photos', userId] });
      toast.success('Photo saved!');
      setPreview(null);
      setNotes('');
    } catch (err) {
      toast.error('Save failed — image may be too large, try a smaller photo');
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(photo) {
    try {
      await deleteDoc(doc(db, 'users', userId, 'progressPhotos', photo.id));
      qc.invalidateQueries({ queryKey: ['progress-photos', userId] });
      setLightbox(null);
      toast.success('Photo deleted');
    } catch {
      toast.error('Delete failed');
    }
  }

  const lb = lightbox !== null ? photos[lightbox] : null;

  function fmtDate(iso, opts) {
    try { return new Date(iso).toLocaleDateString('en', opts); } catch { return ''; }
  }

  return (
    <>
      <div className="bg-card border border-border/60 rounded-3xl p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm">Progress Photos</h3>
            <p className="text-[11px] text-muted-foreground">Track your visual transformation</p>
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 text-xs font-semibold bg-primary/15 text-primary px-3 py-1.5 rounded-xl hover:bg-primary/25 transition-colors"
          >
            <Camera className="w-3.5 h-3.5" /> Add Photo
          </button>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
        </div>

        {/* Loading skeletons */}
        {isLoading && (
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="aspect-square rounded-2xl animate-pulse bg-secondary/60" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && photos.length === 0 && (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full h-28 border-2 border-dashed border-border/60 rounded-2xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
          >
            <Camera className="w-6 h-6" />
            <span className="text-xs font-medium">Upload your first progress photo</span>
          </button>
        )}

        {/* Grid */}
        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo, i) => (
              <motion.button
                key={photo.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setLightbox(i)}
                className="aspect-square rounded-2xl overflow-hidden bg-secondary/30 relative group"
              >
                <img
                  src={photo.base64}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 pt-3 pb-1">
                  <p className="text-[9px] text-white/80 text-center leading-tight">
                    {fmtDate(photo.date, { month: 'short', day: 'numeric' })}
                  </p>
                  {photo.notes && (
                    <StickyNote className="w-2.5 h-2.5 text-white/50 mx-auto mt-0.5" />
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* ── Upload preview modal ── */}
      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => !saving && setPreview(null)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 280 }}
              className="w-full max-w-sm bg-card border border-border/50 rounded-3xl overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Preview image */}
              <div className="relative">
                <img src={preview.base64} alt="" className="w-full max-h-64 object-cover" />
                <button
                  onClick={() => setPreview(null)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm text-white/70 text-[10px] px-2 py-1 rounded-lg">
                  {fmtDate(new Date().toISOString(), { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>

              {/* Notes + save */}
              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Notes (optional)</label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="How are you feeling? Any measurements?"
                    rows={2}
                    maxLength={300}
                    className="w-full bg-secondary/40 border border-border/50 rounded-2xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground/50"
                  />
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full h-11 rounded-2xl primary-gradient text-white text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  {saving ? 'Saving…' : 'Save Photo'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {lb && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4"
            onClick={() => setLightbox(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', damping: 24, stiffness: 300 }}
              className="relative w-full max-w-sm"
              onClick={e => e.stopPropagation()}
            >
              {/* Photo */}
              <img
                src={lb.base64}
                alt=""
                className="w-full rounded-3xl object-contain max-h-[65vh] shadow-2xl"
              />

              {/* Close */}
              <button
                onClick={() => setLightbox(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Meta strip */}
              <div className="mt-4 px-1 flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-white/80 text-xs font-semibold">
                    {fmtDate(lb.date, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  {lb.notes && (
                    <p className="text-white/50 text-[11px] leading-snug max-w-[220px]">{lb.notes}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(lb)}
                  className="flex items-center gap-1 text-red-400 text-xs font-semibold hover:text-red-300 transition-colors shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>

              {/* Prev / next */}
              {lightbox > 0 && (
                <button
                  onClick={() => setLightbox(lightbox - 1)}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              {lightbox < photos.length - 1 && (
                <button
                  onClick={() => setLightbox(lightbox + 1)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}

              {/* Dot indicator */}
              {photos.length > 1 && (
                <div className="flex items-center justify-center gap-1.5 mt-4">
                  {photos.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setLightbox(i)}
                      className={`rounded-full transition-all ${i === lightbox ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/30 hover:bg-white/50'}`}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
