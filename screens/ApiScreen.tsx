import React, { useState, useEffect } from 'react';
import { Database, Trash2, Download, Upload, HardDrive, Edit3, ArrowUpRight, FolderOpen, AlertTriangle } from 'lucide-react';
import { SavedModel } from '../types';

interface DataScreenProps {
  onRefresh: () => void;
  savedModels: SavedModel[];
  onDeleteModel: (id: string) => void;
  onRenameModel: (id: string) => void;
  onLoadModel: (id: string) => void;
}

const LOCAL_STORAGE_KEY_MODELS = 'nfce_models_db_v1';
const LOCAL_STORAGE_KEY_LAYOUTS = 'nfce_pro_layouts_v3';

const DataScreen: React.FC<DataScreenProps> = ({ onRefresh, savedModels, onDeleteModel, onRenameModel, onLoadModel }) => {
  const [dbSize, setDbSize] = useState<string>('0 KB');
  const [lastBackup, setLastBackup] = useState<string>('Nunca');

  useEffect(() => {
    calculateStats();
  }, [savedModels]);

  const calculateStats = () => {
    const models = localStorage.getItem(LOCAL_STORAGE_KEY_MODELS) || '[]';
    const totalBytes = new Blob([models]).size + new Blob([localStorage.getItem(LOCAL_STORAGE_KEY_LAYOUTS) || '']).size;
    if (totalBytes > 1024 * 1024) {
      setDbSize(`${(totalBytes / (1024 * 1024)).toFixed(2)} MB`);
    } else {
      setDbSize(`${(totalBytes / 1024).toFixed(2)} KB`);
    }
  };

  const handleClearAll = () => {
    if (confirm("ATENÇÃO CRÍTICA!\n\nIsso apagará TODOS os seus modelos salvos neste navegador.\nEsta ação não pode ser desfeita.\n\nDeseja continuar?")) {
      localStorage.removeItem(LOCAL_STORAGE_KEY_MODELS);
      calculateStats();
      onRefresh(); 
      alert("Banco de dados local limpo com sucesso.");
    }
  };

  const handleExport = () => {
    const data = {
      models: JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_MODELS) || '[]'),
      layouts: JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_LAYOUTS) || '[]'),
      exportedAt: new Date().toISOString(),
      version: '2.0-local'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_nfce_pro_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setLastBackup(new Date().toLocaleString());
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        if (!data.models && !Array.isArray(data.models)) {
           throw new Error("Arquivo de backup inválido ou antigo.");
        }

        if (confirm(`Restaurar backup com ${data.models.length} modelos?\nIsso substituirá os dados atuais.`)) {
           localStorage.setItem(LOCAL_STORAGE_KEY_MODELS, JSON.stringify(data.models));
           if (data.layouts) {
             localStorage.setItem(LOCAL_STORAGE_KEY_LAYOUTS, JSON.stringify(data.layouts));
           }
           calculateStats();
           onRefresh();
           alert("Dados restaurados com sucesso!");
        }
      } catch (err) {
        alert("Erro ao importar: " + (err as Error).message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      
      <div className="flex items-center gap-2">
        <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full text-blue-600 dark:text-blue-400">
          <Database size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Dados Locais</h2>
          <p className="text-xs text-slate-500">Seus dados estão salvos no navegador deste dispositivo.</p>
        </div>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
           <div className="flex items-center gap-2 text-slate-500 mb-1">
             <HardDrive size={16} />
             <span className="text-xs font-bold uppercase">Uso em Disco</span>
           </div>
           <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{dbSize}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
           <div className="flex items-center gap-2 text-slate-500 mb-1">
             <Database size={16} />
             <span className="text-xs font-bold uppercase">Modelos Salvos</span>
           </div>
           <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{savedModels.length}</div>
        </div>
      </div>

      {/* LISTA DE MODELOS SALVOS */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
         <div className="bg-slate-50 dark:bg-slate-700/50 px-4 py-3 border-b border-slate-100 dark:border-slate-700">
          <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <FolderOpen size={16} /> Gerenciar Modelos Salvos
          </h3>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
           {savedModels.length === 0 && (
             <div className="p-8 text-center flex flex-col items-center gap-2 text-slate-400">
               <Database size={32} className="opacity-20" />
               <span className="text-sm">Nenhum modelo salvo ainda.</span>
               <span className="text-xs">Crie e salve um modelo na aba "EDITAR".</span>
             </div>
           )}
           {savedModels.map(model => (
             <div key={model.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-center justify-between group">
                <div className="flex-1 overflow-hidden mr-2">
                   <div className="font-bold text-slate-700 dark:text-slate-200 truncate text-sm">{model.name}</div>
                   <div className="text-[10px] text-slate-400">
                      Atualizado em: {new Date(model.updatedAt).toLocaleDateString()} às {new Date(model.updatedAt).toLocaleTimeString().slice(0,5)}
                   </div>
                </div>
                <div className="flex items-center gap-2">
                   <button 
                     onClick={() => onLoadModel(model.id)}
                     className="flex items-center gap-1 px-3 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-xs font-bold"
                     title="Carregar este modelo"
                   >
                     <ArrowUpRight size={14} /> Abrir
                   </button>
                   <button 
                     onClick={() => onRenameModel(model.id)}
                     className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                     title="Renomear"
                   >
                     <Edit3 size={16} />
                   </button>
                   <button 
                     onClick={() => onDeleteModel(model.id)}
                     className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                     title="Excluir"
                   >
                     <Trash2 size={16} />
                   </button>
                </div>
             </div>
           ))}
        </div>
      </div>

      {/* Ações de Backup */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="bg-slate-50 dark:bg-slate-700/50 px-4 py-3 border-b border-slate-100 dark:border-slate-700">
          <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200">Backup e Restauração</h3>
        </div>
        <div className="p-4 space-y-4">
          
          <button 
            onClick={handleExport}
            className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group"
          >
             <div className="flex items-center gap-3">
               <div className="bg-green-100 dark:bg-green-900/30 text-green-600 p-2 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
                 <Download size={20} />
               </div>
               <div className="text-left">
                 <div className="font-bold text-sm text-slate-700 dark:text-slate-200">Exportar Backup</div>
                 <div className="text-xs text-slate-400">Salvar arquivo .json no dispositivo</div>
               </div>
             </div>
             <div className="text-xs text-slate-400">
                Último: {lastBackup}
             </div>
          </button>

          <label className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group cursor-pointer">
             <div className="flex items-center gap-3">
               <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 p-2 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                 <Upload size={20} />
               </div>
               <div className="text-left">
                 <div className="font-bold text-sm text-slate-700 dark:text-slate-200">Restaurar Backup</div>
                 <div className="text-xs text-slate-400">Carregar arquivo .json salvo anteriormente</div>
               </div>
             </div>
             <input type="file" className="hidden" accept=".json" onChange={handleImport} />
          </label>

        </div>
      </div>

      {/* Zona de Perigo */}
      <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-4 border border-red-100 dark:border-red-900/30">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
          <AlertTriangle size={18} />
          <h3 className="font-bold text-sm">Zona de Perigo</h3>
        </div>
        <p className="text-xs text-red-600/70 dark:text-red-400/70 mb-4">
          Ações aqui são irreversíveis. Tenha certeza do que está fazendo.
        </p>
        <button 
          onClick={handleClearAll}
          className="w-full bg-red-600 hover:bg-red-700 text-white p-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"
        >
          <Trash2 size={16} /> Apagar Banco de Dados Local
        </button>
      </div>

    </div>
  );
};

export default DataScreen;