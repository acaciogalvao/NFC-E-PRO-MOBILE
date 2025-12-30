
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Database, Trash2, Download, Upload, HardDrive, Edit3, ArrowUpRight, FolderOpen, AlertTriangle, ShieldCheck, Cloud, RefreshCw, Loader2, Palette, Plus, X, Save, Settings, Type, AlignCenter, AlignLeft, Image as ImageIcon, Check, Eye } from 'lucide-react';
import { SavedModel, LayoutConfig } from '../types';
import { LOCAL_STORAGE_KEY_MODELS, LOCAL_STORAGE_KEY_LAYOUTS, DEFAULT_LAYOUTS } from '../utils/constants';
import { useAppContext } from '../context/AppContext';
import StandardReceipt from '../components/receipts/StandardReceipt';

interface DataScreenProps {
  onRefresh: () => void;
  savedModels: SavedModel[];
  onDeleteModel: (id: string) => void;
  onRenameModel: (id: string) => void;
  onLoadModel: (id: string) => void;
  onClearAllData: () => void;
  onImportBackup: (models: SavedModel[], layouts?: LayoutConfig[]) => void;
}

const LayoutEditorModal: React.FC<{
  layout: LayoutConfig | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (layout: LayoutConfig) => void;
}> = ({ layout, isOpen, onClose, onSave }) => {
  const { postoData, invoiceData, fuels } = useAppContext();
  const [formData, setFormData] = useState<LayoutConfig | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (layout) {
      setFormData({ ...layout });
    } else {
      setFormData({
        ...DEFAULT_LAYOUTS[0],
        id: `layout_${Date.now()}`,
        name: 'Novo Estilo Customizado',
        logoUrl: '',
      });
    }
  }, [layout, isOpen]);

  if (!isOpen || !formData) return null;

  const handleChange = (field: string, value: any) => {
    setFormData(prev => prev ? ({ ...prev, [field]: value }) : null);
  };

  const handleTextChange = (field: string, value: string) => {
    setFormData(prev => prev ? ({
      ...prev,
      customTexts: { ...prev.customTexts, [field]: value }
    }) : null);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => handleChange('logoUrl', event.target?.result);
      reader.readAsDataURL(file);
    }
  };

  const previewData = {
    posto: { ...postoData, razaoSocial: postoData.razaoSocial || 'POSTO EXEMPLO LTDA' },
    invoice: { ...invoiceData, numero: '000123456', dataEmissao: new Date().toLocaleString() },
    calculations: {
      rawTotal: 150.50,
      valTotalTributos: 45.20,
      valFederal: 15.10,
      valEstadual: 30.10,
      valMunicipal: 0,
      activeFuels: (fuels || []).length > 0 ? (fuels || []).map(f => ({ ...f, q: 10, p: 5.5, t: 55 })) : [
        { id: '1', code: '001', name: 'GASOLINA COMUM', q: 25.450, p: 5.890, t: 149.90, unit: 'L' } as any
      ],
      qrCodeImageUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=PROXIMO',
      paymentMethodLabel: 'DINHEIRO'
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-0 sm:p-4 bg-black/95 backdrop-blur-2xl animate-fade-in overflow-hidden">
      <div className="glass-card w-full max-w-5xl h-full sm:h-[90vh] rounded-none sm:rounded-[3rem] shadow-2xl border border-white/10 animate-reveal flex flex-col overflow-hidden">
        
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-2xl">
              <Palette size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tight">Estúdio de Estilo</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ajuste e visualize em tempo real</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowPreview(!showPreview)} 
              className={`p-3 rounded-2xl transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest ${showPreview ? 'bg-indigo-500 text-white' : 'bg-white/5 text-slate-400'}`}
            >
              <Eye size={18} /> {showPreview ? 'Configurar' : 'Ver Preview'}
            </button>
            <button onClick={onClose} className="p-3 bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          <div className={`flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar ${showPreview ? 'hidden md:block' : 'block'}`}>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-4 block">Identidade Visual</label>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase ml-2">Nome do Estilo</label>
                  <input 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-indigo-500 transition-all"
                    value={formData.name}
                    onChange={e => handleChange('name', e.target.value.toUpperCase())}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase ml-2">Logo do Posto</label>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => logoInputRef.current?.click()}
                      className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-bold text-slate-400 hover:text-white hover:border-indigo-500 transition-all flex items-center justify-center gap-2"
                    >
                      {formData.logoUrl ? <Check size={14} className="text-emerald-500" /> : <ImageIcon size={14} />}
                      {formData.logoUrl ? 'LOGO CARREGADA' : 'CARREGAR LOGO'}
                    </button>
                    {formData.logoUrl && (
                      <button onClick={() => handleChange('logoUrl', '')} className="p-4 bg-rose-500/10 text-rose-500 rounded-2xl border border-rose-500/20"><Trash2 size={16} /></button>
                    )}
                    <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
              <label className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-4 block">Tipografia & Formatação</label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase ml-2">Tamanho da Fonte</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none appearance-none" value={formData.fontSize} onChange={e => handleChange('fontSize', e.target.value)}>
                    <option value="SMALL" className="bg-slate-900">PEQUENO (NATIVO)</option>
                    <option value="MEDIUM" className="bg-slate-900">MÉDIO</option>
                    <option value="LARGE" className="bg-slate-900">GRANDE</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase ml-2">Espaçamento Entre Linhas</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none appearance-none" value={formData.lineSpacing} onChange={e => handleChange('lineSpacing', e.target.value)}>
                    <option value="TIGHT" className="bg-slate-900">COMPACTO</option>
                    <option value="NORMAL" className="bg-slate-900">PADRÃO</option>
                    <option value="WIDE" className="bg-slate-900">ESPAÇADO</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
              <label className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-4 block">Textos do Cupom</label>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase ml-2">Título DANFE</label>
                  <textarea 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-indigo-500 min-h-[80px]"
                    value={formData.customTexts.headerTitle}
                    onChange={e => handleTextChange('headerTitle', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase ml-2">Rodapé e Mensagens</label>
                  <textarea 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-indigo-500 min-h-[80px]"
                    value={formData.customTexts.footerMessage}
                    onChange={e => handleTextChange('footerMessage', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
              {[
                { field: 'showQrCode', label: 'QR Code' },
                { field: 'showConsumer', label: 'Consumidor' },
                { field: 'showHeader', label: 'Cabeçalho' },
                { field: 'upperCaseAll', label: 'Caixa Alta' },
                { field: 'showSeparatorLines', label: 'Divisórias' },
                { field: 'showSidebars', label: 'Barras Lat.' }
              ].map(opt => (
                <button 
                  key={opt.field}
                  onClick={() => handleChange(opt.field, !(formData as any)[opt.field])}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${(formData as any)[opt.field] ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400' : 'bg-white/5 border-white/5 text-slate-500'}`}
                >
                  <span className="text-[10px] font-black uppercase tracking-tight">{opt.label}</span>
                  <div className={`w-2 h-2 rounded-full transition-all ${(formData as any)[opt.field] ? 'bg-indigo-500 scale-125' : 'bg-slate-700'}`} />
                </button>
              ))}
            </div>
          </div>

          <div className={`flex-1 bg-slate-900/50 flex flex-col items-center justify-start p-6 overflow-y-auto no-scrollbar border-l border-white/5 ${showPreview ? 'block' : 'hidden md:flex'}`}>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-8 block">Preview em Tempo Real</label>
            <div className="scale-[0.8] sm:scale-100 origin-top bg-white p-4 shadow-2xl rounded-sm">
               <StandardReceipt data={previewData as any} layout={formData} width="80mm" />
            </div>
          </div>

        </div>

        <div className="p-8 border-t border-white/5 bg-white/5">
          <button 
            onClick={() => onSave(formData)}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 py-5 rounded-[2rem] text-white font-black text-sm tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-indigo-500/20 active:scale-95 transition-all"
          >
            <Save size={20} /> SALVAR ESTILO DE IMPRESSÃO
          </button>
        </div>
      </div>
    </div>
  );
};

const DataScreen: React.FC<DataScreenProps> = ({ savedModels, onDeleteModel, onRenameModel, onLoadModel, onClearAllData, onImportBackup }) => {
  const { handleSyncFromCloud, isSyncing, customLayouts, handleSaveLayout, handleDeleteLayout } = useAppContext();
  const [dbSize, setDbSize] = useState<string>('0 KB');
  const [editingLayout, setEditingLayout] = useState<LayoutConfig | null>(null);
  const [isLayoutModalOpen, setIsLayoutModalOpen] = useState(false);

  useEffect(() => {
    calculateStats();
  }, [savedModels, customLayouts]);

  const calculateStats = () => {
    try {
      const models = localStorage.getItem(LOCAL_STORAGE_KEY_MODELS) || '[]';
      const layouts = localStorage.getItem(LOCAL_STORAGE_KEY_LAYOUTS) || '';
      const totalBytes = new Blob([models]).size + new Blob([layouts]).size;
      setDbSize(totalBytes > 1024 * 1024 ? `${(totalBytes / (1024 * 1024)).toFixed(2)} MB` : `${(totalBytes / 1024).toFixed(2)} KB`);
    } catch { setDbSize('Err'); }
  };

  const handleExport = () => {
    const data = { models: savedModels || [], layouts: customLayouts || [], exportedAt: new Date().toISOString() };
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
        const models = Array.isArray(data) ? data : (data.models || []);
        if (confirm(`Importar ${models.length} modelos? Isso substituirá os atuais.`)) onImportBackup(models, data.layouts);
      } catch { alert("Arquivo inválido"); }
    };
    reader.readAsText(file);
  };

  const openLayoutEditor = (layout: LayoutConfig | null = null) => {
    setEditingLayout(layout);
    setIsLayoutModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-reveal pb-20">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black text-indigo-500 uppercase tracking-[0.3em]">Gestão de Dados</h3>
        <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2 py-1 rounded-lg">
          <ShieldCheck size={12} className="text-emerald-500" />
          <span className="text-[9px] font-black text-emerald-500 uppercase">Segurança Ativa</span>
        </div>
      </div>

      <div className="glass-card rounded-[2rem] p-6 border border-indigo-500/20 bg-indigo-500/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400">
                <Cloud size={20} />
             </div>
             <div>
                <h4 className="text-xs font-black dark:text-white uppercase tracking-widest">Sincronização Cloud</h4>
                <p className="text-[9px] font-bold text-slate-500 uppercase">MongoDB Atlas Engine</p>
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
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card rounded-3xl p-5 border border-white/5">
           <div className="flex items-center gap-2 text-slate-500 mb-2">
             <HardDrive size={14} />
             <span className="text-[9px] font-black uppercase tracking-widest">Armazém</span>
           </div>
           <div className="text-2xl font-black dark:text-white tracking-tight">{dbSize}</div>
        </div>
        <div className="glass-card rounded-3xl p-5 border border-white/5">
           <div className="flex items-center gap-2 text-slate-500 mb-2">
             <Database size={14} />
             <span className="text-[9px] font-black uppercase tracking-widest">Modelos</span>
           </div>
           <div className="text-2xl font-black text-indigo-500 tracking-tight">{(savedModels || []).length}</div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
           <div className="flex items-center gap-2">
              <Palette size={14} className="text-indigo-500" />
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Estilos de Impressão</h4>
           </div>
           <button onClick={() => openLayoutEditor(null)} className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-1">
             <Plus size={14} /> Novo Estilo
           </button>
        </div>
        <div className="glass-card rounded-[2rem] overflow-hidden border border-white/5 divide-y divide-white/5">
           {(customLayouts || []).map(layout => (
             <div key={layout.id} className="p-5 flex items-center justify-between group hover:bg-white/5 transition-all">
                <div>
                   <div className="font-bold text-sm dark:text-white uppercase truncate max-w-[150px]">{layout.name}</div>
                   <div className="text-[9px] text-slate-500 font-bold uppercase mt-0.5 tracking-tighter">
                      Fonte: {layout.fontFamily} • Alinhamento: {layout.textAlign}
                   </div>
                </div>
                <div className="flex items-center gap-1">
                   <button onClick={() => openLayoutEditor(layout)} className="w-10 h-10 flex items-center justify-center bg-white/5 text-slate-400 rounded-xl hover:text-indigo-400 transition-colors"><Edit3 size={18} /></button>
                   <button onClick={() => handleDeleteLayout(layout.id)} className="w-10 h-10 flex items-center justify-center text-slate-600 hover:text-rose-500 transition-colors" disabled={DEFAULT_LAYOUTS.some(d => d.id === layout.id)}><Trash2 size={18} /></button>
                </div>
             </div>
           ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 px-2">
           <FolderOpen size={14} className="text-indigo-500" />
           <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Biblioteca de Modelos</h4>
        </div>
        <div className="glass-card rounded-[2rem] overflow-hidden border border-white/5 divide-y divide-white/5">
           {(savedModels || []).map(model => (
             <div key={model.id} className="p-5 flex items-center justify-between group hover:bg-white/5 transition-all">
                <div className="flex-1 overflow-hidden">
                   <div className="font-bold text-sm dark:text-white uppercase truncate mb-0.5">{model.name}</div>
                   <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                      {new Date(model.updatedAt).toLocaleDateString()}
                   </div>
                </div>
                <div className="flex items-center gap-1">
                   <button onClick={() => onLoadModel(model.id)} className="w-10 h-10 flex items-center justify-center bg-indigo-500/10 text-indigo-400 rounded-xl"><ArrowUpRight size={20} /></button>
                   <button onClick={() => onRenameModel(model.id)} className="w-10 h-10 flex items-center justify-center text-slate-600"><Edit3 size={18} /></button>
                   <button onClick={() => onDeleteModel(model.id)} className="w-10 h-10 flex items-center justify-center text-slate-600 hover:text-rose-500"><Trash2 size={18} /></button>
                </div>
             </div>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <button onClick={handleExport} className="w-full flex items-center gap-4 p-5 glass-card rounded-3xl group transition-all hover:bg-white/5">
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all">
            <Download size={22} />
          </div>
          <div className="text-left">
            <div className="font-black text-xs dark:text-white uppercase tracking-widest">Backup em Arquivo</div>
            <div className="text-[10px] text-slate-500 font-bold">Exportar biblioteca (.json)</div>
          </div>
        </button>

        <label className="w-full flex items-center gap-4 p-5 glass-card rounded-3xl cursor-pointer group transition-all hover:bg-white/5">
          <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all">
            <Upload size={22} />
          </div>
          <div className="text-left">
            <div className="font-black text-xs dark:text-white uppercase tracking-widest text-blue-400">Importar Arquivo</div>
            <div className="text-[10px] text-slate-500 font-bold">Restaurar de arquivo local</div>
          </div>
          <input type="file" className="hidden" accept=".json" onChange={handleImport} />
        </label>
      </div>

      <div className="pt-4">
        <button onClick={onClearAllData} className="w-full py-4 text-rose-500/50 hover:text-rose-500 text-[10px] font-black uppercase tracking-[0.3em] transition-colors flex items-center justify-center gap-2">
          <AlertTriangle size={14} /> Wipe Cache Local
        </button>
      </div>

      <LayoutEditorModal 
        isOpen={isLayoutModalOpen}
        layout={editingLayout}
        onClose={() => setIsLayoutModalOpen(false)}
        onSave={(layout) => {
          handleSaveLayout(layout);
          setIsLayoutModalOpen(false);
        }}
      />
    </div>
  );
};

export default DataScreen;
