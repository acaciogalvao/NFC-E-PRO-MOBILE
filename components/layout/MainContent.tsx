import React from 'react';
import { TabId } from '../../types';
import EditScreen from '../../screens/EditScreen';
import PricesScreen from '../../screens/PricesScreen';
import NoteScreen from '../../screens/NoteScreen';
import CouponScreen from '../../screens/CouponScreen';
import PaymentScreen from '../../screens/PaymentScreen';
import DataScreen from '../../screens/DataScreen';

interface MainContentProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  handleSaveModel: () => void;
  savedModels: any[];
  handleDeleteModel: (id: string) => void;
  setActionModal: (val: any) => void;
  handleLoadModel: (id: string) => void;
  handleImportBackup: (models: any[], layouts?: any[]) => void;
}

const MainContent: React.FC<MainContentProps> = ({
  activeTab,
  setActiveTab,
  handleSaveModel,
  savedModels,
  handleDeleteModel,
  setActionModal,
  handleLoadModel,
  handleImportBackup
}) => {
  return (
    <main className="flex-1 overflow-y-auto px-6 pt-2 pb-32 no-scrollbar animate-reveal">
      <div className="max-w-md mx-auto">
        {activeTab === 'EDITAR' && <EditScreen onGenerate={() => setActiveTab('PAGAMENTO')} />}
        {activeTab === 'PRECOS' && <PricesScreen />}
        {activeTab === 'NOTA' && <NoteScreen />}
        {activeTab === 'CUPOM' && <CouponScreen />}
        {activeTab === 'PAGAMENTO' && <PaymentScreen onConfirm={() => { handleSaveModel(); setActiveTab('EDITAR'); }} />}
        {activeTab === 'DADOS' && (
          <DataScreen 
            onRefresh={()=>{}} 
            savedModels={savedModels} 
            onDeleteModel={handleDeleteModel} 
            onRenameModel={(id) => setActionModal({ type: 'RENAME', targetId: id })} 
            onLoadModel={handleLoadModel} 
            onClearAllData={() => setActionModal({type:'RESET_ALL'})} 
            onImportBackup={handleImportBackup} 
          />
        )}
      </div>
    </main>
  );
};

export default MainContent;