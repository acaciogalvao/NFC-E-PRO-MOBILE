
import React, { useState } from 'react';
import { TabId } from './types';
import TabBar from './components/layout/TabBar';
import Header from './components/layout/Header';
import ToastContainer from './components/layout/ToastContainer';
import MainContent from './components/layout/MainContent';
import { AppProvider, useAppContext } from './context/AppContext';
import { ModelListModal, ActionModals } from './components/modals/ModelManagerModals';

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
      showToast("Acesse a aba 'NFC-e' ou 'Cupom' para imprimir o documento.", "info");
      return;
    }
    window.print();
  };

  const selectedModelName = selectedModelId 
    ? (savedModels.find(m => m.id === selectedModelId)?.name || 'Novo Rascunho') 
    : 'Novo Rascunho';

  return (
    <div className="w-full min-h-dvh flex flex-col bg-slate-50 dark:bg-[#0a0a0b] transition-colors duration-500 overflow-hidden">
      <ToastContainer notifications={notifications} />

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

      <MainContent 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        handleSaveModel={handleSaveModel}
        savedModels={savedModels}
        handleDeleteModel={handleDeleteModel}
        setActionModal={setActionModal}
        handleLoadModel={handleLoadModel}
        handleImportBackup={handleImportBackup}
      />

      <ModelListModal 
        isOpen={showModelModal} 
        onClose={() => setShowModelModal(false)} 
        savedModels={savedModels} 
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
        initialValue={actionModal.type === 'RENAME' ? savedModels.find(m => m.id === actionModal.targetId)?.name : ''}
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
