import React from 'react';
import { DollarSign, Plus, Trash2, Percent, Tag, CreditCard, ChevronRight } from 'lucide-react';
import { PriceItem, TaxRates } from '../types';
import { useAppContext } from '../context/AppContext';

const PricesScreen: React.FC = () => {
  const { prices, setPrices, taxRates, handleUpdateTaxRates } = useAppContext();

  const formatPriceMask = (value: string) => {
    const numeric = value.replace(/\D/g, '');
    if (!numeric) return '';
    const floatVal = parseFloat(numeric) / 1000;
    if (isNaN(floatVal)) return '';
    return floatVal.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  };

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
    if (value === '' || /^\d*([.,]\d{0,4})?$/.test(value)) {
      handleUpdateTaxRates({ ...taxRates, [field]: value });
    }
  };

  return (
    <div className="space-y-8 animate-reveal">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black text-indigo-500 uppercase tracking-[0.3em]">Catálogo & Tributos</h3>
        <button onClick={addPriceItem} className="flex items-center gap-2 text-indigo-400 font-bold text-[10px] uppercase">
          <Plus size={14} /> Adicionar Item
        </button>
      </div>

      {/* Taxas Padrão */}
      <div className="glass-card rounded-3xl p-6 border-l-4 border-l-indigo-500 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
            <Percent size={16} />
          </div>
          <h4 className="text-[10px] font-black dark:text-white uppercase tracking-widest">Impostos Padrão (%)</h4>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {['federal', 'estadual', 'municipal'].map((tax) => (
            <div key={tax}>
              <label className="text-[8px] font-black text-slate-500 uppercase block mb-1.5">{tax}</label>
              <input 
                className="w-full bg-slate-800/40 border border-white/5 rounded-xl p-2.5 text-center text-xs font-bold dark:text-white outline-none focus:border-indigo-500/50"
                value={(taxRates as any)[tax]}
                onChange={e => handleTaxRateChange(tax as keyof TaxRates, e.target.value)}
                placeholder="0,00" inputMode="decimal"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Lista de Produtos */}
      <div className="space-y-4">
        {prices.map((item) => (
          <div key={item.id} className="glass-card rounded-3xl p-5 border border-white/5 group">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-800/80 rounded-2xl flex items-center justify-center text-indigo-400 border border-white/5">
                   <Tag size={18} />
                </div>
                <div>
                   <input 
                     value={item.name} 
                     onChange={(e) => handlePriceChange(item.id, 'name', e.target.value)}
                     className="bg-transparent text-sm font-bold dark:text-white outline-none w-full placeholder:text-slate-700"
                     placeholder="Nome do Produto"
                   />
                   <div className="flex items-center gap-2 mt-0.5">
                     <span className="text-[9px] font-black text-slate-500">COD:</span>
                     <input 
                       value={item.code} 
                       onChange={(e) => handlePriceChange(item.id, 'code', e.target.value)}
                       className="bg-transparent text-[9px] font-mono font-bold dark:text-slate-400 outline-none w-16"
                       placeholder="000"
                     />
                   </div>
                </div>
              </div>
              <button onClick={() => removePriceItem(item.id)} className="p-2 text-slate-600 hover:text-rose-500 transition-colors">
                <Trash2 size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-slate-800/30 rounded-2xl p-3 border border-white/5">
                  <label className="text-[8px] font-black text-emerald-500 uppercase block mb-1">Preço À Vista (R$)</label>
                  <input 
                    value={item.price} 
                    onChange={(e) => handlePriceValueChange(item.id, 'price', e.target.value)}
                    className="w-full bg-transparent text-lg font-black dark:text-white outline-none"
                    placeholder="0,000"
                    inputMode="decimal"
                  />
               </div>
               <div className="bg-slate-800/30 rounded-2xl p-3 border border-white/5">
                  <label className="text-[8px] font-black text-indigo-400 uppercase block mb-1">Preço Cartão (R$)</label>
                  <input 
                    value={item.priceCard || ''} 
                    onChange={(e) => handlePriceValueChange(item.id, 'priceCard', e.target.value)}
                    className="w-full bg-transparent text-lg font-black dark:text-white outline-none"
                    placeholder="0,000"
                    inputMode="decimal"
                  />
               </div>
            </div>
          </div>
        ))}
      </div>
      
      {prices.length === 0 && (
        <div className="py-12 flex flex-col items-center opacity-30">
          <DollarSign size={48} className="text-slate-600 mb-2" />
          <p className="text-xs font-bold uppercase tracking-widest">Nenhum preço definido</p>
        </div>
      )}
    </div>
  );
};

export default PricesScreen;