
import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, PlusCircle, Building2, Fingerprint, Lock, FileCheck, Smartphone, Camera, Image as ImageIcon, Sparkles, Hash, Phone, MapPin, QrCode as QrIcon, Tag, User } from 'lucide-react';
import { FuelItem, PixKeyType, PaymentMethod } from '../../shared/types';
import { useAppContext } from '../../shared/context/AppContext';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  moneyToFloat, 
  quantityToFloat, 
  formatMoneyMask, 
  formatQuantityInput, 
  generateNfceAccessKey, 
  generateNfceQrCodeUrl, 
  toCurrency, 
  to3Decimals, 
  parseLocaleNumber, 
  formatCNPJ, 
  formatPhone,
  formatCEP, 
  formatPixKey
} from '../../../utils/helpers';

interface EditScreenProps {
  onGenerate: () => void;
}

const EditScreen: React.FC<EditScreenProps> = ({ onGenerate }) => {
  const { 
    postoData, setPostoData, invoiceData, setInvoiceData, 
    fuels, setFuels, prices, taxRates, setTaxRates, showToast 
  } = useAppContext();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [awaitingFirstChar, setAwaitingFirstChar] = useState<Record<string, boolean>>({});

  const isSpecialPrice = invoiceData?.formaPagamento && ['CARTAO', 'CREDITO', 'DEBITO'].includes(invoiceData.formaPagamento);

  const handlePostoChange = (field: string, value: string) => {
    setPostoData(prev => ({ ...prev, [field]: value }));
  };

  const handleInvoiceChange = (field: string, value: string) => {
    setInvoiceData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanning(true);
    showToast("IA Analisando Documento...", "info");
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        await processImageWithAI(base64Data, file.type);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      showToast("Erro ao carregar imagem", "error");
      setIsScanning(false);
    }
  };

  const processImageWithAI = async (base64Image: string, mimeType: string) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{
          parts: [
            { inlineData: { mimeType: mimeType || 'image/jpeg', data: base64Image } },
            { text: `Extraia dados de nota fiscal de combustível: posto, cnpj, endereco, produtos, totais.` }
          ]
        }],
        config: { responseMimeType: "application/json" }
      });
      showToast("Dados processados!", "success");
      
      try {
        const text = response.text;
        if(text) {
           const json = JSON.parse(text);
           // Simple mapping example - real implementation would be more robust
           if(json.posto) setPostoData(prev => ({ ...prev, ...json.posto }));
           if(json.cnpj) setPostoData(prev => ({ ...prev, cnpj: json.cnpj }));
        }
      } catch (e) {
        console.error("Error parsing AI response", e);
      }
    } catch (e) { showToast("Falha na IA", "error"); }
    finally { setIsScanning(false); }
  };

  const handleInputChange = (fuelId: string, field: 'qty' | 'total', rawValue: string) => {
    const fieldKey = `${fuelId}-${field}`;
    let valueToProcess = rawValue;
    if (awaitingFirstChar[fieldKey]) {
      const lastChar = rawValue.charAt(rawValue.length - 1);
      if (/[0-9]/.test(lastChar)) valueToProcess = lastChar;
      setAwaitingFirstChar(prev => ({ ...prev, [fieldKey]: false }));
    }
    setFuels(prev => (prev || []).map(f => f.id === fuelId ? calculateUpdate(f, field, valueToProcess) : f));
  };

  const calculateUpdate = (item: FuelItem, field: 'qty' | 'total', value: string): FuelItem => {
    const currentProduct = prices.find(p => p.id === item.productId || p.code === item.code);
    const activePriceStr = isSpecialPrice && currentProduct?.priceCard ? currentProduct.priceCard : (currentProduct?.price || item.unitPrice);
    const rawUnitPrice = parseLocaleNumber(activePriceStr);
    
    if (field === 'qty') {
      const formattedQty = formatQuantityInput(value);
      const qty = quantityToFloat(formattedQty);
      return { ...item, quantity: formattedQty, total: toCurrency(qty * rawUnitPrice) };
    }
    
    const formattedTotal = formatMoneyMask(value);
    const total = moneyToFloat(formattedTotal);
    const qty = rawUnitPrice > 0 ? total / rawUnitPrice : 0;
    return { ...item, total: formattedTotal, quantity: to3Decimals(qty) };
  };

  const handleFinalize = () => {
    if (!fuels || fuels.length === 0) {
      showToast("Adicione um produto!", "error");
      return;
    }
    const nNota = Math.floor(100000 + Math.random() * 900000).toString();
    const serieAuto = invoiceData?.serie || '001';
    const bicoAuto = Math.floor(Math.random() * 20 + 1).toString().padStart(2, '0');
    const dataEm = new Date().toLocaleString('pt-BR');
    const chave = generateNfceAccessKey({ uf: '21', cnpj: postoData.cnpj, serie: serieAuto, numero: nNota, tpEmis: '1', dataEmissao: dataEm });
    
    setInvoiceData(prev => ({ 
      ...prev, 
      bico: bicoAuto, 
      serie: serieAuto, 
      numero: nNota, 
      dataEmissao: dataEm, 
      chaveAcesso: chave, 
      protocolo: Math.floor(100000000000000 + Math.random() * 900000000000000).toString(),
      urlQrCode: generateNfceQrCodeUrl(chave),
      impostos: { ...taxRates }
    }));
    showToast("Lançamento Finalizado!", "success");
    onGenerate();
  };

  return (
    <div className="space-y-8 pb-48 animate-reveal">
      {/* SCANNER */}
      <div className="grid grid-cols-2 gap-3">
         <button onClick={() => cameraInputRef.current?.click()} className="glass-card rounded-2xl p-4 flex flex-col items-center gap-2 border-indigo-500/20 active:scale-95 transition-transform touch-manipulation">
            <Camera size={24} className="text-indigo-400" />
            <span className="text-[9px] font-black text-white uppercase tracking-widest">Scanner Câmera</span>
         </button>
         <button onClick={() => fileInputRef.current?.click()} className="glass-card rounded-2xl p-4 flex flex-col items-center gap-2 border-purple-500/20 active:scale-95 transition-transform touch-manipulation">
            <ImageIcon size={24} className="text-purple-400" />
            <span className="text-[9px] font-black text-white uppercase tracking-widest">Scanner Galeria</span>
         </button>
         <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileUpload} />
         <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
      </div>

      {/* ESTABELECIMENTO */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-2"><Building2 size={14} className="text-indigo-500" /><h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Estabelecimento</h4></div>
        <div className="glass-card rounded-[2.5rem] p-6 space-y-4 border border-white/5">
           <div>
              <label className="text-[8px] font-black text-slate-500 uppercase block mb-1.5 ml-1">Razão Social</label>
              <input className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-base font-bold text-white outline-none focus:border-indigo-500/50" value={postoData.razaoSocial} onChange={e => handlePostoChange('razaoSocial', e.target.value.toUpperCase())} placeholder="NOME DO POSTO" />
           </div>
           
           <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[8px] font-black text-slate-500 uppercase block mb-1.5 ml-1">CNPJ</label>
                <input className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-base font-bold text-white outline-none" value={postoData.cnpj} onChange={e => handlePostoChange('cnpj', formatCNPJ(e.target.value))} placeholder="00.000.000/0000-00" inputMode="numeric" />
              </div>
              <div>
                <label className="text-[8px] font-black text-slate-500 uppercase block mb-1.5 ml-1">Insc. Estadual</label>
                <input className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-base font-bold text-white outline-none" value={postoData.inscEstadual} onChange={e => handlePostoChange('inscEstadual', e.target.value)} placeholder="ISENTO" inputMode="numeric" />
              </div>
           </div>

           <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[8px] font-black text-slate-500 uppercase block mb-1.5 ml-1">CEP</label>
                <input className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-base font-bold text-white outline-none" value={postoData.cep || ''} onChange={e => handlePostoChange('cep', formatCEP(e.target.value))} placeholder="00000-000" inputMode="numeric" />
              </div>
              <div>
                <label className="text-[8px] font-black text-slate-500 uppercase block mb-1.5 ml-1">Telefone</label>
                <input className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-base font-bold text-white outline-none" value={postoData.fone} onChange={e => handlePostoChange('fone', formatPhone(e.target.value))} placeholder="(00) 00000-0000" inputMode="tel" />
              </div>
           </div>

           <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[8px] font-black text-slate-500 uppercase block mb-1.5 ml-1">Tipo Pix</label>
                <select className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-base font-bold text-white outline-none" value={postoData.tipoChavePix || 'CNPJ'} onChange={e => handlePostoChange('tipoChavePix', e.target.value as PixKeyType)}>
                   <option value="CNPJ" className="bg-slate-900">CNPJ</option>
                   <option value="CPF" className="bg-slate-900">CPF</option>
                   <option value="EMAIL" className="bg-slate-900">E-MAIL</option>
                   <option value="TELEFONE" className="bg-slate-900">TELEFONE</option>
                   <option value="ALEATORIA" className="bg-slate-900">ALEATÓRIA</option>
                </select>
              </div>
              <div>
                <label className="text-[8px] font-black text-slate-500 uppercase block mb-1.5 ml-1">Chave Pix</label>
                <input className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-base font-bold text-white outline-none" value={postoData.chavePix || ''} onChange={e => handlePostoChange('chavePix', formatPixKey(e.target.value, postoData.tipoChavePix || 'CNPJ'))} placeholder="CHAVE PIX" />
              </div>
           </div>

           <div>
              <label className="text-[8px] font-black text-slate-500 uppercase block mb-1.5 ml-1">Endereço Completo</label>
              <textarea className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-base font-bold text-white outline-none focus:border-indigo-500/50 min-h-[80px]" value={postoData.endereco} onChange={e => handlePostoChange('endereco', e.target.value.toUpperCase())} placeholder="RUA, NÚMERO, BAIRRO, CIDADE-UF" />
           </div>
        </div>
      </section>

      {/* IDENTIFICAÇÃO */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          <User size={14} className="text-indigo-500" />
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Identificação</h4>
        </div>
        <div className="glass-card rounded-[2.5rem] p-6 border border-white/5 space-y-4">
           <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[8px] font-black text-slate-500 uppercase block mb-1.5 ml-1">Placa</label>
                <input 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-base font-bold text-white outline-none focus:border-indigo-500/50 uppercase" 
                  value={invoiceData.placa || ''} 
                  onChange={e => handleInvoiceChange('placa', e.target.value.toUpperCase())} 
                  placeholder="ABC-1234" 
                />
              </div>
              <div>
                <label className="text-[8px] font-black text-slate-500 uppercase block mb-1.5 ml-1">KM Atual</label>
                <input 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-base font-bold text-white outline-none focus:border-indigo-500/50" 
                  value={invoiceData.km || ''} 
                  onChange={e => handleInvoiceChange('km', e.target.value)} 
                  placeholder="0" 
                  inputMode="numeric" 
                />
              </div>
           </div>
           
           <div>
              <label className="text-[8px] font-black text-slate-500 uppercase block mb-1.5 ml-1">Motorista</label>
              <input 
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-base font-bold text-white outline-none focus:border-indigo-500/50 uppercase" 
                value={invoiceData.motorista || ''} 
                onChange={e => handleInvoiceChange('motorista', e.target.value.toUpperCase())} 
                placeholder="NOME DO MOTORISTA" 
              />
           </div>

           <div>
              <label className="text-[8px] font-black text-slate-500 uppercase block mb-1.5 ml-1">Operador (Frentista)</label>
              <input 
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-base font-bold text-white outline-none focus:border-indigo-500/50 uppercase" 
                value={invoiceData.operador || ''} 
                onChange={e => handleInvoiceChange('operador', e.target.value.toUpperCase())} 
                placeholder="NOME DO FRENTISTA" 
              />
           </div>
        </div>
      </section>

      {/* DADOS DE EMISSÃO */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-2"><Lock size={14} className="text-indigo-500" /><h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Dados de Emissão (Automáticos)</h4></div>
        <div className="glass-card rounded-[2rem] p-6 border border-white/5 grid grid-cols-2 gap-4">
           <div className="space-y-1">
              <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Número</span>
              <div className="bg-white/5 p-3 rounded-xl text-xs font-bold text-indigo-300">{invoiceData.numero || '---'}</div>
           </div>
           <div className="space-y-1">
              <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Série</span>
              <div className="bg-white/5 p-3 rounded-xl text-xs font-bold text-indigo-300">{invoiceData.serie || '001'}</div>
           </div>
           <div className="space-y-1">
              <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Bico Bomba</span>
              <div className="bg-white/5 p-3 rounded-xl text-xs font-bold text-indigo-300">{invoiceData.bico || '---'}</div>
           </div>
           <div className="space-y-1">
              <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Protocolo</span>
              <div className="bg-white/5 p-3 rounded-xl text-xs font-bold text-indigo-300 truncate">{invoiceData.protocolo || 'PENDENTE'}</div>
           </div>
           <div className="col-span-2 space-y-1">
              <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Data de Emissão</span>
              <div className="bg-white/5 p-3 rounded-xl text-xs font-bold text-indigo-300">{invoiceData.dataEmissao || 'GERADA NA FINALIZAÇÃO'}</div>
           </div>
        </div>
      </section>

      {/* LANÇAMENTO DE PRODUTOS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
           <div className="flex items-center gap-2"><PlusCircle size={14} className="text-indigo-500" /><h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Lançamento de Itens</h4></div>
           <button onClick={() => setFuels(prev => [...(prev || []), { id: Date.now().toString(), code: '', name: 'NOVO ITEM', quantity: '0,000', unit: 'L', unitPrice: '0,00', total: '0,00' }])} className="text-[9px] font-black text-indigo-500 uppercase tracking-widest py-2 px-3 bg-indigo-500/10 rounded-xl active:bg-indigo-500/20 transition-colors">+ Item</button>
        </div>
        {(fuels || []).map((fuel) => {
           // Encontrar o preço unitário do produto selecionado no catálogo
           const catalogItem = prices.find(p => p.id === fuel.productId || p.code === fuel.code);
           const currentUnitPrice = isSpecialPrice && catalogItem?.priceCard ? catalogItem.priceCard : (catalogItem?.price || fuel.unitPrice);

           return (
              <div key={fuel.id} className="glass-card rounded-3xl p-6 border border-white/5 space-y-4">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                       <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400"><Tag size={16} /></div>
                       <select 
                         className="bg-transparent text-sm font-black text-white outline-none w-full uppercase"
                         value={fuel.productId || ''}
                         onChange={(e) => {
                           const selected = prices.find(p => p.id === e.target.value);
                           if (selected) {
                             setFuels(prev => prev.map(f => f.id === fuel.id ? { 
                               ...f, 
                               productId: selected.id, 
                               code: selected.code, 
                               name: selected.name,
                               unitPrice: selected.price,
                               unitPriceCard: selected.priceCard,
                               total: '0,00',
                               quantity: '0,000'
                             } : f));
                           }
                         }}
                       >
                         <option value="" className="bg-slate-900">Selecione o Produto...</option>
                         {prices.map(p => <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>)}
                       </select>
                    </div>
                    <button onClick={() => setFuels(prev => prev.filter(f => f.id !== fuel.id))} className="text-rose-500/30 p-2 hover:text-rose-500 transition-colors"><Trash2 size={20} /></button>
                 </div>
                 
                 <div className="grid grid-cols-3 gap-3">
                    {/* CAMPO NÃO EDITÁVEL - VALOR UNITÁRIO */}
                    <div className="space-y-1.5">
                       <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest block ml-1">V. Unitário</span>
                       <div className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs font-black text-indigo-400 text-center truncate">
                          R$ {currentUnitPrice}
                       </div>
                    </div>

                    <div className="space-y-1.5">
                       <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest block ml-1">Quantidade</span>
                       <input 
                         className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-base font-black text-white text-center outline-none focus:border-indigo-500 transition-colors" 
                         value={fuel.quantity} 
                         onFocus={() => setAwaitingFirstChar(prev => ({ ...prev, [`${fuel.id}-qty`]: true }))} 
                         onChange={(e) => handleInputChange(fuel.id, 'qty', e.target.value)} 
                         placeholder="0,000" 
                         inputMode="decimal" 
                       />
                    </div>

                    <div className="space-y-1.5">
                       <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest block ml-1">V. Total R$</span>
                       <input 
                         className="w-full bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 text-base font-black text-emerald-400 text-center outline-none focus:border-emerald-500 transition-colors" 
                         value={fuel.total} 
                         onFocus={() => setAwaitingFirstChar(prev => ({ ...prev, [`${fuel.id}-total`]: true }))} 
                         onChange={(e) => handleInputChange(fuel.id, 'total', e.target.value)} 
                         placeholder="0,00" 
                         inputMode="decimal" 
                       />
                    </div>
                 </div>
              </div>
           );
        })}
      </section>

      <div className="fixed bottom-28 left-6 right-6 z-30 pb-safe">
        <button onClick={handleFinalize} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 py-6 rounded-[2.5rem] text-white font-black text-sm shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all touch-manipulation">
          <Sparkles size={20} className="animate-pulse" /> FINALIZAR E GERAR NOTA
        </button>
      </div>
    </div>
  );
};

export default EditScreen;
