import React from 'react';
import { DollarSign, Plus, Trash2, Percent, Tag, BarChart3, CreditCard } from 'lucide-react';
import { PriceItem, TaxRates } from '../types';

interface PricesScreenProps {
  prices: PriceItem[];
  setPrices: (prices: PriceItem[]) => void;
  taxRates: TaxRates;
  setTaxRates: (rates: TaxRates) => void;
}

// Helper: Formats number to "1.000,000" (3 decimals) for price input
const formatPriceMask = (value: string) => {
  const numeric = value.replace(/\D/g, '');
  if (!numeric) return '';
  const floatVal = parseFloat(numeric) / 1000;
  if (isNaN(floatVal)) return '';
  return floatVal.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
};

const PricesScreen: React.FC<PricesScreenProps> = ({ prices, setPrices, taxRates, setTaxRates }) => {
  
  const handlePriceChange = (id: string, field: keyof PriceItem, value: string) => {
    setPrices(prices.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handlePriceValueChange = (id: string, field: 'price' | 'priceCard', rawValue: string) => {
    const formatted = formatPriceMask(rawValue);
    setPrices(prices.map(p => p.id === id ? { ...p, [field]: formatted } : p));
  };

  const addPriceItem = () => {
    const newId = (Math.max(...prices.map(p => parseInt(p.id) || 0), 0) + 1).toString();
    setPrices([...prices, { id: newId, code: '', name: '', unit: 'L', price: '', priceCard: '' }]);
  };

  const removePriceItem = (id: string) => {
    setPrices(prices.filter(p => p.id !== id));
  };

  const handleTaxRateChange = (field: keyof TaxRates, value: string) => {
    // Permite digitar "13,45" ou "13,4567" (até 4 casas)
    if (value === '' || /^\d*([.,]\d{0,4})?$/.test(value)) {
      setTaxRates({ ...taxRates, [field]: value });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="text-yellow-600" size={24} />
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Gerenciador de Preços</h2>
        </div>
      </div>

      {/* Configuração de Impostos */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 border-l-4 border-l-blue-500">
        <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
          <Percent size={18} className="text-blue-500" />
          Configuração de Taxas Padrão (%)
        </h3>
        <p className="text-xs text-slate-400 mb-3">Defina as porcentagens para cálculo automático.</p>
        
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">Federal %</label>
            <div className="relative">
              <input 
                className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg p-2 pr-6 text-center text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                value={taxRates.federal}
                onChange={e => handleTaxRateChange('federal', e.target.value)}
                placeholder="0,0000"
                inputMode="decimal"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">%</span>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">Estadual %</label>
            <div className="relative">
              <input 
                className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg p-2 pr-6 text-center text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                value={taxRates.estadual}
                onChange={e => handleTaxRateChange('estadual', e.target.value)}
                placeholder="0,0000"
                inputMode="decimal"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">%</span>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">Munic. %</label>
            <div className="relative">
              <input 
                className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg p-2 pr-6 text-center text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                value={taxRates.municipal}
                onChange={e => handleTaxRateChange('municipal', e.target.value)}
                placeholder="0,0000"
                inputMode="decimal"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Preços */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
         <div className="bg-slate-50 dark:bg-slate-700 p-4 border-b border-slate-200 dark:border-slate-600 flex justify-between items-center">
           <div>
             <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
               <Tag size={18} />
               Produtos & Preços
             </h3>
             <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Cadastre os combustíveis</p>
           </div>
           <button 
             onClick={addPriceItem}
             className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-md transition-colors flex items-center gap-1 px-3"
           >
             <Plus size={18} /> <span className="text-xs font-bold">Novo</span>
           </button>
         </div>

         <div className="divide-y divide-slate-100 dark:divide-slate-700">
           {prices.length === 0 && (
             <div className="p-8 text-center text-slate-400 text-sm italic">
               Nenhum produto cadastrado. Clique em "Novo" para adicionar.
             </div>
           )}

           {prices.map((item) => (
             <div key={item.id} className="p-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <div className="flex gap-3 items-start flex-col sm:flex-row">
                   
                   <div className="flex gap-3 w-full">
                       {/* Coluna 1: UN */}
                       <div className="w-14">
                          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1 block">Un</label>
                          <input 
                            type="text"
                            value={item.unit}
                            onChange={(e) => handlePriceChange(item.id, 'unit', e.target.value)}
                            className="w-full h-10 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded px-2 text-center text-sm font-bold text-slate-700 dark:text-slate-100 focus:border-blue-500 outline-none uppercase"
                            placeholder="L"
                          />
                       </div>

                       {/* Coluna 2: Dados Principais */}
                       <div className="flex-1 space-y-3">
                          
                          {/* Linha 1: Código e Nome */}
                          <div className="flex gap-2">
                            <div className="w-20">
                               <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1 block">Cód</label>
                               <input 
                                 type="text"
                                 value={item.code}
                                 onChange={(e) => handlePriceChange(item.id, 'code', e.target.value)}
                                 className="w-full h-10 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded px-2 text-sm font-mono text-slate-600 dark:text-slate-300 focus:border-blue-500 outline-none"
                                 placeholder="000"
                               />
                            </div>
                            <div className="flex-1">
                               <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1 block">Nome do Produto</label>
                               <input 
                                 type="text"
                                 value={item.name}
                                 onChange={(e) => handlePriceChange(item.id, 'name', e.target.value)}
                                 className="w-full h-10 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded px-3 text-sm font-bold text-slate-800 dark:text-slate-100 focus:border-blue-500 outline-none"
                                 placeholder="Ex: Gasolina Comum"
                               />
                            </div>
                          </div>

                          {/* Linha 2: Preço Dinheiro e Cartão */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                               <label className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase mb-1 flex items-center gap-1">
                                 <DollarSign size={10} /> À Vista
                               </label>
                               <div className="relative">
                                 <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-bold">R$</span>
                                 <input 
                                   type="text"
                                   value={item.price}
                                   onChange={(e) => handlePriceValueChange(item.id, 'price', e.target.value)}
                                   className="w-full h-10 border border-green-200 dark:border-green-900 bg-green-50/30 dark:bg-green-900/20 rounded pl-6 pr-2 text-sm font-bold text-green-700 dark:text-green-400 focus:border-green-500 outline-none"
                                   placeholder="0,000"
                                   inputMode="decimal"
                                 />
                               </div>
                            </div>
                            <div>
                               <label className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase mb-1 flex items-center gap-1">
                                 <CreditCard size={10} /> Cartão
                               </label>
                               <div className="relative">
                                 <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-bold">R$</span>
                                 <input 
                                   type="text"
                                   value={item.priceCard || ''}
                                   onChange={(e) => handlePriceValueChange(item.id, 'priceCard', e.target.value)}
                                   className="w-full h-10 border border-blue-200 dark:border-blue-900 bg-blue-50/30 dark:bg-blue-900/20 rounded pl-6 pr-2 text-sm font-bold text-blue-700 dark:text-blue-400 focus:border-blue-500 outline-none"
                                   placeholder="0,000"
                                   inputMode="decimal"
                                 />
                               </div>
                            </div>
                          </div>
                       </div>
                   </div>

                   {/* Coluna 3: Ações */}
                   <div className="flex justify-end pt-2 sm:pt-6">
                      <button 
                        onClick={() => removePriceItem(item.id)}
                        className="h-10 w-10 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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