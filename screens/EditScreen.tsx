
import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, ScanLine, PlusCircle, User, CreditCard, Banknote, QrCode as QrIcon, FileCheck, Calendar, Building2, Fingerprint, Smartphone, Key, Mail, Hash, Check, Copy, Settings2, Lock } from 'lucide-react';
import { PaymentMethod, FuelItem, PixKeyType } from '../types';
import { useAppContext } from '../context/AppContext';
import { moneyToFloat, quantityToFloat, formatMoneyMask, formatQuantityInput, generateNfceAccessKey, generateNfceQrCodeUrl, toCurrency, to3Decimals, parseLocaleNumber, formatCNPJ, formatPixKey, formatCEP } from '../utils/helpers';

interface EditScreenProps {
  onGenerate: () => void;
}

const EditScreen: React.FC<EditScreenProps> = ({ onGenerate }) => {
  const { 
    postoData, setPostoData, invoiceData, setInvoiceData, 
    fuels, setFuels, 
    prices, showToast 
  } = useAppContext();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [awaitingFirstChar, setAwaitingFirstChar] = useState<Record<string, boolean>>({});

  const isSpecialPrice = ['CARTAO', 'CREDITO', 'DEBITO'].includes(invoiceData.formaPagamento);

  // Efeito para sincronizar a string técnica #CF com o bico e quantidade atual
  useEffect(() => {
    if (fuels.length > 0) {
      const firstFuel = fuels[0];
      const qty = firstFuel.quantity || '0,000';
      const bico = invoiceData.bico || '01'; 
      const autoGen = `#CF:B${bico.padStart(2, '0')} EI0550800,620 EF0550927,830 V${qty}`;
      
      if (invoiceData.detalheCodigo !== autoGen) {
        setInvoiceData(prev => ({ ...prev, detalheCodigo: autoGen }));
      }
    }
  }, [fuels, invoiceData.bico, setInvoiceData]);

  const handleInvoiceChange = (field: string, value: string) => {
    setInvoiceData(prev => ({ ...prev, [field]: value }));
  };

  const handlePostoChange = (field: string, value: string) => {
    setPostoData(prev => ({ ...prev, [field]: value }));
  };

  const handleInputChange = (fuelId: string, field: 'qty' | 'total', rawValue: string) => {
    const fieldKey = `${fuelId}-${field}`;
    let valueToProcess = rawValue;

    if (awaitingFirstChar[fieldKey]) {
      const lastChar = rawValue.charAt(rawValue.length - 1);
      if (/[0-9]/.test(lastChar)) { valueToProcess = lastChar; }
      setAwaitingFirstChar(prev => ({ ...prev, [fieldKey]: false }));
    }

    setFuels(prevFuels => prevFuels.map(f => {
      if (f.id === fuelId) { return calculateUpdate(f, field === 'qty' ? 'qty' : 'total', valueToProcess); }
      return f;
    }));
  };

  const calculateUpdate = (item: FuelItem, field: 'qty' | 'total', value: string): FuelItem => {
    const currentProduct = prices.find(p => p.id === item.productId || p.code === item.code);
    const activePriceStr = isSpecialPrice && currentProduct?.priceCard 
      ? currentProduct.priceCard 
      : (currentProduct?.price || item.unitPrice);
    
    const rawUnitPrice = parseLocaleNumber(activePriceStr);

    if (field === 'qty') {
      const formattedQty = formatQuantityInput(value);
      const qty = quantityToFloat(formattedQty);
      return { ...item, quantity: formattedQty, total: toCurrency(qty * rawUnitPrice) };
    }

    if (field === 'total') {
      const formattedTotal = formatMoneyMask(value);
      const total = moneyToFloat(formattedTotal);
      const qty = rawUnitPrice > 0 ? total / rawUnitPrice : 0;
      return { ...item, total: formattedTotal, quantity: to3Decimals(qty) };
    }

    return item;
  };

  const addFuel = () => {
    const newId = Date.now().toString();
    const defaultPrice = prices.length > 0 ? prices[0] : null;
    setFuels([...fuels, { 
      id: newId, 
      productId: defaultPrice?.id, 
      code: defaultPrice?.code || '', 
      name: defaultPrice?.name || 'SELECIONE O PRODUTO', 
      quantity: '0,000', 
      unitPrice: defaultPrice?.price || '0,000', 
      unitPriceCard: defaultPrice?.priceCard || '0,000',
      unit: defaultPrice?.unit || 'L',
      total: '0,00'
    }]);
  };

  const handleFinalize = () => {
    if (fuels.length === 0) {
      showToast("Adicione ao menos um item!", "error");
      return;
    }

    const nNota = Math.floor(100000 + Math.random() * 900000).toString();
    // Série agora é gerada automaticamente como '001' se estiver vazia
    const serieAutomatica = invoiceData.serie || '001';
    const dataFormatada = new Date().toLocaleString('pt-BR');
    const chaveAcesso = generateNfceAccessKey({ uf: '21', cnpj: postoData.cnpj, serie: serieAutomatica, numero: nNota, tpEmis: '1', dataEmissao: dataFormatada });
    const protocolo = Math.floor(100000000000000 + Math.random() * 900000000000000).toString();
    const urlQrCode = generateNfceQrCodeUrl(chaveAcesso);
    
    // GERAÇÃO AUTOMÁTICA DE BICO E SÉRIE
    const bicoAleatorio = Math.floor(Math.random() * 20 + 1).toString().padStart(2, '0');
    
    setInvoiceData(prev => ({ 
      ...prev, 
      bico: bicoAleatorio, 
      serie: serieAutomatica,
      numero: nNota, 
      dataEmissao: dataFormatada, 
      chaveAcesso: chaveAcesso, 
      protocolo: protocolo, 
      urlQrCode: urlQrCode
    }));
    
    showToast("Nota Finalizada com Sucesso!", "success");
  };

  return (
    <div className="space-y-8 pb-10 animate-reveal">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xs font-black text-indigo-500 uppercase tracking-[0.3em]">Emissão de Nota</h3>
        <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 text-indigo-400 font-bold text-[10px] uppercase">
          <ScanLine size={14} /> Scanner IA
        </button>
      </div>

      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" />

      {/* Estabelecimento Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          <Building2 size={14} className="text-indigo-500" />
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Estabelecimento</h4>
        </div>
        <div className="glass-card rounded-[2.5rem] p-6 space-y-4 border border-white/5">
           <div>
              <label className="text-[8px] font-black text-slate-500 uppercase block mb-1 ml-2">Razão Social</label>
              <input className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-indigo-500/50" value={postoData.razaoSocial} onChange={e => handlePostoChange('razaoSocial', e.target.value.toUpperCase())} placeholder="NOME DA EMPRESA" />
           </div>
           <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[8px] font-black text-slate-500 uppercase block mb-1 ml-2">CNPJ</label>
                <input className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-indigo-500/50" value={postoData.cnpj} onChange={e => handlePostoChange('cnpj', formatCNPJ(e.target.value))} placeholder="00.000.000/0000-00" />
              </div>
              <div>
                <label className="text-[8px] font-black text-slate-500 uppercase block mb-1 ml-2">Insc. Estadual</label>
                <input className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-indigo-500/50" value={postoData.inscEstadual} onChange={e => handlePostoChange('inscEstadual', e.target.value)} placeholder="ISENTO" />
              </div>
           </div>
           <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[8px] font-black text-slate-500 uppercase block mb-1 ml-2">CEP</label>
                <input className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-indigo-500/50" value={postoData.cep} onChange={e => handlePostoChange('cep', formatCEP(e.target.value))} placeholder="00000-000" />
              </div>
              <div>
                <label className="text-[8px] font-black text-slate-500 uppercase block mb-1 ml-2">Telefone</label>
                <input className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-indigo-500/50" value={postoData.fone} onChange={e => handlePostoChange('fone', e.target.value)} placeholder="(00) 0000-0000" />
              </div>
           </div>
           <div>
              <label className="text-[8px] font-black text-slate-500 uppercase block mb-1 ml-2">Endereço Completo</label>
              <textarea className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-indigo-500/50 min-h-[80px]" value={postoData.endereco} onChange={e => handlePostoChange('endereco', e.target.value.toUpperCase())} placeholder="RUA, NÚMERO, BAIRRO, CIDADE-UF" />
           </div>
        </div>
      </section>

      {/* Identificação Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-2"><User size={14} className="text-indigo-500" /><h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Identificação</h4></div>
        <div className="grid grid-cols-2 gap-3">
           <div className="glass-card rounded-2xl p-4"><label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Placa</label><input className="w-full bg-transparent text-sm font-bold outline-none text-white uppercase" value={invoiceData.placa} onChange={e => handleInvoiceChange('placa', e.target.value.toUpperCase())} placeholder="ABC1D23" /></div>
           <div className="glass-card rounded-2xl p-4"><label className="text-[9px] font-black text-slate-500 uppercase block mb-1">KM Atual</label><input className="w-full bg-transparent text-sm font-bold outline-none text-white" value={invoiceData.km} onChange={e => handleInvoiceChange('km', e.target.value)} inputMode="numeric" placeholder="0" /></div>
           <div className="glass-card rounded-2xl p-4 col-span-2"><label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Motorista</label><input className="w-full bg-transparent text-sm font-bold outline-none text-white uppercase" value={invoiceData.motorista} onChange={e => handleInvoiceChange('motorista', e.target.value.toUpperCase())} placeholder="NOME DO MOTORISTA" /></div>
           <div className="glass-card rounded-2xl p-4 col-span-2"><label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Operador (Frentista)</label><input className="w-full bg-transparent text-sm font-bold outline-none text-white uppercase" value={invoiceData.operador} onChange={e => handleInvoiceChange('operador', e.target.value.toUpperCase())} placeholder="NOME DO FRENTISTA" /></div>
        </div>
      </section>

      {/* Dados Técnicos Section - GERAÇÃO 100% AUTOMÁTICA (BICO E SÉRIE) */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-2"><Settings2 size={14} className="text-indigo-500" /><h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Processamento Fiscal Automático</h4></div>
        <div className="glass-card rounded-3xl p-6 border border-white/5 space-y-6">
           <div>
              <div className="flex items-center justify-between mb-2 ml-2">
                 <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Configurações Sistêmicas</label>
                 <div className="flex items-center gap-1 text-[8px] text-emerald-400 font-bold uppercase"><Lock size={10} /> Gerenciamento IA</div>
              </div>
              <div className="w-full bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-5 space-y-4">
                 <div className="flex flex-col gap-1">
                    <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Identificador da Bomba (Bico)</span>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                       <div className={`w-2 h-2 rounded-full ${invoiceData.bico ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-700'}`} />
                       {invoiceData.bico ? `MEDIDOR ATIVO: ${invoiceData.bico},99` : 'AGUARDANDO LANÇAMENTO'}
                    </div>
                 </div>
                 
                 <div className="flex flex-col gap-1 border-t border-white/5 pt-3">
                    <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Série Tributária</span>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                       <div className={`w-2 h-2 rounded-full ${invoiceData.serie ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-700'}`} />
                       {invoiceData.serie ? `SÉRIE GERADA: ${invoiceData.serie}` : 'GERAÇÃO DINÂMICA'}
                    </div>
                 </div>

                 <div className="flex flex-col gap-1 border-t border-white/5 pt-3">
                    <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Código Estrutural</span>
                    <div className="text-[10px] font-mono font-bold text-indigo-300 break-all leading-tight opacity-80">
                       {invoiceData.detalheCodigo || '#CF: AUTO-GEN-ACTIVE'}
                    </div>
                 </div>
              </div>
              <p className="text-[8px] text-slate-500 mt-3 ml-2 italic">A série e o bico são atribuídos de forma exclusiva a cada nota no fechamento do cupom.</p>
           </div>
        </div>
      </section>

      {/* Pagamento Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-2"><Fingerprint size={14} className="text-indigo-500" /><h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pagamento</h4></div>
        <div className="bg-indigo-500/5 rounded-[2rem] p-4 border border-indigo-500/10">
          <div className="flex gap-2">
              {[
                { id: 'DINHEIRO', icon: Banknote, label: 'Dinheiro' },
                { id: 'PIX', icon: QrIcon, label: 'Pix' },
                { id: 'CARTAO', icon: CreditCard, label: 'Cartão' }
              ].map((m) => {
                const Icon = m.icon;
                const active = invoiceData.formaPagamento === m.id || (m.id === 'CARTAO' && ['CREDITO', 'DEBITO', 'CARTAO'].includes(invoiceData.formaPagamento));
                return (
                  <button key={m.id} onClick={() => handleInvoiceChange('formaPagamento', m.id as PaymentMethod)} className={`flex-1 py-3 rounded-2xl flex flex-col items-center justify-center gap-1 border transition-all ${active ? 'bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 border-white/5 text-slate-500'}`}><Icon size={16} /><span className="text-[8px] font-black uppercase">{m.label}</span></button>
                );
              })}
          </div>
        </div>
      </section>

      {/* Itens Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
           <div className="flex items-center gap-2"><PlusCircle size={14} className="text-indigo-500" /><h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Produtos</h4></div>
           <button onClick={addFuel} className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-1"><Plus size={14} /> Adicionar</button>
        </div>
        {fuels.map((fuel) => {
           const currentProduct = prices.find(p => p.id === fuel.productId);
           const activePriceStr = (isSpecialPrice && currentProduct?.priceCard && parseLocaleNumber(currentProduct.priceCard) > 0) ? currentProduct.priceCard : (currentProduct?.price || fuel.unitPrice);
           return (
             <div key={fuel.id} className="glass-card rounded-3xl p-5 border border-white/5 space-y-4">
                <div className="flex items-center justify-between gap-3">
                   <select className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-3 text-xs font-bold text-white outline-none focus:border-indigo-500/50" value={fuel.productId || ''} onChange={(e) => { const sel = prices.find(p => p.id === e.target.value); if (sel) { setFuels(fuels.map(f => f.id === fuel.id ? { ...f, productId: sel.id, name: sel.name, unitPrice: sel.price, unitPriceCard: sel.priceCard, code: sel.code, total: toCurrency(quantityToFloat(f.quantity) * parseLocaleNumber(isSpecialPrice && sel.priceCard && parseLocaleNumber(sel.priceCard) > 0 ? sel.priceCard : sel.price)) } : f)); } }}>
                      <option value="" className="bg-slate-900">Selecione o Produto</option>
                      {prices.map(p => (<option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>))}
                   </select>
                   <button onClick={() => setFuels(fuels.filter(f => f.id !== fuel.id))} className="p-2 text-rose-500 active:scale-90 transition-transform"><Trash2 size={18} /></button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                   <div className="relative">
                      <label className="text-[7px] font-black text-slate-500 uppercase block mb-1">Qtd</label>
                      <input className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm font-black text-white outline-none focus:border-indigo-500" value={fuel.quantity} onFocus={() => setAwaitingFirstChar(prev => ({ ...prev, [`${fuel.id}-qty`]: true }))} onChange={(e) => handleInputChange(fuel.id, 'qty', e.target.value)} inputMode="numeric" placeholder="0,000" />
                   </div>
                   <div>
                      <label className="text-[7px] font-black text-slate-500 uppercase block mb-1">Unitário</label>
                      <div className="text-[10px] font-bold text-indigo-400 p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10 truncate">R$ {activePriceStr}</div>
                   </div>
                   <div>
                      <label className="text-[7px] font-black text-emerald-400 uppercase block mb-1">Total</label>
                      <input className="w-full bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-sm font-black text-emerald-400 outline-none focus:border-emerald-500" value={fuel.total} onFocus={() => setAwaitingFirstChar(prev => ({ ...prev, [`${fuel.id}-total`]: true }))} onChange={(e) => handleInputChange(fuel.id, 'total', e.target.value)} inputMode="numeric" placeholder="0,00" />
                   </div>
                </div>
             </div>
           );
        })}
      </section>
      
      <div className="space-y-4">
        <button onClick={handleFinalize} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 py-6 rounded-[2.5rem] text-white font-black text-sm shadow-2xl flex items-center justify-center gap-3 tracking-[0.1em] transition-transform active:scale-95">
          <FileCheck size={20} /> FINALIZAR LANÇAMENTO
        </button>

        {invoiceData.chaveAcesso && (
          <div className="glass-card rounded-[2.5rem] p-6 border border-indigo-500/30 bg-indigo-500/5 animate-reveal space-y-4">
             <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Dados Fiscais Gerados</h4>
                <div className="flex gap-2">
                   <button onClick={() => { navigator.clipboard.writeText(invoiceData.chaveAcesso); showToast("Chave Copiada!", "success"); }} className="p-2 bg-white/5 rounded-xl text-indigo-400"><Copy size={14}/></button>
                   <button onClick={onGenerate} className="p-2 bg-indigo-500 text-white rounded-xl"><QrIcon size={14}/></button>
                </div>
             </div>
             
             <div className="space-y-3 text-xs">
                <div className="flex flex-col gap-1 border-b border-white/5 pb-2">
                   <span className="text-slate-500 font-black uppercase text-[8px] tracking-widest">Chave de Acesso</span>
                   <span className="text-white font-mono text-[10px] break-all leading-tight">{invoiceData.chaveAcesso.replace(/(\d{4})/g, '$1 ')}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                   <div className="flex flex-col gap-1">
                      <span className="text-slate-500 font-black uppercase text-[8px] tracking-widest">Nº / Série Automática</span>
                      <span className="text-white font-bold">{invoiceData.numero} / {invoiceData.serie}</span>
                   </div>
                   <div className="flex flex-col gap-1">
                      <span className="text-slate-500 font-black uppercase text-[8px] tracking-widest">Bico Aleatório</span>
                      <span className="text-white font-bold truncate">MED:{invoiceData.bico},99</span>
                   </div>
                </div>
             </div>

             <div className="text-center">
                <button onClick={onGenerate} className="text-indigo-400 text-[10px] font-black uppercase tracking-widest hover:underline">Ver Nota Completa →</button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditScreen;
