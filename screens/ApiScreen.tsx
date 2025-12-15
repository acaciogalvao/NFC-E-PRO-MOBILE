import React, { useState, useEffect } from 'react';
import { Database, Trash2, Download, Upload, HardDrive, Edit3, ArrowUpRight, FolderOpen, AlertTriangle } from 'lucide-react';
import { SavedModel, LayoutConfig } from '../types';

interface DataScreenProps {
  onRefresh: () => void;
  savedModels: SavedModel[];
  onDeleteModel: (id: string) => void;
  onRenameModel: (id: string) => void;
  onLoadModel: (id: string) => void;
  onClearAllData: () => void;
  onImportBackup: (models: SavedModel[], layouts?: LayoutConfig[]) => void;
}

const LOCAL_STORAGE_KEY_MODELS = 'nfce_models_db_v1';
const LOCAL_STORAGE_KEY_LAYOUTS = 'nfce_pro_layouts_v3';

const DataScreen: React.FC<DataScreenProps> = ({ savedModels, onDeleteModel, onRenameModel, onLoadModel, onClearAllData, onImportBackup }) => {
  const [dbSize, setDbSize] = useState<string>('0 KB');

  useEffect(() => {
    calculateStats();
  }, [savedModels]);

  const calculateStats = () => {
    try {
      const models = localStorage.getItem(LOCAL_STORAGE_KEY_MODELS) || '[]';
      const layouts = localStorage.getItem(LOCAL_STORAGE_KEY_LAYOUTS) || '';
      const totalBytes = new Blob([models]).size + new Blob([layouts]).size;
      
      if (totalBytes > 1024 * 1024) {
        setDbSize(`${(totalBytes / (1024 * 1024)).toFixed(2)} MB`);
      } else {
        setDbSize(`${(totalBytes / 1024).toFixed(2)} KB`);
      }
    } catch {
      setDbSize('Erro');
    }
  };

  const handleExport = () => {
    const data = {
      models: savedModels,
      layouts: JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_LAYOUTS) || '[]'),
      exportedAt: new Date().toISOString(),
      version: '3.0-local'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_nfce_pro_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        let modelsToImport: SavedModel[] = [];
        let layoutsToImport: LayoutConfig[] | undefined = undefined;

        // LÓGICA DE COMPATIBILIDADE DE BACKUP
        if (Array.isArray(data)) {
           // Formato Antigo (V1): Apenas um array de modelos
           modelsToImport = data;
        } else if (data.models && Array.isArray(data.models)) {
           // Formato Novo (V2/V3): Objeto com 'models' e 'layouts'
           modelsToImport = data.models;
           if (data.layouts && Array.isArray(data.layouts)) {
             layoutsToImport = data.layouts;
           }
        } else {
           throw new Error("Formato de arquivo não reconhecido.");
        }

        if (modelsToImport.length === 0) {
           alert("O arquivo de backup não contém modelos válidos.");
           return;
        }

        if (confirm(`Restaurar backup com ${modelsToImport.length} modelos?\n\nISSO SUBSTITUIRÁ OS DADOS ATUAIS!`)) {
           onImportBackup(modelsToImport, layoutsToImport);
        }

      } catch (err) {
        alert("Erro ao importar: " + (err as Error).message);
      } finally {
        // Limpa o input para permitir selecionar o mesmo arquivo novamente se necessário
        event.target.value = '';
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
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Gerenciador de Dados</h2>
          <p className="text-xs text-slate-500">Dados armazenados localmente no navegador.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
           <div className="flex items-center gap-2 text-slate-500 mb-1">
             <HardDrive size={16} />
             <span className="text-xs font-bold uppercase">Armazenamento</span>
           </div>
           <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{dbSize}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
           <div className="flex items-center gap-2 text-slate-500 mb-1">
             <Database size={16} />
             <span className="text-xs font-bold uppercase">Modelos</span>
           </div>
           <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{savedModels.length}</div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
         <div className="bg-slate-50 dark:bg-slate-700/50 px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <FolderOpen size={16} /> Meus Modelos
          </h3>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-[400px] overflow-y-auto">
           {savedModels.length === 0 && (
             <div className="p-8 text-center flex flex-col items-center gap-3 text-slate-400">
               <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-full">
                 <Database size={32} className="opacity-30" />
               </div>
               <div className="flex flex-col">
                 <span className="text-sm font-bold">Nenhum modelo encontrado.</span>
                 <span className="text-xs">Crie seu primeiro modelo na aba "EDITAR".</span>
               </div>
             </div>
           )}
           {savedModels.map(model => (
             <div key={model.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-center justify-between group">
                <div className="flex-1 overflow-hidden mr-3">
                   <div className="font-bold text-slate-700 dark:text-slate-200 truncate text-sm mb-0.5">{model.name}</div>
                   <div className="text-[10px] text-slate-400 flex items-center gap-2">
                      <span>Atualizado: {new Date(model.updatedAt).toLocaleDateString()}</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="hidden sm:inline">{new Date(model.updatedAt).toLocaleTimeString().slice(0,5)}</span>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                   <button 
                     onClick={(e) => { e.stopPropagation(); onLoadModel(model.id); }}
                     className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-md text-xs font-bold transition-colors flex items-center gap-1"
                     title="Carregar para Edição"
                   >
                     <ArrowUpRight size={14} /> Abrir
                   </button>
                   <button 
                     onClick={(e) => { e.stopPropagation(); onRenameModel(model.id); }}
                     className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                     title="Renomear"
                   >
                     <Edit3 size={16} />
                   </button>
                   <button 
                     onClick={(e) => { e.stopPropagation(); onDeleteModel(model.id); }}
                     className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                     title="Excluir Permanentemente"
                   >
                     <Trash2 size={16} />
                   </button>
                </div>
             </div>
           ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="bg-slate-50 dark:bg-slate-700/50 px-4 py-3 border-b border-slate-100 dark:border-slate-700">
          <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200">Ferramentas de Sistema</h3>
        </div>
        <div className="p-4 space-y-3">
          
          <button 
            onClick={handleExport}
            className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group"
          >
             <div className="flex items-center gap-3">
               <div className="bg-green-100 dark:bg-green-900/30 text-green-600 p-2 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
                 <Download size={20} />
               </div>
               <div className="text-left">
                 <div className="font-bold text-sm text-slate-700 dark:text-slate-200">Fazer Backup (Download)</div>
                 <div className="text-xs text-slate-400">Salvar todos os modelos em arquivo .json</div>
               </div>
             </div>
          </button>

          <label className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group cursor-pointer">
             <div className="flex items-center gap-3">
               <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 p-2 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                 <Upload size={20} />
               </div>
               <div className="text-left">
                 <div className="font-bold text-sm text-slate-700 dark:text-slate-200">Restaurar Backup</div>
                 <div className="text-xs text-slate-400">Carregar arquivo .json do computador</div>
               </div>
             </div>
             <input type="file" className="hidden" accept=".json" onChange={handleImport} />
          </label>

          <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-700">
            <button 
              onClick={onClearAllData}
              className="w-full flex items-center justify-center gap-2 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg text-xs font-bold transition-colors"
            >
              <AlertTriangle size={14} /> Apagar Todos os Dados (Reset)
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DataScreen;