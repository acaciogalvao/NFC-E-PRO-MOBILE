import React, { useState, useEffect } from 'react';
import { Bluetooth, Download, Printer, Save, Trash2, Loader2, Check, AlertCircle, Info, FilePlus, Edit3, FolderOpen, X, ChevronRight, Database, AlertTriangle, Type, Smartphone } from 'lucide-react';
import { TabId, PostoData, InvoiceData, FuelItem, PriceItem, SavedModel, LayoutConfig, TaxRates, BluetoothDevice } from './types';
import TabBar from './components/TabBar';
import EditScreen from './screens/EditScreen';
import PricesScreen from './screens/PricesScreen';
import NoteScreen from './screens/NoteScreen';
import PaymentScreen from './screens/PaymentScreen';
import DataScreen from './screens/ApiScreen';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// --- CONFIGURAÇÃO INICIAL E CONSTANTES ---

const LOCAL_STORAGE_KEY_LAYOUTS = 'nfce_pro_layouts_v4'; 
const LOCAL_STORAGE_KEY_MODELS = 'nfce_models_db_v1';

const DEFAULT_LAYOUTS: LayoutConfig[] = [
  {
    id: 'padrao_iccar',
    name: 'Modelo Moderno (ICCar)',
    fontFamily: 'SANS',
    fontSize: 'SMALL',
    textAlign: 'CENTER',
    showSidebars: true,
    showBorders: false,
    showHeader: true,
    showConsumer: true,
    showQrCode: true,
    showFooter: true,
    density: 'COMPACT',
    customTexts: {
      headerTitle: 'DANFE NFC-e - Documento Auxiliar de Nota Fiscal\nde Consumidor Eletrônica',
      subHeader: 'NFC-e não permite aproveitamento de crédito de ICMS',
      taxLabel: 'Informações Adicionais de Interesse do Contribuinte',
      consumerLabel: 'CONSUMIDOR NÃO IDENTIFICADO',
      footerMessage: 'Consulte pela Chave de Acesso em'
    }
  },
  {
    id: 'modelo_guimaraes',
    name: 'Modelo Auto Posto Guimarães',
    fontFamily: 'MONO',
    fontSize: 'SMALL',
    textAlign: 'LEFT',
    showSidebars: false,
    showBorders: false,
    showHeader: true,
    showConsumer: true,
    showQrCode: true,
    showFooter: true,
    density: 'COMPACT',
    customTexts: {
      headerTitle: 'Documento Auxiliar\nda Nota Fiscal de Consumidor Eletrônica',
      subHeader: '',
      taxLabel: '',
      consumerLabel: 'CONSUMIDOR NÃO IDENTIFICADO',
      footerMessage: 'Consulte pela Chave de Acesso em\nhttp://nfce.sefaz.ma.gov.br/portal/consultarNFCe.jsp'
    }
  }
];

const BLANK_POSTO: PostoData = {
  razaoSocial: '',
  cnpj: '',
  inscEstadual: '',
  endereco: '',
  activeLayoutId: 'padrao_iccar',
  chavePix: '',
  tipoChavePix: 'CNPJ'
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
  impostos: { federal: '0,00', estadual: '0,00', municipal: '0,00' },
  detalheCodigo: ''
};

const DEFAULT_TAX_RATES: TaxRates = { federal: '0,00', estadual: '0,00', municipal: '0,00' };

// --- MODELO PADRÃO ICCAR (FIXO) ---
const ICCAR_DEFAULT_MODEL: SavedModel = {
  id: 'iccar_padrao_fixo',
  name: 'POSTO ICCAR LTDA (Padrão)',
  updatedAt: new Date().toISOString(),
  postoData: {
    razaoSocial: 'POSTO ICCAR LTDA',
    cnpj: '02.280.133/0047-77',
    inscEstadual: '124846041',
    endereco: 'ROD BR 010, 25\nJARDIM TROPICAL, IMPERATRIZ - MA',
    activeLayoutId: 'padrao_iccar',
    chavePix: '02.280.133/0047-77',
    tipoChavePix: 'CNPJ'
  },
  taxRates: { federal: '5,8258', estadual: '20,3272', municipal: '0,00' },
  prices: [
    { id: '1', code: '1', name: 'GASOLINA COMUM', unit: 'L', price: '5,590', priceCard: '5,590' },
    { id: '2', code: '2', name: 'ETANOL COMUM', unit: 'L', price: '3,490', priceCard: '3,490' },
    { id: '3', code: '3', name: 'DIESEL S10', unit: 'L', price: '5,890', priceCard: '5,890' },
  ],
  invoiceData: { ...BLANK_INVOICE, impostos: { federal: '5,8258', estadual: '20,3272', municipal: '0,00' } },
  fuels: []
};

