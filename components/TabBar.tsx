import React from 'react';
import { Edit2, DollarSign, FileText, CreditCard, Database, Ticket } from 'lucide-react';
import { TabId } from '../types';

interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange }) => {
  const tabs: { id: TabId; label: string; icon: React.FC<any> }[] = [
    { id: 'EDITAR', label: 'EDITAR', icon: Edit2 },
    { id: 'PRECOS', label: 'PREÇOS', icon: DollarSign },
    { id: 'CUPOM', label: 'CUPONS', icon: Ticket },    // Agora aponta para CouponScreen (Térmico)
    { id: 'NOTA', label: 'NFC-e', icon: FileText },    // Agora aponta para NoteScreen (A4)
    { id: 'PAGAMENTO', label: 'PGTO', icon: CreditCard },
    { id: 'DADOS', label: 'DADOS', icon: Database },
  ];

  return (
    <div className="flex overflow-x-auto no-scrollbar border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center gap-2 px-3 py-3 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors flex-1 justify-center min-w-[80px]
              ${isActive 
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/20' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }
            `}
          >
            <Icon size={16} className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default TabBar;