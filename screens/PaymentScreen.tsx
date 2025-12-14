import React from 'react';
import { FuelItem, PostoData } from '../types';
import { Copy, QrCode, CreditCard, Banknote } from 'lucide-react';

interface PaymentScreenProps {
  fuels: FuelItem[];
  postoData: PostoData;
}

const PaymentScreen: React.FC<PaymentScreenProps> = ({ fuels, postoData }) => {
  const calculateTotal = () => {
    return fuels.reduce((acc, fuel) => {
      const q = parseFloat(fuel.quantity.replace(',', '.')) || 0;
      const p = parseFloat(fuel.unitPrice.replace(',', '.')) || 0;
      return acc + (q * p);
    }, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="space-y-6 text-center">
      
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Valor Total a Pagar</p>
        <h2 className="text-4xl font-extrabold text-slate-800">R$ {calculateTotal()}</h2>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <button className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-green-500 bg-green-50 text-green-700 transition-all">
          <QrCode size={24} className="mb-2" />
          <span className="text-sm font-bold">Pix</span>
        </button>
        <button className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-all">
          <CreditCard size={24} className="mb-2" />
          <span className="text-sm font-bold">Cartão</span>
        </button>
        <button className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-all">
          <Banknote size={24} className="mb-2" />
          <span className="text-sm font-bold">Dinheiro</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col items-center space-y-6">
        <div className="relative p-2 border-2 border-slate-900 rounded-lg">
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
          <label className="text-xs font-bold text-slate-500 uppercase">Pix Copia e Cola</label>
          <div className="flex gap-2">
            <input 
              readOnly 
              value="00020101021226360014br.gov.bcb..." 
              className="flex-1 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-500 font-mono"
            />
            <button className="bg-slate-800 text-white px-4 rounded-lg flex items-center gap-2 font-bold text-sm hover:bg-slate-700">
               <Copy size={16} /> Copiar
            </button>
          </div>
          <p className="text-[10px] text-slate-400 text-center pt-2">Chave: {postoData.cnpj || '---'} (CNPJ)</p>
        </div>
      </div>

      <button className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-200 transition-all text-lg">
        Confirmar Pagamento
      </button>

    </div>
  );
};

export default PaymentScreen;