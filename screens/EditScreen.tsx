
import React, { useState, useRef } from 'react';
import { Plus, Trash2, Zap, Loader2, ScanLine, ShieldCheck, QrCode, PlusCircle, Tag, User, Activity, MapPin } from 'lucide-react';
import { PixKeyType } from '../types';
import { useAppContext } from '../context/AppContext';
import { formatCNPJ, formatQuantityInput, formatMoneyMask, parseLocaleNumber, formatPhone, formatPixKey, generateNfceAccessKey, generateNfceQrCodeUrl } from '../utils/formatters';

interface EditScreenProps {
  onGenerate: () => void;
}

const EditScreen: React.FC<EditScreenProps> = ({ onGenerate }) => {
  const { 
    postoData, setPostoData, 
    invoiceData, setInvoiceData, 
    fuels, setFuels, 
    prices, 
    taxRates,
    showToast,
  } = useAppContext();

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePostoChange = (field: keyof typeof postoData, value: string) => {
    let formattedValue = value;
    if (field === 'cnpj') formattedValue = formatCNPJ(value);
    if (field === 'fone') formattedValue = formatPhone(value);
    if (field === 'chavePix') {
      const type = postoData.tipoChavePix || 'CNPJ';
      formattedValue = formatPixKey(value, type);
    }
    setPostoData(prev => ({ ...prev, [field]: formattedValue }));
  };

  const handlePixTypeChange = (type: PixKeyType) => {
    setPostoData(prev => ({ ...prev, tipoChavePix: type, chavePix: '' }));
    showToast(`Tipo Pix: ${type}`, "info");
  };

  const handleInvoiceChange = (field: string, value: string) => {
    setInvoiceData(prev => ({ ...prev, [field]: value }));
  };

  const addFuel = () => {
    const newId = (Math.max(...fuels.map(f => parseInt(f.id) || 0), 0) + 1).toString();
    const defaultPrice = prices.length > 0 ? prices[0] : null;
    setFuels([...fuels, { 
      id: newId, 
      productId: defaultPrice?.id, 
      code: defaultPrice?.code || '', 
      name: defaultPrice?.name || 'NOVO ITEM', 
      quantity: '', 
      unitPrice: defaultPrice?.price || '', 
      unitPriceCard: defaultPrice?.priceCard || '',
      unit: defaultPrice?.unit || 'UN',
      total: ''
    }]);
  };

  const handleFuelProductChange = (id: string, productId: string) => {
    const selectedPrice = prices.find(p => p.id === productId);
    if (!selectedPrice) return;
    setFuels(fuels.map(f => f.id === id ? { 
      ...f, productId: selectedPrice.id, name: selectedPrice.name,
      unitPrice: selectedPrice.price, unitPriceCard: selectedPrice.priceCard, 
      unit: selectedPrice.unit, code: selectedPrice.code, quantity: '', total: ''
    } : f));
  };

  const handleQuantityChange = (id: string, rawValue: string) => {
    const formattedQty = formatQuantityInput(rawValue);
    setFuels(fuels.map(f => {
      if (f.id === id) {
         const q = parseLocaleNumber(formattedQty);
         const p = parseLocaleNumber(f.unitPrice);
         const newTotal = (q * p).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
         return { ...f, quantity: formattedQty, total: newTotal };
      }
      return f;
    }));
  };

  const handleTotalChange = (id: string, rawValue: string) => {
    const formattedTotal = formatMoneyMask(rawValue);
    setFuels(fuels.map(f => {
      if (f.id === id) {
        const totalVal = parseLocaleNumber(formattedTotal);
        const priceVal = parseLocaleNumber(f.unitPrice);
        const newQtyVal = priceVal > 0 ? totalVal / priceVal : 0;
        return { 
          ...f, 
          quantity: newQtyVal.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 }), 
          total: formattedTotal 
        }; 
      }
      return f;
    }));
  };

  const generateNFCe = () => {
    if (fuels.length === 0) { showToast("Adicione produtos!", "error"); return; }
    
    const nNota = invoiceData.numero || Math.floor(100000 + Math.random() * 900000).toString();
    const serie = invoiceData.serie || '1';
    const now = new Date();
    const dataFormatada = now.toLocaleString('pt-BR');

    const chaveAcesso = generateNfceAccessKey({
      uf: '21',
      cnpj: postoData.cnpj,
      serie: serie,
      numero: nNota,
      tpEmis: '1',
      dataEmissao: dataFormatada
    });

    const protocolo = invoiceData.protocolo || Array.from({length: 15}, () => Math.floor(Math.random() * 10)).join('');
    const urlSefaz = generateNfceQrCodeUrl(chaveAcesso, '1');

    setInvoiceData(prev => ({
      ...prev,
      numero: nNota,
      serie: serie,
      dataEmissao: dataFormatada,
      chaveAcesso: chaveAcesso,
      protocolo: protocolo,
      urlQrCode: urlSefaz,
      impostos: {
        federal: taxRates.federal,
        estadual: taxRates.estadual,
        municipal: taxRates.municipal
      }
    }));

    showToast("NFC-e Gerada com Sucesso!", "success");
    onGenerate();
  };

  const hasGeneratedNota = !!invoiceData.chaveAcesso;

  return (
    <div className="space-y-8 pb-10 animate-reveal">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black text-indigo-500 uppercase tracking-[0.3em]">Painel de Emissão</h3>
        <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 text-indigo-400 font-bold text-[10px] uppercase">
          {isUploading ? <Loader2 size={14} className="animate-spin" /> : <><ScanLine size={14} /> Scanner IA</>}
        </button>
      </div>

      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" />

      {/* SEÇÃO ESTABELECIMENTO */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-2">
           <ShieldCheck size={14} className="text-indigo-500" />
           <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Estabelecimento</h4>
        </div>
        
        <div className="glass-card rounded-3xl p-1 border-l-4 border-indigo-500">
          <label className="text-[7px] font-black text-slate-500 uppercase block pt-3 px-5">Razão Social</label>
          <textarea 
            className="w-full bg-transparent px-5 pb-4 pt-1 text-sm font-bold outline-none dark:text-white uppercase"
            value={postoData.razaoSocial} 
            onChange={e => handlePostoChange('razaoSocial', e.target.value)} 
            placeholder="NOME DA EMPRESA" rows={1}
          />
        </div>

        <div className="glass-card rounded-3xl p-1 border-l-4 border-indigo-500/50">
          <div className="flex items-center gap-1.5 pt-3 px-5">
            <MapPin size={10} className="text-indigo-400" />
            <label className="text-[7px] font-black text-slate-500 uppercase block">Endereço Completo</label>
          </div>
          <textarea 
            className="w-full bg-transparent px-5 pb-4 pt-1 text-xs font-bold outline-none dark:text-white leading-tight uppercase"
            value={postoData.endereco} 
            onChange={e => handlePostoChange('endereco', e.target.value)} 
            placeholder="RUA, Nº, BAIRRO, CIDADE - UF" rows={2}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card rounded-2xl p-4">
            <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">CNPJ</label>
            <input className="w-full bg-transparent text-sm font-bold outline-none dark:text-white" value={postoData.cnpj} onChange={e => handlePostoChange('cnpj', e.target.value)} placeholder="00.000.000/0000-00" inputMode="numeric" />
          </div>
          <div className="glass-card rounded-2xl p-4">
            <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Telefone</label>
            <input className="w-full bg-transparent text-sm font-bold outline-none dark:text-white" value={postoData.fone} onChange={e => handlePostoChange('fone', e.target.value)} placeholder="(00) 00000-0000" inputMode="tel" />
          </div>
        </div>

        {/* PIX CONFIG */}
        <div className="glass-card rounded-3xl p-4 space-y-3">
           <div className="flex items-center gap-2 mb-1">
              <QrCode size={16} className="text-emerald-500" />
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Configuração Pix</label>
           </div>
           <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {(['CNPJ', 'CPF', 'EMAIL', 'TELEFONE', 'ALEATORIA'] as PixKeyType[]).map(t => (
                <button key={t} onClick={() => handlePixTypeChange(t)} className={`px-3 py-1.5 rounded-xl text-[8px] font-black border whitespace-nowrap transition-all ${postoData.tipoChavePix === t ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-white/5 text-slate-500 border-white/5'}`}>{t}</button>
              ))}
           </div>
           <input 
             className="w-full bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 text-sm font-bold text-emerald-400 outline-none placeholder:text-emerald-500/30"
             value={postoData.chavePix} 
             onChange={e => handlePostoChange('chavePix', e.target.value)} 
             placeholder="Insira a chave pix..."
           />
        </div>
      </section>

      {/* SEÇÃO PRODUTOS COM ADICIONAR */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
           <div className="flex items-center gap-2">
              <PlusCircle size={14} className="text-indigo-500" />
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Produtos / Itens</h4>
           </div>
           <button onClick={addFuel} className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-1">
             <Plus size={14} /> Adicionar
           </button>
        </div>

        {fuels.map((fuel) => (
           <div key={fuel.id} className="glass-card rounded-3xl p-5 border border-white/5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                 <select className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-3 text-xs font-bold text-white outline-none" value={fuel.productId || ''} onChange={(e) => handleFuelProductChange(fuel.id, e.target.value)}>
                    <option value="" disabled className="bg-slate-900">Selecione o Produto</option>
                    {prices.map(p => (<option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>))}
                 </select>
                 <button onClick={() => setFuels(fuels.filter(f => f.id !== fuel.id))} className="p-2 text-rose-500"><Trash2 size={18} /></button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                 <div className="bg-white/5 rounded-2xl p-2.5">
                    <label className="text-[7px] font-black text-slate-500 uppercase block mb-1">Qtd</label>
                    <input className="w-full bg-transparent text-sm font-black text-white outline-none" value={fuel.quantity} onChange={(e) => handleQuantityChange(fuel.id, e.target.value)} placeholder="0,000" inputMode="decimal" />
                 </div>
                 <div className="bg-white/5 rounded-2xl p-2.5 opacity-60">
                    <label className="text-[7px] font-black text-slate-500 uppercase block mb-1">Unit</label>
                    <input className="w-full bg-transparent text-sm font-black text-indigo-400 outline-none" value={fuel.unitPrice} readOnly />
                 </div>
                 <div className="bg-white/5 rounded-2xl p-2.5">
                    <label className="text-[7px] font-black text-slate-500 uppercase block mb-1">Total</label>
                    <input className="w-full bg-transparent text-sm font-black text-white outline-none" value={fuel.total} onChange={(e) => handleTotalChange(fuel.id, e.target.value)} placeholder="0,00" inputMode="decimal" />
                 </div>
              </div>
           </div>
        ))}
      </section>

      {/* OPERAÇÃO E CAMPO COM KM, PLACA, OPERADOR E MOTORISTA */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-2">
           <User size={14} className="text-indigo-500" />
           <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Operação & Campo</h4>
        </div>
        <div className="grid grid-cols-2 gap-3">
           <div className="glass-card rounded-2xl p-4">
              <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Placa</label>
              <input className="w-full bg-transparent text-sm font-bold outline-none text-white uppercase" value={invoiceData.placa} onChange={e => handleInvoiceChange('placa', e.target.value.toUpperCase())} placeholder="AAA0A00" />
           </div>
           <div className="glass-card rounded-2xl p-4">
              <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Odômetro (KM)</label>
              <input className="w-full bg-transparent text-sm font-bold outline-none text-white" value={invoiceData.km} onChange={e => handleInvoiceChange('km', e.target.value.replace(/\D/g, ''))} placeholder="000000" inputMode="numeric" />
           </div>
           <div className="glass-card rounded-2xl p-4 col-span-2">
              <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Motorista</label>
              <input className="w-full bg-transparent text-sm font-bold outline-none text-white uppercase" value={invoiceData.motorista} onChange={e => handleInvoiceChange('motorista', e.target.value.toUpperCase())} placeholder="NOME DO MOTORISTA" />
           </div>
           <div className="glass-card rounded-2xl p-4 col-span-2">
              <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Operador / Frentista</label>
              <input className="w-full bg-transparent text-sm font-bold outline-none text-white uppercase" value={invoiceData.operador} onChange={e => handleInvoiceChange('operador', e.target.value.toUpperCase())} placeholder="NOME DO OPERADOR" />
           </div>
        </div>
      </section>

      {/* ALÍQUOTAS */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-2">
           <Tag size={14} className="text-amber-500" />
           <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Demonstrativo Tributário</h4>
        </div>
        <div className="glass-card rounded-3xl p-6 grid grid-cols-3 gap-4 border border-amber-500/10">
           <div className="text-center">
              <span className="text-[8px] font-black text-slate-500 uppercase block mb-1">Federal</span>
              <div className="text-sm font-black text-amber-500">{taxRates.federal}%</div>
           </div>
           <div className="text-center border-x border-white/5">
              <span className="text-[8px] font-black text-slate-500 uppercase block mb-1">Estadual</span>
              <div className="text-sm font-black text-amber-500">{taxRates.estadual}%</div>
           </div>
           <div className="text-center">
              <span className="text-[8px] font-black text-slate-500 uppercase block mb-1">Municipal</span>
              <div className="text-sm font-black text-amber-500">{taxRates.municipal}%</div>
           </div>
        </div>
      </section>

      {/* DADOS FISCAIS - NÚMERO E SÉRIE COMO READONLY */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-2">
           <Activity size={14} className="text-blue-400" />
           <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Dados Fiscais Autorizados</h4>
        </div>
        <div className={`glass-card rounded-3xl p-6 space-y-4 border border-blue-500/10 transition-all ${hasGeneratedNota ? 'opacity-100' : 'opacity-40 select-none'}`}>
           <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[8px] font-black text-slate-500 uppercase block mb-1">Nº Nota (Visualização)</label>
                <input className="w-full bg-white/5 rounded-xl p-3 text-xs font-bold text-blue-400 outline-none cursor-not-allowed" value={invoiceData.numero} readOnly />
              </div>
              <div>
                <label className="text-[8px] font-black text-slate-500 uppercase block mb-1">Série (Visualização)</label>
                <input className="w-full bg-white/5 rounded-xl p-3 text-xs font-bold text-blue-400 outline-none cursor-not-allowed" value={invoiceData.serie || '1'} readOnly />
              </div>
           </div>

           <div>
              <label className="text-[8px] font-black text-slate-500 uppercase block mb-1">Chave de Acesso</label>
              <input className="w-full bg-white/5 rounded-xl p-3 text-[10px] font-mono font-bold text-blue-400 outline-none" value={invoiceData.chaveAcesso} readOnly placeholder="CHAVE GERADA AUTOMATICAMENTE" />
           </div>

           <div>
              <label className="text-[8px] font-black text-slate-500 uppercase block mb-1">URL Consulta (Padrão SEFAZ MA)</label>
              <div className="w-full bg-blue-500/5 rounded-xl p-3 text-[9px] font-bold text-blue-500/50 truncate border border-blue-500/10 select-all">
                 {invoiceData.urlQrCode || 'http://www.nfce.sefaz.ma.gov.br/portal/consultarNFCe.jsp'}
              </div>
           </div>
        </div>
      </section>

      <button onClick={generateNFCe} className="w-full btn-primary py-5 rounded-[2.5rem] text-white font-black text-sm shadow-2xl flex items-center justify-center gap-3 tracking-[0.1em]"><Zap size={20} fill="currentColor" /> FINALIZAR EMISSÃO</button>
    </div>
  );
};

export default EditScreen;
