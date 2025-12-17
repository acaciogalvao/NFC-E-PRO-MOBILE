import React, { useMemo, useState } from 'react';
import { FuelItem, InvoiceData, PostoData, PaymentMethod, PixKeyType } from '../types';
import { Copy, QrCode, CreditCard, Banknote, AlertCircle, CheckCircle, Loader2, Wifi, Wallet } from 'lucide-react';

interface PaymentScreenProps {
  fuels: FuelItem[];
  postoData: PostoData;
  invoiceData: InvoiceData;
  setInvoiceData: (data: InvoiceData) => void;
  onConfirm: () => void;
}

// --- FUNÇÕES GERADORAS DO PIX (EMV QRCPS MPM) ---

const crc16ccitt = (payload: string): string => {
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) > 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
};

const formatField = (id: string, value: string): string => {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
};

const removeAccents = (str: string) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

const generatePixString = (key: string, type: PixKeyType | undefined, name: string, city: string, amount: string, txId: string = '***'): string => {
  if (!key) return '';

  // Tratamento de Chave baseado no TIPO
  let cleanKey = key;
  
  if (type === 'EMAIL' || type === 'ALEATORIA') {
    // E-mail e Aleatória não removem letras, apenas espaços
    cleanKey = key.trim();
    if (type === 'EMAIL') cleanKey = cleanKey.toLowerCase();
  } else if (type === 'TELEFONE') {
    // Telefone: Remove não dígitos e garante +55
    const nums = key.replace(/\D/g, '');
    if (nums.length > 0) {
      cleanKey = `+55${nums}`;
    }
  } else {
    // CPF e CNPJ: Apenas números
    cleanKey = key.replace(/\D/g, '');
  }

  if (!cleanKey) return '';

  const cleanName = removeAccents(name.substring(0, 25)).toUpperCase() || 'RECEBEDOR';
  const cleanCity = removeAccents(city.substring(0, 15)).toUpperCase() || 'CIDADE';
  
  // CORREÇÃO: Lógica para tratar valor monetário corretamente
  // Se o valor tiver vírgula, assume formato PT-BR (1.000,00) -> remove pontos, troca vírgula por ponto
  // Se não tiver vírgula, assume formato JS/US (1000.00) -> mantém como está
  let cleanAmount = '0.00';
  if (amount.includes(',')) {
     cleanAmount = parseFloat(amount.replace(/\./g, '').replace(',', '.')).toFixed(2);
  } else {
     cleanAmount = parseFloat(amount).toFixed(2);
  }

  let payload = '';

  // 00 - Payload Format Indicator
  payload += formatField('00', '01');
  
  // 26 - Merchant Account Information (GUI + Chave)
  const gui = formatField('00', 'br.gov.bcb.pix');
  const chave = formatField('01', cleanKey);
  payload += formatField('26', gui + chave);

  // 52 - Merchant Category Code
  payload += formatField('52', '0000');

  // 53 - Transaction Currency (BRL = 986)
  payload += formatField('53', '986');

  // 54 - Transaction Amount
  if (parseFloat(cleanAmount) > 0) {
    payload += formatField('54', cleanAmount);
  }

  // 58 - Country Code
  payload += formatField('58', 'BR');

  // 59 - Merchant Name
  payload += formatField('59', cleanName);

  // 60 - Merchant City
  payload += formatField('60', cleanCity);

  // 62 - Additional Data Field Template (TxID)
  const txIdField = formatField('05', txId);
  payload += formatField('62', txIdField);

  // 63 - CRC16
  payload += '6304'; // Adiciona ID e tamanho do CRC para cálculo
  const crc = crc16ccitt(payload);
  
  return payload + crc;
};

// --- COMPONENTE ---

