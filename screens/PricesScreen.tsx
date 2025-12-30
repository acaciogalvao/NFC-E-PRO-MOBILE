
import React, { useMemo } from 'react';
import { DollarSign, Plus, Trash2, Tag, Wallet, Info, Landmark, ShieldCheck, RefreshCw } from 'lucide-react';
import { PriceItem, TaxRates } from '../components/shared/types';
import { useAppContext } from '../components/shared/context/AppContext';
import { parseLocaleNumber, toCurrency, round2 } from '../utils/helpers';

const PricesScreen: React.FC = () => {
  const { prices, setPrices, taxRates, handleUpdateTaxRates, fuels } = useAppContext();

  // Garante que taxRates nunca seja indefinido e usa alíquotas de precisão por padrão
  const safeTaxRates = taxRates || { federal: '5,7631', estadual: '20,1081', municipal: '0,0000' };

  const totalProdutos = useMemo(() => {
    return (fuels || []).reduce((acc, fuel) => acc + parseLocaleNumber(fuel.total), 0);
  }, [fuels]);

  const taxDetails = useMemo(() => {
    const fPercent = parseLocaleNumber(safeTaxRates.federal);
    const ePercent = parseLocaleNumber(safeTaxRates.estadual);
    const mPercent = parseLocaleNumber(safeTaxRates.municipal);
    
    // O cálculo deve ser feito com a base (totalProdutos) multiplicada pela alíquota (%)
    // Exemplo do usuário: 922,07 * 5,7631% = 53,139... -> R$ 53,14
    const federalVal = round2((totalProdutos * fPercent) / 100);
    const estadualVal = round2((totalProdutos * ePercent) / 100);
    const municipalVal = round2((totalProdutos * mPercent) / 100);
    
    return {
      federal: federalVal,
      estadual: estadualVal,
      municipal: municipalVal,
      total: round2(federalVal + estadualVal + municipalVal)
    };
  }, [safeTaxRates, totalProdutos]);

  const handleTaxRateInputChange = (field: keyof TaxRates, rawValue: string) => {
    handleUpdateTaxRates({ ...safeTaxRates, [field]: rawValue });
  };

  const handleResetTaxes = () => {
    handleUpdateTaxRates({ federal: '5,7631', estadual: '20,1081', municipal: '0,0000' });
  };

  const handlePriceValueChange = (id: string, field: 'price' | 'priceCard', rawValue: string) => {
    const numeric = rawValue.replace(/\D/g, '');
    if (!numeric) {
      setPrices((prices || []).map(p => p.id === id ? { ...p, [field]: '0,000' } : p));
      return;
    }
    const floatVal = parseFloat(numeric) / 1000;
    const formatted = floatVal.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
    setPrices((prices || []).map(p => p.id === id ? { ...p, [field]: formatted } : p));
  };

  return (
    <div className="space-y-8 animate-reveal pb-40">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-black text-indigo-500 uppercase tracking-[0.3em]">Catálogo & Tributos</h3>
        <button onClick={handleResetTaxes} className="flex items-center gap-1.5 text-slate-500 font-bold text-[9px] uppercase hover:text-indigo-400 transition-colors">
          <RefreshCw size={12} /> Reset Alíquotas
        </button>
      </div>

      <div className="bg-[#0a0a0b] rounded-[2.5rem] p-8 border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.6)] relative overflow-hidden ring-1 ring-white/5">
         <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 blur-[80px] rounded-full" />
         
         <div className="flex items-center justify-between mb-8 relative z-10">
            <div className="flex items-center gap-4">
               <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-[1.2rem] flex items-center justify-center shadow-xl shadow-indigo-900/40 border border-white/20">
                  <Wallet size={24} />
               </div>
               <div>
                  <h4 className="text-[12px] font-black text-white uppercase tracking-[0.2em]">Resumo Fiscal</h4>
                  <div className="flex items-center gap-1.5 mt-1">
                    <ShieldCheck size={10} className="text-emerald-500" />
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">Cálculo de Precisão Ativo</p>
                  </div>
               </div>
            </div>
            <div className="text-right">
               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Tributos</p>
               <span className="text-3xl font-black text-white tracking-tighter block leading-none">R$ {toCurrency(taxDetails.total)}</span>
            </div>
         </div>
         
         <div className="flex items-center justify-between mb-8 bg-white/[0.03] p-4 rounded-2xl border border-white/5 relative z-10">
            <div className="flex items-center gap-2">
              <Info size={14} className="text-indigo-400 shrink-0" />
              <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Base de Cálculo (Nota)</p>
            </div>
            <span className="text-sm font-black text-white">R$ {toCurrency(totalProdutos)}</span>
         </div>

         <div className="grid grid-cols-3 gap-4 relative z-10">
            {[
              { id: 'federal', label: 'Federal', val: taxDetails.federal, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
              { id: 'estadual', label: 'Estadual', val: taxDetails.estadual, color: 'text-purple-400', bg: 'bg-purple-500/10' },
              { id: 'municipal', label: 'Municipal', val: taxDetails.municipal, color: 'text-emerald-400', bg: 'bg-emerald-500/10' }
            ].map((tax) => (
              <div key={tax.id} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-slate-500 uppercase block text-center tracking-[0.1em]">{tax.label} %</label>
                  <input 
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3 text-center text-[12px] font-black text-white outline-none focus:border-indigo-500/50 transition-all"
                    value={(safeTaxRates as any)[tax.id]}
                    onChange={e => handleTaxRateInputChange(tax.id as keyof TaxRates, e.target.value)}
                    placeholder="0,0000" 
                    inputMode="decimal"
                  />
                </div>
                
                {/* EXIBIÇÃO CLARA DO VALOR EM R$ CALCULADO SOBRE A NOTA */}
                <div className={`${tax.bg} border border-white/10 rounded-2xl p-3 flex flex-col items-center justify-center min-h-[64px] shadow-inner`}>
                   <span className="text-[7px] font-black text-slate-500 uppercase mb-1 leading-none tracking-widest">VALOR R$</span>
                   <span className={`text-[12px] font-black ${tax.color} whitespace-nowrap leading-none tracking-tight`}>
                      {toCurrency(tax.val)}
                   </span>
                </div>
              </div>
            ))}
         </div>
         <p className="text-[8px] text-slate-600 mt-6 text-center font-bold uppercase tracking-widest">
           Nota: Entre com a % da alíquota. O valor em R$ é calculado automaticamente.
         </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
           <div className="flex items-center gap-2">
              <Tag size={14} className="text-indigo-500" />
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Catálogo de Produtos</h4>
           </div>
           <button onClick={() => setPrices([...(prices || []), { id: Date.now().toString(), code: '', name: 'NOVO PRODUTO', unit: 'L', price: '0,000', priceCard: '0,000' }])} className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">
             + Novo Produto
           </button>
        </div>

        {(prices || []).map((item) => (
          <div key={item.id} className="bg-[#0f1115]/80 backdrop-blur-md rounded-[2.5rem] p-6 border border-white/5 group">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-4 overflow-hidden">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-indigo-400 border border-white/5">
                   <Tag size={20} />
                </div>
                <div className="flex-1 overflow-hidden text-left">
                   <input 
                     value={item.name} 
                     onChange={(e) => setPrices((prices || []).map(p => p.id === item.id ? { ...p, name: e.target.value.toUpperCase() } : p))}
                     className="bg-transparent text-sm font-black text-white outline-none w-full"
                     placeholder="NOME DO PRODUTO"
                   />
                </div>
              </div>
              <button onClick={() => setPrices((prices || []).filter(p => p.id !== item.id))} className="p-3 text-slate-600 hover:text-rose-500 transition-all">
                <Trash2 size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white/[0.02] rounded-2xl p-4 border border-white/5">
                  <label className="text-[8px] font-black text-emerald-500 uppercase block mb-1 tracking-widest">À Vista (R$)</label>
                  <input value={item.price} onChange={(e) => handlePriceValueChange(item.id, 'price', e.target.value)} className="w-full bg-transparent text-xl font-black text-white outline-none" inputMode="decimal" />
               </div>
               <div className="bg-white/[0.02] rounded-2xl p-4 border border-white/5">
                  <label className="text-[8px] font-black text-indigo-400 uppercase block mb-1 tracking-widest">Cartão (R$)</label>
                  <input value={item.priceCard || ''} onChange={(e) => handlePriceValueChange(item.id, 'priceCard', e.target.value)} className="w-full bg-transparent text-xl font-black text-white outline-none" inputMode="decimal" />
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PricesScreen;
