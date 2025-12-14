import React from 'react';
import { Edit2, DollarSign, FileText, CreditCard, Wifi } from 'lucide-react';
import { TabId } from '../types';

interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange }) => {
  const tabs: { id: TabId; label: string; icon: React.FC<any> }[] = [
    { id: 'EDITAR', label: 'EDITAR', icon: Edit2 },
    { id: 'PRECOS', label: 'PREÇOS', icon: DollarSign },
    { id: 'NOTA', label: 'NOTA', icon: FileText },
    { id: 'PAGAMENTO', label: 'PAGAMENTO', icon: CreditCard },
    { id: 'API', label: '', icon: Wifi },
  ];

  return (
    <div className="flex overflow-x-auto no-scrollbar border-b border-slate-200">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors flex-1 justify-center
              ${isActive 
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }
            `}
          >
            <Icon size={16} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default TabBar;
