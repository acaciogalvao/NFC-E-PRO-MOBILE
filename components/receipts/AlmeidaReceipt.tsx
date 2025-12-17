
import React from 'react';
import { LayoutConfig } from '../../types';
import { toCurrency, to3Decimals } from '../../utils/formatters';

interface ReceiptProps {
  data: any;
  layout: LayoutConfig;
  width: '58mm' | '80mm';
}

const AlmeidaReceipt: React.FC<ReceiptProps> = ({ data, layout, width }) => {
  const { posto, invoice, calculations } = data;
  const { rawTotal, activeFuels, qrCodeImageUrl, paymentMethodLabel } = calculations;
  
  const fontSize = width === '58mm' ? 'text-[9px]' : 'text-[10px]';

  return (
    <div style={{ maxWidth: width, minWidth: width }} className="bg-white text-black p-4 font-mono leading-tight text-center uppercase border border-black">
       <div className="font-bold text-[11px] mb-1">{posto.razaoSocial}</div>
       <div className={`${fontSize} mb-1 opacity-90`}>
          CNPJ: {posto.cnpj} IE: {posto.inscEstadual}<br/>{posto.endereco}
       </div>
       
       <div className="border-b border-black border-dashed my-2"></div>
       
       <div className={`${fontSize} font-bold mb-1 whitespace-nowrap overflow-visible`}>{layout.customTexts.headerTitle}</div>
       <div className={`${fontSize} mb-1 font-bold whitespace-nowrap text-red-600`}>{layout.customTexts.subHeader}</div>

       <div className="border-b border-black border-dashed my-2"></div>

       <div className="w-full text-left mb-1 px-1">
          <div className={`flex font-bold mb-1 ${fontSize} border-b border-black/5 pb-1`}>
             <span className="w-10">COD</span>
             <span className="flex-1">DESCRIÇÃO</span>
             <span className="w-16 text-right">VL TOT</span>
          </div>
          {activeFuels.map((item: any, idx: number) => (
             <div key={idx} className={`${fontSize} mb-2`}>
                <div className="flex items-center">
                   <span className="w-10 shrink-0">{item.code || '000'}</span>
                   <span className="flex-1 whitespace-nowrap font-bold">{item.name}</span>
                   <span className="w-16 shrink-0 text-right">{toCurrency(item.t)}</span>
                </div>
                <div className="pl-10 text-[8.5px] opacity-70">
                   {to3Decimals(item.q)} {item.unit} X {to3Decimals(item.p)}
                </div>
             </div>
          ))}
       </div>

       <div className="border-b border-black border-dashed my-2"></div>

       <div className="px-2 space-y-1">
          <div className={`flex justify-between ${fontSize} font-bold`}>
             <span>QTD. TOTAL DE ITENS</span>
             <span>{activeFuels.length}</span>
          </div>
          <div className={`flex justify-between ${fontSize} font-bold`}>
             <span>VALOR TOTAL R$</span>
             <span>{toCurrency(rawTotal)}</span>
          </div>
       </div>
       
       <div className="border-b border-black border-dashed my-2"></div>

       <div className="px-2 space-y-1">
          <div className={`flex justify-between ${fontSize}`}>
             <span>FORMA PAGAMENTO</span>
             <span>VALOR PAGO</span>
          </div>
          <div className={`flex justify-between ${fontSize} font-bold`}>
             <span>{paymentMethodLabel}</span>
             <span>{toCurrency(rawTotal)}</span>
          </div>
       </div>

       <div className="border-b border-black border-dashed my-2"></div>

       <div className={`${fontSize} font-bold my-2`}>{layout.customTexts.consumerLabel}</div>

       <div className="border-b border-black border-dashed my-2"></div>

       <div className={`${fontSize} space-y-2 px-1`}>
          <div>
             Nº {invoice.numero} &nbsp; SÉRIE {invoice.serie} <br/>
             EMISSÃO: {invoice.dataEmissao}
          </div>
          <div className="font-bold tracking-tight text-[8px] bg-black/5 p-1">{invoice.chaveAcesso}</div>
          
          <div className="text-[8px] text-center px-1 border border-black/20 p-2 leading-tight">{layout.customTexts.taxLabel}</div>

          <div className="font-bold my-1 leading-tight">{layout.customTexts.footerMessage}</div>
       </div>

       {qrCodeImageUrl && (
         <div className="flex justify-center my-3">
            <img src={qrCodeImageUrl} alt="QR Code" className="w-28 h-28 mix-blend-multiply" />
         </div>
       )}
       
       <div className="text-[8px] mt-4 italic opacity-40 text-center">webPostoPDV v12.5</div>
    </div>
  );
};

export default AlmeidaReceipt;
