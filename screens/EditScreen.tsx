import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Layout, Zap, Lock, AlertCircle, Upload, Loader2, ScanLine, FileCheck, CalendarClock, Percent, Calculator, QrCode } from 'lucide-react';
import { PostoData, InvoiceData, FuelItem, PriceItem, TaxRates, PixKeyType } from '../types';
import { GoogleGenAI } from "@google/genai";

interface EditScreenProps {
  postoData: PostoData;
  setPostoData: React.Dispatch<React.SetStateAction<PostoData>>;
  invoiceData: InvoiceData;
  setInvoiceData: React.Dispatch<React.SetStateAction<InvoiceData>>;
  fuels: FuelItem[];
  setFuels: React.Dispatch<React.SetStateAction<FuelItem[]>>;
  prices: PriceItem[]; 
  taxRates: TaxRates; // Taxas % para calculo automatico
  onGenerate: () => void;
}

const formatCNPJ = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .slice(0, 18);
};

const formatCPF = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

const formatPhone = (value: string) => {
  const v = value.replace(/\D/g, "").slice(0, 11);
  
  if (v.length > 10) {
    // Celular: (XX) XXXXX-XXXX
    return v.replace(/^(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  } 
  if (v.length > 6) {
    // Fixo ou Celular incompleto: (XX) XXXX-XXXX
    return v.replace(/^(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  }
  if (v.length > 2) {
    return v.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
  }
  return v;
};

const validateCNPJ = (cnpj: string): boolean => {
  cnpj = cnpj.replace(/[^\d]+/g, '');
  if (cnpj === '') return true; 
  if (cnpj.length !== 14) return false;
  // Basic validation logic...
  if (/^(\d)\1+$/.test(cnpj)) return false;
  return true; // Simplified for speed
};

const parseLocaleNumber = (stringNumber: string) => {
  if (!stringNumber) return 0;
  const clean = stringNumber.replace(/\./g, '').replace(',', '.');
  return parseFloat(clean);
};

const formatMoneyMask = (value: string) => {
  const numeric = value.replace(/\D/g, '');
  if (!numeric) return '';
  const floatVal = parseFloat(numeric) / 100;
  if (isNaN(floatVal)) return '';
  return floatVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatQuantityInput = (value: string) => {
  let clean = value.replace(/[^0-9,]/g, '');
  const parts = clean.split(',');
  if (parts.length > 2) {
    clean = parts[0] + ',' + parts.slice(1).join('');
  }
  const integerPart = parts[0];
  const decimalPart = parts.length > 1 ? ',' + parts[1] : '';
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
  taxRates,
  onGenerate
}) => {
  const [cnpjError, setCnpjError] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cálculos em tempo real para visualização
  const isCard = invoiceData.formaPagamento === 'CARTAO' || invoiceData.formaPagamento === 'CREDITO' || invoiceData.formaPagamento === 'DEBITO';
  const totalItems = fuels.reduce((acc, f) => {
    const q = parseLocaleNumber(f.quantity);
    let p = parseLocaleNumber(f.unitPrice);
    if (isCard && f.unitPriceCard && parseLocaleNumber(f.unitPriceCard) > 0) {
      p = parseLocaleNumber(f.unitPriceCard);
    }
    return acc + (q * p);
  }, 0);

  const calcTaxValue = (percentStr: string) => {
    const pct = parseLocaleNumber(percentStr);
    return totalItems * (pct / 100);
  };

  useEffect(() => {
    setCnpjError(!validateCNPJ(postoData.cnpj));
  }, [postoData.cnpj]);

  const handlePostoChange = (field: keyof PostoData, value: string) => {
    let finalValue = value;
    if (field === 'cnpj') {
      finalValue = formatCNPJ(value);
    }
    setPostoData({ ...postoData, [field]: finalValue });
  };

  const handlePixKeyChange = (value: string) => {
     let formatted = value;

     if (postoData.tipoChavePix === 'CNPJ') {
       formatted = formatCNPJ(value);
     } else if (postoData.tipoChavePix === 'CPF') {
       formatted = formatCPF(value);
     } else if (postoData.tipoChavePix === 'TELEFONE') {
       formatted = formatPhone(value);
     } else if (postoData.tipoChavePix === 'EMAIL') {
       // Logica E-mail: Se o valor atual (state) já termina com .com,
       // e o usuário está tentando digitar algo novo (length maior),
       // bloqueia se o novo valor não for uma "deleção" (length menor).
       const currentValue = postoData.chavePix || '';
       if (currentValue.endsWith('.com') && value.length > currentValue.length) {
         return; // Bloqueia adição
       }
       formatted = value.toLowerCase().replace(/\s/g, ''); // Remove espaços
     }
     
     setPostoData({ ...postoData, chavePix: formatted });
  };

  const addFuel = () => {
    const newId = (Math.max(...fuels.map(f => parseInt(f.id) || 0), 0) + 1).toString();
    const defaultPrice = prices.length > 0 ? prices[0] : null;
    
    setFuels([...fuels, { 
      id: newId, 
      productId: defaultPrice ? defaultPrice.id : undefined, 
      code: defaultPrice ? defaultPrice.code : '', 
      name: defaultPrice ? defaultPrice.name : 'SELECIONE O PRODUTO', 
      quantity: '', 
      unitPrice: defaultPrice ? defaultPrice.price : '', 
      unitPriceCard: defaultPrice ? defaultPrice.priceCard : '',
      unit: defaultPrice ? defaultPrice.unit : 'L',
      total: ''
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
      productId: selectedPrice.id, 
      name: selectedPrice.name,
      unitPrice: selectedPrice.price,
      unitPriceCard: selectedPrice.priceCard, 
      unit: selectedPrice.unit,
      code: selectedPrice.code, 
      quantity: '', 
      total: ''
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
    const totalVal = parseLocaleNumber(formattedTotal);
    setFuels(fuels.map(f => {
      if (f.id === id) {
        const priceVal = parseLocaleNumber(f.unitPrice);
        if (priceVal === 0) return { ...f, total: formattedTotal }; 
        const newQtyVal = totalVal / priceVal;
        const qtyCeiled = Math.ceil(newQtyVal * 1000) / 1000;
        const newQtyStr = qtyCeiled.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
        return { ...f, quantity: newQtyStr, total: formattedTotal }; 
      }
      return f;
    }));
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // 1. Convert to Base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          const cleanBase64 = base64String.split(',')[1];
          resolve(cleanBase64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // 2. Call Gemini API
      if (!process.env.API_KEY) {
        throw new Error("API_KEY não configurada. Configure process.env.API_KEY para usar o OCR.");
      }

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        Analise a imagem deste comprovante fiscal (NFC-e) e extraia os dados em formato JSON.
        
        INSTRUÇÃO PARA IMPOSTOS:
        1. Localize os valores aproximados de tributos (Federal, Estadual, Municipal).
        2. Tente identificar a PORCENTAGEM (%). Se a nota mostrar apenas o valor em R$, tente estimar a porcentagem baseada no total da nota.
        3. Priorize retornar a PORCENTAGEM nos campos de impostos.
        
        Estrutura JSON esperada:
        {
          "posto": {
            "razaoSocial": "string",
            "cnpj": "string",
            "inscEstadual": "string",
            "endereco": "string"
          },
          "invoice": {
            "numero": "string",
            "serie": "string",
            "dataEmissao": "string",
            "chaveAcesso": "string",
            "protocolo": "string"
          },
          "impostos": {
             "federal": "string (ex: 13,45)",
             "estadual": "string (ex: 18,00)",
             "municipal": "string (ex: 0,00)"
          },
          "items": [
            {
              "code": "string",
              "name": "string",
              "quantity": "number",
              "unit": "string",
              "unitPrice": "number",
              "total": "number"
            }
          ]
        }
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            { inlineData: { mimeType: file.type, data: base64Data } },
            { text: prompt }
          ]
        },
        config: {
          responseMimeType: "application/json"
        }
      });

      const jsonText = response.text;
      const data = JSON.parse(jsonText);

      // 3. Map to App State
      if (data.posto) {
        setPostoData(prev => ({
          ...prev,
          razaoSocial: data.posto.razaoSocial || prev.razaoSocial,
          cnpj: formatCNPJ(data.posto.cnpj || ''),
          inscEstadual: data.posto.inscEstadual || prev.inscEstadual,
          endereco: data.posto.endereco || prev.endereco
        }));
      }

      if (data.invoice) {
        setInvoiceData(prev => ({
          ...prev,
          numero: data.invoice.numero || prev.numero,
          serie: data.invoice.serie || prev.serie,
          dataEmissao: data.invoice.dataEmissao || prev.dataEmissao,
          chaveAcesso: data.invoice.chaveAcesso || prev.chaveAcesso,
          protocolo: data.invoice.protocolo || prev.protocolo,
        }));
      }
      
      if (data.impostos) {
         setInvoiceData(prev => ({
           ...prev,
           impostos: {
             federal: data.impostos.federal || prev.impostos.federal,
             estadual: data.impostos.estadual || prev.impostos.estadual,
             municipal: data.impostos.municipal || prev.impostos.municipal,
           }
         }));
      }

      if (data.items && Array.isArray(data.items)) {
        const newFuels: FuelItem[] = data.items.map((item: any, index: number) => ({
          id: (Date.now() + index).toString(),
          code: item.code || '000',
          name: item.name || 'PRODUTO',
          unit: item.unit || 'L',
          quantity: item.quantity ? item.quantity.toLocaleString('pt-BR', { minimumFractionDigits: 3 }) : '0,000',
          unitPrice: item.unitPrice ? item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 3 }) : '0,000',
          total: item.total ? item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00',
          productId: undefined 
        }));
        setFuels(newFuels);
      }

      alert("Dados extraídos com sucesso!");

    } catch (error) {
      console.error(error);
      alert("Erro ao ler comprovante: " + (error instanceof Error ? error.message : "Erro desconhecido"));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Load Action */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-100">Editar Dados</h2>
        <Layout size={20} className="text-slate-400" />
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        accept="image/*" 
        className="hidden" 
      />

      <button 
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className={`w-full p-4 rounded-xl shadow-md border-2 border-dashed flex items-center justify-center gap-3 transition-all
          ${isUploading 
            ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-700 text-slate-400 cursor-wait' 
            : 'bg-blue-50 dark:bg-slate-800 border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-slate-700 hover:border-blue-300'
          }`}
      >
        {isUploading ? (
          <>
            <Loader2 size={24} className="animate-spin" />
            <span className="font-bold">Lendo Comprovante com IA...</span>
          </>
        ) : (
          <>
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <ScanLine size={24} />
            </div>
            <div className="text-left">
              <span className="block font-bold text-sm uppercase">Preencher via Upload</span>
              <span className="block text-xs text-blue-600/70 dark:text-blue-400/70">Reconhece valores automaticamente</span>
            </div>
            <Upload size={20} className="ml-auto text-blue-400" />
          </>
        )}
      </button>

      {/* Dados do Posto */}
      <div className="space-y-3">
        <h3 className="text-blue-600 dark:text-blue-400 font-semibold text-sm uppercase tracking-wider border-b border-blue-100 dark:border-slate-700 pb-1">Dados do Posto</h3>
        <div className="space-y-3">
          
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Razão Social</label>
            <input 
              className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded p-3 text-slate-700 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={postoData.razaoSocial}
              onChange={e => handlePostoChange('razaoSocial', e.target.value)}
              placeholder="Digite a Razão Social"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase flex justify-between">
              CNPJ (Fiscal)
              {cnpjError && <span className="text-red-500 dark:text-red-400 flex items-center gap-1 normal-case"><AlertCircle size={10} /> Inválido</span>}
            </label>
            <input 
              className={`w-full border rounded p-3 text-slate-700 dark:text-slate-100 bg-white dark:bg-slate-700 outline-none transition-all ${cnpjError ? 'border-red-500 bg-red-50 dark:bg-red-900/20 focus:ring-red-200' : 'border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500'}`}
              value={postoData.cnpj}
              onChange={e => handlePostoChange('cnpj', e.target.value)}
              placeholder="00.000.000/0000-00"
              maxLength={18}
            />
          </div>

          {/* CONFIGURAÇÃO CHAVE PIX */}
          <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
             <div className="flex justify-between items-center mb-2">
               <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1">
                 <QrCode size={12} /> Chave Pix
               </label>
             </div>
             <div className="flex gap-2 mb-2">
               <select 
                 className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-xs font-bold text-slate-700 dark:text-slate-200 px-2 h-10 outline-none focus:border-blue-500"
                 value={postoData.tipoChavePix || 'CNPJ'}
                 onChange={(e) => setPostoData({...postoData, tipoChavePix: e.target.value as PixKeyType, chavePix: ''})}
               >
                 <option value="CNPJ">CNPJ</option>
                 <option value="CPF">CPF</option>
                 <option value="TELEFONE">CELULAR</option>
                 <option value="EMAIL">E-MAIL</option>
                 <option value="ALEATORIA">ALEATÓRIA</option>
               </select>
               <input 
                 className="flex-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded px-3 h-10 text-sm text-slate-700 dark:text-slate-100 outline-none focus:border-blue-500 transition-all font-mono"
                 value={postoData.chavePix || ''}
                 onChange={(e) => handlePixKeyChange(e.target.value)}
                 placeholder={
                    postoData.tipoChavePix === 'CNPJ' ? '00.000.000/0000-00' :
                    postoData.tipoChavePix === 'CPF' ? '000.000.000-00' :
                    postoData.tipoChavePix === 'TELEFONE' ? '(99) 99999-9999' :
                    postoData.tipoChavePix === 'EMAIL' ? 'exemplo@email.com' :
                    'Chave Aleatória'
                 }
               />
             </div>
             <p className="text-[10px] text-slate-400">Esta chave será usada para gerar o QR Code de pagamento.</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Insc. Estadual</label>
            <input 
              className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded p-3 text-slate-700 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
              value={postoData.inscEstadual}
              onChange={e => handlePostoChange('inscEstadual', e.target.value)}
              placeholder="Inscrição Estadual"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Endereço Completo</label>
            <textarea 
              className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded p-3 text-slate-700 dark:text-slate-100 h-28 resize-none font-mono text-sm leading-tight focus:ring-2 focus:ring-blue-500 outline-none"
              value={postoData.endereco}
              onChange={e => handlePostoChange('endereco', e.target.value)}
              placeholder="Rua Exemplo, 123&#10;Bairro Centro&#10;Cidade - UF"
            />
          </div>
        </div>
      </div>

      {/* Combustíveis */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-blue-100 dark:border-slate-700 pb-1">
           <h3 className="text-blue-600 dark:text-blue-400 font-semibold text-sm uppercase tracking-wider flex items-center gap-1">
             <Zap size={14} />
             Combustíveis
           </h3>
           <button onClick={addFuel} className="bg-green-500 hover:bg-green-600 text-white rounded-full p-1 shadow-md transition-colors">
             <Plus size={20} />
           </button>
        </div>
        
        {fuels.length === 0 && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800 text-slate-400 text-center rounded border border-slate-200 dark:border-slate-700 text-sm">
            Nenhum combustível. Clique no botão verde (+) ou faça upload da nota.
          </div>
        )}
        
        {fuels.map((fuel, index) => (
          <div key={fuel.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-700 px-4 py-2 border-b border-slate-200 dark:border-slate-600 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-300">BICO #{index + 1}</span>
              <button onClick={() => removeFuel(fuel.id)} className="text-red-400 hover:text-red-600">
                <Trash2 size={16} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 dark:text-slate-500 mb-1 block">PRODUTO</label>
                {prices.length > 0 ? (
                  <select 
                    className="w-full h-10 border border-slate-300 dark:border-slate-600 rounded px-2 text-slate-700 dark:text-slate-100 bg-white dark:bg-slate-700 font-bold text-sm focus:border-blue-500 outline-none"
                    value={prices.find(p => p.name === fuel.name)?.id || ''}
                    onChange={e => handleFuelProductChange(fuel.id, e.target.value)}
                  >
                    <option value="" disabled>Selecione um produto</option>
                    {prices.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="text-xs text-slate-500 dark:text-slate-400 p-2 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded">
                    {fuel.name} (Importado)
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                   <label className="text-xs font-semibold text-slate-400 dark:text-slate-500 mb-1 block">CÓD</label>
                   <input 
                     className="w-full h-10 border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700/50 rounded px-2 text-center text-slate-500 dark:text-slate-400 font-mono text-sm cursor-not-allowed outline-none"
                     value={fuel.code}
                     readOnly
                     placeholder="000"
                   />
                </div>
                <div>
                   <label className="text-xs font-semibold text-slate-400 dark:text-slate-500 mb-1 block">QTD ({fuel.unit})</label>
                   <input 
                     className="w-full h-10 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 rounded px-2 text-center text-slate-700 dark:text-slate-100 font-bold text-lg focus:border-blue-500 outline-none placeholder:font-normal placeholder:text-slate-300 dark:placeholder:text-slate-600"
                     value={fuel.quantity}
                     onChange={e => handleQuantityChange(fuel.id, e.target.value)}
                     inputMode="decimal"
                     placeholder="000"
                   />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                   <label className="text-xs font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1 mb-1">
                     <Lock size={10} /> R$/{fuel.unit} (FIXO)
                   </label>
                   <div className="relative">
                     <input 
                       className="w-full h-10 border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700/50 rounded px-2 text-center font-bold text-slate-500 dark:text-slate-400 cursor-not-allowed outline-none"
                       value={fuel.unitPrice}
                       readOnly
                       placeholder="0,00"
                     />
                   </div>
                </div>
                <div>
                   <label className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1 block">TOTAL (R$)</label>
                   <input 
                     className="w-full h-10 border-2 border-blue-100 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-900/20 rounded px-2 text-center text-blue-700 dark:text-blue-400 font-bold text-lg focus:border-blue-400 outline-none transition-colors placeholder:font-normal placeholder:text-slate-300 dark:placeholder:text-slate-600"
                     value={fuel.total}
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

      {/* Impostos - SOMENTE LEITURA */}
      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-slate-500 dark:text-slate-400 font-semibold text-sm uppercase flex items-center gap-1">
            <Percent size={14} /> ALÍQUOTAS (%)
          </h3>
          <span className="text-[10px] text-slate-400 flex items-center gap-1"><Lock size={8}/> Fixo</span>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase">
              Federal (%)
            </label>
            <input 
              readOnly
              className="w-full border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700/50 rounded p-2 text-center text-slate-500 dark:text-slate-400 font-bold outline-none cursor-not-allowed"
              value={invoiceData.impostos.federal}
              placeholder="0,00"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase">
              Estadual (%)
            </label>
            <input 
              readOnly
              className="w-full border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700/50 rounded p-2 text-center text-slate-500 dark:text-slate-400 font-bold outline-none cursor-not-allowed"
              value={invoiceData.impostos.estadual}
              placeholder="0,00"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase">
              Munic. (%)
            </label>
            <input 
              readOnly
              className="w-full border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700/50 rounded p-2 text-center text-slate-500 dark:text-slate-400 font-bold outline-none cursor-not-allowed"
              value={invoiceData.impostos.municipal}
              placeholder="0,00"
            />
          </div>
        </div>

        {/* Visualização do Cálculo R$ */}
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
           <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase flex items-center gap-1 mb-2">
             <Calculator size={10} /> Simulação do Cálculo (R$)
           </h4>
           <div className="grid grid-cols-3 gap-3 text-center">
             <div>
                <span className="text-[10px] block text-slate-400">Federal</span>
                <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                  R$ {calcTaxValue(invoiceData.impostos.federal).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
             </div>
             <div>
                <span className="text-[10px] block text-slate-400">Estadual</span>
                <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                  R$ {calcTaxValue(invoiceData.impostos.estadual).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
             </div>
             <div>
                <span className="text-[10px] block text-slate-400">Municipal</span>
                <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                  R$ {calcTaxValue(invoiceData.impostos.municipal).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
             </div>
           </div>
        </div>
      </div>

      {/* Emissão & Fiscal */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-blue-100 dark:border-slate-700 pb-1">
           <h3 className="text-blue-600 dark:text-blue-400 font-semibold text-sm uppercase tracking-wider flex items-center gap-1">
             <Zap size={14} className="rotate-180" />
             Emissão & Fiscal
           </h3>
           <button 
             onClick={onGenerate}
             className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded shadow-md transition-colors flex items-center gap-1 font-bold"
           >
             <Zap size={14} fill="currentColor" /> Gerar NFC-e
           </button>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 space-y-3">
           <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Dados da Operação</h4>
           <div className="grid grid-cols-2 gap-3">
             <input placeholder="PLACA" className="border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-100 p-2 rounded text-sm placeholder:text-xs" value={invoiceData.placa} onChange={e => setInvoiceData({...invoiceData, placa: e.target.value})} />
             <input placeholder="KM" className="border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-100 p-2 rounded text-sm placeholder:text-xs" value={invoiceData.km} onChange={e => setInvoiceData({...invoiceData, km: e.target.value})} />
             <input placeholder="OPERADOR" className="border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-100 p-2 rounded text-sm placeholder:text-xs" value={invoiceData.operador} onChange={e => setInvoiceData({...invoiceData, operador: e.target.value})} />
             <input placeholder="MOTORISTA" className="border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-100 p-2 rounded text-sm placeholder:text-xs" value={invoiceData.motorista} onChange={e => setInvoiceData({...invoiceData, motorista: e.target.value})} />
           </div>
        </div>

        {/* Dados Fiscais Automáticos (Read Only) */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 space-y-3">
           <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1">
              <FileCheck size={14} /> Detalhes da Nota (Auto)
           </h4>
           
           <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 dark:text-slate-500 block mb-1">Número</label>
                <input 
                  readOnly 
                  className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded p-2 text-xs text-slate-500 dark:text-slate-400 cursor-not-allowed"
                  value={invoiceData.numero} 
                  placeholder="---"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 dark:text-slate-500 block mb-1">Série</label>
                <input 
                  readOnly 
                  className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded p-2 text-xs text-slate-500 dark:text-slate-400 cursor-not-allowed"
                  value={invoiceData.serie} 
                  placeholder="---"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 dark:text-slate-500 block mb-1">Emissão</label>
                <input 
                  readOnly 
                  className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded p-2 text-[10px] text-slate-500 dark:text-slate-400 cursor-not-allowed"
                  value={invoiceData.dataEmissao ? invoiceData.dataEmissao.split(' ')[0] : '---'} 
                  placeholder="DD/MM/YYYY"
                />
              </div>
           </div>
           
           {/* Campo Data e Hora Completa Não Editável */}
           <div>
              <label className="text-[10px] text-slate-400 dark:text-slate-500 mb-1 flex items-center gap-1">
                <CalendarClock size={10} /> Data e Hora de Emissão
              </label>
              <input 
                readOnly 
                className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded p-2 text-xs text-slate-500 dark:text-slate-400 cursor-not-allowed font-mono"
                value={invoiceData.dataEmissao} 
                placeholder="Gerado automaticamente..."
              />
           </div>

           <div>
              <label className="text-[10px] text-slate-400 dark:text-slate-500 block mb-1">Protocolo Autorização</label>
              <input 
                readOnly 
                className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded p-2 text-xs text-slate-500 dark:text-slate-400 cursor-not-allowed font-mono"
                value={invoiceData.protocolo} 
                placeholder="Gerado automaticamente..."
              />
           </div>

           <div>
              <label className="text-[10px] text-slate-400 dark:text-slate-500 block mb-1">Chave de Acesso</label>
              <textarea 
                readOnly 
                className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded p-2 text-[10px] text-slate-500 dark:text-slate-400 cursor-not-allowed font-mono h-14 resize-none leading-tight"
                value={invoiceData.chaveAcesso} 
                placeholder="Gerada automaticamente ao clicar em Gerar NFC-e..."
              />
           </div>

           <div>
              <label className="text-[10px] text-slate-400 dark:text-slate-500 block mb-1">URL Consulta QR Code</label>
              <input 
                readOnly 
                className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded p-2 text-[10px] text-slate-500 dark:text-slate-400 cursor-not-allowed font-mono truncate"
                value={invoiceData.urlQrCode} 
                placeholder="http://..."
              />
           </div>
        </div>
      </div>
    </div>
  );
};

export default EditScreen;