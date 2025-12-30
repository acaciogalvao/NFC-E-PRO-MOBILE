
import React, { useState } from 'react';
import { TabId } from './components/shared/types';
import TabBar from './components/core/TabBar/TabBar';
import Header from './components/core/Header/Header';
import ToastContainer from './components/core/Toast/ToastContainer';
import { AppProvider, useAppContext } from './components/shared/context/AppContext';
import { ModelListModal, ActionModals } from './components/modules/Data/components/ModelManagerModals';

import EditScreen from './components/modules/Edit/EditScreen';
import PricesScreen from './screens/PricesScreen';
import NoteScreen from './screens/NoteScreen';
import CouponScreen from './screens/CouponScreen';
import PaymentScreen from './screens/PaymentScreen';
import DataScreen from './screens/DataScreen';

import { useBluetooth } from './hooks/useBluetooth';
import { usePrintPDF } from './hooks/usePrintPDF';
import { useAppActions } from './hooks/useAppActions';

const AppLayout: React.FC = () => {
  const { 
    notifications, 
    selectedModelId, savedModels, 
    handleSaveModel, isSaving, 
    handleNewModel, handleRenameModel, handleDeleteModel, handleLoadModel, handleImportBackup,
    invoiceData,
    showToast
  } = useAppContext();

  const [activeTab, setActiveTab] = useState<TabId>('EDITAR');
  
  const { printCharacteristic, handleBluetoothConnect } = useBluetooth();
  const { isProcessing, handleDownloadPDF } = usePrintPDF(activeTab, invoiceData);
  const { 
    showModelModal, setShowModelModal,
    actionModal, setActionModal
  } = useAppActions();

  const handlePrint = () => {
    if (activeTab !== 'NOTA' && activeTab !== 'CUPOM') {
      showToast("Acesse a aba 'NFC-e' ou 'Cupom' para imprimir.", "info");
      return;
    }
    window.print();
  };

  const selectedModelName = selectedModelId 
    ? (savedModels?.find(m => m.id === selectedModelId)?.name || 'Novo Rascunho') 
    : 'Novo Rascunho';

  return (
    <div className="w-full min-h-dvh flex flex-col bg-slate-50 dark:bg-[#0a0a0b] transition-colors duration-500 overflow-hidden">
      <ToastContainer notifications={notifications || []} />

      <Header 
        selectedModelName={selectedModelName}
        onShowModels={() => setShowModelModal(true)}
        onSave={handleSaveModel}
        onNew={() => setActionModal({ type: 'NEW_MODEL'})}
        onDownload={handleDownloadPDF}
        onPrint={handlePrint}
        isSaving={isSaving}
        isDownloading={isProcessing}
        isBluetoothConnected={!!printCharacteristic}
        onBluetoothConnect={handleBluetoothConnect}
      />

      <div className="mt-auto px-6 print:hidden">
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

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
              savedModels={savedModels || []} 
              onDeleteModel={handleDeleteModel} 
              onRenameModel={(id) => setActionModal({ type: 'RENAME', targetId: id })} 
              onLoadModel={handleLoadModel} 
              onClearAllData={() => setActionModal({type:'RESET_ALL'})} 
              onImportBackup={handleImportBackup} 
            />
          )}
        </div>
      </main>

      <ModelListModal 
        isOpen={showModelModal} 
        onClose={() => setShowModelModal(false)} 
        savedModels={savedModels || []} 
        selectedId={selectedModelId} 
        onLoad={handleLoadModel} 
        onNew={handleNewModel} 
      />
      
      <ActionModals 
        type={actionModal.type} 
        onClose={() => setActionModal({ type: 'NONE' })} 
        onConfirm={(val) => {
          if (actionModal.type === 'RENAME') handleRenameModel(actionModal.targetId!, val!);
          if (actionModal.type === 'DELETE') handleDeleteModel(actionModal.targetId!);
          if (actionModal.type === 'NEW_MODEL') handleNewModel();
          setActionModal({ type: 'NONE' });
        }}
        initialValue={actionModal.type === 'RENAME' ? savedModels?.find(m => m.id === actionModal.targetId)?.name : ''}
        name={actionModal.name}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppLayout />
    </AppProvider>
  );
};

export default App;
