import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Layout, Zap, Lock, AlertCircle } from 'lucide-react';
import { PostoData, InvoiceData, FuelItem, PriceItem } from '../types';

interface EditScreenProps {
  postoData: PostoData;
  setPostoData: (data: PostoData) => void;
  invoiceData: InvoiceData;
  setInvoiceData: (data: InvoiceData) => void;
  fuels: FuelItem[];
  setFuels: (fuels: FuelItem[]) => void;
  prices: PriceItem[]; // Received from App
  onGenerate: () => void;
}

// --- Helper Functions ---

const formatCNPJ = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .slice(0, 18);
};

const validateCNPJ = (cnpj: string): boolean => {
  cnpj = cnpj.replace(/[^\d]+/g, '');
  if (cnpj === '') return true; // Allow empty for typing
  if (cnpj.length !== 14) return false;

  // Eliminate invalid known patterns
  if (/^(\d)\1+$/.test(cnpj)) return false;

  // Validate DVs
  let length = cnpj.length - 2;
  let numbers = cnpj.substring(0, length);
  let digits = cnpj.substring(length);
  let sum = 0;
  let pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;

  length = length + 1;
  numbers = cnpj.substring(0, length);
  sum = 0;
  pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;

  return true;
};

// Converts "1.000,00" string to 1000.00 number
const parseLocaleNumber = (stringNumber: string) => {
  if (!stringNumber) return 0;
  const clean = stringNumber.replace(/\./g, '').replace(',', '.');
  return parseFloat(clean);
};

