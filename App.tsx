import React, { useState, useEffect } from 'react';
import { Bluetooth, Download, Printer, RefreshCw, Wifi, Trash2, Save, Plus } from 'lucide-react';
import { TabId, PostoData, InvoiceData, FuelItem, PriceItem, SavedModel } from './types';
import TabBar from './components/TabBar';
import EditScreen from './screens/EditScreen';
import PricesScreen from './screens/PricesScreen';
import NoteScreen from './screens/NoteScreen';
import PaymentScreen from './screens/PaymentScreen';
import ApiScreen from './screens/ApiScreen';

// Default Data - Configured based on Photo (Posto ICCAR)
const DEFAULT_POSTO: PostoData = {
  razaoSocial: 'POSTO ICCAR LTDA',
  cnpj: '02.280.133/0047-77',
  inscEstadual: '124846041',
  endereco: 'ROD BR 010, 25\nJARDIM TROPICAL, IMPERATRIZ - MA',
};

// Initial empty/placeholder state with calculated taxes based on user request
// Reference: Total 910.89 -> Federal 53.07 | Estadual 185.16
// Federal: (53.07 / 910.89) * 100 = 5.8261... -> 5.826%
// Estadual: (185.16 / 910.89) * 100 = 20.3273... -> 20.327%
const DEFAULT_INVOICE: InvoiceData = {
  placa: 'OIB4C39',
  km: '742583',
  operador: '',
  motorista: '',
  dataEmissao: '',
  numero: '',
  serie: '',
  chaveAcesso: '',
  protocolo: '',
  urlQrCode: '',
  impostos: {
    federal: '5,826', 
    estadual: '20,327',
    municipal: '0,00',
  },
};

// Default Fuel based on Photo
const DEFAULT_FUELS: FuelItem[] = [
  { 
    id: '1', 
    code: 'BS10', 
    name: 'DIESEL BS10', 
    quantity: '145,202', 
    unitPrice: '5,510', 
    unit: 'L' 
  }
];

