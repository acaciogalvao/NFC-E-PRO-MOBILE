import React, { useState, useEffect } from 'react';
import { Bluetooth, Download, Printer, Save, Trash2, PlusCircle, FileInput, Edit3 } from 'lucide-react';
import { TabId, PostoData, InvoiceData, FuelItem, PriceItem, SavedModel, LayoutConfig, TaxRates } from './types';
import TabBar from './components/TabBar';
import EditScreen from './screens/EditScreen';
import PricesScreen from './screens/PricesScreen';
import NoteScreen from './screens/NoteScreen';
import PaymentScreen from './screens/PaymentScreen';
import ApiScreen from './screens/ApiScreen';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// --- LAYOUTS VISUAIS ---
const DEFAULT_LAYOUTS: LayoutConfig[] = [
  {
    id: 'padrao_iccar',
    name: 'Padrão (Igual Foto)',
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
  activeLayoutId: 'padrao_iccar'
};

// Valores padrão em Porcentagem (%)
const DEFAULT_IMPOSTOS_PERCENTAGES = {
  federal: '13,45', 
  estadual: '18,00',
  municipal: '0,00',
};

const DEFAULT_TAX_RATES: TaxRates = {
  federal: '13,45',
  estadual: '18,00',
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

const LOCAL_STORAGE_KEY_MODELS = 'nfce_pro_models_v6_full'; 
const LOCAL_STORAGE_KEY_LAYOUTS = 'nfce_pro_layouts_v2'; 
const LOCAL_STORAGE_KEY_LAST_MODEL = 'nfce_pro_last_model_id_v6';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('EDITAR');
  
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
     }
  };

  // --- GERENCIAMENTO DE MODELOS ---
  const [savedModels, setSavedModels] = useState<SavedModel[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_MODELS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return []; 
  });
  
  // ESTADO ATUAL (Edição)
  const [postoData, setPostoData] = useState<PostoData>(BLANK_POSTO);
  const [invoiceData, setInvoiceData] = useState<InvoiceData>(BLANK_INVOICE);
  const [fuels, setFuels] = useState<FuelItem[]>([]);
  const [prices, setPrices] = useState<PriceItem[]>([]);
  const [taxRates, setTaxRates] = useState<TaxRates>(DEFAULT_TAX_RATES); 
  const [selectedModelId, setSelectedModelId] = useState<string>('');

  // Persistência dos modelos
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_MODELS, JSON.stringify(savedModels));
  }, [savedModels]);

  // Sincroniza Taxas (Preços -> Invoice)
  // Isso garante que o que você configura na tela de Preços apareça na Nota e Edição
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

  // Carrega o último modelo selecionado ao abrir o app
  useEffect(() => {
    const lastId = localStorage.getItem(LOCAL_STORAGE_KEY_LAST_MODEL);
    if (lastId && !selectedModelId && savedModels.length > 0) {
      const modelExists = savedModels.some(m => m.id === lastId);
      if (modelExists) {
        handleLoadModel(lastId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const handleBluetoothConnect = async () => {
    alert("Simulação: Bluetooth ligado e buscando dispositivos...");
  };

  const handleDownloadPDF = async () => {
    if (activeTab !== 'NOTA') {
      setActiveTab('NOTA');
      setTimeout(() => generatePDF(), 500);
    } else {
      generatePDF();
    }
  };

  const generatePDF = async () => {
    const input = document.getElementById('printable-receipt');
    if (!input) {
      alert("Comprovante não encontrado.");
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
    } catch (err) {
      console.error(err);
      alert("Erro ao gerar PDF.");
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

  // --- FUNÇÕES DE SALVAMENTO DE MODELO ---

  const handleSaveModel = () => {
    // 1. Prepara o objeto com o estado atual
    const currentModelData = {
      postoData: { ...postoData },
      prices: prices.map(p => ({...p})),
      taxRates: { ...taxRates },
      invoiceData: { ...invoiceData },
      fuels: fuels.map(f => ({...f}))
    };

    // 2. Tenta ATUALIZAR se já existe e foi selecionado
    if (selectedModelId) {
       const modelIndex = savedModels.findIndex(m => m.id === selectedModelId);
       if (modelIndex >= 0) {
          const updatedModels = [...savedModels];
          updatedModels[modelIndex] = {
            ...updatedModels[modelIndex],
            ...currentModelData
          };
          
          setSavedModels(updatedModels);
          
          // Feedback rápido
          const updatedName = updatedModels[modelIndex].name;
          alert(`Modelo "${updatedName}" atualizado com sucesso!`);
          return;
       }
    }

    // 3. Se não tem modelo selecionado (ou ID inválido), CRIA UM NOVO
    const nameDefault = postoData.razaoSocial || `Modelo ${savedModels.length + 1}`;
    const modelName = prompt("Criando NOVO Modelo.\nDigite um nome para salvar:", nameDefault);
    
    if (modelName) {
      const newId = Date.now().toString();
      const newModel: SavedModel = {
        id: newId,
        name: modelName,
        ...currentModelData
      };
      
      setSavedModels(prev => [...prev, newModel]);
      setSelectedModelId(newId);
      localStorage.setItem(LOCAL_STORAGE_KEY_LAST_MODEL, newId); // Lembra da seleção
      alert(`Modelo "${modelName}" criado e salvo!`);
    }
  };

  const handleRenameModel = () => {
    if (!selectedModelId) return;
    
    const currentModel = savedModels.find(m => m.id === selectedModelId);
    if (!currentModel) return;

    const newName = prompt("Editar nome do modelo:", currentModel.name);
    if (newName && newName !== currentModel.name) {
      setSavedModels(prev => prev.map(m => 
        m.id === selectedModelId ? { ...m, name: newName } : m
      ));
    }
  };

  const handleLoadModel = (modelId: string) => {
    if (!modelId) {
      setSelectedModelId('');
      localStorage.removeItem(LOCAL_STORAGE_KEY_LAST_MODEL);
      return; 
    }
    
    const model = savedModels.find(m => m.id === modelId);
    if (model) {
      setSelectedModelId(modelId);
      localStorage.setItem(LOCAL_STORAGE_KEY_LAST_MODEL, modelId); // Salva persistência
      
      setPostoData({ ...model.postoData });
      setPrices(model.prices.map(p => ({...p})));
      if (model.taxRates) setTaxRates({ ...model.taxRates });
      
      // Carrega dados da nota
      if (model.invoiceData) {
        setInvoiceData({ ...model.invoiceData });
      } else if (model.impostos) {
         // Fallback para legado
         setInvoiceData(prev => ({ ...prev, impostos: model.impostos || DEFAULT_IMPOSTOS_PERCENTAGES }));
      }
      
      // Carrega combustíveis
      if (model.fuels) {
        setFuels(model.fuels.map(f => ({...f})));
      } else {
        setFuels([]);
      }
    }
  };

  const handleDeleteModel = () => {
    if (!selectedModelId) return;
    if (confirm("Excluir permanentemente este modelo?")) {
      const newModels = savedModels.filter(m => m.id !== selectedModelId);
      setSavedModels(newModels);
      setSelectedModelId('');
      localStorage.removeItem(LOCAL_STORAGE_KEY_LAST_MODEL);
      handleNewModel(false); 
    }
  };

  const handleNewModel = (confirmAction = true) => {
    if (!confirmAction || confirm("Limpar todos os campos para iniciar do zero?")) {
      setSelectedModelId('');
      localStorage.removeItem(LOCAL_STORAGE_KEY_LAST_MODEL);
      setPostoData(BLANK_POSTO);
      setPrices([]);
      setInvoiceData(BLANK_INVOICE);
      setFuels([]);
      setTaxRates(DEFAULT_TAX_RATES);
      setActiveTab('EDITAR');
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
            taxRates={taxRates} // Passa taxas %
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
          />
        );
      case 'API':
        return <ApiScreen />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col font-sans text-slate-900 dark:text-slate-100">
      <header className="bg-slate-900 text-white pb-0 shadow-lg print:hidden border-b border-slate-800">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight">NFC-e Pro</h1>
            <span className="bg-blue-600 text-[10px] font-bold px-1.5 py-0.5 rounded text-white">V6.0</span>
          </div>
          <div className="flex items-center gap-3 text-blue-400">
            <button onClick={handleBluetoothConnect}><Bluetooth size={18} /></button>
            <button onClick={handleDownloadPDF}><Download size={18} /></button>
            <button onClick={handlePrint}><Printer size={18} /></button>
          </div>
        </div>

        <div className="px-4 py-3 bg-slate-800 dark:bg-slate-900">
          <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold">Modelos de Nota</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <select 
                className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-l px-3 py-2 outline-none focus:border-blue-500 appearance-none disabled:opacity-50"
                value={selectedModelId}
                onChange={(e) => handleLoadModel(e.target.value)}
                disabled={savedModels.length === 0}
              >
                {savedModels.length === 0 && <option value="">Nenhum modelo salvo</option>}
                {savedModels.length > 0 && <option value="">Selecione um modelo...</option>}
                {savedModels.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            
            {/* Botão Novo */}
            <button 
              onClick={() => handleNewModel(true)}
              className="bg-slate-600 hover:bg-slate-700 text-white px-3 py-2 border-l border-slate-500"
              title="Novo Modelo em Branco"
            >
              <PlusCircle size={16} />
            </button>

            {/* Botão Salvar (Cria ou Atualiza) */}
            <button 
              onClick={handleSaveModel}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 flex items-center gap-1 border-l border-green-700"
              title={selectedModelId ? "Atualizar modelo atual" : "Salvar novo modelo"}
            >
              <Save size={16} />
            </button>
            
            {/* Controles do Modelo Selecionado (Renomear e Excluir) */}
            {savedModels.length > 0 && selectedModelId && (
              <>
                <button
                  onClick={handleRenameModel}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 border-l border-blue-700"
                  title="Renomear Modelo"
                >
                  <Edit3 size={16} />
                </button>
                
                <button 
                  onClick={handleDeleteModel}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-r border-l border-red-600"
                  title="Excluir modelo atual"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
            
            {/* Fecha canto arredondado se não tiver modelo selecionado */}
            {(!savedModels.length || !selectedModelId) && <div className="w-1 bg-transparent rounded-r"></div>}
          </div>
        </div>
      </header>

      <div className="sticky top-0 z-20 bg-white dark:bg-slate-900 shadow-sm print:hidden">
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <main className="flex-1 overflow-y-auto p-4 pb-24 no-scrollbar">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;