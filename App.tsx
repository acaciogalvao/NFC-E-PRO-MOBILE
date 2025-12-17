import React, { useState, useEffect } from 'react';
import { Bluetooth, Download, Printer, Save, Trash2, Loader2, Check, AlertCircle, Info, FilePlus, Edit3, FolderOpen, X, ChevronRight, Database, AlertTriangle, Type, Smartphone } from 'lucide-react';
import { TabId, PostoData, InvoiceData, FuelItem, PriceItem, SavedModel, LayoutConfig, TaxRates, BluetoothRemoteGATTCharacteristic } from './types';
import TabBar from './components/TabBar';
import EditScreen from './screens/EditScreen';
import PricesScreen from './screens/PricesScreen';
import NoteScreen from './screens/NoteScreen';
import CouponScreen from './screens/CouponScreen';
import PaymentScreen from './screens/PaymentScreen';
import DataScreen from './screens/ApiScreen';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { db } from './services/StorageService'; // NOVO SERVIÇO DE BANCO DE DADOS
import { BLANK_INVOICE, BLANK_POSTO } from './constants/defaults';

const DEFAULT_TAX_RATES: TaxRates = { federal: '0,00', estadual: '0,00', municipal: '0,00' };

type NotificationType = { message: string; type: 'success' | 'error' | 'info'; id: number; };

// Tipos para os Modais de Ação
type ActionModalState = 
  | { type: 'NONE' }
  | { type: 'RENAME'; targetId: string; currentName: string }
  | { type: 'DELETE'; targetId: string; modelName: string }
  | { type: 'DELETE_LAYOUT'; layoutId: string; layoutName: string }
  | { type: 'RESET_ALL' }
  | { type: 'NEW_MODEL' };