// --- MODELO NOVO GUIMARÃES (DA FOTO) ---
const GUIMARAES_DEFAULT_MODEL: SavedModel = {
  id: 'guimaraes_modelo_fixo',
  name: 'AUTO POSTO GUIMARAES LTDA',
  updatedAt: new Date().toISOString(),
  postoData: {
    razaoSocial: 'AUTO POSTO GUIMARAES LTDA',
    cnpj: '02.855.790/0001-12',
    inscEstadual: '', // Não visível na foto
    endereco: 'BR 010, SN - KM 1350 - MARANHÃO NOVO\nIMPERATRIZ - MA',
    activeLayoutId: 'modelo_guimaraes',
    chavePix: '',
    tipoChavePix: 'CNPJ'
  },
  taxRates: { federal: '9,50', estadual: '20,10', municipal: '0,00' },
  prices: [
    { id: '1', code: '2', name: 'OLEO DIESEL B S10', unit: 'L', price: '5,990', priceCard: '5,990' }
  ],
  invoiceData: {
    ...BLANK_INVOICE,
    numero: '467352',
    serie: '1',
    dataEmissao: '10/12/2025 22:32:33',
    protocolo: '221250476045004',
    chaveAcesso: '2125 1202 8557 9000 0112 6500 1000 4673 5211 0437 2459',
    urlQrCode: 'http://nfce.sefaz.ma.gov.br/portal/consultarNFCe.jsp',
    impostos: { federal: '9,5005', estadual: '20,1000', municipal: '0,00' },
    placa: 'OIB4C39',
    km: '',
    motorista: 'ACACIO',
    operador: '741.779.0',
    detalheCodigo: '#CF:B31 EI0550800.620 EF0550927.830 V127.206'
  },
  fuels: [
    { 
       id: '1', 
       code: '2', 
       name: 'OLEO DIESEL B S10', 
       quantity: '127,206', 
       unit: 'L', 
       unitPrice: '5,990', 
       total: '761,96'
    }
  ]
};

type NotificationType = { message: string; type: 'success' | 'error' | 'info'; id: number; };

// Tipos para os Modais de Ação
type ActionModalState = 
  | { type: 'NONE' }
  | { type: 'RENAME'; targetId: string; currentName: string }
  | { type: 'DELETE'; targetId: string; modelName: string }
  | { type: 'DELETE_LAYOUT'; layoutId: string; layoutName: string } // Novo tipo para Layout
  | { type: 'RESET_ALL' }
  | { type: 'NEW_MODEL' };

