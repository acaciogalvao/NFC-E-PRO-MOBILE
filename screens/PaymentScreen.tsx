import React from 'react';
import { FuelItem, InvoiceData, PostoData, PaymentMethod } from '../types';
import { Copy, QrCode, CreditCard, Banknote, DollarSign } from 'lucide-react';

interface PaymentScreenProps {
  fuels: FuelItem[];
  postoData: PostoData;
  invoiceData: InvoiceData;
  setInvoiceData: (data: InvoiceData) => void;
}

const PaymentScreen: React.FC<PaymentScreenProps> = ({ fuels, postoData, invoiceData, setInvoiceData }) => {
  
  const handleMethodChange = (method: PaymentMethod) => {
    setInvoiceData({ ...invoiceData, formaPagamento: method });
  };

  const calculateTotal = () => {
    const isCard = invoiceData.formaPagamento === 'CARTAO' || invoiceData.formaPagamento === 'CREDITO' || invoiceData.formaPagamento === 'DEBITO';

    const rawTotal = fuels.reduce((acc, fuel) => {
      // Parse quantity
      const q = parseFloat(fuel.quantity.replace(/\./g, '').replace(',', '.')) || 0;
      
      let p = 0;
      if (isCard && fuel.unitPriceCard) {
        // Se for cartão e tiver preço cadastrado, usa ele
        p = parseFloat(fuel.unitPriceCard.replace(/\./g, '').replace(',', '.')) || 0;
      } else {
        // Senão usa preço a vista
        p = parseFloat(fuel.unitPrice.replace(/\./g, '').replace(',', '.')) || 0;
      }
      
      // Se preço do cartão for 0 ou inválido, fallback para preço normal
      if (p === 0) p = parseFloat(fuel.unitPrice.replace(/\./g, '').replace(',', '.')) || 0;

      return acc + (q * p);
    }, 0);
    
    return rawTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="space-y-6 text-center">
      
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
           Valor Total a Pagar ({invoiceData.formaPagamento})
        </p>
        <h2 className="text-4xl font-extrabold text-slate-800 dark:text-white">R$ {calculateTotal()}</h2>
        {invoiceData.formaPagamento === 'CARTAO' && (
          <span className="text-[10px] text-blue-500 font-bold bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
            Preço Diferenciado Aplicado
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <button 
          onClick={() => handleMethodChange('PIX')}
          className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${invoiceData.formaPagamento === 'PIX' ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
        >
          <QrCode size={24} className="mb-2" />
          <span className="text-sm font-bold">Pix</span>
        </button>
        
        <button 
          onClick={() => handleMethodChange('CARTAO')}
          className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${invoiceData.formaPagamento === 'CARTAO' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
        >
          <CreditCard size={24} className="mb-2" />
          <span className="text-sm font-bold">Cartão</span>
        </button>
        
        <button 
          onClick={() => handleMethodChange('DINHEIRO')}
          className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${invoiceData.formaPagamento === 'DINHEIRO' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
        >
          <Banknote size={24} className="mb-2" />
          <span className="text-sm font-bold">Dinheiro</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center space-y-6">
        <div className="relative p-2 border-2 border-slate-900 dark:border-white rounded-lg">
           {/* Abstract QR Code using CSS Grid for visual effect */}
           <div className="w-48 h-48 bg-white grid grid-cols-12 grid-rows-12 gap-0.5 p-1">
              {Array.from({ length: 144 }).map((_, i) => (
                <div key={i} className={`bg-black ${Math.random() > 0.5 ? 'opacity-100' : 'opacity-0'} rounded-[1px]`} />
              ))}
              {/* Corner squares */}
              <div className="absolute top-2 left-2 w-10 h-10 border-4 border-black bg-white flex items-center justify-center">
                <div className="w-4 h-4 bg-black"></div>
              </div>
              <div className="absolute top-2 right-2 w-10 h-10 border-4 border-black bg-white flex items-center justify-center">
                <div className="w-4 h-4 bg-black"></div>
              </div>
              <div className="absolute bottom-2 left-2 w-10 h-10 border-4 border-black bg-white flex items-center justify-center">
                <div className="w-4 h-4 bg-black"></div>
              </div>
           </div>
        </div>

        <div className="w-full text-left space-y-2">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Pix Copia e Cola</label>
          <div className="flex gap-2">
            <input 
              readOnly 
              value="00020101021226360014br.gov.bcb..." 
              className="flex-1 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-500 dark:text-slate-300 font-mono"
            />
            <button className="bg-slate-800 dark:bg-slate-600 text-white px-4 rounded-lg flex items-center gap-2 font-bold text-sm hover:bg-slate-700 dark:hover:bg-slate-500">
               <Copy size={16} /> Copiar
            </button>
          </div>
          <p className="text-[10px] text-slate-400 text-center pt-2">Chave: {postoData.cnpj || '---'} (CNPJ)</p>
        </div>
      </div>

    </div>
  );
};

export default PaymentScreen;