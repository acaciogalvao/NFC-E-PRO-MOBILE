import React from 'react';
import { Smartphone } from 'lucide-react';

interface InstallPromptProps {
  onInstall: () => void;
  show: boolean;
}

const InstallPrompt: React.FC<InstallPromptProps> = ({ onInstall, show }) => {
  if (!show) return null;
  
  return (
    <div className="fixed bottom-28 left-6 right-6 z-50 animate-slide-up">
      <div className="glass-card rounded-2xl p-4 flex items-center justify-between border border-indigo-500/30 shadow-xl shadow-indigo-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white">
            <Smartphone size={20} />
          </div>
          <div>
            <h4 className="text-xs font-black text-white uppercase">Instalar App</h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Acesse offline e mais rápido</p>
          </div>
        </div>
        <button 
          onClick={onInstall}
          className="bg-indigo-500 px-4 py-2 rounded-xl text-white text-[10px] font-black uppercase tracking-widest"
        >
          Instalar
        </button>
      </div>
    </div>
  );
};

export default InstallPrompt;