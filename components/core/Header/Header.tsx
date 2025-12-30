
import React from 'react';
import { Sparkles, ChevronRight, Database, Save, PlusCircle, Loader2 } from 'lucide-react';
import BluetoothButton from '../../buttons/BluetoothButton';
import ActionButtons from '../../buttons/ActionButtons';

interface HeaderProps {
  selectedModelName: string;
  onShowModels: () => void;
  onSave: () => void;
  onNew: () => void;
  onDownload: () => void;
  onPrint: () => void;
  isSaving: boolean;
  isDownloading: boolean;
  isBluetoothConnected: boolean;
  onBluetoothConnect: () => void;
}

const Header: React.FC<HeaderProps> = ({
  selectedModelName,
  onShowModels,
  onSave,
  onNew,
  onDownload,
  onPrint,
  isSaving,
  isDownloading,
  isBluetoothConnected,
  onBluetoothConnect
}) => {
  return (
    <header className="px-6 pt-12 pb-6 print:hidden z-30">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight dark:text-white leading-none">NFC-e <span className="text-indigo-500">Pro</span></h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Mobile System</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <BluetoothButton isConnected={isBluetoothConnected} onClick={onBluetoothConnect} />
          <ActionButtons isDownloading={isDownloading} onDownload={onDownload} onPrint={onPrint} />
        </div>
      </div>

      <div className="glass-card rounded-3xl p-5 shadow-xl border border-white/5 animate-slide-down">
        <div className="flex items-center justify-between mb-4">
           <div className="flex flex-col">
              <span className="text-[9px] font-extrabold text-indigo-500 uppercase tracking-[0.2em] mb-1">Modelo em Edição</span>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold truncate max-w-[180px] dark:text-white">
                  {selectedModelName}
                </h2>
                <ChevronRight size={14} className="text-slate-500" />
              </div>
           </div>
           <button onClick={onShowModels} className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-2xl hover:bg-indigo-500/20 transition-all">
              <Database size={20} />
           </button>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={onSave} 
            disabled={isSaving}
            className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 py-3.5 rounded-2xl text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {selectedModelName !== 'Novo Rascunho' ? 'ATUALIZAR' : 'CRIAR MODELO'}
          </button>
          
          <button 
            onClick={onNew}
            className="w-14 glass-card rounded-2xl flex items-center justify-center text-slate-300 border border-white/10"
          >
            <PlusCircle size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
