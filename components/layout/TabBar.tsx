import React from 'react';
import { Edit3, DollarSign, FileText, CreditCard, Layers, Ticket } from 'lucide-react';
import { TabId } from '../../types';

interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange }) => {
  const tabs: { id: TabId; label: string; icon: React.FC<any> }[] = [
    { id: 'EDITAR', label: 'Editar', icon: Edit3 },
    { id: 'PRECOS', label: 'Preços', icon: DollarSign },
    { id: 'CUPOM', label: 'Cupom', icon: Ticket },
    { id: 'NOTA', label: 'NFC-e', icon: FileText },
    { id: 'PAGAMENTO', label: 'Pgto', icon: CreditCard },
    { id: 'DADOS', label: 'Dados', icon: Layers },
  ];

  return (
    <nav className="fixed bottom-6 left-6 right-6 z-40">
      <div className="glass-card rounded-[2rem] p-2 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                relative flex flex-col items-center justify-center px-4 py-2.5 rounded-2xl transition-all duration-300 min-w-[64px]
                ${isActive ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}
              `}
            >
              <Icon size={20} className={isActive ? 'animate-float' : ''} />
              <span className={`text-[9px] font-bold mt-1 uppercase tracking-tighter ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute -bottom-1 w-1 h-1 bg-white rounded-full"></span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default TabBar;