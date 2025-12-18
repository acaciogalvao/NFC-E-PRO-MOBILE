
import React, { useState, useRef, useEffect } from 'react';
// Import QrCode and alias it to QrIcon as used in the code
import { Plus, Trash2, Zap, ScanLine, PlusCircle, User, CreditCard, Banknote, QrCode as QrIcon, FileCheck, Calendar, MapPin, Building2, Fingerprint, Smartphone, Key, Mail, Globe, Hash } from 'lucide-react';
import { PaymentMethod, FuelItem, PixKeyType } from '../types';
import { useAppContext } from '../context/AppContext';
import { moneyToFloat, quantityToFloat, formatMoneyMask, formatQuantityInput, generateNfceAccessKey, generateNfceQrCodeUrl, toCurrency, to3Decimals, parseLocaleNumber, formatCNPJ, formatPixKey } from '../utils/formatters';

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
  const pixKeyInputRef = useRef<HTMLInputElement>(null);
  
  const [awaitingFirstChar, setAwaitingFirstChar] = useState<Record<string, boolean>>({});

  const isSpecialPrice = ['CARTAO', 'CREDITO', 'DEBITO'].includes(invoiceData.formaPagamento);

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
      if (/[0-9]/.test(lastChar)) {
        valueToProcess = lastChar;
      }
      setAwaitingFirstChar(prev => ({ ...prev, [fieldKey]: false }));
    }

    setFuels(prevFuels => prevFuels.map(f => {
      if (f.id === fuelId) {
        return calculateUpdate(f, field === 'qty' ? 'qty' : 'total', valueToProcess);
      }
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
      return { 
        ...item, 
        quantity: formattedQty, 
        total: toCurrency(qty * rawUnitPrice) 
      };
    }

    if (field === 'total') {
      const formattedTotal = formatMoneyMask(value);
      const total = moneyToFloat(formattedTotal);
      const qty = rawUnitPrice > 0 ? total / rawUnitPrice : 0;
      return { 
        ...item, 
        total: formattedTotal, 
        quantity: to3Decimals(qty) 
      };
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

    // Geração Síncrona dos Dados Fiscais
    const nNota = invoiceData.numero || Math.floor(100000 + Math.random() * 900000).toString();
    const serie = invoiceData.serie || '001';
    const dataFormatada = invoiceData.dataEmissao || new Date().toLocaleString('pt-BR');
    const chaveAcesso = generateNfceAccessKey({ uf: '21', cnpj: postoData.cnpj, serie, numero: nNota, tpEmis: '1', dataEmissao: dataFormatada });
    const protocolo = invoiceData.protocolo || Math.floor(100000000000000 + Math.random() * 900000000000000).toString();
    const urlQrCode = generateNfceQrCodeUrl(chaveAcesso, '1');

    // Commit imediato ao estado
    setInvoiceData(prev => ({
      ...prev,
      numero: nNota,
      serie: serie,
      dataEmissao: dataFormatada,
      chaveAcesso: chaveAcesso,
      protocolo: protocolo,
      urlQrCode: urlQrCode
    }));

    showToast("NFC-e Processada!", "success");
    
    // Pequeno delay para garantir que o NoteScreen receba os novos valores do context
    setTimeout(() => {
      onGenerate();
    }, 150);
  };

  return (
    <div className="space-y-8 pb-10 animate-reveal">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xs font-black text-indigo-500 uppercase tracking-[0.3em]">Painel de Emissão</h3>
        <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 text-indigo-400 font-bold text-[10px] uppercase">
          <ScanLine size={14} /> Scanner IA
        </button>
      </div>

      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" />

      {/* 1. ESTABELECIMENTO */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          <Building2 size={14} className="text-indigo-500" />
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Estabelecimento</h4>
        </div>
        <div className="glass-card rounded-[2.5rem] p-6 space-y-4 border border-white/5">
           <div>
              <label className="text-[8px] font-black text-slate-500 uppercase block mb-1 ml-2">Razão Social</label>
              <input 
                className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-indigo-500/50" 
                value={postoData.razaoSocial} 
                onChange={e => handlePostoChange('razaoSocial', e.target.value.toUpperCase())}
                placeholder="NOME DA EMPRESA"
              />
           </div>
           <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[8px] font-black text-slate-500 uppercase block mb-1 ml-2">CNPJ</label>
                <input 
                  className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-indigo-500/50" 
                  value={postoData.cnpj} 
                  onChange={e => handlePostoChange('cnpj', formatCNPJ(e.target.value))}
                  placeholder="00.000.000/0000-00"
                />
              </div>
              <div>
                <label className="text-[8px] font-black text-slate-500 uppercase block mb-1 ml-2">Insc. Estadual</label>
                <input 
                  className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-indigo-500/50" 
                  value={postoData.inscEstadual} 
                  onChange={e => handlePostoChange('inscEstadual', e.target.value)}
                  placeholder="ISENTO"
                />
              </div>
           </div>
           <div>
              <label className="text-[8px] font-black text-slate-500 uppercase block mb-1 ml-2">Endereço Completo</label>
              <textarea 
                className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-indigo-500/50 min-h-[80px]" 
                value={postoData.endereco} 
                onChange={e => handlePostoChange('endereco', e.target.value.toUpperCase())}
                placeholder="RUA, NÚMERO, BAIRRO, CIDADE-UF"
              />
           </div>

           {/* PIX DO ESTABELECIMENTO */}
           <div className="pt-4 border-t border-white/5 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                 <QrIcon size={14} className="text-emerald-500" />
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Dados para Recebimento Pix</span>
              </div>
              <div className="grid grid-cols-1 gap-3">
                 <div>
                    <label className="text-[8px] font-black text-slate-500 uppercase block mb-1 ml-2">Tipo de Chave</label>
                    <select 
                      className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-emerald-500/50 appearance-none"
                      value={postoData.tipoChavePix || 'CNPJ'}
                      onChange={e => {
                        const newType = e.target.value as PixKeyType;
                        setPostoData(prev => ({ ...prev, tipoChavePix: newType, chavePix: '' }));
                        setTimeout(() => pixKeyInputRef.current?.focus(), 150);
                      }}
                    >
                      <option value="CNPJ" className="bg-slate-900">CNPJ</option>
                      <option value="CPF" className="bg-slate-900">CPF</option>
                      <option value="EMAIL" className="bg-slate-900">E-mail</option>
                      <option value="TELEFONE" className="bg-slate-900">Telefone (Celular)</option>
                      <option value="ALEATORIA" className="bg-slate-900">Chave Aleatória</option>
                    </select>
                 </div>
                 <div>
                    <label className="text-[8px] font-black text-slate-500 uppercase block mb-1 ml-2">Chave Pix</label>
                    <div className="relative">
                      <input 
                        ref={pixKeyInputRef}
                        className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-emerald-500/50 pr-12" 
                        value={postoData.chavePix || ''} 
                        onChange={e => handlePostoChange('chavePix', formatPixKey(e.target.value, postoData.tipoChavePix || 'CNPJ'))}
                        placeholder={
                          postoData.tipoChavePix === 'EMAIL' ? 'exemplo@email.com' :
                          postoData.tipoChavePix === 'TELEFONE' ? '(00) 00000-0000' :
                          postoData.tipoChavePix === 'CPF' ? '000.000.000-00' :
                          postoData.tipoChavePix === 'CNPJ' ? '00.000.000/0000-00' : 'Cole sua chave aqui'
                        }
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500/50">
                        {postoData.tipoChavePix === 'EMAIL' && <Mail size={18} />}
                        {postoData.tipoChavePix === 'TELEFONE' && <Smartphone size={18} />}
                        {postoData.tipoChavePix === 'ALEATORIA' && <Key size={18} />}
                        {(postoData.tipoChavePix === 'CPF' || postoData.tipoChavePix === 'CNPJ') && <Fingerprint size={18} />}
                      </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* 2. VEÍCULO E EQUIPE */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-2"><User size={14} className="text-indigo-500" /><h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Veículo e Equipe</h4></div>
        <div className="grid grid-cols-2 gap-3">
           <div className="glass-card rounded-2xl p-4"><label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Placa</label><input className="w-full bg-transparent text-sm font-bold outline-none text-white uppercase" value={invoiceData.placa} onChange={e => handleInvoiceChange('placa', e.target.value.toUpperCase())} placeholder="ABC1D23" /></div>
           <div className="glass-card rounded-2xl p-4"><label className="text-[9px] font-black text-slate-500 uppercase block mb-1">KM Atual</label><input className="w-full bg-transparent text-sm font-bold outline-none text-white" value={invoiceData.km} onChange={e => handleInvoiceChange('km', e.target.value)} inputMode="numeric" placeholder="0" /></div>
           <div className="glass-card rounded-2xl p-4 col-span-2"><label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Motorista</label><input className="w-full bg-transparent text-sm font-bold outline-none text-white uppercase" value={invoiceData.motorista} onChange={e => handleInvoiceChange('motorista', e.target.value.toUpperCase())} placeholder="NOME DO MOTORISTA" /></div>
           <div className="glass-card rounded-2xl p-4 col-span-2"><label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Operador (Frentista)</label><input className="w-full bg-transparent text-sm font-bold outline-none text-white uppercase" value={invoiceData.operador} onChange={e => handleInvoiceChange('operador', e.target.value.toUpperCase())} placeholder="NOME DO FRENTISTA" /></div>
        </div>
      </section>

      {/* 3. DADOS FISCAIS AUTOMÁTICOS (READ ONLY) */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 px-2">
          <FileCheck size={14} className="text-indigo-500" />
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Dados Fiscais (Monitoramento)</h4>
        </div>
        <div className="glass-card rounded-3xl p-5 border border-white/5 space-y-4 opacity-80">
           <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                 <label className="text-[8px] font-black text-slate-500 uppercase block mb-1">Nº da Nota</label>
                 <div className="text-xs font-bold text-white opacity-80">{invoiceData.numero || 'GERADO AO FINALIZAR'}</div>
              </div>
              <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                 <label className="text-[8px] font-black text-slate-500 uppercase block mb-1">Série</label>
                 <div className="text-xs font-bold text-white opacity-80">{invoiceData.serie || '001'}</div>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                <label className="text-[8px] font-black text-slate-500 uppercase block mb-1">Emissão</label>
                <div className="text-[10px] font-bold text-white opacity-80 flex items-center gap-2">
                  <Calendar size={12} className="text-indigo-400" />
                  {invoiceData.dataEmissao || 'AGUARDANDO'}
                </div>
              </div>
              <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                 <label className="text-[8px] font-black text-slate-500 uppercase block mb-1">Protocolo</label>
                 <div className="text-[10px] font-bold text-white opacity-80 flex items-center gap-2">
                  <Hash size={12} className="text-indigo-400" />
                  {invoiceData.protocolo || 'PENDENTE'}
                </div>
              </div>
           </div>

           <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
              <label className="text-[8px] font-black text-slate-500 uppercase block mb-1">Chave de Acesso</label>
              <div className="text-[9px] font-mono font-bold text-indigo-300 break-all leading-relaxed">
                {invoiceData.chaveAcesso ? invoiceData.chaveAcesso.replace(/(\d{4})/g, '$1 ') : 'GERADO AUTOMATICAMENTE AO CLICAR EM FINALIZAR'}
              </div>
           </div>
        </div>
      </section>

      {/* 4. MÉTODOS DE PAGAMENTO */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-2">
           <Fingerprint size={14} className="text-indigo-500" />
           <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Método de Pagamento</h4>
        </div>
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
                  <button 
                    key={m.id} 
                    onClick={() => handleInvoiceChange('formaPagamento', m.id as PaymentMethod)}
                    className={`flex-1 py-3 rounded-2xl flex flex-col items-center justify-center gap-1 border transition-all ${active ? 'bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 border-white/5 text-slate-500'}`}
                  >
                    <Icon size={16} />
                    <span className="text-[8px] font-black uppercase">{m.label}</span>
                  </button>
                );
              })}
          </div>
        </div>
      </section>

      {/* 5. ITENS DA NOTA */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
           <div className="flex items-center gap-2"><PlusCircle size={14} className="text-indigo-500" /><h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Itens na Nota</h4></div>
           <button onClick={addFuel} className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-1"><Plus size={14} /> Adicionar</button>
        </div>

        {fuels.map((fuel) => {
           const currentProduct = prices.find(p => p.id === fuel.productId);
           const activePriceStr = (isSpecialPrice && currentProduct?.priceCard && parseFloat(currentProduct.priceCard.replace(/\D/g, '')) > 0) 
            ? currentProduct.priceCard 
            : (currentProduct?.price || fuel.unitPrice);
           
           return (
             <div key={fuel.id} className="glass-card rounded-3xl p-5 border border-white/5 space-y-4 transition-all">
                <div className="flex items-center justify-between gap-3">
                   <select className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-3 text-xs font-bold text-white outline-none focus:border-indigo-500/50" value={fuel.productId || ''} onChange={(e) => {
                      const sel = prices.find(p => p.id === e.target.value);
                      if (sel) {
                        setFuels(fuels.map(f => f.id === fuel.id ? { 
                          ...f, 
                          productId: sel.id, 
                          name: sel.name, 
                          unitPrice: sel.price, 
                          unitPriceCard: sel.priceCard, 
                          code: sel.code,
                          total: toCurrency(quantityToFloat(f.quantity) * parseLocaleNumber(isSpecialPrice && sel.priceCard && parseLocaleNumber(sel.priceCard) > 0 ? sel.priceCard : sel.price))
                        } : f));
                      }
                   }}>
                      <option value="" className="bg-slate-900">Selecione o Produto</option>
                      {prices.map(p => (<option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>))}
                   </select>
                   <button onClick={() => setFuels(fuels.filter(f => f.id !== fuel.id))} className="p-2 text-rose-500 hover:scale-110 transition-transform"><Trash2 size={18} /></button>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                   <div className="relative">
                      <label className="text-[7px] font-black text-slate-500 uppercase block mb-1">Qtd ({fuel.unit})</label>
                      <input 
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm font-black text-white outline-none focus:border-indigo-500 transition-all" 
                        value={fuel.quantity} 
                        onFocus={() => setAwaitingFirstChar(prev => ({ ...prev, [`${fuel.id}-qty`]: true }))}
                        onChange={(e) => handleInputChange(fuel.id, 'qty', e.target.value)}
                        inputMode="numeric" 
                        placeholder="0,000"
                      />
                   </div>
                   <div>
                      <label className="text-[7px] font-black text-slate-500 uppercase block mb-1">Unitário</label>
                      <div className="text-xs font-bold text-indigo-400 p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10 truncate">R$ {activePriceStr}</div>
                   </div>
                   <div>
                      <label className="text-[7px] font-black text-emerald-400 uppercase block mb-1">Total Item</label>
                      <input 
                        className="w-full bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-sm font-black text-emerald-400 outline-none focus:border-emerald-500 transition-all" 
                        value={fuel.total} 
                        onFocus={() => setAwaitingFirstChar(prev => ({ ...prev, [`${fuel.id}-total`]: true }))}
                        onChange={(e) => handleInputChange(fuel.id, 'total', e.target.value)} 
                        inputMode="numeric" 
                        placeholder="0,00"
                      />
                   </div>
                </div>
             </div>
           );
        })}
      </section>

      <button onClick={handleFinalize} className="w-full btn-primary py-5 rounded-[2.5rem] text-white font-black text-sm shadow-2xl flex items-center justify-center gap-3 tracking-[0.1em]"><Zap size={20} fill="currentColor" /> FINALIZAR E VER NOTA</button>
    </div>
  );
};

export default EditScreen;