const PaymentScreen: React.FC<PaymentScreenProps> = ({ fuels, postoData, invoiceData, setInvoiceData, onConfirm }) => {
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  const handleMethodChange = (method: PaymentMethod) => {
    setInvoiceData({ ...invoiceData, formaPagamento: method });
    setPaymentSuccess(false);
  };

  // Calcula o valor numérico total
  const rawTotalValue = useMemo(() => {
    const isCard = invoiceData.formaPagamento === 'CARTAO' || invoiceData.formaPagamento === 'CREDITO' || invoiceData.formaPagamento === 'DEBITO';
    
    return fuels.reduce((acc, fuel) => {
      const q = parseFloat(fuel.quantity.replace(/\./g, '').replace(',', '.')) || 0;
      let p = 0;
      
      if (isCard && fuel.unitPriceCard) {
        p = parseFloat(fuel.unitPriceCard.replace(/\./g, '').replace(',', '.')) || 0;
      } else {
        p = parseFloat(fuel.unitPrice.replace(/\./g, '').replace(',', '.')) || 0;
      }
      
      if (p === 0) p = parseFloat(fuel.unitPrice.replace(/\./g, '').replace(',', '.')) || 0;

      return acc + (q * p);
    }, 0);
  }, [fuels, invoiceData.formaPagamento]);

  const formattedTotal = rawTotalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formattedTotalForPix = rawTotalValue.toFixed(2); 

  // 1. Gera a string do Pix AUTOMATICAMENTE com base nos dados
  const generatedPixString = useMemo(() => {
    // Tenta extrair a cidade do endereço (quebra de linha ou vírgula)
    let city = 'CIDADE';
    if (postoData.endereco) {
        const parts = postoData.endereco.split(/[\n,-]/);
        if (parts.length > 1) {
            city = parts[parts.length - 2].trim();
        }
    }

    const keyToUse = postoData.chavePix || postoData.cnpj;
    const typeToUse = postoData.chavePix ? postoData.tipoChavePix : 'CNPJ';

    return generatePixString(
        keyToUse,
        typeToUse,
        postoData.razaoSocial, 
        city, 
        formattedTotalForPix, 
        invoiceData.numero || '***'
    );
  }, [postoData.cnpj, postoData.chavePix, postoData.tipoChavePix, postoData.razaoSocial, postoData.endereco, formattedTotalForPix, invoiceData.numero]);

  // 2. Gera o QR Code com base no que está VISÍVEL no input (seja gerado ou colado)
  const qrCodeUrl = useMemo(() => {
      if (!generatedPixString) return null;
      return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(generatedPixString)}`;
  }, [generatedPixString]);

  const handleCopyPix = () => {
    if (generatedPixString) {
      navigator.clipboard.writeText(generatedPixString);
      alert("Código Pix copiado!");
    } else {
      alert("Campo vazio ou Chave Pix não configurada.");
    }
  };

  const simulateAutomaticVerification = () => {
    if (!generatedPixString) return;
    setVerifyingPayment(true);
    
    // Simula delay de rede bancária
    setTimeout(() => {
      setVerifyingPayment(false);
      setPaymentSuccess(true);
      
      // Auto-confirma após mostrar sucesso
      setTimeout(() => {
        onConfirm();
      }, 1500);
    }, 2500);
  };

  // Lógica de visibilidade do Total: 
  // Mostra SE não for Pix OU (se for Pix E tiver QR Code)
  const shouldShowTotal = invoiceData.formaPagamento !== 'PIX' || (invoiceData.formaPagamento === 'PIX' && qrCodeUrl);
  const isCard = invoiceData.formaPagamento === 'CARTAO' || invoiceData.formaPagamento === 'CREDITO' || invoiceData.formaPagamento === 'DEBITO';

  return (
    <div className="space-y-6 text-center pb-6">
      
      {shouldShowTotal && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 animate-slide-down">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
             Valor Total a Pagar ({invoiceData.formaPagamento})
          </p>
          <h2 className="text-4xl font-extrabold text-slate-800 dark:text-white">R$ {formattedTotal}</h2>
          {isCard && (
            <span className="text-[10px] text-blue-500 font-bold bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
              Preço Diferenciado Aplicado
            </span>
          )}
        </div>
      )}

      {/* Grid de Métodos de Pagamento */}
      <div className="grid grid-cols-2 gap-3">
        {/* PIX */}
        <button 
          onClick={() => handleMethodChange('PIX')}
          className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${invoiceData.formaPagamento === 'PIX' ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
        >
          <QrCode size={24} className="mb-2" />
          <span className="text-sm font-bold">Pix</span>
        </button>
        
        {/* DINHEIRO */}
        <button 
          onClick={() => handleMethodChange('DINHEIRO')}
          className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${invoiceData.formaPagamento === 'DINHEIRO' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
        >
          <Banknote size={24} className="mb-2" />
          <span className="text-sm font-bold">Dinheiro</span>
        </button>

        {/* CRÉDITO */}
        <button 
          onClick={() => handleMethodChange('CREDITO')}
          className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${invoiceData.formaPagamento === 'CREDITO' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
        >
          <CreditCard size={24} className="mb-2" />
          <span className="text-sm font-bold">Crédito</span>
        </button>

        {/* DÉBITO */}
        <button 
          onClick={() => handleMethodChange('DEBITO')}
          className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${invoiceData.formaPagamento === 'DEBITO' ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
        >
          <Wallet size={24} className="mb-2" />
          <span className="text-sm font-bold">Débito</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center space-y-6 relative overflow-hidden">
        
        {/* Camada de Sucesso Overlay */}
        {paymentSuccess && (
          <div className="absolute inset-0 bg-green-500 z-50 flex flex-col items-center justify-center text-white animate-zoom-in">
            <CheckCircle size={64} className="mb-4" />
            <h3 className="text-2xl font-bold">Pagamento Confirmado!</h3>
            <p className="text-sm opacity-90 mt-1">Gerando nota fiscal...</p>
          </div>
        )}

        <div className="relative">
          {invoiceData.formaPagamento === 'PIX' ? (
             <div className="p-2 border-2 border-slate-900 dark:border-white rounded-lg bg-white relative">
                {qrCodeUrl ? (
                   <>
                      <img src={qrCodeUrl} alt="QR Code Pix" className={`w-48 h-48 object-contain transition-opacity ${verifyingPayment ? 'opacity-30' : 'opacity-100'}`} />
                      {verifyingPayment && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 size={48} className="text-blue-600 animate-spin" />
                        </div>
                      )}
                   </>
                ) : (
                   <div className="w-48 h-48 flex flex-col items-center justify-center text-slate-400 text-center p-4">
                     <AlertCircle size={32} className="mb-2 text-red-400" />
                     <span className="text-xs">Configure o CNPJ ou Chave Pix na tela de edição.</span>
                   </div>
                )}
             </div>
          ) : (
             <div className="w-48 h-48 bg-slate-100 dark:bg-slate-700 rounded-lg flex flex-col items-center justify-center text-slate-400">
                {isCard ? <CreditCard size={48} className="opacity-20 mb-2" /> : <Banknote size={48} className="opacity-20 mb-2" />}
                <span className="text-xs font-bold uppercase">Aguardando Pagamento</span>
                <span className="text-[10px] uppercase font-bold mt-1 text-slate-500 dark:text-slate-300 bg-slate-200 dark:bg-slate-600 px-2 py-1 rounded">
                  {invoiceData.formaPagamento}
                </span>
             </div>
          )}
        </div>

        {/* Informações da Chave */}
        {invoiceData.formaPagamento === 'PIX' && (
           <div className="text-center w-full">
              {verifyingPayment ? (
                 <div className="flex flex-col items-center text-blue-500 animate-pulse">
                    <Wifi size={24} className="mb-1" />
                    <span className="text-sm font-bold">Verificando banco...</span>
                 </div>
              ) : (
                <>
                  <button 
                    onClick={simulateAutomaticVerification}
                    className="w-full bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 py-3 rounded-lg font-bold text-sm mb-4 border border-blue-200 dark:border-blue-800 transition-colors flex items-center justify-center gap-2"
                  >
                     <Wifi size={16} /> Verificar Recebimento Agora
                  </button>
                  <p className="text-[10px] text-slate-400">
                     Chave: {postoData.chavePix || postoData.cnpj || '---'}
                  </p>
                </>
              )}
           </div>
        )}

        <div className="w-full text-left space-y-2">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Pix Copia e Cola</label>
          <div className="flex gap-2">
            <input 
              value={generatedPixString}
              readOnly
              className="flex-1 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-400 dark:text-slate-500 font-mono truncate cursor-not-allowed select-all"
            />
            <button 
              onClick={handleCopyPix}
              className="bg-slate-800 dark:bg-slate-600 text-white px-4 rounded-lg flex items-center gap-2 font-bold text-sm hover:bg-slate-700 dark:hover:bg-slate-500 active:scale-95 transition-all"
            >
               <Copy size={16} /> <span className="hidden sm:inline">Copiar</span>
            </button>
          </div>
        </div>
      </div>
      
      {!paymentSuccess && !verifyingPayment && (
        <button 
          onClick={onConfirm}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 mt-4 active:scale-95 transition-all"
        >
          <CheckCircle size={24} />
          CONFIRMAR MANUALMENTE
        </button>
      )}

    </div>
  );
};

export default PaymentScreen;