const App: React.FC = () => {
  // --- ESTADOS GLOBAIS ---
  const [activeTab, setActiveTab] = useState<TabId>('EDITAR');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false); // Modal de Seleção (Lista)
  const [actionModal, setActionModal] = useState<ActionModalState>({ type: 'NONE' }); // Modal de Ação (Renomear/Deletar)
  const [renameInputValue, setRenameInputValue] = useState('');
  
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  
  // Estados Bluetooth
  const [btStatus, setBtStatus] = useState<'DISCONNECTED' | 'SEARCHING' | 'CONNECTED'>('DISCONNECTED');
  const [btDevice, setBtDevice] = useState<BluetoothDevice | null>(null);

  // Estado PWA (Instalação)
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    // Escuta o evento de "pode instalar"
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

  // --- PERSISTÊNCIA DE DADOS (MODELOS) ---
  const [savedModels, setSavedModels] = useState<SavedModel[]>(() => {
    try {
      const item = localStorage.getItem(LOCAL_STORAGE_KEY_MODELS);
      if (item) {
        const parsed = JSON.parse(item);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      // Se não tiver nada salvo, inicia com o modelo ICCAR padrão e Guimarães
      return [GUIMARAES_DEFAULT_MODEL, ICCAR_DEFAULT_MODEL];
    } catch (error) {
      console.error("Falha ao carregar banco de dados local:", error);
      return [GUIMARAES_DEFAULT_MODEL, ICCAR_DEFAULT_MODEL];
    }
  });

  // Helper para salvar diretamente no Storage
  const persistModels = (models: SavedModel[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_MODELS, JSON.stringify(models));
      setSavedModels(models);
    } catch (error) {
      console.error("Erro ao gravar no localStorage", error);
      showToast("Erro crítico ao salvar dados no navegador.", "error");
    }
  };

  // --- PERSISTÊNCIA DE LAYOUTS ---
  const [customLayouts, setCustomLayouts] = useState<LayoutConfig[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_LAYOUTS);
      // Se existir salvo, usa o salvo. Se não, usa o padrão.
      return saved ? JSON.parse(saved) : DEFAULT_LAYOUTS;
    } catch { return DEFAULT_LAYOUTS; }
  });

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_LAYOUTS, JSON.stringify(customLayouts));
  }, [customLayouts]);

  // --- ESTADO DO FORMULÁRIO (EDITOR) ---
  // Inicializa o estado com o primeiro modelo salvo (que será o Guimarães por padrão se for a 1ª vez)
  const [selectedModelId, setSelectedModelId] = useState<string>(() => {
     return savedModels.length > 0 ? savedModels[0].id : '';
  });

  // Função auxiliar para inicializar dados baseado no modelo selecionado ou no BLANK
  const getInitialData = (modelId: string, field: keyof SavedModel, fallback: any) => {
     const model = savedModels.find(m => m.id === modelId);
     if (model && model[field]) {
        // Deep copy para evitar mutação direta
        return JSON.parse(JSON.stringify(model[field]));
     }
     return fallback;
  };

  const [postoData, setPostoData] = useState<PostoData>(() => getInitialData(selectedModelId, 'postoData', BLANK_POSTO));
  const [invoiceData, setInvoiceData] = useState<InvoiceData>(() => {
    const model = savedModels.find(m => m.id === selectedModelId);
    if (model) {
        if(model.invoiceData) return { ...BLANK_INVOICE, ...model.invoiceData };
        if(model.impostos) return { ...BLANK_INVOICE, impostos: model.impostos };
    }
    return BLANK_INVOICE;
  });
  const [fuels, setFuels] = useState<FuelItem[]>(() => getInitialData(selectedModelId, 'fuels', []));
  const [prices, setPrices] = useState<PriceItem[]>(() => getInitialData(selectedModelId, 'prices', []));
  const [taxRates, setTaxRates] = useState<TaxRates>(() => getInitialData(selectedModelId, 'taxRates', DEFAULT_TAX_RATES));

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
      impostos: {
        federal: newRates.federal,
        estadual: newRates.estadual,
        municipal: newRates.municipal
      }
    }));
  };

  // --- FUNÇÕES DE CRUD (CORE) ---

  // 1. IMPORTAR BACKUP (NOVO)
  const handleImportBackup = (newModels: SavedModel[], newLayouts?: LayoutConfig[]) => {
    try {
      // Atualiza Modelos
      setSavedModels(newModels);
      localStorage.setItem(LOCAL_STORAGE_KEY_MODELS, JSON.stringify(newModels));
      
      // Atualiza Layouts (se houver)
      if (newLayouts && newLayouts.length > 0) {
        setCustomLayouts(newLayouts);
        localStorage.setItem(LOCAL_STORAGE_KEY_LAYOUTS, JSON.stringify(newLayouts));
      }

      showToast(`Backup restaurado: ${newModels.length} modelos.`, "success");
      
      // Se a lista não estiver vazia, carrega o primeiro modelo
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

  // 2. INICIAR FLUXO DE NOVO MODELO
  const openNewModelModal = () => {
    setActionModal({ type: 'NEW_MODEL' });
  };

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
    await new Promise(r => setTimeout(r, 400)); // UI Delay

    try {
      const now = new Date().toISOString();
      const currentModelData = {
        updatedAt: now,
        postoData,
        prices,
        taxRates,
        invoiceData,
        fuels
      };

      let newModelsList = [...savedModels];

      if (selectedModelId) {
        // ATUALIZAR
        const index = newModelsList.findIndex(m => m.id === selectedModelId);
        if (index >= 0) {
          newModelsList[index] = { ...newModelsList[index], ...currentModelData };
          persistModels(newModelsList);
          showToast("Modelo atualizado com sucesso!", "success");
        } else {
           // Fallback se ID sumiu
           const newId = Date.now().toString();
           const newModel: SavedModel = { id: newId, name: postoData.razaoSocial || 'Recuperado', ...currentModelData };
           newModelsList = [newModel, ...newModelsList];
           persistModels(newModelsList);
           setSelectedModelId(newId);
           showToast("Modelo recriado e salvo!", "success");
        }
      } else {
        // CRIAR NOVO
        const newId = Date.now().toString();
        const autoName = postoData.razaoSocial 
          ? postoData.razaoSocial.substring(0, 30) 
          : `Modelo ${new Date().toLocaleTimeString()}`;
        
        const newModel: SavedModel = {
          id: newId,
          name: autoName,
          ...currentModelData
        };

        newModelsList = [newModel, ...newModelsList];
        persistModels(newModelsList);
        setSelectedModelId(newId);
        showToast("Novo modelo criado e salvo!", "success");
      }

    } catch (error) {
      console.error(error);
      showToast("Erro ao salvar dados.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // 4. CARREGAR (READ)
  const handleLoadModel = (id: string) => {
    const model = savedModels.find(m => m.id === id);
    if (!model) {
      showToast("Modelo não encontrado.", "error");
      return;
    }

    // Deep copy
    const loadedPosto = JSON.parse(JSON.stringify({ ...BLANK_POSTO, ...model.postoData }));
    const loadedPrices = model.prices ? JSON.parse(JSON.stringify(model.prices)) : [];
    const loadedTaxRates = { ...DEFAULT_TAX_RATES, ...(model.taxRates || {}) };
    const loadedFuels = model.fuels ? JSON.parse(JSON.stringify(model.fuels)) : [];
    
    let loadedInvoice = JSON.parse(JSON.stringify(BLANK_INVOICE));
    if (model.invoiceData) {
       loadedInvoice = { ...BLANK_INVOICE, ...model.invoiceData };
    } else if (model.impostos) {
       loadedInvoice.impostos = model.impostos;
    }

    setPostoData(loadedPosto);
    setPrices(loadedPrices);
    setTaxRates(loadedTaxRates);
    setInvoiceData(loadedInvoice);
    setFuels(loadedFuels);
    
    setSelectedModelId(id);
    setActiveTab('EDITAR');
    setShowModelModal(false);
    showToast(`Modelo carregado: ${model.name}`, "info");
  };

  // 5. FLUXO RENOMEAR
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

    const updatedList = savedModels.map(m => 
      m.id === actionModal.targetId 
        ? { ...m, name: newName, updatedAt: new Date().toISOString() } 
        : m
    );
    persistModels(updatedList);
    showToast("Modelo renomeado!", "success");
    setActionModal({ type: 'NONE' });
  };

  // 6. FLUXO DELETAR MODELO DE DADOS
  const openDeleteModal = (targetId?: string) => {
    const idToDelete = targetId || selectedModelId;
    if (!idToDelete) return;
    const model = savedModels.find(m => m.id === idToDelete);
    if (!model) return;

    setActionModal({ type: 'DELETE', targetId: idToDelete, modelName: model.name });
  };

  const confirmDelete = () => {
    if (actionModal.type !== 'DELETE') return;

    const newList = savedModels.filter(m => m.id !== actionModal.targetId);
    persistModels(newList);
    
    if (actionModal.targetId === selectedModelId) {
      // Se apagou o selecionado, tenta carregar outro ou reseta
      if (newList.length > 0) {
        handleLoadModel(newList[0].id);
      } else {
        setSelectedModelId('');
        setPostoData({ ...BLANK_POSTO });
        setInvoiceData({ ...BLANK_INVOICE });
        setFuels([]);
      }
    }
    
    showToast("Modelo excluído.", "info");
    setActionModal({ type: 'NONE' });
  };

  // 7. FLUXO DELETAR LAYOUT (VISUAL) - NOVO COM MODAL
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
    setCustomLayouts(newLayouts);
    
    // Se deletou o ativo, muda para o primeiro disponível
    if (postoData.activeLayoutId === layoutId) {
        setPostoData(prev => ({ ...prev, activeLayoutId: newLayouts[0].id }));
    }
    showToast("Modelo visual excluído.", "info");
    setActionModal({ type: 'NONE' });
  };

  // 8. FLUXO RESET
  const openResetModal = () => {
    setActionModal({ type: 'RESET_ALL' });
  };

  const confirmReset = () => {
    // Reseta para o padrão ICCAR + GUIMARAES
    persistModels([GUIMARAES_DEFAULT_MODEL, ICCAR_DEFAULT_MODEL]);
    handleLoadModel(GUIMARAES_DEFAULT_MODEL.id);
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
        const device = await (navigator as any).bluetooth.requestDevice({ acceptAllDevices: true });
        if(device) showToast("Dispositivo selecionado", "success");
    } catch(e) { console.error(e); }
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
      showToast("Erro ao renderizar nota", "error");
      return;
    }
    try {
      const canvas = await html2canvas(input, { scale: 2, useCORS: true, scrollY: -window.scrollY });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [80, (canvas.height * 80) / canvas.width] });
      pdf.addImage(imgData, 'PNG', 0, 0, 80, (canvas.height * 80) / canvas.width);
      pdf.save(`NFCe-${invoiceData.numero || 'Nota'}.pdf`);
      showToast("Download concluído!", "success");
    } catch (err) {
      console.error(err);
      showToast("Falha ao gerar PDF", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- FUNÇÃO DE IMPRESSÃO MELHORADA (ABRE O DIÁLOGO DO SISTEMA) ---
  const handlePrint = () => {
    // Função interna para disparar o comando
    const doPrint = () => {
      // Pequeno delay para garantir renderização, mas curto o suficiente para ser responsivo
      setTimeout(() => {
          window.print();
      }, 100);
    };

    if (activeTab !== 'NOTA') {
      showToast("Abrindo impressoras...", "info");
      setActiveTab('NOTA');
      // Aguarda a transição de aba (tempo reduzido para ser mais ágil)
      setTimeout(doPrint, 500);
    } else {
      doPrint();
    }
  };

  const handleConfirmPayment = () => {
    if (confirm("Confirmar o recebimento do pagamento e finalizar a nota?")) {
       showToast("Pagamento Registrado! Nota Finalizada.", "success");
       setTimeout(() => {
         const cleanInvoice = { ...BLANK_INVOICE, impostos: invoiceData.impostos };
         setInvoiceData(cleanInvoice);
         setFuels([]);
         setActiveTab('EDITAR');
       }, 1500);
    }
  };

  const handleGenerateInvoice = () => {
    const today = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const randomDigits = (n: number) => Array.from({length:n}, ()=>Math.floor(Math.random()*10)).join('');
    const dateStr = `${pad(today.getDate())}/${pad(today.getMonth() + 1)}/${today.getFullYear()} ${pad(today.getHours())}:${pad(today.getMinutes())}:${pad(today.getSeconds())}`;
    
    // Gera código aleatório para o modelo Guimarães
    const r = (n: number) => Math.floor(Math.random() * n);
    const p1 = `B${r(9)}${r(9)}`; // ex: B31
    const p2 = `EI0${r(9)}${r(9)}${r(9)}${r(9)}${r(9)}.${r(9)}${r(9)}${r(9)}`; // ex: EI0550800.620
    const p3 = `EF0${r(9)}${r(9)}${r(9)}${r(9)}${r(9)}.${r(9)}${r(9)}${r(9)}`; // ex: EF0550927.830
    const p4 = `V${r(9)}${r(9)}${r(9)}.${r(9)}${r(9)}${r(9)}`; // ex: V127.206
    const randomDetailCode = `#CF:${p1} ${p2} ${p3} ${p4}`;

    // Gera REQ (Operador) no formato 741.779.0
    const reqPart1 = Math.floor(100 + Math.random() * 900); // 3 digitos
    const reqPart2 = Math.floor(100 + Math.random() * 900); // 3 digitos
    const reqPart3 = Math.floor(Math.random() * 10); // 1 digito
    const generatedReq = `${reqPart1}.${reqPart2}.${reqPart3}`;

    setInvoiceData(prev => ({
      ...prev,
      dataEmissao: dateStr,
      numero: prev.numero || Math.floor(10000 + Math.random() * 90000).toString(),
      serie: prev.serie || "1",
      protocolo: prev.protocolo || `321${today.getFullYear().toString().substr(2)}${randomDigits(10)}`,
      chaveAcesso: prev.chaveAcesso || `${randomDigits(44)}`.replace(/(.{4})/g, '$1 ').trim(),
      urlQrCode: prev.urlQrCode || 'http://www.nfce.sefaz.ma.gov.br',
      detalheCodigo: randomDetailCode, // Insere o código gerado
      operador: generatedReq // Insere o código REQ
    }));
    
    showToast("NFC-e Gerada com Sucesso!", "success");
    setActiveTab('PAGAMENTO');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'EDITAR':
        return (
          <EditScreen
            postoData={postoData} setPostoData={setPostoData}
            invoiceData={invoiceData} setInvoiceData={setInvoiceData}
            fuels={fuels} setFuels={setFuels}
            prices={prices}
            taxRates={taxRates} setTaxRates={handleUpdateTaxRates} 
            onGenerate={handleGenerateInvoice}
          />
        );
      case 'PRECOS':
        return (
          <PricesScreen 
            prices={prices} setPrices={setPrices}
            taxRates={taxRates} setTaxRates={handleUpdateTaxRates}
          />
        );
      case 'NOTA':
        return (
          <NoteScreen 
            postoData={postoData} setPostoData={setPostoData} 
            invoiceData={invoiceData} fuels={fuels}
            layouts={customLayouts} onDeleteLayout={openDeleteLayoutModal}
          />
        );
      case 'PAGAMENTO':
        return (
          <PaymentScreen 
            fuels={fuels} postoData={postoData} 
            invoiceData={invoiceData} setInvoiceData={setInvoiceData}
            onConfirm={handleConfirmPayment}
          />
        );
      case 'DADOS':
        return (
          <DataScreen 
            onRefresh={() => {}}
            savedModels={savedModels}
            onDeleteModel={openDeleteModal} // Usa o modal novo
            onRenameModel={openRenameModal} // Usa o modal novo
            onLoadModel={handleLoadModel}
            onClearAllData={openResetModal} // Usa o modal novo
            onImportBackup={handleImportBackup} // Nova Prop
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col font-sans text-slate-900 dark:text-slate-100">
      
      {/* NOTIFICAÇÕES */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none print:hidden">
        {notifications.map(n => (
          <div key={n.id} className={`pointer-events-auto flex items-center gap-3 p-3 rounded-lg shadow-xl border animate-toast-slide
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

      {/* --- HEADER PRINCIPAL --- */}
      <header className="bg-slate-900 text-white pb-0 shadow-lg print:hidden border-b border-slate-800 z-30">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight">NFC-e Pro</h1>
            <span className="bg-blue-600 text-[10px] font-bold px-1.5 py-0.5 rounded text-white">v3.7 Local</span>
          </div>
          <div className="flex items-center gap-3 text-blue-400">
            {installPrompt && (
              <button 
                onClick={handleInstallClick} 
                className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-500 animate-pulse shadow-lg ring-2 ring-blue-400"
                title="Instalar Aplicativo"
              >
                <Smartphone size={18} />
              </button>
            )}
            <button onClick={handleBluetoothConnect} className="hover:bg-slate-800 p-2 rounded-full" title="Conectar Impressora Bluetooth (Experimental)"><Bluetooth size={18} /></button>
            <button onClick={handleDownloadPDF} disabled={isProcessing} className="hover:bg-slate-800 p-2 rounded-full" title="Salvar como Imagem/PDF">
               {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            </button>
            <button onClick={handlePrint} className="hover:bg-slate-800 p-2 rounded-full" title="Imprimir (Abrir Impressoras)"><Printer size={18} /></button>
          </div>
        </div>

        {/* BARRA DE FERRAMENTAS */}
        <div className="px-4 py-3 bg-slate-800 dark:bg-slate-900 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] text-slate-400 font-bold uppercase">
               {selectedModelId ? 'Editando Modelo Salvo' : 'Editando Novo (Não Salvo)'}
            </label>
            {selectedModelId && (
               <span className="text-[10px] text-green-400 font-mono bg-green-900/30 px-2 rounded">
                  ID: {selectedModelId.slice(-6)}
               </span>
            )}
          </div>

          <div className="flex gap-2">
             <button 
               onClick={() => setShowModelModal(true)}
               className="flex-1 flex items-center justify-between bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded border border-slate-600 transition-colors group"
             >
                <div className="flex items-center gap-2 overflow-hidden">
                   <FolderOpen size={16} className="text-blue-400 group-hover:text-white transition-colors shrink-0" />
                   <span className="font-bold text-sm truncate">
                      {selectedModelId 
                         ? savedModels.find(m => m.id === selectedModelId)?.name || 'Modelo Desconhecido'
                         : '📂 Selecionar / Criar Modelo...'}
                   </span>
                </div>
                <ChevronRight size={16} className="text-slate-400 group-hover:text-white" />
             </button>

             <button 
               onClick={handleSaveModel}
               disabled={isSaving}
               className={`px-3 py-2 rounded text-white font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95 disabled:opacity-50
                  ${selectedModelId 
                    ? 'bg-blue-600 hover:bg-blue-500 border border-blue-500' 
                    : 'bg-green-600 hover:bg-green-500 border border-green-500'}`}
             >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                <span className="hidden sm:inline">{selectedModelId ? 'Atualizar' : 'Salvar'}</span>
             </button>
          </div>

          {selectedModelId && (
             <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-700 animate-slide-down-sm">
                <button 
                   onClick={() => openRenameModal()}
                   className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white py-1.5 rounded text-xs border border-slate-700 hover:border-slate-600 flex items-center justify-center gap-1 transition-colors"
                >
                   <Edit3 size={12} /> Renomear
                </button>
                <button 
                   onClick={openNewModelModal}
                   className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white py-1.5 rounded text-xs border border-slate-700 hover:border-slate-600 flex items-center justify-center gap-1 transition-colors"
                >
                   <FilePlus size={12} /> Novo Vazio
                </button>
                <button 
                   onClick={() => openDeleteModal()}
                   className="flex-1 bg-red-900/30 hover:bg-red-900/50 text-red-400 hover:text-red-300 py-1.5 rounded text-xs border border-red-900/50 hover:border-red-500/50 flex items-center justify-center gap-1 transition-colors"
                >
                   <Trash2 size={12} /> Excluir
                </button>
             </div>
          )}
        </div>
      </header>

      {/* --- MODAIS DE AÇÃO (CUSTOM DIALOGS) --- */}

      {/* 1. Modal Renomear */}
      {actionModal.type === 'RENAME' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in print:hidden">
           <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-xl p-6 shadow-2xl border border-slate-700 animate-zoom-in">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                 <Type size={20} className="text-blue-500" /> Renomear Modelo
              </h3>
              <input 
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                value={renameInputValue}
                onChange={(e) => setRenameInputValue(e.target.value)}
                placeholder="Novo nome..."
                autoFocus
              />
              <div className="flex gap-3">
                 <button onClick={() => setActionModal({ type: 'NONE' })} className="flex-1 py-3 rounded-lg font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">Cancelar</button>
                 <button onClick={confirmRename} className="flex-1 py-3 rounded-lg font-bold bg-blue-600 text-white hover:bg-blue-700">Salvar</button>
              </div>
           </div>
        </div>
      )}

      {/* 2. Modal Confirmar Exclusão */}
      {actionModal.type === 'DELETE' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in print:hidden">
           <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-xl p-6 shadow-2xl border border-red-900/50 animate-zoom-in">
              <div className="flex flex-col items-center text-center mb-6">
                 <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full text-red-600 mb-3">
                    <Trash2 size={32} />
                 </div>
                 <h3 className="text-lg font-bold text-slate-800 dark:text-white">Excluir Modelo?</h3>
                 <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                    Você está prestes a apagar <b>"{actionModal.modelName}"</b>. Esta ação não pode ser desfeita.
                 </p>
              </div>
              <div className="flex gap-3">
                 <button onClick={() => setActionModal({ type: 'NONE' })} className="flex-1 py-3 rounded-lg font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">Cancelar</button>
                 <button onClick={confirmDelete} className="flex-1 py-3 rounded-lg font-bold bg-red-600 text-white hover:bg-red-700">Excluir</button>
              </div>
           </div>
        </div>
      )}

      {/* 3. Modal Confirmar Reset Total */}
      {actionModal.type === 'RESET_ALL' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in print:hidden">
           <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-xl p-6 shadow-2xl border border-red-900/50 animate-zoom-in">
              <div className="flex flex-col items-center text-center mb-6">
                 <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full text-red-600 mb-3">
                    <AlertTriangle size={32} />
                 </div>
                 <h3 className="text-lg font-bold text-slate-800 dark:text-white">Restaurar Padrão?</h3>
                 <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                    Isso apagará seus modelos e restaurará o <b>POSTO ICCAR LTDA</b> padrão.
                 </p>
              </div>
              <div className="flex gap-3">
                 <button onClick={() => setActionModal({ type: 'NONE' })} className="flex-1 py-3 rounded-lg font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">Cancelar</button>
                 <button onClick={confirmReset} className="flex-1 py-3 rounded-lg font-bold bg-red-600 text-white hover:bg-red-700">RESTAURAR</button>
              </div>
           </div>
        </div>
      )}

      {/* 4. Modal Confirmar Novo Modelo */}
      {actionModal.type === 'NEW_MODEL' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in print:hidden">
           <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-xl p-6 shadow-2xl border border-slate-700 animate-zoom-in">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Iniciar Novo Modelo?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                 Isso limpará os campos atuais. Se não salvou, perderá as alterações.
              </p>
              <div className="flex gap-3">
                 <button onClick={() => setActionModal({ type: 'NONE' })} className="flex-1 py-3 rounded-lg font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">Voltar</button>
                 <button onClick={confirmNewModel} className="flex-1 py-3 rounded-lg font-bold bg-green-600 text-white hover:bg-green-700">Iniciar Novo</button>
              </div>
           </div>
        </div>
      )}

      {/* 5. Modal Confirmar Exclusão de Layout (Visual) */}
      {actionModal.type === 'DELETE_LAYOUT' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in print:hidden">
           <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-xl p-6 shadow-2xl border border-red-900/50 animate-zoom-in">
              <div className="flex flex-col items-center text-center mb-6">
                 <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full text-red-600 mb-3">
                    <Trash2 size={32} />
                 </div>
                 <h3 className="text-lg font-bold text-slate-800 dark:text-white">Excluir Layout?</h3>
                 <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                    Você vai apagar o visual <b>"{actionModal.layoutName}"</b>.
                 </p>
              </div>
              <div className="flex gap-3">
                 <button onClick={() => setActionModal({ type: 'NONE' })} className="flex-1 py-3 rounded-lg font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">Cancelar</button>
                 <button onClick={confirmDeleteLayout} className="flex-1 py-3 rounded-lg font-bold bg-red-600 text-white hover:bg-red-700">Excluir</button>
              </div>
           </div>
        </div>
      )}

      {/* --- MODAL DE SELEÇÃO DE MODELOS (LISTA) --- */}
      {showModelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in print:hidden">
           <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[80vh]">
              
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                 <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                    <Database className="text-blue-500" size={20} /> Meus Modelos
                 </h3>
                 <button onClick={() => setShowModelModal(false)} className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500">
                    <X size={20} />
                 </button>
              </div>

              <div className="overflow-y-auto p-2 flex-1 space-y-1">
                 <button 
                   onClick={openNewModelModal}
                   className="w-full text-left p-3 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 group transition-all"
                 >
                    <div className="bg-green-100 dark:bg-green-900/20 p-2 rounded-full text-green-600 group-hover:scale-110 transition-transform">
                       <FilePlus size={20} />
                    </div>
                    <div>
                       <div className="font-bold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 transition-colors">Criar Novo Modelo</div>
                       <div className="text-xs text-slate-400">Começar com editor vazio</div>
                    </div>
                 </button>

                 {savedModels.length === 0 && (
                    <div className="p-8 text-center text-slate-400 text-sm">
                       Nenhum modelo salvo ainda.
                    </div>
                 )}

                 {savedModels.map(m => (
                    <button 
                      key={m.id}
                      onClick={() => handleLoadModel(m.id)}
                      className={`w-full text-left p-3 rounded-lg border flex items-center gap-3 transition-all
                         ${selectedModelId === m.id 
                           ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 ring-1 ring-blue-500' 
                           : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300'}`}
                    >
                       <div className={`p-2 rounded-full ${selectedModelId === m.id ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                          <FolderOpen size={20} />
                       </div>
                       <div className="flex-1 overflow-hidden">
                          <div className="font-bold text-slate-800 dark:text-slate-200 truncate">{m.name}</div>
                          <div className="text-[10px] text-slate-400 flex justify-between mt-0.5">
                             <span>ID: {m.id.slice(-4)}</span>
                             <span>{new Date(m.updatedAt).toLocaleDateString()}</span>
                          </div>
                       </div>
                       {selectedModelId === m.id && <Check size={16} className="text-blue-600" />}
                    </button>
                 ))}
              </div>
              
              <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-center">
                 <button onClick={() => setShowModelModal(false)} className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 uppercase">
                    Cancelar
                 </button>
              </div>
           </div>
        </div>
      )}

      <div className="sticky top-0 z-20 bg-white dark:bg-slate-900 shadow-sm print:hidden">
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <main className="flex-1 overflow-y-auto p-4 pb-24 no-scrollbar">
        {renderContent()}
      </main>
      
      {isProcessing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center flex-col text-white print:hidden">
           <Loader2 size={48} className="animate-spin mb-4" />
           <p className="font-bold">Processando...</p>
        </div>
      )}
    </div>
  );
};

export default App;