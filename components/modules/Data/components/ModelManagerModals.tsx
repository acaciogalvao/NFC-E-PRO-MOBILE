
import React from 'react';
import { X, Check, FolderOpen, FilePlus, Edit3, Trash2, ChevronRight } from 'lucide-react';
import { SavedModel } from '../../../shared/types';

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
       <div className="glass-card w-full max-w-md rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[85vh] border border-white/10 animate-reveal overflow-hidden bg-[#0a0a0b]/80">
          <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
            <div>
              <h3 className="font-black text-xl text-white tracking-tight">Biblioteca</h3>
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] mt-1">Meus Modelos Salvos</p>
            </div>
            <button onClick={onClose} className="p-3 bg-white/5 rounded-full text-slate-400 hover:bg-white/10 hover:text-white transition-all">
              <X size={24} />
            </button>
          </div>
          
          <div className="overflow-y-auto p-5 flex-1 space-y-3 no-scrollbar">
             <button 
               onClick={() => { onNew(); onClose(); }} 
               className="w-full text-left p-6 rounded-[2rem] border-2 border-dashed border-white/10 hover:bg-indigo-500/10 hover:border-indigo-500/50 flex items-center gap-5 transition-all group"
             >
               <div className="w-14 h-14 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-lg">
                 <FilePlus size={28} />
               </div>
               <div>
                 <span className="text-white font-black text-sm block uppercase tracking-widest group-hover:text-indigo-300 transition-colors">Novo Rascunho</span>
                 <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight mt-1">Limpar campos para nova nota</span>
               </div>
             </button>
             
             <div className="h-px bg-white/5 mx-4 my-2" />

             {(savedModels || []).map(m => {
                const isSelected = selectedId === m.id;
                return (
                  <button 
                    key={m.id} 
                    onClick={() => { onLoad(m.id); onClose(); }} 
                    className={`
                      w-full text-left p-5 rounded-[2rem] flex items-center gap-4 transition-all duration-300
                      ${isSelected 
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-[0_10px_25px_rgba(79,70,229,0.3)] ring-1 ring-white/20' 
                        : 'bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-slate-300'
                      }
                    `}
                  >
                    <div className={`
                      w-12 h-12 rounded-2xl flex items-center justify-center transition-all
                      ${isSelected ? 'bg-white/20 shadow-inner' : 'bg-slate-800/50 text-slate-500'}
                    `}>
                      <FolderOpen size={22} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className={`font-black text-sm truncate uppercase tracking-tight ${isSelected ? 'text-white' : 'text-slate-100'}`}>
                        {m.name}
                      </div>
                      <div className={`text-[9px] font-bold uppercase tracking-widest mt-1 ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                        Atualizado: {new Date(m.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    {isSelected ? (
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <Check size={18} className="text-white" />
                      </div>
                    ) : (
                      <ChevronRight size={20} className="text-slate-700 group-hover:text-slate-500" />
                    )}
                  </button>
                );
             })}
          </div>

          <div className="p-6 bg-white/[0.02] border-t border-white/5 text-center">
             <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.3em]">NFC-e Pro Mobile v2.5</p>
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
  
  React.useEffect(() => {
    if (type === 'RENAME') setInputValue(initialValue);
  }, [type, initialValue]);

  if (type === 'NONE') return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-fade-in">
      <div className="glass-card w-full max-w-sm rounded-[3rem] p-10 shadow-[0_0_80px_rgba(0,0,0,0.8)] border border-white/10 animate-reveal bg-[#0a0a0b]">
        {type === 'RENAME' && (
          <>
            <div className="w-20 h-20 bg-blue-500/20 text-blue-400 rounded-[2rem] flex items-center justify-center mb-8 mx-auto shadow-lg shadow-blue-500/10">
              <Edit3 size={40} />
            </div>
            <h3 className="text-2xl font-black text-white mb-2 tracking-tight text-center">Renomear</h3>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-8 text-center">Defina um novo título premium</p>
            <input 
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 mb-8 text-white font-bold outline-none focus:border-indigo-500 focus:bg-white/10 transition-all text-center placeholder:text-slate-700" 
              value={inputValue} 
              onChange={(e) => setInputValue(e.target.value)} 
              autoFocus 
              placeholder="Digite o novo nome..."
            />
            <div className="flex flex-col gap-3">
              <button onClick={() => onConfirm(inputValue)} className="w-full btn-primary py-5 rounded-2xl text-white font-black text-xs tracking-[0.2em] shadow-lg shadow-indigo-500/20">SALVAR ALTERAÇÃO</button>
              <button onClick={onClose} className="w-full py-4 text-slate-500 font-bold text-xs uppercase tracking-widest hover:text-white transition-colors">Cancelar</button>
            </div>
          </>
        )}
        {(type === 'DELETE' || type === 'RESET_ALL') && (
          <>
            <div className="w-20 h-20 bg-rose-500/20 text-rose-500 rounded-[2rem] flex items-center justify-center mb-8 mx-auto shadow-lg shadow-rose-500/10">
              <Trash2 size={40} />
            </div>
            <h3 className="text-2xl font-black text-white mb-2 tracking-tight text-center">Confirmar?</h3>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-tight mb-10 text-center leading-relaxed px-2">Esta ação removerá permanentemente os dados da nuvem. Deseja prosseguir?</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => onConfirm()} className="w-full bg-rose-600 hover:bg-rose-500 py-5 rounded-2xl text-white font-black text-xs tracking-[0.2em] shadow-xl shadow-rose-900/30 transition-all active:scale-95">CONFIRMAR EXCLUSÃO</button>
              <button onClick={onClose} className="w-full py-4 text-slate-500 font-bold text-xs uppercase tracking-widest hover:text-white transition-colors">Manter Dados</button>
            </div>
          </>
        )}
        {type === 'NEW_MODEL' && (
          <>
             <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-[2rem] flex items-center justify-center mb-8 mx-auto shadow-lg shadow-emerald-500/10">
              <FilePlus size={40} />
            </div>
            <h3 className="text-2xl font-black text-white mb-2 tracking-tight text-center">Novo Projeto</h3>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-tight mb-10 text-center leading-relaxed">Deseja limpar todos os campos atuais e iniciar uma nova emissão do zero?</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => onConfirm()} className="w-full bg-emerald-600 hover:bg-emerald-500 py-5 rounded-2xl text-white font-black text-xs tracking-[0.2em] shadow-xl shadow-emerald-900/20 transition-all active:scale-95">SIM, NOVO PROJETO</button>
              <button onClick={onClose} className="w-full py-4 text-slate-500 font-bold text-xs uppercase tracking-widest hover:text-white transition-colors">Continuar Editando</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
