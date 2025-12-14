import React from 'react';
import { DollarSign, Plus, Trash2, Percent, Tag, BarChart3 } from 'lucide-react';
import { PriceItem } from '../types';

interface PricesScreenProps {
  prices: PriceItem[];
  setPrices: (prices: PriceItem[]) => void;
  impostos: { federal: string; estadual: string; municipal: string };
  onUpdateImpostos: (impostos: { federal: string; estadual: string; municipal: string }) => void;
}

// Helper: Formats number to "1.000,000" (3 decimals) for price input
// Input: "5510" -> "5,510"
const formatPriceMask = (value: string) => {
  const numeric = value.replace(/\D/g, '');
  if (!numeric) return '';
  const floatVal = parseFloat(numeric) / 1000;
  if (isNaN(floatVal)) return '';
  return floatVal.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
};

const PricesScreen: React.FC<PricesScreenProps> = ({ prices, setPrices, impostos, onUpdateImpostos }) => {
  
  const handlePriceChange = (id: string, field: keyof PriceItem, value: string) => {
    setPrices(prices.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  // Special handler for masking the price input to 3 decimals
  const handlePriceValueChange = (id: string, rawValue: string) => {
    const formatted = formatPriceMask(rawValue);
    setPrices(prices.map(p => p.id === id ? { ...p, price: formatted } : p));
  };

  const addPriceItem = () => {
    const newId = (Math.max(...prices.map(p => parseInt(p.id) || 0), 0) + 1).toString();
    setPrices([...prices, { id: newId, code: '', name: '', unit: 'L', price: '' }]);
  };

  const removePriceItem = (id: string) => {
    setPrices(prices.filter(p => p.id !== id));
  };

  const handleTaxChange = (field: 'federal' | 'estadual' | 'municipal', value: string) => {
    // Allow empty string to show placeholder, otherwise validate decimal
    if (value === '' || /^\d*([.,]\d{0,3})?$/.test(value)) {
      onUpdateImpostos({ ...impostos, [field]: value });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="text-yellow-600" size={24} />
          <h2 className="text-xl font-bold text-slate-800">Gerenciador de Preços</h2>
        </div>
      </div>

      {/* Configuração de Impostos */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-blue-500">
        <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
          <Percent size={18} className="text-blue-500" />
          Configuração de Impostos
        </h3>
        <p className="text-xs text-slate-400 mb-3">Defina as alíquotas padrão (máx. 3 casas decimais).</p>
        
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Federal %</label>
            <input 
              className="w-full border border-slate-300 rounded-lg p-2 text-center text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
              value={impostos.federal}
              onChange={e => handleTaxChange('federal', e.target.value)}
              placeholder="0,00"
              inputMode="decimal"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Estadual %</label>
            <input 
              className="w-full border border-slate-300 rounded-lg p-2 text-center text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
              value={impostos.estadual}
              onChange={e => handleTaxChange('estadual', e.target.value)}
              placeholder="0,00"
              inputMode="decimal"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Munic. %</label>
            <input 
              className="w-full border border-slate-300 rounded-lg p-2 text-center text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
              value={impostos.municipal}
              onChange={e => handleTaxChange('municipal', e.target.value)}
              placeholder="0,00"
              inputMode="decimal"
            />
          </div>
        </div>
      </div>

      {/* Tabela de Preços */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
         <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
           <div>
             <h3 className="font-bold text-slate-700 flex items-center gap-2">
               <Tag size={18} />
               Produtos & Preços
             </h3>
             <p className="text-xs text-slate-500 mt-1">Cadastre os combustíveis</p>
           </div>
           <button 
             onClick={addPriceItem}
             className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-md transition-colors flex items-center gap-1 px-3"
           >
             <Plus size={18} /> <span className="text-xs font-bold">Novo</span>
           </button>
         </div>

         <div className="divide-y divide-slate-100">
           {prices.length === 0 && (
             <div className="p-8 text-center text-slate-400 text-sm italic">
               Nenhum produto cadastrado. Clique em "Novo" para adicionar.
             </div>
           )}

           {prices.map((item) => (
             <div key={item.id} className="p-4 bg-white hover:bg-slate-50 transition-colors">
                <div className="flex gap-3 items-start">
                   
                   {/* Coluna 1: UN */}
                   <div className="w-16">
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Un</label>
                      <input 
                        type="text"
                        value={item.unit}
                        onChange={(e) => handlePriceChange(item.id, 'unit', e.target.value)}
                        className="w-full h-10 border border-slate-300 rounded px-2 text-center text-sm font-bold text-slate-700 focus:border-blue-500 outline-none uppercase"
                        placeholder="L"
                      />
                   </div>

                   {/* Coluna 2: Dados Principais */}
                   <div className="flex-1 space-y-3">
                      
                      {/* Linha 1: Código e Nome */}
                      <div className="flex gap-2">
                        <div className="w-24">
                           <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Cód (Sist)</label>
                           <input 
                             type="text"
                             value={item.code}
                             onChange={(e) => handlePriceChange(item.id, 'code', e.target.value)}
                             className="w-full h-10 border border-slate-300 rounded px-2 text-sm font-mono text-slate-600 focus:border-blue-500 outline-none"
                             placeholder="000"
                           />
                        </div>
                        <div className="flex-1">
                           <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Nome do Produto</label>
                           <input 
                             type="text"
                             value={item.name}
                             onChange={(e) => handlePriceChange(item.id, 'name', e.target.value)}
                             className="w-full h-10 border border-slate-300 rounded px-3 text-sm font-bold text-slate-800 focus:border-blue-500 outline-none"
                             placeholder="Ex: Gasolina Comum"
                           />
                        </div>
                      </div>

                      {/* Linha 2: Preço */}
                      <div>
                         <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Preço Unitário (R$)</label>
                         <div className="relative">
                           <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">R$</span>
                           <input 
                             type="text"
                             value={item.price}
                             onChange={(e) => handlePriceValueChange(item.id, e.target.value)}
                             className="w-full h-10 border border-slate-300 rounded pl-8 pr-3 text-sm font-bold text-slate-800 focus:border-blue-500 outline-none"
                             placeholder="0,000"
                             inputMode="decimal"
                           />
                         </div>
                      </div>
                   </div>

                   {/* Coluna 3: Ações */}
                   <div className="pt-6">
                      <button 
                        onClick={() => removePriceItem(item.id)}
                        className="h-10 w-10 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remover Item"
                      >
                        <Trash2 size={18} />
                      </button>
                   </div>
                </div>
             </div>
           ))}
         </div>
      </div>
    </div>
  );
};

export default PricesScreen;