const App: React.FC = () => {
  // --- ESTADOS GLOBAIS ---
  const [activeTab, setActiveTab] = useState<TabId>('EDITAR');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);
  const [actionModal, setActionModal] = useState<ActionModalState>({ type: 'NONE' });
  const [renameInputValue, setRenameInputValue] = useState('');
  
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  
  // Estados Bluetooth
  const [printCharacteristic, setPrintCharacteristic] = useState<BluetoothRemoteGATTCharacteristic | null>(null);
  const [btDeviceName, setBtDeviceName] = useState<string | null>(null);

  // Estado PWA
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  // --- CARREGAMENTO INICIAL DO BANCO DE DADOS ---
  const [savedModels, setSavedModels] = useState<SavedModel[]>([]);
  const [customLayouts, setCustomLayouts] = useState<LayoutConfig[]>([]);

  useEffect(() => {
    // Carrega dados do StorageService ao iniciar
    const models = db.getAllModels();
    setSavedModels(models);
    setCustomLayouts(db.getAllLayouts());

    // Se houver modelos, carrega o primeiro automaticamente
    if (models.length > 0 && !selectedModelId) {
       // Pequeno delay para garantir que o estado esteja pronto
       setTimeout(() => handleLoadModel(models[0].id), 50);
    }
  }, []);

  // --- ESTADO DO FORMULÁRIO (EDITOR) ---
  const [selectedModelId, setSelectedModelId] = useState<string>('');

  const [postoData, setPostoData] = useState<PostoData>(BLANK_POSTO);
  const [invoiceData, setInvoiceData] = useState<InvoiceData>(BLANK_INVOICE);
  const [fuels, setFuels] = useState<FuelItem[]>([]);
  const [prices, setPrices] = useState<PriceItem[]>([]);
  const [taxRates, setTaxRates] = useState<TaxRates>(DEFAULT_TAX_RATES);

  // --- SINCRONIZAÇÃO DE PREÇOS ---
  useEffect(() => {
    setFuels(currentFuels => {
      let hasChanges = false;
      const updatedFuels = currentFuels.map(fuel => {
        if (!fuel.productId) return fuel;
        const matchingPrice = prices.find(p => p.id === fuel.productId);
        if (!matchingPrice) return fuel;
        
        const isPriceChanged = fuel.unitPrice !== matchingPrice.price || fuel.unitPriceCard !== matchingPrice.priceCard;
        const isDataChanged = fuel.name !== matchingPrice.name || fuel.code !== matchingPrice.code;

        if (!isPriceChanged && !isDataChanged) return fuel;

        hasChanges = true;
        let newTotal = fuel.total;
        
        if (isPriceChanged) {
           const qty = parseFloat(fuel.quantity.replace(/\./g, '').replace(',', '.')) || 0;
           const price = parseFloat(matchingPrice.price.replace(/\./g, '').replace(',', '.')) || 0;
           newTotal = (qty * price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }

        return {
          ...fuel,
          name: matchingPrice.name,
          code: matchingPrice.code,
          unit: matchingPrice.unit,
          unitPrice: matchingPrice.price,
          unitPriceCard: matchingPrice.priceCard,
          total: newTotal
        };
      });
      return hasChanges ? updatedFuels : currentFuels;
    });
  }, [prices]);


  // --- HELPERS E NOTIFICAÇÕES ---
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { message, type, id }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 3000);
  };

  const handleUpdateTaxRates = (newRates: TaxRates) => {
    setTaxRates(newRates);
    setInvoiceData(prev => ({
      ...prev,
      impostos: { ...prev.impostos, ...newRates }
    }));
  };

  // --- FUNÇÕES DE CRUD (USANDO STORAGE SERVICE) ---

  // 1. IMPORTAR BACKUP
  const handleImportBackup = (newModels: SavedModel[], newLayouts?: LayoutConfig[]) => {
    try {
      db.saveModels(newModels);
      if (newLayouts && newLayouts.length > 0) {
        db.saveLayouts(newLayouts);
        setCustomLayouts(newLayouts);
      }
      setSavedModels(newModels);
      showToast(`Backup restaurado: ${newModels.length} modelos.`, "success");
      
      if (newModels.length > 0) {
        handleLoadModel(newModels[0].id);
      } else {
        confirmNewModel();
      }
    } catch (error) {
      console.error(error);
      showToast("Erro ao processar backup.", "error");
    }
  };

  // 2. INICIAR NOVO
  const openNewModelModal = () => setActionModal({ type: 'NEW_MODEL' });

  const confirmNewModel = () => {
    setSelectedModelId('');
    setPostoData({ ...BLANK_POSTO });
    setInvoiceData({ ...BLANK_INVOICE });
    setFuels([]);
    setPrices([]);
    setTaxRates({ ...DEFAULT_TAX_RATES });
    setActiveTab('EDITAR');
    setShowModelModal(false);
    setActionModal({ type: 'NONE' });
    showToast("Editor limpo. Inicie um novo modelo.", "info");
  };

  // 3. SALVAR (CREATE / UPDATE)
  const handleSaveModel = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 400));

    try {
      const now = new Date().toISOString();
      const currentId = selectedModelId || Date.now().toString();
      const autoName = postoData.razaoSocial 
        ? postoData.razaoSocial.substring(0, 30) 
        : `Modelo ${new Date().toLocaleTimeString()}`;

      const modelToSave: SavedModel = {
        id: currentId,
        name: selectedModelId ? (savedModels.find(m => m.id === currentId)?.name || autoName) : autoName,
        updatedAt: now,
        postoData,
        prices,
        taxRates,
        invoiceData,
        fuels
      };

      const updatedList = db.saveOrUpdateModel(modelToSave);
      setSavedModels(updatedList);
      setSelectedModelId(currentId);
      showToast(selectedModelId ? "Modelo atualizado!" : "Novo modelo criado!", "success");

    } catch (error) {
      console.error(error);
      showToast("Erro ao salvar dados.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // 4. CARREGAR (READ)
  const handleLoadModel = (id: string) => {
    const model = db.getModelById(id);
    if (!model) {
      showToast("Modelo não encontrado.", "error");
      return;
    }

    // Deep copy dos dados para o formulário
    setPostoData(JSON.parse(JSON.stringify({ ...BLANK_POSTO, ...model.postoData })));
    setPrices(model.prices ? JSON.parse(JSON.stringify(model.prices)) : []);
    setTaxRates({ ...DEFAULT_TAX_RATES, ...(model.taxRates || {}) });
    setFuels(model.fuels ? JSON.parse(JSON.stringify(model.fuels)) : []);
    
    let loadedInvoice = JSON.parse(JSON.stringify(BLANK_INVOICE));
    if (model.invoiceData) {
       loadedInvoice = { ...BLANK_INVOICE, ...model.invoiceData };
    } else if (model.impostos) {
       loadedInvoice.impostos = model.impostos;
    }
    setInvoiceData(loadedInvoice);
    
    setSelectedModelId(id);
    setActiveTab('EDITAR');
    setShowModelModal(false);
    showToast(`Modelo carregado: ${model.name}`, "info");
  };

  // 5. RENOMEAR
  const openRenameModal = (targetId?: string) => {
    const idToRename = targetId || selectedModelId;
    if (!idToRename) {
      showToast("Nenhum modelo selecionado.", "error");
      return;
    }
    const model = savedModels.find(m => m.id === idToRename);
    if (!model) return;

    setRenameInputValue(model.name);
    setActionModal({ type: 'RENAME', targetId: idToRename, currentName: model.name });
  };

  const confirmRename = () => {
    if (actionModal.type !== 'RENAME') return;
    const newName = renameInputValue.trim();
    if (!newName) {
       showToast("Nome inválido.", "error");
       return;
    }

    const modelToRename = savedModels.find(m => m.id === actionModal.targetId);
    if (modelToRename) {
        const updatedModel = { ...modelToRename, name: newName, updatedAt: new Date().toISOString() };
        const updatedList = db.saveOrUpdateModel(updatedModel);
        setSavedModels(updatedList);
        showToast("Modelo renomeado!", "success");
    }
    setActionModal({ type: 'NONE' });
  };

  // 6. DELETAR MODELO
  const openDeleteModal = (targetId?: string) => {
    const idToDelete = targetId || selectedModelId;
    if (!idToDelete) return;
    const model = savedModels.find(m => m.id === idToDelete);
    if (!model) return;
    setActionModal({ type: 'DELETE', targetId: idToDelete, modelName: model.name });
  };

  const confirmDelete = () => {
    if (actionModal.type !== 'DELETE') return;

    const newList = db.deleteModel(actionModal.targetId);
    setSavedModels(newList);
    
    if (actionModal.targetId === selectedModelId) {
      if (newList.length > 0) {
        handleLoadModel(newList[0].id);
      } else {
        confirmNewModel();
      }
    }
    showToast("Modelo excluído.", "info");
    setActionModal({ type: 'NONE' });
  };

  // 7. DELETAR LAYOUT
  const openDeleteLayoutModal = (layoutId: string) => {
     if (customLayouts.length <= 1) {
       showToast("É necessário manter pelo menos um modelo visual.", "error");
       return;
     }
     const layout = customLayouts.find(l => l.id === layoutId);
     if (layout) {
        setActionModal({ type: 'DELETE_LAYOUT', layoutId, layoutName: layout.name });
     }
  };

  const confirmDeleteLayout = () => {
    if (actionModal.type !== 'DELETE_LAYOUT') return;
    const { layoutId } = actionModal;
    const newLayouts = customLayouts.filter(l => l.id !== layoutId);
    
    db.saveLayouts(newLayouts);
    setCustomLayouts(newLayouts);
    
    if (postoData.activeLayoutId === layoutId) {
        setPostoData(prev => ({ ...prev, activeLayoutId: newLayouts[0].id }));
    }
    showToast("Modelo visual excluído.", "info");
    setActionModal({ type: 'NONE' });
  };

  // 8. RESET TOTAL
  const openResetModal = () => setActionModal({ type: 'RESET_ALL' });

  const confirmReset = () => {
    const defaults = db.resetModels();
    setSavedModels(defaults);
    handleLoadModel(defaults[0].id);
    showToast("Banco de dados resetado para padrões.", "success");
    setActionModal({ type: 'NONE' });
  };

  // --- OUTRAS AÇÕES ---

  const handleBluetoothConnect = async () => {
    if (!(navigator as any).bluetooth) {
      showToast("Navegador incompatível com Bluetooth Web", "error");
      return;
    }
    try {
        const device = await (navigator as any).bluetooth.requestDevice({ 
          acceptAllDevices: true,
          optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
        });
        
        if (device && device.gatt) {
            const server = await device.gatt.connect();
            const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
            const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');
            setPrintCharacteristic(characteristic);
            setBtDeviceName(device.name || 'Impressora');
            showToast(`Conectado a ${device.name || 'Impressora'}`, "success");
        }
    } catch(e) { 
      console.error(e);
      showToast("Erro na conexão Bluetooth: " + (e as Error).message, "error"); 
    }
  };

  const generateThermalReceiptBuffer = () => {
    // ... (Lógica de buffer térmica mantida igual, omitida para brevidade pois não mudou)
    // Se necessário, posso reinserir o código completo, mas ele não afeta a separação do DB.
    // Assumindo que a função existe e usa os estados postoData, fuels, invoiceData.
    const encoder = new TextEncoder();
    let commands: number[] = [];
    const add = (str: string) => {
        const normalized = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const bytes = encoder.encode(normalized);
        bytes.forEach(b => commands.push(b));
    };
    const addCmd = (...bytes: number[]) => bytes.forEach(b => commands.push(b));
    const addLine = () => add('--------------------------------\n');

    addCmd(0x1B, 0x40); 
    addCmd(0x1B, 0x61, 1);
    addCmd(0x1B, 0x45, 1); 
    add((postoData.razaoSocial || 'POSTO').substring(0, 32) + '\n');
    addCmd(0x1B, 0x45, 0); 
    add((postoData.endereco || '').substring(0, 32) + '\n');
    add(`CNPJ: ${postoData.cnpj}\n\n`);
    add('DANFE NFC-e - Documento Auxiliar\nNota Fiscal de Consumidor Eletronica\n');
    addLine();
    addCmd(0x1B, 0x61, 0); 
    add('ITEM CODIGO DESCRICAO QTD UN VL.UNIT VL.TOTAL\n');
    addLine();
    let totalGeral = 0;
    fuels.forEach((item, idx) => {
       const total = parseFloat(item.total.replace(/\./g, '').replace(',', '.')) || 0;
       totalGeral += total;
       const desc = item.name.substring(0, 20).toUpperCase();
       add(`${(idx + 1).toString().padStart(3, '0')} ${item.code} ${desc}\n`);
       add(`   ${item.quantity} ${item.unit} X ${item.unitPrice}   ${item.total}\n`);
    });
    addLine();
    addCmd(0x1B, 0x61, 2); 
    addCmd(0x1B, 0x45, 1); 
    add(`QTD. TOTAL DE ITENS: ${fuels.length}\n`);
    add(`VALOR TOTAL R$: ${totalGeral.toFixed(2).replace('.',',')}\n`);
    addCmd(0x1B, 0x45, 0); 
    addCmd(0x1B, 0x61, 0); 
    addLine();
    add(`FORMA PAGAMENTO: ${invoiceData.formaPagamento}\n`);
    add(`VALOR PAGO R$: ${totalGeral.toFixed(2).replace('.',',')}\n`);
    addLine();
    addCmd(0x1B, 0x61, 1); 
    add('Consulte pela Chave de Acesso em:\nwww.sefaz.ma.gov.br/nfce/consulta\n');
    const chave = invoiceData.chaveAcesso.replace(/\s/g, '');
    for(let i=0; i<chave.length; i+=4) add(chave.substring(i, i+4) + ' ');
    add('\n\n');
    add(`NFC-e n ${invoiceData.numero} Serie ${invoiceData.serie}\n${invoiceData.dataEmissao}\n`);
    add('Protocolo de Autorizacao:\n' + invoiceData.protocolo + '\n\n\n\n'); 
    addCmd(0x1D, 0x56, 66, 0);
    return new Uint8Array(commands);
  };

  const handleDownloadPDF = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    const input = document.getElementById('printable-receipt');
    if (!input) { setIsProcessing(false); return; }
    try {
      const canvas = await html2canvas(input, { scale: 2, useCORS: true, scrollY: -window.scrollY });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [80, (canvas.height * 80) / canvas.width] });
      pdf.addImage(imgData, 'PNG', 0, 0, 80, (canvas.height * 80) / canvas.width);
      const fileName = activeTab === 'CUPOM' ? 'Cupom' : 'NFCe-A4';
      pdf.save(`${fileName}-${invoiceData.numero || 'Nota'}.pdf`);
      showToast("Download concluído!", "success");
    } catch (err) { console.error(err); showToast("Falha ao gerar PDF", "error"); } 
    finally { setIsProcessing(false); }
  };

  const handlePrint = async () => {
    if (activeTab === 'CUPOM' && printCharacteristic) {
        try {
            showToast(`Enviando para ${btDeviceName}...`, "info");
            const data = generateThermalReceiptBuffer();
            const chunkSize = 512;
            for (let i = 0; i < data.length; i += chunkSize) {
                await printCharacteristic.writeValue(data.slice(i, i + chunkSize));
            }
            showToast("Enviado via Bluetooth!", "success");
            return; 
        } catch { showToast("Erro Bluetooth. Usando sistema...", "error"); }
    }
    const triggerSystemPrint = () => window.print();
    if (activeTab === 'NOTA' || activeTab === 'CUPOM') {
        showToast("Abrindo impressão...", "info");
        setTimeout(triggerSystemPrint, 500); 
    } else {
        setActiveTab('CUPOM'); 
        showToast("Gerando visualização...", "info");
        setTimeout(triggerSystemPrint, 800);
    }
  };

  const handleConfirmPayment = () => {
    if (confirm("Confirmar o recebimento do pagamento e finalizar a nota?")) {
       showToast("Pagamento Registrado! Nota Finalizada.", "success");
       setTimeout(() => {
         setInvoiceData({ ...BLANK_INVOICE, impostos: invoiceData.impostos });
         setFuels([]);
         setActiveTab('EDITAR');
       }, 1500);
    }
  };

  const handleGenerateInvoice = () => {
    if (fuels.length === 0) { showToast("Adicione itens à nota.", "error"); return; }
    const today = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dateStr = `${pad(today.getDate())}/${pad(today.getMonth() + 1)}/${today.getFullYear()} ${pad(today.getHours())}:${pad(today.getMinutes())}:${pad(today.getSeconds())}`;
    
    const numeroNota = (invoiceData.numero || Math.floor(10000 + Math.random() * 90000).toString()).padStart(9, '0');
    const serieNota = (invoiceData.serie || '1').padStart(3, '0');
    const uf = '21'; const aamm = `${today.getFullYear().toString().slice(-2)}${pad(today.getMonth() + 1)}`;
    const cleanCnpj = postoData.cnpj.replace(/\D/g, '') || '00000000000000';
    const codigoAleatorio = Math.floor(10000000 + Math.random() * 90000000).toString();
    const baseKey = `${uf}${aamm}${cleanCnpj}65${serieNota}${numeroNota}1${codigoAleatorio}`;
    const dv = Math.floor(Math.random() * 10).toString();
    const chaveAcessoGerada = `${baseKey}${dv}`;

    const totalVolume = fuels.reduce((acc, f) => acc + (parseFloat(f.quantity.replace(/\./g, '').replace(',', '.')) || 0), 0);
    const ei = (Math.random() * 100000).toFixed(3).replace('.', '');
    const ef = (parseFloat(ei) + totalVolume).toFixed(3).replace('.', '');
    const detalheCodigoGerado = `#CF:B${Math.floor(1 + Math.random() * 10).toString().padStart(2, '0')} EI${ei} EF${ef} V${totalVolume.toFixed(3).replace('.', ',')}`;

    setInvoiceData(prev => ({
      ...prev,
      dataEmissao: dateStr,
      numero: parseInt(numeroNota).toString(),
      serie: parseInt(serieNota).toString(),
      chaveAcesso: chaveAcessoGerada,
      protocolo: `${Math.floor(100 + Math.random() * 900)}${Date.now().toString()}`.slice(0, 15),
      urlQrCode: `http://nfce.sefaz.ma.gov.br/portal/consultarNFCe.jsp?p=${chaveAcessoGerada}|2|1|1|${dv}`,
      detalheCodigo: detalheCodigoGerado
    }));
    showToast("NFC-e Gerada!", "success");
    setActiveTab('PAGAMENTO');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'EDITAR': return <EditScreen postoData={postoData} setPostoData={setPostoData} invoiceData={invoiceData} setInvoiceData={setInvoiceData} fuels={fuels} setFuels={setFuels} prices={prices} taxRates={taxRates} setTaxRates={handleUpdateTaxRates} onGenerate={handleGenerateInvoice} />;
      case 'PRECOS': return <PricesScreen prices={prices} setPrices={setPrices} taxRates={taxRates} setTaxRates={handleUpdateTaxRates} />;
      case 'NOTA': return <NoteScreen postoData={postoData} setPostoData={setPostoData} invoiceData={invoiceData} fuels={fuels} />;
      case 'CUPOM': return <CouponScreen postoData={postoData} setPostoData={setPostoData} invoiceData={invoiceData} fuels={fuels} layouts={customLayouts} onDeleteLayout={openDeleteLayoutModal} />;
      case 'PAGAMENTO': return <PaymentScreen fuels={fuels} postoData={postoData} invoiceData={invoiceData} setInvoiceData={setInvoiceData} onConfirm={handleConfirmPayment} />;
      case 'DADOS': return <DataScreen onRefresh={() => {}} savedModels={savedModels} onDeleteModel={openDeleteModal} onRenameModel={openRenameModal} onLoadModel={handleLoadModel} onClearAllData={openResetModal} onImportBackup={handleImportBackup} />;
      default: return null;
    }
  };

  return (
    <div className="w-full min-h-dvh bg-slate-100 dark:bg-slate-950 flex flex-col font-sans text-slate-900 dark:text-slate-100">
      
      {/* NOTIFICAÇÕES */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none print:hidden">
        {notifications.map(n => (
          <div key={n.id} className={`pointer-events-auto flex items-center gap-3 p-3 rounded-lg shadow-xl border animate-toast-slide ${n.type === 'success' ? 'bg-green-600 text-white border-green-700' : n.type === 'error' ? 'bg-red-600 text-white border-red-700' : 'bg-slate-800 text-white border-slate-700'}`}>
            {n.type === 'success' && <Check size={18} />}
            {n.type === 'error' && <AlertCircle size={18} />}
            {n.type === 'info' && <Info size={18} />}
            <span className="text-sm font-medium">{n.message}</span>
          </div>
        ))}
      </div>

      {/* HEADER */}
      <header className="bg-slate-900 text-white pb-0 shadow-lg print:hidden border-b border-slate-800 z-30">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight">NFC-e Pro</h1>
            <span className="bg-blue-600 text-[10px] font-bold px-1.5 py-0.5 rounded text-white">v1.0</span>
          </div>
          <div className="flex items-center gap-3 text-blue-400">
            {installPrompt && <button onClick={handleInstallClick} className="bg-blue-600 text-white p-2 rounded-full animate-pulse shadow-lg ring-2 ring-blue-400"><Smartphone size={18} /></button>}
            <button onClick={handleBluetoothConnect} className={`hover:bg-slate-800 p-2 rounded-full transition-colors ${printCharacteristic ? 'text-green-400 bg-green-900/20' : ''}`}><Bluetooth size={18} /></button>
            <button onClick={handleDownloadPDF} disabled={isProcessing} className="hover:bg-slate-800 p-2 rounded-full">{isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}</button>
            <button onClick={handlePrint} className="hover:bg-slate-800 p-2 rounded-full"><Printer size={18} /></button>
          </div>
        </div>

        <div className="px-4 py-3 bg-slate-800 dark:bg-slate-900 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] text-slate-400 font-bold uppercase">{selectedModelId ? 'Editando Modelo Salvo' : 'Editando Novo (Não Salvo)'}</label>
            {selectedModelId && <span className="text-[10px] text-green-400 font-mono bg-green-900/30 px-2 rounded">ID: {selectedModelId.slice(-6)}</span>}
          </div>
          <div className="flex gap-2">
             <button onClick={() => setShowModelModal(true)} className="flex-1 flex items-center justify-between bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded border border-slate-600 transition-colors group">
                <div className="flex items-center gap-2 overflow-hidden">
                   <FolderOpen size={16} className="text-blue-400 group-hover:text-white transition-colors shrink-0" />
                   <span className="font-bold text-sm truncate">{selectedModelId ? savedModels.find(m => m.id === selectedModelId)?.name || 'Modelo Desconhecido' : '📂 Selecionar / Criar Modelo...'}</span>
                </div>
                <ChevronRight size={16} className="text-slate-400 group-hover:text-white" />
             </button>
             <button onClick={handleSaveModel} disabled={isSaving} className={`px-3 py-2 rounded text-white font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95 disabled:opacity-50 ${selectedModelId ? 'bg-blue-600 hover:bg-blue-500 border border-blue-500' : 'bg-green-600 hover:bg-green-500 border border-green-500'}`}>
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                <span className="hidden sm:inline">{selectedModelId ? 'Atualizar' : 'Salvar'}</span>
             </button>
          </div>
          {selectedModelId && (
             <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-700 animate-slide-down-sm">
                <button onClick={() => openRenameModal()} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white py-1.5 rounded text-xs border border-slate-700 hover:border-slate-600 flex items-center justify-center gap-1 transition-colors"><Edit3 size={12} /> Renomear</button>
                <button onClick={openNewModelModal} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white py-1.5 rounded text-xs border border-slate-700 hover:border-slate-600 flex items-center justify-center gap-1 transition-colors"><FilePlus size={12} /> Novo Vazio</button>
                <button onClick={() => openDeleteModal()} className="flex-1 bg-red-900/30 hover:bg-red-900/50 text-red-400 hover:text-red-300 py-1.5 rounded text-xs border border-red-900/50 hover:border-red-500/50 flex items-center justify-center gap-1 transition-colors"><Trash2 size={12} /> Excluir</button>
             </div>
          )}
        </div>
      </header>

      {/* --- MODAIS DE AÇÃO --- */}
      {actionModal.type === 'RENAME' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in print:hidden">
           <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-xl p-6 shadow-2xl border border-slate-700 animate-zoom-in">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><Type size={20} className="text-blue-500" /> Renomear Modelo</h3>
              <input className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 mb-4" value={renameInputValue} onChange={(e) => setRenameInputValue(e.target.value)} placeholder="Novo nome..." autoFocus />
              <div className="flex gap-3"><button onClick={() => setActionModal({ type: 'NONE' })} className="flex-1 py-3 rounded-lg font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">Cancelar</button><button onClick={confirmRename} className="flex-1 py-3 rounded-lg font-bold bg-blue-600 text-white hover:bg-blue-700">Salvar</button></div>
           </div>
        </div>
      )}

      {actionModal.type === 'DELETE' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in print:hidden">
           <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-xl p-6 shadow-2xl border border-red-900/50 animate-zoom-in">
              <div className="flex flex-col items-center text-center mb-6"><div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full text-red-600 mb-3"><Trash2 size={32} /></div><h3 className="text-lg font-bold text-slate-800 dark:text-white">Excluir Modelo?</h3><p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Você está prestes a apagar <b>"{actionModal.modelName}"</b>.</p></div>
              <div className="flex gap-3"><button onClick={() => setActionModal({ type: 'NONE' })} className="flex-1 py-3 rounded-lg font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">Cancelar</button><button onClick={confirmDelete} className="flex-1 py-3 rounded-lg font-bold bg-red-600 text-white hover:bg-red-700">Excluir</button></div>
           </div>
        </div>
      )}

      {actionModal.type === 'RESET_ALL' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in print:hidden">
           <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-xl p-6 shadow-2xl border border-red-900/50 animate-zoom-in">
              <div className="flex flex-col items-center text-center mb-6"><div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full text-red-600 mb-3"><AlertTriangle size={32} /></div><h3 className="text-lg font-bold text-slate-800 dark:text-white">Restaurar Padrão?</h3><p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Isso apagará seus modelos e restaurará o padrão.</p></div>
              <div className="flex gap-3"><button onClick={() => setActionModal({ type: 'NONE' })} className="flex-1 py-3 rounded-lg font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">Cancelar</button><button onClick={confirmReset} className="flex-1 py-3 rounded-lg font-bold bg-red-600 text-white hover:bg-red-700">RESTAURAR</button></div>
           </div>
        </div>
      )}

      {actionModal.type === 'NEW_MODEL' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in print:hidden">
           <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-xl p-6 shadow-2xl border border-slate-700 animate-zoom-in">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Iniciar Novo Modelo?</h3><p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Isso limpará os campos atuais.</p>
              <div className="flex gap-3"><button onClick={() => setActionModal({ type: 'NONE' })} className="flex-1 py-3 rounded-lg font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">Voltar</button><button onClick={confirmNewModel} className="flex-1 py-3 rounded-lg font-bold bg-green-600 text-white hover:bg-green-700">Iniciar Novo</button></div>
           </div>
        </div>
      )}

      {actionModal.type === 'DELETE_LAYOUT' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in print:hidden">
           <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-xl p-6 shadow-2xl border border-red-900/50 animate-zoom-in">
              <div className="flex flex-col items-center text-center mb-6"><div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full text-red-600 mb-3"><Trash2 size={32} /></div><h3 className="text-lg font-bold text-slate-800 dark:text-white">Excluir Layout?</h3><p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Você vai apagar o visual <b>"{actionModal.layoutName}"</b>.</p></div>
              <div className="flex gap-3"><button onClick={() => setActionModal({ type: 'NONE' })} className="flex-1 py-3 rounded-lg font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">Cancelar</button><button onClick={confirmDeleteLayout} className="flex-1 py-3 rounded-lg font-bold bg-red-600 text-white hover:bg-red-700">Excluir</button></div>
           </div>
        </div>
      )}

      {/* --- MODAL DE SELEÇÃO DE MODELOS --- */}
      {showModelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in print:hidden">
           <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[80vh]">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900"><h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2"><Database className="text-blue-500" size={20} /> Meus Modelos</h3><button onClick={() => setShowModelModal(false)} className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500"><X size={20} /></button></div>
              <div className="overflow-y-auto p-2 flex-1 space-y-1">
                 <button onClick={openNewModelModal} className="w-full text-left p-3 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 group transition-all"><div className="bg-green-100 dark:bg-green-900/20 p-2 rounded-full text-green-600 group-hover:scale-110 transition-transform"><FilePlus size={20} /></div><div><div className="font-bold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 transition-colors">Criar Novo Modelo</div><div className="text-xs text-slate-400">Começar com editor vazio</div></div></button>
                 {savedModels.map(m => (
                    <button key={m.id} onClick={() => handleLoadModel(m.id)} className={`w-full text-left p-3 rounded-lg border flex items-center gap-3 transition-all ${selectedModelId === m.id ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 ring-1 ring-blue-500' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300'}`}><div className={`p-2 rounded-full ${selectedModelId === m.id ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}><FolderOpen size={20} /></div><div className="flex-1 overflow-hidden"><div className="font-bold text-slate-800 dark:text-slate-200 truncate">{m.name}</div><div className="text-[10px] text-slate-400 flex justify-between mt-0.5"><span>ID: {m.id.slice(-4)}</span><span>{new Date(m.updatedAt).toLocaleDateString()}</span></div></div>{selectedModelId === m.id && <Check size={16} className="text-blue-600" />}</button>
                 ))}
              </div>
              <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-center"><button onClick={() => setShowModelModal(false)} className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 uppercase">Cancelar</button></div>
           </div>
        </div>
      )}

      <div className="sticky top-0 z-20 bg-white dark:bg-slate-900 shadow-sm print:hidden">
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <main className="flex-1 overflow-y-auto p-4 pb-24 no-scrollbar">
        {renderContent()}
      </main>
      
      {isProcessing && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center flex-col text-white print:hidden"><Loader2 size={48} className="animate-spin mb-4" /><p className="font-bold">Processando...</p></div>}
    </div>
  );
};

export default App;