import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { 
  Database, 
  Clock, 
  CheckCircle, 
  FileText, 
  ChevronLeft, 
  X, 
  ExternalLink,
  BarChart3,
  Trash2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';

const HistoryPage = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch data from FastAPI on component mount
  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('http://localhost:8000/history');
      setHistory(response.data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch history:", err);
      setError("Could not connect to the Media Vault. Ensure the backend is running.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // 2. Delete logic (Real API call + Optimistic UI)
  const deleteItem = async (id: string) => {
    try {
      await axios.delete(`http://localhost:8000/media/${id}`);
      setHistory(prev => prev.filter(item => item.id !== id));
      if (selectedItem?.id === id) setSelectedItem(null);
    } catch (err) {
      alert("Failed to delete the record.");
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 selection:bg-indigo-500/30">
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full -z-10" />

      <div className="max-w-6xl mx-auto">
        {/* --- HEADER --- */}
        <div className="flex justify-between items-center mb-12">
          <Link to="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group">
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> 
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <Database className="text-indigo-400" size={24} />
            </div>
            <h1 className="text-3xl font-bold tracking-tighter uppercase">Media Vault</h1>
          </div>
        </div>

        {/* --- ERROR STATE --- */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400">
            <AlertCircle size={20} />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* --- TABLE --- */}
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="p-6 text-zinc-400 font-semibold text-xs uppercase tracking-widest">Resource</th>
                <th className="p-6 text-zinc-400 font-semibold text-xs uppercase tracking-widest">Status</th>
                <th className="p-6 text-zinc-400 font-semibold text-xs uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="relative min-h-[200px]">
              <AnimatePresence mode='popLayout'>
                {isLoading ? (
                  // Skeleton Loading State
                  <tr key="loading">
                    <td colSpan={3} className="p-20 text-center">
                      <Loader2 className="animate-spin mx-auto text-indigo-500 mb-2" size={32} />
                      <p className="text-zinc-500 animate-pulse font-mono text-xs uppercase">Accessing Database...</p>
                    </td>
                  </tr>
                ) : history.length === 0 ? (
                  <tr key="empty">
                    <td colSpan={3} className="p-20 text-center text-zinc-500 italic">No records found in vault.</td>
                  </tr>
                ) : (
                  history.map((item) => (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, x: 20 }}
                      key={item.id} 
                      className="border-b border-white/5 hover:bg-white/[0.03] transition-colors group"
                    >
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <FileText className="text-zinc-500 group-hover:text-indigo-400" size={18} />
                          <span className="font-medium text-sm">{item.filename}</span>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider ${
                          item.status === 'COMPLETED' ? 'text-emerald-400' : 'text-amber-400'
                        }`}>
                          {item.status === 'COMPLETED' ? <CheckCircle size={14} /> : <Clock size={14} className="animate-spin" />}
                          {item.status}
                        </div>
                      </td>
                      <td className="p-6 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button 
                            onClick={() => setSelectedItem(item)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600/10 text-indigo-400 text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all"
                          >
                            Insights <ExternalLink size={14} />
                          </button>
                          <button 
                            onClick={() => deleteItem(item.id)}
                            className="p-2 rounded-xl bg-white/5 text-zinc-500 hover:bg-red-500/10 hover:text-red-500 transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* --- INSIGHTS MODAL (Using Real Data Fields) --- */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-3xl bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl"
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{selectedItem.filename}</h2>
                  <span className="text-zinc-500 text-xs font-mono">{selectedItem.id}</span>
                </div>
                <button onClick={() => setSelectedItem(null)} className="p-2 text-zinc-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                  <section>
                    <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <BarChart3 size={14} /> AI Summary
                    </h3>
                    <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5 text-zinc-300 text-sm leading-relaxed">
                      {selectedItem.summary || "Summary is being generated by the Temporal engine..."}
                    </div>
                  </section>
                  <section>
                    <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">Full Transcript</h3>
                    <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5 text-zinc-400 text-xs h-32 overflow-y-auto custom-scrollbar italic">
                      {selectedItem.transcript || "No transcript available yet."}
                    </div>
                  </section>
                </div>
                
                <div className="space-y-4">
                   <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                      <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Tokens</p>
                      <p className="text-xl font-mono text-white">{selectedItem.tokens || 0}</p>
                   </div>
                   <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                      <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Created</p>
                      <p className="text-[10px] font-mono text-zinc-400">{new Date(selectedItem.created_at).toLocaleString()}</p>
                   </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HistoryPage;