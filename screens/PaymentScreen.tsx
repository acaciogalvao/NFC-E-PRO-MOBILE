
import React, { useMemo, useState } from 'react';
import { PaymentMethod } from '../components/shared/types';
import { CreditCard, Banknote, CheckCircle, Loader2, Wifi, QrCode as QrIcon, Copy, Check } from 'lucide-react';
import { useAppContext } from '../components/shared/context/AppContext';
import { parseLocaleNumber, generatePixPayload } from '../utils/helpers';

const PaymentScreen: React.FC<{ onConfirm: () => void }> = ({ onConfirm }) => {
  const { fuels, invoiceData, setInvoiceData, postoData, showToast } = useAppContext();
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  
  if (!invoiceData || !postoData) {
    return <div className="p-10 text-center text-slate-500 font-bold uppercase text-xs">Carregando gateway...</div>;
  }

  const handleMethodChange = (method: PaymentMethod) => {
    setInvoiceData(prev => ({ ...prev, formaPagamento: method }));
    setPaymentSuccess(false);
  };

  const totalLiquido = useMemo(() => {
    if (!fuels) return 0;
    return fuels.reduce((acc, fuel) => acc + parseLocaleNumber(fuel.total), 0);
  }, [fuels]);

  const pixPayload = useMemo(() => {
    if (invoiceData.formaPagamento === 'PIX' && postoData.chavePix) {
      const addressParts = (postoData.endereco || '').split(',');
      let city = 'IMPERATRIZ';
      
      if (addressParts.length > 1) {
        const lastPart = addressParts[addressParts.length - 1];
        if (lastPart.includes('-')) {
          city = lastPart.split('-')[0].trim();
        } else {
          city = lastPart.trim();
        }
      }

      if (!city || city.length < 2) city = 'IMPERATRIZ';
      
      return generatePixPayload(
        postoData.chavePix, 
        postoData.razaoSocial, 
        city, 
        totalLiquido, 
        postoData.tipoChavePix || 'CNPJ'
      );
    }
    return '';
  }, [invoiceData.formaPagamento, postoData, totalLiquido]);

  const qrCodeUrl = useMemo(() => {
    if (!pixPayload) return '';
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixPayload)}`;
  }, [pixPayload]);

  const handleCopyPix = () => {
    if (!pixPayload) return;
    navigator.clipboard.writeText(pixPayload);
    setCopied(true);
    showToast("Código Pix copiado!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const confirmAction = () => {
    setVerifyingPayment(true);
    setTimeout(() => {
      setVerifyingPayment(false);
      setPaymentSuccess(true);
      setTimeout(onConfirm, 1500);
    }, 2000);
  };

  const methods: { id: PaymentMethod; label: string; icon: any }[] = [
    { id: 'PIX', label: 'PIX', icon: QrIcon },
    { id: 'DINHEIRO', label: 'Dinheiro', icon: Banknote },
    { id: 'CREDITO', label: 'Crédito', icon: CreditCard },
    { id: 'DEBITO', label: 'Débito', icon: CreditCard },
  ];

  return (
    <div className="space-y-8 animate-reveal">
      <div className="flex flex-col items-center">
         <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-3">Total a Pagar</span>
         <div className="glass-card rounded-[2.5rem] px-10 py-8 shadow-2xl border border-white/10 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <h2 className="text-5xl font-black tracking-tighter dark:text-white flex items-start gap-1">
               <span className="text-lg text-indigo-500 mt-1">R$</span>
               {totalLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
         </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {methods.map(m => {
          const Icon = m.icon;
          const active = invoiceData.formaPagamento === m.id;
          return (
            <button key={m.id} onClick={() => handleMethodChange(m.id)} className={`flex flex-col items-center justify-center p-6 rounded-[2rem] border-2 transition-all duration-300 ${active ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-lg shadow-indigo-500/20' : 'border-white/5 bg-white/5 text-slate-500'}`}>
              <Icon size={24} className={`mb-2 ${active ? 'text-indigo-400' : ''}`} />
              <span className="text-xs font-black uppercase tracking-widest">{m.label}</span>
            </button>
          );
        })}
      </div>
      <div className="glass-card rounded-[2.5rem] p-8 flex flex-col items-center space-y-6 relative overflow-hidden min-h-[350px] justify-center">
        {paymentSuccess && (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 z-50 flex flex-col items-center justify-center text-white animate-reveal">
            <CheckCircle size={80} className="mb-4 animate-float" />
            <h3 className="text-2xl font-black tracking-tight">PAGAMENTO OK!</h3>
          </div>
        )}
        {invoiceData.formaPagamento === 'PIX' ? (
           <>
              <div className="p-4 bg-white rounded-3xl shadow-2xl relative group">
                <div className={`transition-all duration-500 ${verifyingPayment ? 'opacity-20 blur-sm' : ''}`}>
                   {qrCodeUrl ? <img src={qrCodeUrl} alt="Pix QR Code" className="w-48 h-48" /> : <div className="w-48 h-48 flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-200 rounded-xl"><QrIcon size={40} className="mb-2 opacity-20" /><span className="text-[8px] font-black uppercase text-center px-4">Chave Pix não configurada</span></div>}
                </div>
                {verifyingPayment && <div className="absolute inset-0 flex items-center justify-center"><Loader2 size={48} className="text-indigo-600 animate-spin" /></div>}
              </div>
              <div className="text-center w-full">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Aguardando transferência Pix</p>
                 {pixPayload && (
                   <div className="flex flex-col gap-2">
                     <button onClick={handleCopyPix} className="flex items-center gap-2 mx-auto px-6 py-3 bg-emerald-500/10 text-emerald-500 rounded-2xl text-xs font-black uppercase tracking-widest border border-emerald-500/20 active:scale-95 transition-all">
                       {copied ? <Check size={16} /> : <Copy size={16} />}
                       {copied ? 'COPIADO!' : 'PIX COPIA E COLA'}
                     </button>
                   </div>
                 )}
              </div>
           </>
        ) : (
          <div className="flex flex-col items-center text-slate-600">
            <Banknote size={64} strokeWidth={1} className="mb-4 opacity-20" />
            <p className="text-xs font-bold uppercase tracking-widest">Aguardando {invoiceData.formaPagamento}</p>
          </div>
        )}
      </div>
      {!paymentSuccess && (
        <button 
          onClick={confirmAction} 
          disabled={verifyingPayment} 
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 py-5 rounded-[2rem] text-white font-black text-sm shadow-2xl flex items-center justify-center gap-3 tracking-[0.1em] disabled:opacity-50 transition-transform active:scale-95"
        >
          {verifyingPayment ? <Loader2 className="animate-spin" /> : <><Wifi size={20} /> CONFIRMAR RECEBIMENTO</>}
        </button>
      )}
    </div>
  );
};

export default PaymentScreen;
