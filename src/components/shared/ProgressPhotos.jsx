import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, ChevronLeft, ChevronRight, Loader2, Trash2 } from 'lucide-react';
import { storage, db } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import {
  collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function ProgressPhotos({ userId }) {
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState(null); // index into photos array
  const fileRef = useRef();
  const qc = useQueryClient();

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['progress-photos', userId],
    queryFn: async () => {
      const snap = await getDocs(
        query(collection(db, 'users', userId, 'progressPhotos'), orderBy('createdAt', 'desc'))
      );
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },
    enabled: !!userId,
  });

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Image must be under 10 MB'); return; }

    setUploading(true);
    try {
      const path = `users/${userId}/progress-photos/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await addDoc(collection(db, 'users', userId, 'progressPhotos'), {
        url,
        storagePath: path,
        createdAt: serverTimestamp(),
      });
      qc.invalidateQueries({ queryKey: ['progress-photos', userId] });
      toast.success('Photo uploaded!');
    } catch (err) {
      toast.error('Upload failed — check Firebase Storage rules');
      console.error(err);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handleDelete(photo) {
    try {
      if (photo.storagePath) {
        await deleteObject(ref(storage, photo.storagePath)).catch(() => {});
      }
      await deleteDoc(doc(db, 'users', userId, 'progressPhotos', photo.id));
      qc.invalidateQueries({ queryKey: ['progress-photos', userId] });
      setLightbox(null);
      toast.success('Photo deleted');
    } catch (err) {
      toast.error('Delete failed');
    }
  }

  const lb = lightbox !== null ? photos[lightbox] : null;

  return (
    <div className="bg-card border border-border/60 rounded-3xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm">Progress Photos</h3>
          <p className="text-[11px] text-muted-foreground">Track your visual transformation</p>
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 text-xs font-semibold bg-primary/15 text-primary px-3 py-1.5 rounded-xl hover:bg-primary/25 transition-colors disabled:opacity-50"
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
          {uploading ? 'Uploading…' : 'Add Photo'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      </div>

      {isLoading && (
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="aspect-square rounded-2xl animate-pulse bg-secondary/60" />
          ))}
        </div>
      )}

      {!isLoading && photos.length === 0 && (
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full h-28 border-2 border-dashed border-border/60 rounded-2xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
        >
          <Camera className="w-6 h-6" />
          <span className="text-xs font-medium">Upload your first progress photo</span>
        </button>
      )}

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
              <img src={photo.url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              {photo.createdAt && (
                <div className="absolute bottom-0 inset-x-0 bg-black/50 text-[9px] text-white/80 px-1.5 py-1 text-center">
                  {photo.createdAt.toDate?.().toLocaleDateString('en', { month: 'short', day: 'numeric' }) ?? ''}
                </div>
              )}
            </motion.button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lb && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightbox(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-sm w-full"
              onClick={e => e.stopPropagation()}
            >
              <img src={lb.url} alt="" className="w-full rounded-3xl object-contain max-h-[70vh]" />
              <div className="flex items-center justify-between mt-3">
                <span className="text-white/60 text-xs">
                  {lb.createdAt?.toDate?.().toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) ?? ''}
                </span>
                <button
                  onClick={() => handleDelete(lb)}
                  className="flex items-center gap-1 text-red-400 text-xs font-semibold hover:text-red-300 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
              {/* Prev / next */}
              {lightbox > 0 && (
                <button onClick={() => setLightbox(lightbox - 1)}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 text-white/70 hover:text-white">
                  <ChevronLeft className="w-7 h-7" />
                </button>
              )}
              {lightbox < photos.length - 1 && (
                <button onClick={() => setLightbox(lightbox + 1)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 text-white/70 hover:text-white">
                  <ChevronRight className="w-7 h-7" />
                </button>
              )}
              <button onClick={() => setLightbox(null)}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white/70 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
