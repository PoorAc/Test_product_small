import { motion } from 'framer-motion';
import { Upload, Cpu, Shield, Search, LogOut, Database } from 'lucide-react';
import keycloak from './keycloak';
import { FileUploader } from './components/FileUploader';
import { Link } from 'react-router-dom';

const App = ({ authenticated }: { authenticated: boolean }) => {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-indigo-500/30 overflow-x-hidden">
      {/* 🔮 Animated Background Glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-purple-600/10 blur-[120px] rounded-full" />

      {/* 🧭 Glass Navbar */}
      <nav className="sticky top-0 z-50 px-6 py-4 backdrop-blur-md border-b border-white/5 bg-black/20">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
              <Cpu size={20} />
            </div>
            <span className="text-xl font-bold tracking-tighter uppercase">Durable<span className="text-indigo-400">AI</span></span>
          </motion.div>

          {authenticated ? (
            <div className="flex items-center gap-6"> 
                {/* 🏛️ The new History Link */}
                <Link 
                  to="/history" 
                  className="text-sm font-medium text-zinc-400 hover:text-indigo-400 transition-colors flex items-center gap-2 group"
                >
                  <Database size={16} className="group-hover:rotate-12 transition-transform" />
                  History Vault
                </Link>

                {/* 🚪 Sign Out Button */}
                <button 
                  onClick={() => keycloak.logout()} 
                  className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-lg border border-white/5"
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
          ) : (
            <button onClick={() => keycloak.login()} className="px-5 py-2 bg-white text-black text-sm font-bold rounded-full hover:scale-105 transition-transform">
              Connect Identity
            </button>
          )}
        </div>
      </nav>

      {/* 🚀 Hero Section */}
      <main className="max-w-6xl mx-auto px-6 pt-24 pb-20">
        <motion.div 
          initial={{ y: 20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/5 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-6 inline-block">
            Autonomous Media Processing
          </span>
          <h2 className="text-6xl md:text-7xl font-black mb-6 tracking-tight leading-[0.9]">
            The Engine for <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Unstructured Logic.</span>
          </h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto mb-10">
            Securely upload your media to our durable Temporal pipelines. We transcribe, index, and vectorize everything for semantic search.
          </p>
        </motion.div>

        {/* 🛠️ Interactable Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {[
            { icon: <Upload />, title: "Durable Upload", desc: "S3-compatible storage with MinIO." },
            { icon: <Shield />, title: "Keycloak Auth", desc: "Enterprise-grade identity management." },
            { icon: <Search />, title: "Milvus Search", desc: "Instant semantic retrieval via vectors." }
          ].map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -5, borderColor: 'rgba(99, 102, 241, 0.4)' }}
              className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm transition-colors group cursor-default"
            >
              <div className="mb-4 text-indigo-400 group-hover:scale-110 transition-transform duration-300">{item.icon}</div>
              <h3 className="text-lg font-bold mb-2">{item.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* 📂 Actual Interactive Upload Zone */}
        {authenticated ? (
          <FileUploader />
        ) : (
          <div className="text-center p-12 border border-white/5 rounded-3xl bg-white/[0.01]">
            <p className="text-zinc-500">Authentication Required to access processing nodes.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;