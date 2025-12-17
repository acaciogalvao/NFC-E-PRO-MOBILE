
import React, { useState, useEffect } from 'react';
import { Bluetooth, Download, Printer, Save, Loader2, ChevronRight, Database, Sparkles, PlusCircle } from 'lucide-react';
import { TabId, BluetoothRemoteGATTCharacteristic } from './types';
import TabBar from './components/TabBar';
import EditScreen from './screens/EditScreen';
import PricesScreen from './screens/PricesScreen';
import NoteScreen from './screens/NoteScreen';
import CouponScreen from './screens/CouponScreen';
import PaymentScreen from './screens/PaymentScreen';
import DataScreen from './screens/ApiScreen';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { AppProvider, useAppContext } from './context/AppContext';

import { ModelListModal, ActionModals } from './components/modals/ModelManagerModals';

const AppLayout: React.FC = () => {
  const { 
    notifications, showToast, 
    selectedModelId, savedModels, 
    handleSaveModel, isSaving, 
    handleNewModel, handleRenameModel, handleDeleteModel, handleLoadModel, handleImportBackup,
    postoData, invoiceData, fuels
  } = useAppContext();

  const [activeTab, setActiveTab] = useState<TabId>('EDITAR');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);
  const [actionModal, setActionModal] = useState<{ type: 'NONE' | 'RENAME' | 'DELETE' | 'RESET_ALL' | 'NEW_MODEL', targetId?: string, name?: string }>({ type: 'NONE' });

  const [printCharacteristic, setPrintCharacteristic] = useState<BluetoothRemoteGATTCharacteristic | null>(null);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setInstallPrompt(null);
  };

  const handleBluetoothConnect = async () => {
    if (!(navigator as any).bluetooth) { showToast("Bluetooth não disponível", "error"); return; }
    try {
        const device = await (navigator as any).bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb'] });
        if (device && device.gatt) {
            const server = await device.gatt.connect();
            const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
            const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');
            setPrintCharacteristic(characteristic);
            showToast(`Impressora Conectada!`, "success");
        }
    } catch(e) { console.error(e); showToast("Erro conexão BT", "error"); }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (isProcessing) return;
    
    // Verifica se estamos em uma aba que tem algo para imprimir
    if (activeTab !== 'NOTA' && activeTab !== 'CUPOM') {
      showToast("Vá para a aba NFC-e ou Cupom para baixar", "info");
      return;
    }

    setIsProcessing(true);
    const input = document.getElementById('printable-receipt');
    
    if (!input) { 
      showToast("Documento não encontrado na tela", "error");
      setIsProcessing(false); 
      return; 
    }

    try {
      // Captura o elemento com alta fidelidade
      const canvas = await html2canvas(input, { 
        scale: 3, 
        useCORS: true, 
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const filename = `${activeTab === 'NOTA' ? 'NFCe' : 'CUPOM'}-${invoiceData.numero || 'DOC'}.pdf`;

      let pdf;

      if (activeTab === 'NOTA') {
        // Formato A4 para NFC-e
        pdf = new jsPDF({ 
          orientation: 'portrait', 
          unit: 'mm', 
          format: 'a4' 
        });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const imgProps = pdf.getImageProperties(imgData);
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      } else {
        // Formato Térmico (80mm) para Cupom
        const pdfWidth = 80;
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf = new jsPDF({ 
          orientation: 'portrait', 
          unit: 'mm', 
          format: [pdfWidth, pdfHeight] 
        });
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      }

      pdf.save(filename);
      showToast("PDF gerado com sucesso!", "success");
    } catch (error) { 
      console.error(error);
      showToast("Erro ao processar PDF", "error"); 
    } finally { 
      setIsProcessing(false); 
    }
  };

  return (
    <div className="w-full min-h-dvh flex flex-col bg-slate-50 dark:bg-[#0a0a0b] transition-colors duration-500 overflow-hidden">
      {/* Notificações Flutuantes */}
      <div className="fixed top-6 left-0 right-0 z-[100] flex flex-col items-center gap-2 px-6 pointer-events-none print:hidden">
        {notifications.map(n => (
          <div key={n.id} className="pointer-events-auto flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl glass-card animate-reveal border border-white/10">
            <div className={`w-2 h-2 rounded-full ${n.type === 'success' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : n.type === 'error' ? 'bg-rose-500' : 'bg-blue-500'}`} />
            <span className="text-xs font-bold tracking-tight text-white/90">{n.message}</span>
          </div>
        ))}
      </div>

      {/* Header Moderno (Fintech) */}
      <header className="px-6 pt-12 pb-6 print:hidden z-30">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl btn-primary flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight dark:text-white leading-none">NFC-e <span className="text-indigo-500">Pro</span></h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Mobile System</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleBluetoothConnect} 
              className={`p-2.5 rounded-xl glass-card transition-all ${printCharacteristic ? 'text-emerald-400 border-emerald-500/50' : 'text-slate-400'}`}
              title="Conectar Impressora"
            >
              <Bluetooth size={20} />
            </button>
            <button 
              onClick={handleDownloadPDF} 
              disabled={isProcessing}
              className={`p-2.5 rounded-xl glass-card transition-all ${isProcessing ? 'text-indigo-400' : 'text-slate-400'}`}
              title="Baixar PDF"
            >
              {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
            </button>
            <button 
              onClick={handlePrint} 
              className="p-2.5 rounded-xl glass-card text-slate-400"
              title="Imprimir"
            >
              <Printer size={20} />
            </button>
          </div>
        </div>

        {/* Card de Gerenciamento de Modelo */}
        <div className="glass-card rounded-3xl p-5 shadow-xl border border-white/5 animate-slide-down">
          <div className="flex items-center justify-between mb-4">
             <div className="flex flex-col">
                <span className="text-[9px] font-extrabold text-indigo-500 uppercase tracking-[0.2em] mb-1">Modelo em Edição</span>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold truncate max-w-[180px] dark:text-white">
                    {selectedModelId ? savedModels.find(m => m.id === selectedModelId)?.name : 'Novo Rascunho'}
                  </h2>
                  <ChevronRight size={14} className="text-slate-500" />
                </div>
             </div>
             <button onClick={() => setShowModelModal(true)} className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-2xl hover:bg-indigo-500/20 transition-all">
                <Database size={20} />
             </button>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={handleSaveModel} 
              disabled={isSaving}
              className="flex-1 btn-primary py-3.5 rounded-2xl text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {selectedModelId ? 'ATUALIZAR' : 'CRIAR MODELO'}
            </button>
            
            {selectedModelId && (
              <button 
                onClick={() => setActionModal({ type: 'NEW_MODEL'})}
                className="w-14 glass-card rounded-2xl flex items-center justify-center text-slate-300 border border-white/10"
              >
                <PlusCircle size={20} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* TabBar Estilo App */}
      <div className="mt-auto px-6 print:hidden">
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Conteúdo Principal com Transição */}
      <main className="flex-1 overflow-y-auto px-6 pt-2 pb-32 no-scrollbar animate-reveal">
        <div className="max-w-md mx-auto">
          {activeTab === 'EDITAR' && <EditScreen onGenerate={() => setActiveTab('PAGAMENTO')} />}
          {activeTab === 'PRECOS' && <PricesScreen />}
          {activeTab === 'NOTA' && <NoteScreen />}
          {activeTab === 'CUPOM' && <CouponScreen />}
          {activeTab === 'PAGAMENTO' && <PaymentScreen onConfirm={() => { handleSaveModel(); setActiveTab('EDITAR'); }} />}
          {activeTab === 'DADOS' && <DataScreen onRefresh={()=>{}} savedModels={savedModels} onDeleteModel={handleDeleteModel} onRenameModel={(id) => { setActionModal({ type: 'RENAME', targetId: id }); }} onLoadModel={handleLoadModel} onClearAllData={() => setActionModal({type:'RESET_ALL'})} onImportBackup={handleImportBackup} />}
        </div>
      </main>

      {/* Modais */}
      <ModelListModal isOpen={showModelModal} onClose={() => setShowModelModal(false)} savedModels={savedModels} selectedId={selectedModelId} onLoad={handleLoadModel} onNew={handleNewModel} />
      
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