// Default Prices
const DEFAULT_PRICES: PriceItem[] = [
  { id: '1', code: 'BS10', name: 'DIESEL BS10', unit: 'L', price: '5,510' },
  { id: '2', code: 'GC', name: 'GASOLINA COMUM', unit: 'L', price: '5,890' },
  { id: '3', code: 'ET', name: 'ETANOL', unit: 'L', price: '4,290' },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('NOTA'); // Start on NOTA to show the result immediately
  const [postoData, setPostoData] = useState<PostoData>(DEFAULT_POSTO);
  const [invoiceData, setInvoiceData] = useState<InvoiceData>(DEFAULT_INVOICE);
  const [fuels, setFuels] = useState<FuelItem[]>(DEFAULT_FUELS);
  const [prices, setPrices] = useState<PriceItem[]>(DEFAULT_PRICES);
  
  // Model Management State
  const [savedModels, setSavedModels] = useState<SavedModel[]>([
    { id: 'default', name: 'Modelo ICCAR (Padrão)', postoData: DEFAULT_POSTO, prices: DEFAULT_PRICES }
  ]);
  const [selectedModelId, setSelectedModelId] = useState<string>('default');
  const [isLoading, setIsLoading] = useState(false);

  // Initialize Invoice Date/Numbers on Load
  useEffect(() => {
    handleGenerateInvoice();
  }, []);

  // --- AUTO-UPDATE LOGIC ---
  useEffect(() => {
    if (fuels.length === 0 || prices.length === 0) return;

    setFuels(currentFuels => {
      let hasChanges = false;
      const updatedFuels = currentFuels.map(fuel => {
        if (fuel.productId) {
          const masterPrice = prices.find(p => p.id === fuel.productId);
          if (masterPrice && (fuel.unitPrice !== masterPrice.price || fuel.name !== masterPrice.name)) {
            hasChanges = true;
            return {
              ...fuel,
              name: masterPrice.name,
              unitPrice: masterPrice.price,
              unit: masterPrice.unit,
              code: masterPrice.code
            };
          }
        }
        return fuel;
      });

      return hasChanges ? updatedFuels : currentFuels;
    });
  }, [prices]);

  const handleReset = () => {
    setIsLoading(true);
    setPostoData({ razaoSocial: '', cnpj: '', inscEstadual: '', endereco: '' });
    setFuels([]);
    setInvoiceData(prev => ({ ...DEFAULT_INVOICE, impostos: prev.impostos }));
    setTimeout(() => setIsLoading(false), 500);
  };

  // --- MODEL MANAGEMENT ---
  const handleSaveModel = () => {
    const modelName = prompt("Digite um nome para este modelo de nota:", postoData.razaoSocial);
    if (modelName) {
      const newModel: SavedModel = {
        id: Date.now().toString(),
        name: modelName,
        postoData: { ...postoData },
        prices: [...prices]
      };
      setSavedModels([...savedModels, newModel]);
      setSelectedModelId(newModel.id);
      alert("Modelo salvo com sucesso!");
    }
  };

  const handleLoadModel = (modelId: string) => {
    setSelectedModelId(modelId);
    const model = savedModels.find(m => m.id === modelId);
    if (model) {
      setPostoData(model.postoData);
      setPrices(model.prices);
      // Optional: Clear current fuels when switching models to avoid inconsistency? 
      // Keeping fuels for now, but usually a model switch implies a new context.
    }
  };

  const handleDeleteModel = () => {
    if (selectedModelId === 'default') {
      alert("Não é possível excluir o modelo padrão.");
      return;
    }
    if (confirm("Tem certeza que deseja excluir este modelo?")) {
      const newModels = savedModels.filter(m => m.id !== selectedModelId);
      setSavedModels(newModels);
      // Revert to default
      const def = newModels[0];
      setSelectedModelId(def.id);
      setPostoData(def.postoData);
      setPrices(def.prices);
    }
  };

  // Helper to generate random number string of length n
  const randomDigits = (n: number) => {
    let str = '';
    for (let i = 0; i < n; i++) str += Math.floor(Math.random() * 10);
    return str;
  };

  const handleGenerateInvoice = () => {
    const today = new Date();
    // Format similar to photo: 11/12/2025 17:58:00
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dateStr = `${pad(today.getDate())}/${pad(today.getMonth() + 1)}/${today.getFullYear()} ${pad(today.getHours())}:${pad(today.getMinutes())}:${pad(today.getSeconds())}`;
    
    const numero = "59877"; // Fixed for demo or randomDigits(5)
    const serie = "1";
    const protocolo = `321${today.getFullYear().toString().substr(2)}${randomDigits(10)}`;
    
    const uf = '21'; // MA
    const aamm = today.getFullYear().toString().substr(2) + (today.getMonth() + 1).toString().padStart(2, '0');
    const cnpjClean = postoData.cnpj.replace(/\D/g, '').padStart(14, '0');
    const mod = '65'; 
    const emi = '1'; 
    const cnf = randomDigits(8);
    
    const preKey = `${uf}${aamm}${cnpjClean}${mod}${serie}${numero}${emi}${cnf}`;
    const dv = Math.floor(Math.random() * 10).toString();
    const chaveAcesso = `${preKey}${dv}`;
    const hexHash = Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase();
    const params = `${chaveAcesso}|2|1|1|${hexHash}`;
    const urlQrCode = `http://www.nfce.sefaz.ma.gov.br/portal/consultarNFCe.jsp?p=${params}`;

    setInvoiceData(prev => ({
      ...prev,
      dataEmissao: dateStr,
      numero: numero,
      serie: serie,
      chaveAcesso: chaveAcesso.replace(/(.{4})/g, '$1 ').trim(),
      protocolo: protocolo,
      urlQrCode: urlQrCode
    }));
  };

  const updateImpostos = (newImpostos: { federal: string; estadual: string; municipal: string }) => {
    setInvoiceData(prev => ({ ...prev, impostos: newImpostos }));
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
            onGenerate={() => { handleGenerateInvoice(); setActiveTab('NOTA'); }}
          />
        );
      case 'PRECOS':
        return (
          <PricesScreen 
            prices={prices} 
            setPrices={setPrices}
            impostos={invoiceData.impostos}
            onUpdateImpostos={updateImpostos}
          />
        );
      case 'NOTA':
        return <NoteScreen postoData={postoData} invoiceData={invoiceData} fuels={fuels} />;
      case 'PAGAMENTO':
        return <PaymentScreen fuels={fuels} postoData={postoData} />;
      case 'API':
        return <ApiScreen />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-100 flex flex-col font-sans">
      
      {/* Header */}
      <header className="bg-slate-900 text-white pb-0 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight">NFC-e Pro</h1>
            <span className="bg-blue-600 text-[10px] font-bold px-1.5 py-0.5 rounded text-white">V2.1</span>
          </div>
          <div className="flex items-center gap-3 text-blue-400">
            <button className="hover:text-white transition-colors"><Bluetooth size={18} /></button>
            <button className="hover:text-white transition-colors"><Download size={18} /></button>
            <button className="hover:text-white transition-colors"><Printer size={18} /></button>
          </div>
        </div>

        {/* Model Selector & Actions */}
        <div className="px-4 py-3 bg-slate-800">
          <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold">Modelo de Nota (Salvo)</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <select 
                className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-l px-3 py-2 outline-none focus:border-blue-500 appearance-none"
                value={selectedModelId}
                onChange={(e) => handleLoadModel(e.target.value)}
              >
                {savedModels.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            
            <button 
              onClick={handleSaveModel}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-r flex items-center gap-1 border border-l-0 border-green-700"
              title="Salvar configuração atual como modelo"
            >
              <Save size={16} />
            </button>
            
            {selectedModelId !== 'default' && (
              <button 
                onClick={handleDeleteModel}
                className="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white px-3 py-2 rounded ml-2 border border-red-500/30 transition-colors"
                title="Excluir modelo"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="sticky top-0 z-20 bg-white shadow-sm">
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 pb-24 no-scrollbar">
        {renderContent()}
      </main>

    </div>
  );
};

export default App;