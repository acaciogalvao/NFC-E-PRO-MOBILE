import React, { useState, useEffect } from 'react';
import { Database, Trash2, Download, Upload, HardDrive, Edit3, ArrowUpRight, FolderOpen, AlertTriangle, ShieldCheck, Cloud, RefreshCw, Loader2 } from 'lucide-react';
import { SavedModel, LayoutConfig } from '../types';
import { LOCAL_STORAGE_KEY_MODELS, LOCAL_STORAGE_KEY_LAYOUTS } from '../utils/constants';
import { useAppContext } from '../context/AppContext';

interface DataScreenProps {
  onRefresh: () => void;
  savedModels: SavedModel[];
  onDeleteModel: (id: string) => void;
  onRenameModel: (id: string) => void;
  onLoadModel: (id: string) => void;
  onClearAllData: () => void;
  onImportBackup: (models: SavedModel[], layouts?: LayoutConfig[]) => void;
}

const DataScreen: React.FC<DataScreenProps> = ({ savedModels, onDeleteModel, onRenameModel, onLoadModel, onClearAllData, onImportBackup }) => {
  const { handleSyncFromCloud, isSyncing } = useAppContext();
  const [dbSize, setDbSize] = useState<string>('0 KB');

  useEffect(() => {
    calculateStats();
  }, [savedModels]);

  const calculateStats = () => {
    try {
      const models = localStorage.getItem(LOCAL_STORAGE_KEY_MODELS) || '[]';
      const layouts = localStorage.getItem(LOCAL_STORAGE_KEY_LAYOUTS) || '';
      const totalBytes = new Blob([models]).size + new Blob([layouts]).size;
      setDbSize(totalBytes > 1024 * 1024 ? `${(totalBytes / (1024 * 1024)).toFixed(2)} MB` : `${(totalBytes / 1024).toFixed(2)} KB`);
    } catch { setDbSize('Err'); }
  };

  const handleExport = () => {
    const data = { models: savedModels, layouts: JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_LAYOUTS) || '[]'), exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `backup_nfce_pro_${new Date().toISOString().slice(0,10)}.json`;
    link.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        const models = Array.isArray(data) ? data : data.models;
        if (confirm(`Importar ${models.length} modelos? Isso substituirá os atuais.`)) onImportBackup(models, data.layouts);
      } catch { alert("Arquivo inválido"); }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 animate-reveal">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black text-indigo-500 uppercase tracking-[0.3em]">Gestão de Dados</h3>
        <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2 py-1 rounded-lg">
          <ShieldCheck size={12} className="text-emerald-500" />
          <span className="text-[9px] font-black text-emerald-500 uppercase">Híbrido (Local/Cloud)</span>
        </div>
      </div>

      {/* Cloud Sync Section */}
      <div className="glass-card rounded-[2rem] p-6 border border-indigo-500/20 bg-indigo-500/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400">
                <Cloud size={20} />
             </div>
             <div>
                <h4 className="text-xs font-black dark:text-white uppercase tracking-widest">Sincronização na Nuvem</h4>
                <p className="text-[9px] font-bold text-slate-500 uppercase">MongoDB Atlas</p>
             </div>
          </div>
          <button 
            onClick={() => handleSyncFromCloud()} 
            disabled={isSyncing}
            className={`p-3 bg-indigo-500 rounded-xl text-white shadow-lg shadow-indigo-500/20 active:scale-90 transition-all ${isSyncing ? 'opacity-50' : ''}`}
          >
            {isSyncing ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
          </button>
        </div>
        <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed">
          Recupere modelos excluídos ou sincronize alterações entre dispositivos. Todos os dados são guardados de forma segura na sua base de dados externa.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card rounded-3xl p-5 shadow-lg border border-white/5">
           <div className="flex items-center gap-2 text-slate-500 mb-2">
             <HardDrive size={14} />
             <span className="text-[9px] font-black uppercase tracking-widest">Cache Local</span>
           </div>
           <div className="text-2xl font-black dark:text-white tracking-tight">{dbSize}</div>
        </div>
        <div className="glass-card rounded-3xl p-5 shadow-lg border border-white/5">
           <div className="flex items-center gap-2 text-slate-500 mb-2">
             <Database size={14} />
             <span className="text-[9px] font-black uppercase tracking-widest">Projetos</span>
           </div>
           <div className="text-2xl font-black text-indigo-500 tracking-tight">{savedModels.length}</div>
        </div>
      </div>

      <div className="glass-card rounded-[2rem] overflow-hidden border border-white/5">
         <div className="bg-white/5 px-6 py-4 flex items-center gap-3">
          <FolderOpen size={18} className="text-indigo-400" />
          <h3 className="font-black text-xs uppercase tracking-widest dark:text-white">Biblioteca de Modelos</h3>
        </div>
        <div className="divide-y divide-white/5">
           {savedModels.length === 0 ? (
             <div className="p-10 text-center opacity-30 flex flex-col items-center gap-3">
               <Database size={32} />
               <p className="text-[10px] font-black uppercase tracking-widest">Vazio</p>
               <button onClick={() => handleSyncFromCloud()} className="text-indigo-400 text-[9px] font-bold underline">RECUPERAR DA NUVEM</button>
             </div>
           ) : (
             savedModels.map(model => (
               <div key={model.id} className="p-5 flex items-center justify-between group hover:bg-white/5 transition-colors">
                  <div className="flex-1 overflow-hidden">
                     <div className="font-bold text-sm dark:text-white truncate mb-0.5 uppercase">{model.name}</div>
                     <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                        {new Date(model.updatedAt).toLocaleDateString()} • {new Date(model.updatedAt).toLocaleTimeString().slice(0,5)}
                     </div>
                  </div>
                  <div className="flex items-center gap-1">
                     <button onClick={() => onLoadModel(model.id)} className="w-9 h-9 flex items-center justify-center bg-indigo-500/10 text-indigo-400 rounded-xl"><ArrowUpRight size={18} /></button>
                     <button onClick={() => onRenameModel(model.id)} className="w-9 h-9 flex items-center justify-center text-slate-600"><Edit3 size={18} /></button>
                     <button onClick={() => onDeleteModel(model.id)} className="w-9 h-9 flex items-center justify-center text-slate-600 hover:text-rose-500"><Trash2 size={18} /></button>
                  </div>
               </div>
             ))
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <button onClick={handleExport} className="w-full flex items-center gap-4 p-5 glass-card rounded-3xl group">
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all">
            <Download size={22} />
          </div>
          <div className="text-left">
            <div className="font-black text-xs dark:text-white uppercase tracking-widest">Backup em Arquivo</div>
            <div className="text-[10px] text-slate-500 font-bold">Exportar biblioteca para JSON</div>
          </div>
        </button>

        <label className="w-full flex items-center gap-4 p-5 glass-card rounded-3xl cursor-pointer group">
          <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
            <Upload size={22} />
          </div>
          <div className="text-left">
            <div className="font-black text-xs dark:text-white uppercase tracking-widest text-blue-400">Importar Arquivo</div>
            <div className="text-[10px] text-slate-500 font-bold">Restaurar de um arquivo .json</div>
          </div>
          <input type="file" className="hidden" accept=".json" onChange={handleImport} />
        </label>
      </div>

      <div className="pt-4">
        <button onClick={onClearAllData} className="w-full py-4 text-rose-500/50 hover:text-rose-500 text-[10px] font-black uppercase tracking-[0.3em] transition-colors flex items-center justify-center gap-2">
          <AlertTriangle size={14} /> Limpar Cache Local (Wipe)
        </button>
      </div>
    </div>
  );
};

export default DataScreen;