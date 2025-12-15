import React, { useState, useEffect } from 'react';
import { Bluetooth, Download, Printer, Save, Trash2, Loader2, Check, AlertCircle, Info, FilePlus, Edit3 } from 'lucide-react';
import { TabId, PostoData, InvoiceData, FuelItem, PriceItem, SavedModel, LayoutConfig, TaxRates, BluetoothDevice } from './types';
import TabBar from './components/TabBar';
import EditScreen from './screens/EditScreen';
import PricesScreen from './screens/PricesScreen';
import NoteScreen from './screens/NoteScreen';
import PaymentScreen from './screens/PaymentScreen';
import DataScreen from './screens/ApiScreen'; // Agora é a tela de DADOS
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// --- LAYOUTS VISUAIS ---
const DEFAULT_LAYOUTS: LayoutConfig[] = [
  {
    id: 'padrao_iccar',
    name: 'Modelo POSTO ICCAR',
    fontFamily: 'MONO',
    fontSize: 'SMALL',
    textAlign: 'LEFT',
    showSidebars: true,
    showBorders: false,
    showHeader: true,
    showConsumer: true,
    showQrCode: true,
    showFooter: true,
    density: 'COMPACT',
    customTexts: {
      headerTitle: 'DANFE NFC-e - Documento Auxiliar\nde Nota Fiscal de Consumidor Eletrônica',
      subHeader: 'NFC-e não permite aproveitamento de crédito de ICMS',
      taxLabel: 'Informações Adicionais de Interesse do Contribuinte',
      consumerLabel: 'CONSUMIDOR NÃO IDENTIFICADO',
      footerMessage: 'Consulte pela Chave de Acesso em'
    }
  }
];

// --- DADOS EM BRANCO ---
const BLANK_POSTO: PostoData = {
  razaoSocial: '',
  cnpj: '',
  inscEstadual: '',
  endereco: '',
  activeLayoutId: 'padrao_iccar',
  chavePix: '',
  tipoChavePix: 'CNPJ'
};

const DEFAULT_IMPOSTOS_PERCENTAGES = {
  federal: '0,00', 
  estadual: '0,00',
  municipal: '0,00',
};

const DEFAULT_TAX_RATES: TaxRates = {
  federal: '0,00',
  estadual: '0,00',
  municipal: '0,00'
};

const BLANK_INVOICE: InvoiceData = {
  placa: '',
  km: '',
  operador: '',
  motorista: '',
  dataEmissao: '',
  numero: '',
  serie: '',
  chaveAcesso: '',
  protocolo: '',
  urlQrCode: '',
  formaPagamento: 'DINHEIRO',
  impostos: DEFAULT_IMPOSTOS_PERCENTAGES,
};

const LOCAL_STORAGE_KEY_LAYOUTS = 'nfce_pro_layouts_v3'; 
const LOCAL_STORAGE_KEY_MODELS = 'nfce_models_db_v1';

