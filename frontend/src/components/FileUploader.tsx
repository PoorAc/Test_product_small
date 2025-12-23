import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, File, X, ChevronRight } from 'lucide-react';
import axios from 'axios';

export const FileUploader = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploading, setUploading] = useState(false);

  // MANUALLY trigger the hidden input
  const openFileExplorer = () => {
    fileInputRef.current?.click();
  };

  const handleFiles = (incomingFiles: FileList | null) => {
    if (!incomingFiles) return;
    const validFiles = Array.from(incomingFiles).filter(f => f.type.startsWith('video/') || f.type.startsWith('audio/'));
    setFiles(prev => [...prev, ...validFiles]);
    setDragActive(false);
    // Reset input value so you can upload the same file twice if needed
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const startUpload = async () => {
    setUploading(true);
    
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        await axios.post('http://localhost:8000/process-media', formData, {
          headers: { 
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data' 
          },
          onUploadProgress: (p) => {
            const percent = Math.round((p.loaded * 100) / (p.total || 100));
            setUploadProgress(prev => ({ ...prev, [file.name]: percent }));
          },
        });
      } catch (error) {
        console.error(`Failed to upload ${file.name}`, error);
      }
    }

    // 💡 THE FIX: Don't clear immediately!
    // Wait 2 seconds so the user can see the 100% completion
    setTimeout(() => {
      setUploading(false);
      setFiles([]); 
      setUploadProgress({});
    }, 2000); 
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        accept="video/*,audio/*"
      />

      <motion.div
        onDragEnter={() => setDragActive(true)}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        animate={{
          scale: dragActive ? 1.02 : 1,
          borderColor: dragActive ? "rgba(99, 102, 241, 1)" : "rgba(255, 255, 255, 0.1)",
        }}
        className="relative rounded-3xl border-2 border-dashed p-1 bg-white/[0.02] overflow-hidden"
      >
        <div className="p-10 text-center">
          <AnimatePresence mode="wait">
            {files.length === 0 ? (
              /* --- EMPTY STATE: Only here is the click-to-upload active --- */
              <motion.div 
                key="empty" 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="cursor-pointer"
                onClick={openFileExplorer}
              >
                <Upload className="mx-auto mb-4 text-indigo-500 group-hover:animate-bounce" size={40} />
                <h3 className="text-xl font-bold mb-2 text-white">Click or Drag Media</h3>
                <p className="text-zinc-500 text-sm">MP4, MP3, or WAV (Max 500MB)</p>
              </motion.div>
            ) : (
              /* --- FILE LIST: Click handler is NOT on the parent container here --- */
              <motion.div key="list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Queue ({files.length})</h3>
                  <button onClick={openFileExplorer} className="text-xs text-zinc-400 hover:text-white flex items-center gap-1">
                    Add More <ChevronRight size={14} />
                  </button>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {files.map((file, idx) => (
                    <div 
                      key={`${file.name}-${idx}`} 
                      className="flex flex-col bg-white/5 p-4 rounded-2xl border border-white/10 transition-all"
                    >
                      {/* Top Row: File Icon, Name, and Control */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="p-2 bg-indigo-500/10 rounded-lg">
                            <File size={18} className="text-indigo-400" />
                          </div>
                          <div className="text-left overflow-hidden">
                            <p className="text-sm text-white font-medium truncate w-48">{file.name}</p>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>

                        {/* Show % during upload, or X button when idle */}
                        {uploading ? (
                          <span className="text-xs font-mono text-indigo-400 font-bold">
                            {uploadProgress[file.name] || 0}%
                          </span>
                        ) : (
                          <button 
                            onClick={(e) => { e.stopPropagation(); removeFile(idx); }} 
                            className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-500 hover:text-red-400 transition-colors"
                          >
                            <X size={18} />
                          </button>
                        )}
                      </div>

                      {/* Bottom Row: The Progress Bar (Only visible when uploading) */}
                      <AnimatePresence>
                        {uploading && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="w-full"
                          >
                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${uploadProgress[file.name] || 0}%` }}
                                transition={{ duration: 0.3 }}
                                className={`h-full shadow-lg transition-colors ${
                                  uploadProgress[file.name] === 100 
                                    ? "bg-emerald-500 shadow-emerald-500/40" // Green for success
                                    : "bg-indigo-500 shadow-indigo-500/40"   // Indigo for processing
                                }`}
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex gap-4 justify-center">
                   <button onClick={() => setFiles([])} className="text-sm text-zinc-500 hover:text-white">Clear</button>
                   <button onClick={() => startUpload()} className="px-8 py-2 bg-indigo-600 rounded-xl font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20">
                     Initialize Pipeline
                   </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};