// Formats number to "1.000,00" (2 decimals) - Money Mask style
// Input: "6" -> "0,06" | "600" -> "6,00"
const formatMoneyMask = (value: string) => {
  const numeric = value.replace(/\D/g, '');
  if (!numeric) return '';
  const floatVal = parseFloat(numeric) / 100;
  if (isNaN(floatVal)) return '';
  return floatVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Formats user input for Quantity with Thousands Separator
// Input: "1000" -> "1.000"
// Input: "1000,5" -> "1.000,5"
const formatQuantityInput = (value: string) => {
  // Allow numbers and comma
  let clean = value.replace(/[^0-9,]/g, '');
  
  // Prevent multiple commas
  const parts = clean.split(',');
  if (parts.length > 2) {
    clean = parts[0] + ',' + parts.slice(1).join('');
  }

  // Format integer part with dots
  const integerPart = parts[0];
  const decimalPart = parts.length > 1 ? ',' + parts[1] : '';

  // Add dots to integer part
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  
  return formattedInteger + decimalPart;
};

const EditScreen: React.FC<EditScreenProps> = ({
  postoData,
  setPostoData,
  invoiceData,
  setInvoiceData,
  fuels,
  setFuels,
  prices,
  onGenerate,
}) => {
  const [cnpjError, setCnpjError] = useState(false);

  useEffect(() => {
    // Validate CNPJ whenever it changes
    setCnpjError(!validateCNPJ(postoData.cnpj));
  }, [postoData.cnpj]);

  const handlePostoChange = (field: keyof PostoData, value: string) => {
    let finalValue = value;
    if (field === 'cnpj') {
      finalValue = formatCNPJ(value);
    }
    setPostoData({ ...postoData, [field]: finalValue });
  };

  const addFuel = () => {
    const newId = (Math.max(...fuels.map(f => parseInt(f.id) || 0), 0) + 1).toString();
    // Default to the first price item if available, otherwise empty placeholders
    const defaultPrice = prices.length > 0 ? prices[0] : null;
    
    setFuels([...fuels, { 
      id: newId, 
      productId: defaultPrice ? defaultPrice.id : undefined, // Link ID
      code: defaultPrice ? defaultPrice.code : '', 
      name: defaultPrice ? defaultPrice.name : 'SELECIONE O PRODUTO', 
      quantity: '', 
      unitPrice: defaultPrice ? defaultPrice.price : '', 
      unit: defaultPrice ? defaultPrice.unit : 'L' 
    }]);
  };

  const removeFuel = (id: string) => {
    setFuels(fuels.filter(f => f.id !== id));
  };

  const handleFuelProductChange = (id: string, productId: string) => {
    const selectedPrice = prices.find(p => p.id === productId);
    if (!selectedPrice) return;

    setFuels(fuels.map(f => f.id === id ? { 
      ...f, 
      productId: selectedPrice.id, // Update Link ID
      name: selectedPrice.name,
      unitPrice: selectedPrice.price,
      unit: selectedPrice.unit,
      code: selectedPrice.code, 
      quantity: '', 
    } : f));
  };

  // Logic: Change Quantity -> Recalculate Total (Visual) 
  const handleQuantityChange = (id: string, rawValue: string) => {
    const formatted = formatQuantityInput(rawValue);
    setFuels(fuels.map(f => f.id === id ? { ...f, quantity: formatted } : f));
  };

  // Logic: Change Total -> Recalculate Quantity
  // Qty = Total / UnitPrice
  const handleTotalChange = (id: string, rawValue: string) => {
    const formattedTotal = formatMoneyMask(rawValue);
    const totalVal = parseLocaleNumber(formattedTotal);

    setFuels(fuels.map(f => {
      if (f.id === id) {
        const priceVal = parseLocaleNumber(f.unitPrice);
        if (priceVal === 0) return f; // Avoid division by zero
        if (totalVal === 0) return { ...f, quantity: '' };

        const newQtyVal = totalVal / priceVal;
        
        // CUSTOM LOGIC FOR PRECISION: 
        // User requires that 222.00 / 5.51 = 40.291 (normally 40.29038)
        // User requires that 688.89 / 5.51 = 125.026 (normally 125.0254)
        // This pattern matches a Math.ceil at the 3rd decimal place.
        const qtyCeiled = Math.ceil(newQtyVal * 1000) / 1000;

        const newQtyStr = qtyCeiled.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
        
        return { ...f, quantity: newQtyStr }; 
      }
      return f;
    }));
  };

  const calculateTotal = (qty: string, price: string) => {
    const q = parseLocaleNumber(qty) || 0;
    const p = parseLocaleNumber(price) || 0;
    if (q === 0 || p === 0) return '';
    return (q * p).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-700">Editar Dados</h2>
        <Layout size={20} className="text-slate-400" />
      </div>

      {/* Dados do Posto */}
      <div className="space-y-3">
        <h3 className="text-blue-600 font-semibold text-sm uppercase tracking-wider border-b border-blue-100 pb-1">Dados do Posto</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase">Razão Social</label>
            <input 
              className="w-full border border-slate-300 rounded p-3 text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={postoData.razaoSocial}
              onChange={e => handlePostoChange('razaoSocial', e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase flex justify-between">
              CNPJ
              {cnpjError && <span className="text-red-500 flex items-center gap-1 normal-case"><AlertCircle size={10} /> Inválido</span>}
            </label>
            <input 
              className={`w-full border rounded p-3 text-slate-700 outline-none transition-all ${cnpjError ? 'border-red-500 bg-red-50 focus:ring-red-200' : 'border-slate-300 focus:ring-2 focus:ring-blue-500'}`}
              value={postoData.cnpj}
              onChange={e => handlePostoChange('cnpj', e.target.value)}
              placeholder="00.000.000/0000-00"
              maxLength={18}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase">Insc. Estadual</label>
            <input 
              className="w-full border border-slate-300 rounded p-3 text-slate-700"
              value={postoData.inscEstadual}
              onChange={e => handlePostoChange('inscEstadual', e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase">Endereço Completo</label>
            <textarea 
              className="w-full border border-slate-300 rounded p-3 text-slate-700 h-24 resize-none"
              value={postoData.endereco}
              onChange={e => handlePostoChange('endereco', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Combustíveis */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-blue-100 pb-1">
           <h3 className="text-blue-600 font-semibold text-sm uppercase tracking-wider flex items-center gap-1">
             <Zap size={14} />
             Combustíveis
           </h3>
           <button onClick={addFuel} className="bg-green-500 hover:bg-green-600 text-white rounded-full p-1 shadow-md transition-colors">
             <Plus size={20} />
           </button>
        </div>
        
        {fuels.map((fuel, index) => (
          <div key={fuel.id} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500">BICO #{index + 1}</span>
              <button onClick={() => removeFuel(fuel.id)} className="text-red-400 hover:text-red-600">
                <Trash2 size={16} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1 block">PRODUTO</label>
                {prices.length > 0 ? (
                  <select 
                    className="w-full h-10 border border-slate-300 rounded px-2 text-slate-700 bg-white font-bold text-sm focus:border-blue-500 outline-none"
                    value={prices.find(p => p.name === fuel.name)?.id || ''}
                    onChange={e => handleFuelProductChange(fuel.id, e.target.value)}
                  >
                    <option value="" disabled>Selecione um produto</option>
                    {prices.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="text-xs text-red-500 p-2 bg-red-50 border border-red-100 rounded">
                    Configure os preços na aba PREÇOS primeiro.
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                   <label className="text-xs font-semibold text-slate-400 mb-1 block">CÓD</label>
                   <input 
                     className="w-full h-10 border border-slate-200 bg-slate-100 rounded px-2 text-center text-slate-500 font-mono text-sm cursor-not-allowed outline-none"
                     value={fuel.code}
                     readOnly
                     placeholder="000"
                   />
                </div>
                <div>
                   <label className="text-xs font-semibold text-slate-400 mb-1 block">QTD ({fuel.unit})</label>
                   <input 
                     className="w-full h-10 border border-slate-300 rounded px-2 text-center text-slate-700 font-bold text-lg focus:border-blue-500 outline-none placeholder:font-normal placeholder:text-slate-300"
                     value={fuel.quantity}
                     onChange={e => handleQuantityChange(fuel.id, e.target.value)}
                     inputMode="decimal"
                     placeholder="000"
                   />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                   <label className="text-xs font-semibold text-slate-400 flex items-center gap-1 mb-1">
                     <Lock size={10} /> R$/{fuel.unit} (FIXO)
                   </label>
                   <div className="relative">
                     <input 
                       className="w-full h-10 border border-slate-200 bg-slate-100 rounded px-2 text-center font-bold text-slate-500 cursor-not-allowed outline-none"
                       value={fuel.unitPrice}
                       readOnly
                       placeholder="0,00"
                     />
                   </div>
                </div>
                <div>
                   <label className="text-xs font-semibold text-blue-600 mb-1 block">TOTAL (R$)</label>
                   <input 
                     className="w-full h-10 border-2 border-blue-100 bg-blue-50/50 rounded px-2 text-center text-blue-700 font-bold text-lg focus:border-blue-400 outline-none transition-colors placeholder:font-normal placeholder:text-slate-300"
                     value={calculateTotal(fuel.quantity, fuel.unitPrice)}
                     onChange={e => handleTotalChange(fuel.id, e.target.value)}
                     inputMode="numeric"
                     placeholder="0,00"
                   />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Impostos (Read Only here) */}
      <div className="bg-slate-50 p-4 rounded-lg shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-slate-500 font-semibold text-sm uppercase flex items-center gap-1">
            <span>%</span> IMPOSTOS
          </h3>
          <span className="text-[10px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded flex items-center gap-1">
            <Lock size={10} /> Configurar em PREÇOS
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] text-slate-400 block uppercase">Federal %</label>
            <input 
              readOnly
              className="w-full border border-slate-200 bg-slate-100 rounded p-2 text-center text-slate-500 cursor-not-allowed placeholder:text-slate-300"
              value={invoiceData.impostos.federal}
              placeholder="0,00"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block uppercase">Estadual %</label>
            <input 
              readOnly
              className="w-full border border-slate-200 bg-slate-100 rounded p-2 text-center text-slate-500 cursor-not-allowed placeholder:text-slate-300"
              value={invoiceData.impostos.estadual}
              placeholder="0,00"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block uppercase">Munic. %</label>
            <input 
              readOnly
              className="w-full border border-slate-200 bg-slate-100 rounded p-2 text-center text-slate-500 cursor-not-allowed placeholder:text-slate-300"
              value={invoiceData.impostos.municipal}
              placeholder="0,00"
            />
          </div>
        </div>
      </div>

      {/* Emissão & Fiscal */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-blue-100 pb-1">
           <h3 className="text-blue-600 font-semibold text-sm uppercase tracking-wider flex items-center gap-1">
             <Zap size={14} className="rotate-180" />
             Emissão & Fiscal
           </h3>
           <button 
             onClick={onGenerate}
             className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded shadow-md transition-colors flex items-center gap-1 font-bold"
           >
             <Zap size={14} fill="currentColor" /> Gerar
           </button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 space-y-3">
           <h4 className="text-xs font-bold text-slate-500 uppercase">Dados da Operação</h4>
           <div className="grid grid-cols-2 gap-3">
             <input placeholder="PLACA" className="border border-slate-200 p-2 rounded text-sm placeholder:text-xs" value={invoiceData.placa} onChange={e => setInvoiceData({...invoiceData, placa: e.target.value})} />
             <input placeholder="KM" className="border border-slate-200 p-2 rounded text-sm placeholder:text-xs" value={invoiceData.km} onChange={e => setInvoiceData({...invoiceData, km: e.target.value})} />
             <input placeholder="OPERADOR" className="border border-slate-200 p-2 rounded text-sm placeholder:text-xs" value={invoiceData.operador} onChange={e => setInvoiceData({...invoiceData, operador: e.target.value})} />
             <input placeholder="MOTORISTA" className="border border-slate-200 p-2 rounded text-sm placeholder:text-xs" value={invoiceData.motorista} onChange={e => setInvoiceData({...invoiceData, motorista: e.target.value})} />
           </div>
        </div>

        {/* Isolated System Fields */}
        <div className="bg-slate-100 p-4 rounded-lg border border-slate-200 space-y-3">
           <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200">
               <Lock size={14} className="text-slate-400"/>
               <h4 className="text-xs font-bold text-slate-500 uppercase">Dados do Sistema (Não Editável)</h4>
           </div>
           
           <div>
             <label className="text-xs font-semibold text-slate-500 uppercase">Data Emissão</label>
             <input className="w-full border border-slate-200 bg-slate-200/50 p-2 rounded text-slate-500 cursor-not-allowed" value={invoiceData.dataEmissao} readOnly />
           </div>
           <div className="grid grid-cols-2 gap-3">
             <div>
               <label className="text-xs font-semibold text-slate-500 uppercase">Número</label>
               <input className="w-full border border-slate-200 bg-slate-200/50 p-2 rounded text-slate-500 cursor-not-allowed" value={invoiceData.numero} readOnly />
             </div>
             <div>
               <label className="text-xs font-semibold text-slate-500 uppercase">Série</label>
               <input className="w-full border border-slate-200 bg-slate-200/50 p-2 rounded text-slate-500 cursor-not-allowed" value={invoiceData.serie} readOnly />
             </div>
           </div>
           <div>
             <label className="text-xs font-semibold text-slate-500 uppercase">Chave de Acesso</label>
             <input className="w-full border border-slate-200 bg-slate-200/50 p-2 rounded text-slate-500 text-xs font-mono cursor-not-allowed" value={invoiceData.chaveAcesso} readOnly />
           </div>
           <div>
             <label className="text-xs font-semibold text-slate-500 uppercase">URL QR Code</label>
             <input className="w-full border border-slate-200 bg-slate-200/50 p-2 rounded text-slate-500 text-xs cursor-not-allowed" value={invoiceData.urlQrCode} readOnly />
           </div>
        </div>
      </div>
    </div>
  );
};

export default EditScreen;