// Tipo para notificação visual
type NotificationType = {
  message: string;
  type: 'success' | 'error' | 'info';
  id: number;
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('EDITAR');
  const [isProcessing, setIsProcessing] = useState(false);
  const [btStatus, setBtStatus] = useState<'DISCONNECTED' | 'SEARCHING' | 'CONNECTED'>('DISCONNECTED');
  const [btDevice, setBtDevice] = useState<BluetoothDevice | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Estado para Notificações (Toasts)
  const [notifications, setNotifications] = useState<NotificationType[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { message, type, id }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  // --- GERENCIAMENTO DE LAYOUTS ---
  const [customLayouts, setCustomLayouts] = useState<LayoutConfig[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_LAYOUTS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return DEFAULT_LAYOUTS; }
    }
    return DEFAULT_LAYOUTS;
  });

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_LAYOUTS, JSON.stringify(customLayouts));
  }, [customLayouts]);

  const handleDeleteLayout = (layoutId: string) => {
     if (layoutId === 'padrao_iccar') return;
     if (confirm("Excluir este layout visual?")) {
        setCustomLayouts(prev => prev.filter(l => l.id !== layoutId));
        setPostoData(prev => ({ ...prev, activeLayoutId: 'padrao_iccar' }));
        showToast("Layout excluído", "info");
     }
  };

  // --- GERENCIAMENTO DE MODELOS (LOCAL STORAGE) ---
  const [savedModels, setSavedModels] = useState<SavedModel[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_MODELS);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Erro ao carregar do localStorage", e);
      return [];
    }
  });
  
  // Helper para ler diretamente do Storage (Garante dados frescos)
  const getModelsDirectly = (): SavedModel[] => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_MODELS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  // Função para recarregar manualmente
  const loadModelsFromStorage = () => {
    setSavedModels(getModelsDirectly());
  };

  // ESTADO ATUAL (Edição)
  const [postoData, setPostoData] = useState<PostoData>({ ...BLANK_POSTO });
  const [invoiceData, setInvoiceData] = useState<InvoiceData>({ 
    ...BLANK_INVOICE, 
    impostos: { ...DEFAULT_IMPOSTOS_PERCENTAGES } 
  });
  const [fuels, setFuels] = useState<FuelItem[]>([]);
  const [prices, setPrices] = useState<PriceItem[]>([]);
  const [taxRates, setTaxRates] = useState<TaxRates>({ ...DEFAULT_TAX_RATES }); 
  const [selectedModelId, setSelectedModelId] = useState<string>('');

  // Sincroniza Taxas (Preços -> Invoice)
  useEffect(() => {
    setInvoiceData(prev => ({
      ...prev,
      impostos: {
        federal: taxRates.federal,
        estadual: taxRates.estadual,
        municipal: taxRates.municipal
      }
    }));
  }, [taxRates]);

  // --- ACTIONS ---

  const handleBluetoothConnect = async () => {
    if (!(navigator as any).bluetooth) {
      showToast("Navegador sem suporte Bluetooth Web", "error");
      return;
    }

    if (btStatus === 'CONNECTED' && btDevice) {
      if (confirm(`Desconectar de ${btDevice.name || 'Dispositivo'}?`)) {
        if (btDevice.gatt?.connected) btDevice.gatt.disconnect();
        setBtDevice(null);
        setBtStatus('DISCONNECTED');
        showToast("Bluetooth desconectado", "info");
      }
      return;
    }

    try {
      setBtStatus('SEARCHING');
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service', '000018f0-0000-1000-8000-00805f9b34fb']
      });

      if (device) {
        setBtDevice(device);
        const server = await device.gatt?.connect();
        if (server) {
          setBtStatus('CONNECTED');
          showToast(`Conectado: ${device.name}`, "success");
        } else {
          throw new Error("Falha na conexão GATT.");
        }
        device.addEventListener('gattserverdisconnected', () => {
          setBtStatus('DISCONNECTED');
          setBtDevice(null);
          showToast("Dispositivo desconectado", "info");
        });
      }
    } catch (error: any) {
      console.error(error);
      setBtStatus('DISCONNECTED');
      if (error.name !== 'NotFoundError') showToast("Erro Bluetooth: " + error.message, "error");
    }
  };

  const handleDownloadPDF = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    if (activeTab !== 'NOTA') {
      setActiveTab('NOTA');
      setTimeout(() => generatePDF(), 800);
    } else {
      generatePDF();
    }
  };

  const generatePDF = async () => {
    const input = document.getElementById('printable-receipt');
    if (!input) {
      setIsProcessing(false);
      showToast("Erro ao encontrar comprovante", "error");
      return;
    }
    try {
      const canvas = await html2canvas(input, { scale: 2, useCORS: true, scrollY: -window.scrollY });
      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = 80;
      const imgProps = { width: canvas.width, height: canvas.height };
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [pdfWidth, pdfHeight] });
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`NFCe-${invoiceData.numero || 'Nota'}.pdf`);
      showToast("PDF baixado com sucesso!", "success");
    } catch (err) {
      showToast("Erro ao gerar PDF", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = () => {
    if (activeTab !== 'NOTA') {
      setActiveTab('NOTA');
      setTimeout(() => window.print(), 500);
    } else {
      window.print();
    }
  };

  // --- CRUD MODELOS (ROBUSTO) ---

  // 1. LIMPAR / NOVO
  const handleNewModel = (confirmAction = true) => {
    if (confirmAction && !confirm("Limpar tudo e criar novo?")) {
      return;
    }
    
    setSelectedModelId('');
    setPostoData({ ...BLANK_POSTO });
    setPrices([]);
    setInvoiceData({ ...BLANK_INVOICE, impostos: { ...DEFAULT_IMPOSTOS_PERCENTAGES } });
    setFuels([]);
    setTaxRates({ ...DEFAULT_TAX_RATES });
    setActiveTab('EDITAR');
    
    if (confirmAction) showToast("Novo formulário iniciado", "info");
  };

  // 2. SALVAR (PERSISTÊNCIA DIRETA)
  const handleSaveModel = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 500));

    try {
      const now = new Date();
      
      // Lê o estado atual do disco para garantir que não sobrescrevemos nada
      const currentModels = getModelsDirectly();

      const newModelData: SavedModel = {
        id: selectedModelId || Date.now().toString(),
        name: selectedModelId 
              ? (currentModels.find(m => m.id === selectedModelId)?.name || postoData.razaoSocial) 
              : (postoData.razaoSocial || `Modelo ${now.toLocaleTimeString()}`),
        updatedAt: now.toISOString(),
        postoData,
        prices,
        taxRates,
        invoiceData,
        fuels
      };

      let updatedList;
      if (selectedModelId) {
        updatedList = currentModels.map(m => m.id === selectedModelId ? newModelData : m);
      } else {
        updatedList = [newModelData, ...currentModels];
      }

      // Salva explicitamente no LocalStorage
      localStorage.setItem(LOCAL_STORAGE_KEY_MODELS, JSON.stringify(updatedList));
      // Atualiza o estado da UI
      setSavedModels(updatedList);
      
      if (!selectedModelId) setSelectedModelId(newModelData.id);
      
      showToast("Modelo salvo localmente!", "success");

    } catch (error) {
      console.error(error);
      showToast("Erro ao salvar: " + error, "error");
    } finally {
      setIsSaving(false);
    }
  };

  // 3. RENOMEAR (PERSISTÊNCIA DIRETA)
  const handleRenameModel = (targetId?: string) => {
    const idToRename = targetId || selectedModelId;
    if (!idToRename) return;

    // Busca dados frescos do disco
    const currentModels = getModelsDirectly();
    const modelToRename = currentModels.find(m => m.id === idToRename);
    
    if (!modelToRename) {
      showToast("Modelo não encontrado para renomear", "error");
      return;
    }

    const newName = prompt("Digite o novo nome para o modelo:", modelToRename.name);
    
    if (newName && newName.trim() !== "") {
       const updatedList = currentModels.map(m => 
         m.id === idToRename ? { ...m, name: newName.trim(), updatedAt: new Date().toISOString() } : m
       );
       
       // Salva explicitamente
       localStorage.setItem(LOCAL_STORAGE_KEY_MODELS, JSON.stringify(updatedList));
       setSavedModels(updatedList);
       showToast("Nome atualizado!", "success");
    }
  };

  // 4. DELETAR (PERSISTÊNCIA DIRETA)
  const handleDeleteModel = (targetId?: string) => {
    const idToDelete = targetId || selectedModelId;
    if (!idToDelete) return;

    if (confirm("ATENÇÃO: Deseja apagar este modelo do armazenamento local?")) {
      
      const currentModels = getModelsDirectly();
      const updatedList = currentModels.filter(m => m.id !== idToDelete);
      
      // Salva explicitamente
      localStorage.setItem(LOCAL_STORAGE_KEY_MODELS, JSON.stringify(updatedList));
      setSavedModels(updatedList);
      
      // Se apagou o modelo que estava aberto, limpa a tela
      if (idToDelete === selectedModelId) {
        handleNewModel(false);
        setSelectedModelId('');
      }
      
      showToast("Modelo removido.", "info");
    }
  };

  // 5. CARREGAR
  const handleLoadModel = (modelId: string) => {
    if (!modelId) {
      handleNewModel(false);
      return;
    }

    const currentModels = getModelsDirectly();
    const model = currentModels.find(m => m.id === modelId);

    if (model) {
      setPostoData(JSON.parse(JSON.stringify(model.postoData)));
      setPrices(JSON.parse(JSON.stringify(model.prices)));
      setTaxRates(model.taxRates ? JSON.parse(JSON.stringify(model.taxRates)) : { ...DEFAULT_TAX_RATES });
      
      if (model.invoiceData) {
        setInvoiceData(JSON.parse(JSON.stringify(model.invoiceData)));
      } else if (model.impostos) {
         setInvoiceData(prev => ({ 
           ...prev, 
           impostos: model.impostos || { ...DEFAULT_IMPOSTOS_PERCENTAGES } 
         }));
      }
      
      setFuels(model.fuels ? JSON.parse(JSON.stringify(model.fuels)) : []);
      
      setSelectedModelId(modelId);
      setActiveTab('EDITAR');
      showToast("Modelo carregado", "info");
    } else {
      showToast("Erro ao carregar modelo.", "error");
    }
  };

  const handleConfirmPayment = () => {
    if (confirm("Confirmar o recebimento do pagamento e finalizar a nota?")) {
       showToast("Pagamento Registrado! Iniciando nova nota...", "success");
       setTimeout(() => {
         const cleanInvoice = { ...BLANK_INVOICE, impostos: invoiceData.impostos };
         setInvoiceData(cleanInvoice);
         setFuels([]);
         setActiveTab('EDITAR');
       }, 1500);
    }
  };

  const randomDigits = (n: number) => {
    let str = '';
    for (let i = 0; i < n; i++) str += Math.floor(Math.random() * 10);
    return str;
  };

  const handleGenerateInvoice = () => {
    const today = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dateStr = `${pad(today.getDate())}/${pad(today.getMonth() + 1)}/${today.getFullYear()} ${pad(today.getHours())}:${pad(today.getMinutes())}:${pad(today.getSeconds())}`;
    
    const numero = invoiceData.numero || Math.floor(10000 + Math.random() * 90000).toString(); 
    const serie = invoiceData.serie || "1";
    const protocolo = invoiceData.protocolo || `321${today.getFullYear().toString().substr(2)}${randomDigits(10)}`;
    const uf = '21'; 
    const aamm = today.getFullYear().toString().substr(2) + (today.getMonth() + 1).toString().padStart(2, '0');
    const cnpjClean = (postoData.cnpj || '00000000000000').replace(/\D/g, '').padStart(14, '0');
    const mod = '65'; 
    const emi = '1'; 
    const cnf = randomDigits(8);
    const preKey = `${uf}${aamm}${cnpjClean}${mod}${serie}${numero}${emi}${cnf}`;
    const dv = Math.floor(Math.random() * 10).toString();
    const chaveAcesso = invoiceData.chaveAcesso || `${preKey}${dv}`.replace(/(.{4})/g, '$1 ').trim();
    const hexHash = Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase();
    const params = `${chaveAcesso.replace(/\s/g, '')}|2|1|1|${hexHash}`;
    const urlQrCode = invoiceData.urlQrCode || `http://www.nfce.sefaz.ma.gov.br/portal/consultarNFCe.jsp?p=${params}`;

    setInvoiceData(prev => ({
      ...prev,
      dataEmissao: dateStr,
      numero: numero,
      serie: serie,
      chaveAcesso: chaveAcesso,
      protocolo: protocolo,
      urlQrCode: urlQrCode
    }));
    
    showToast("NFC-e Gerada com Sucesso!", "success");
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'EDITAR':
        return (
          <EditScreen
            postoData={postoData}
            setPostoData={setPostoData}
            invoiceData={invoiceData}
            setInvoiceData={setInvoiceData}
            fuels={fuels}
            setFuels={setFuels}
            prices={prices}
            taxRates={taxRates}
            setTaxRates={setTaxRates} 
            onGenerate={() => { handleGenerateInvoice(); setActiveTab('PAGAMENTO'); }}
          />
        );
      case 'PRECOS':
        return (
          <PricesScreen 
            prices={prices} 
            setPrices={setPrices}
            taxRates={taxRates}
            setTaxRates={setTaxRates}
          />
        );
      case 'NOTA':
        return (
          <NoteScreen 
            postoData={postoData} 
            setPostoData={setPostoData} 
            invoiceData={invoiceData} 
            fuels={fuels}
            layouts={customLayouts}
            onDeleteLayout={handleDeleteLayout}
          />
        );
      case 'PAGAMENTO':
        return (
          <PaymentScreen 
            fuels={fuels} 
            postoData={postoData} 
            invoiceData={invoiceData}
            setInvoiceData={setInvoiceData}
            onConfirm={handleConfirmPayment}
          />
        );
      case 'DADOS':
        return (
          <DataScreen 
            onRefresh={loadModelsFromStorage}
            savedModels={savedModels}
            onDeleteModel={(id) => handleDeleteModel(id)}
            onRenameModel={(id) => handleRenameModel(id)}
            onLoadModel={(id) => handleLoadModel(id)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col font-sans text-slate-900 dark:text-slate-100">
      
      {/* NOTIFICAÇÕES */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
        {notifications.map(n => (
          <div key={n.id} className={`pointer-events-auto flex items-center gap-3 p-3 rounded-lg shadow-xl border animate-in slide-in-from-top-5 fade-in duration-300
            ${n.type === 'success' ? 'bg-green-600 text-white border-green-700' : 
              n.type === 'error' ? 'bg-red-600 text-white border-red-700' : 
              'bg-slate-800 text-white border-slate-700'}`}>
            {n.type === 'success' && <Check size={18} />}
            {n.type === 'error' && <AlertCircle size={18} />}
            {n.type === 'info' && <Info size={18} />}
            <span className="text-sm font-medium">{n.message}</span>
          </div>
        ))}
      </div>

      <header className="bg-slate-900 text-white pb-0 shadow-lg print:hidden border-b border-slate-800">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight">NFC-e Pro</h1>
            <span className="bg-blue-600 text-[10px] font-bold px-1.5 py-0.5 rounded text-white">v2.1 Local</span>
          </div>
          <div className="flex items-center gap-3 text-blue-400">
            <button 
              onClick={handleBluetoothConnect}
              className={`transition-colors p-2 rounded-full ${btStatus === 'CONNECTED' ? 'bg-blue-600 text-white' : btStatus === 'SEARCHING' ? 'bg-blue-900/50 text-blue-300 animate-pulse' : 'hover:bg-slate-800'}`}
              title={btStatus === 'CONNECTED' ? "Conectado (Clique para desconectar)" : "Conectar Bluetooth"}
            >
              <Bluetooth size={18} />
            </button>
            
            <button 
              onClick={handleDownloadPDF} 
              className={`transition-colors p-2 rounded-full hover:bg-slate-800 ${isProcessing ? 'opacity-50 cursor-wait' : ''}`}
              title="Baixar PDF"
              disabled={isProcessing}
            >
              {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            </button>
            
            <button 
              onClick={handlePrint} 
              className="hover:bg-slate-800 p-2 rounded-full transition-colors"
              title="Imprimir (Selecionar Impressora)"
            >
              <Printer size={18} />
            </button>
          </div>
        </div>

        <div className="px-4 py-3 bg-slate-800 dark:bg-slate-900">
          <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold flex justify-between">
            <span>Modelos Salvos (Local)</span>
            {selectedModelId && <span className="text-green-400">Editando: {savedModels.find(m => m.id === selectedModelId)?.name}</span>}
            {!selectedModelId && <span className="text-blue-400 font-bold">Novo Modelo (Em Branco)</span>}
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <select 
                className={`w-full border text-white text-sm rounded-l px-3 py-2 outline-none focus:border-blue-500 appearance-none disabled:opacity-50 transition-colors
                  ${selectedModelId 
                    ? 'bg-slate-700 border-slate-600' 
                    : 'bg-slate-800 border-slate-600 text-slate-400 italic'
                  }`}
                value={selectedModelId}
                onChange={(e) => handleLoadModel(e.target.value)}
              >
                <option value="">{savedModels.length > 0 ? "➕ Selecionar Modelo..." : "Nenhum modelo salvo"}</option>
                {savedModels.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            
            {/* Botão NOVO */}
            <button 
              onClick={() => handleNewModel(true)}
              className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 border-l border-slate-600"
              title="Limpar e Iniciar Novo"
            >
              <FilePlus size={16} />
            </button>

            {/* Botão RENOMEAR (Contexto atual) */}
            {selectedModelId && (
              <button 
                onClick={() => handleRenameModel()}
                className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 border-l border-slate-600"
                title="Renomear Modelo Atual"
              >
                <Edit3 size={16} />
              </button>
            )}

            {/* Botão SALVAR */}
            <button 
              onClick={handleSaveModel}
              disabled={isSaving}
              className={`text-white px-3 py-2 flex items-center gap-1 border-l transition-colors disabled:opacity-70 disabled:cursor-wait
                ${selectedModelId 
                  ? 'bg-blue-600 hover:bg-blue-700 border-blue-700' 
                  : 'bg-green-600 hover:bg-green-700 border-green-700'}
                ${!selectedModelId ? 'rounded-r' : ''} 
                ${selectedModelId && !savedModels.length ? 'rounded-r' : ''}
              `}
              title={selectedModelId ? "Atualizar Modelo Existente" : "Salvar como Novo Modelo"}
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            </button>
            
            {/* Botão DELETAR (Contexto atual) */}
            {selectedModelId && (
              <button 
                onClick={() => handleDeleteModel()}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-r border-l border-red-600"
                title="Excluir modelo atual"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="sticky top-0 z-20 bg-white dark:bg-slate-900 shadow-sm print:hidden">
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <main className="flex-1 overflow-y-auto p-4 pb-24 no-scrollbar">
        {renderContent()}
      </main>
      
      {/* Indicador de processamento para download */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center flex-col text-white print:hidden">
           <Loader2 size={48} className="animate-spin mb-4" />
           <p className="font-bold">Gerando PDF...</p>
        </div>
      )}
    </div>
  );
};

export default App;