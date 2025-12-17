import React from 'react';
import { X, Database, Check, FolderOpen, FilePlus, Edit3, Trash2, ChevronRight } from 'lucide-react';
import { SavedModel } from '../../types';

interface ModelListModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedModels: SavedModel[];
  selectedId: string;
  onLoad: (id: string) => void;
  onNew: () => void;
}

export const ModelListModal: React.FC<ModelListModalProps> = ({ isOpen, onClose, savedModels, selectedId, onLoad, onNew }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
       <div className="glass-card w-full max-w-md rounded-[2.5rem] shadow-2xl flex flex-col max-h-[85vh] border border-white/10 animate-reveal overflow-hidden">
          <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
            <div>
              <h3 className="font-black text-lg text-white tracking-tight">Biblioteca</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Meus Modelos Salvos</p>
            </div>
            <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-slate-400"><X size={24} /></button>
          </div>
          
          <div className="overflow-y-auto p-4 flex-1 space-y-2 no-scrollbar">
             <button onClick={() => { onNew(); onClose(); }} className="w-full text-left p-6 rounded-[2rem] border-2 border-dashed border-white/10 hover:bg-indigo-500/10 hover:border-indigo-500/50 flex items-center gap-4 transition-all group">
               <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all">
                 <FilePlus size={24} />
               </div>
               <div>
                 <span className="text-white font-black text-sm block uppercase tracking-widest">Novo Rascunho</span>
                 <span className="text-[10px] text-slate-500 font-bold uppercase">Limpar campos para nova nota</span>
               </div>
             </button>
             
             {savedModels.map(m => (
                <button 
                  key={m.id} 
                  onClick={() => { onLoad(m.id); onClose(); }} 
                  className={`w-full text-left p-5 rounded-[2rem] flex items-center gap-4 transition-all ${selectedId === m.id ? 'bg-indigo-500 text-white shadow-xl shadow-indigo-500/20' : 'hover:bg-white/5 border border-transparent'}`}
                >
                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${selectedId === m.id ? 'bg-white/20' : 'bg-slate-800 text-slate-500'}`}>
                      <FolderOpen size={22} />
                   </div>
                   <div className="flex-1 overflow-hidden">
                      <div className="font-black text-sm truncate uppercase tracking-tight">{m.name}</div>
                      <div className={`text-[9px] font-bold uppercase tracking-widest ${selectedId === m.id ? 'text-indigo-100' : 'text-slate-500'}`}>
                         {new Date(m.updatedAt).toLocaleDateString()}
                      </div>
                   </div>
                   {selectedId === m.id ? <Check size={20} /> : <ChevronRight size={20} className="text-slate-700" />}
                </button>
             ))}
          </div>
       </div>
    </div>
  );
};

interface ActionModalProps {
  type: 'NONE' | 'RENAME' | 'DELETE' | 'RESET_ALL' | 'NEW_MODEL';
  onClose: () => void;
  onConfirm: (val?: string) => void;
  initialValue?: string;
  name?: string;
}

export const ActionModals: React.FC<ActionModalProps> = ({ type, onClose, onConfirm, initialValue = '', name = '' }) => {
  const [inputValue, setInputValue] = React.useState(initialValue);
  if (type === 'NONE') return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-fade-in">
      <div className="glass-card w-full max-w-sm rounded-[3rem] p-10 shadow-2xl border border-white/10 animate-reveal">
        {type === 'RENAME' && (
          <>
            <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-[1.5rem] flex items-center justify-center mb-6">
              <Edit3 size={32} />
            </div>
            <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Renomear</h3>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Defina um novo título</p>
            <input className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 mb-8 text-white font-bold outline-none focus:border-indigo-500 focus:bg-white/10 transition-all" value={inputValue} onChange={(e) => setInputValue(e.target.value)} autoFocus />
            <div className="flex flex-col gap-3">
              <button onClick={() => onConfirm(inputValue)} className="w-full btn-primary py-4 rounded-2xl text-white font-black text-xs tracking-widest">SALVAR ALTERAÇÃO</button>
              <button onClick={onClose} className="w-full py-4 text-slate-500 font-bold text-xs uppercase">Cancelar</button>
            </div>
          </>
        )}
        {(type === 'DELETE' || type === 'RESET_ALL') && (
          <>
            <div className="w-16 h-16 bg-rose-500/20 text-rose-500 rounded-[1.5rem] flex items-center justify-center mb-6">
              <Trash2 size={32} />
            </div>
            <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Excluir?</h3>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-tight mb-8">Esta ação removerá permanentemente os dados. Deseja prosseguir?</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => onConfirm()} className="w-full bg-rose-600 py-4 rounded-2xl text-white font-black text-xs tracking-widest shadow-lg shadow-rose-900/20">CONFIRMAR EXCLUSÃO</button>
              <button onClick={onClose} className="w-full py-4 text-slate-500 font-bold text-xs uppercase">Manter Dados</button>
            </div>
          </>
        )}
        {type === 'NEW_MODEL' && (
          <>
             <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-[1.5rem] flex items-center justify-center mb-6">
              <FilePlus size={32} />
            </div>
            <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Novo Modelo</h3>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-tight mb-8">Deseja limpar todos os campos e iniciar um novo projeto?</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => onConfirm()} className="w-full bg-emerald-600 py-4 rounded-2xl text-white font-black text-xs tracking-widest">SIM, NOVO PROJETO</button>
              <button onClick={onClose} className="w-full py-4 text-slate-500 font-bold text-xs uppercase">Continuar Editando</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};