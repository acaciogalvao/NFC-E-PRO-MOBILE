import React from 'react';
import { LayoutConfig } from '../../types';
import { toCurrency, to3Decimals } from '../../utils/formatters';

interface ReceiptProps {
  data: any;
  layout: LayoutConfig;
  width: '58mm' | '80mm';
}

const GuimaraesReceipt: React.FC<ReceiptProps> = ({ data, layout, width }) => {
  const { posto, invoice, calculations } = data;
  const { rawTotal, activeFuels, qrCodeImageUrl, paymentMethodLabel } = calculations;

  const dashedLine = '-'.repeat(width === '58mm' ? 32 : 48);
  const fontSize = width === '58mm' ? 'text-[9px]' : 'text-[10px]';

  return (
    <div style={{ maxWidth: width, minWidth: width }} className="bg-white text-black p-2 font-mono leading-tight text-left uppercase">
      <div className="font-bold text-center mb-1">{posto.razaoSocial}</div>
      <div className={`${fontSize} text-center mb-1`}>
         CNPJ: {posto.cnpj}<br/>{posto.endereco}
      </div>
      <div className="text-center overflow-hidden whitespace-nowrap">{dashedLine}</div>
      <div className={`${fontSize} text-center font-bold my-1 whitespace-pre-wrap`}>{layout.customTexts.headerTitle}</div>
      <div className="text-center overflow-hidden whitespace-nowrap">{dashedLine}</div>
      
      <div className={`${fontSize} my-1`}>
         CÓDIGO DESCRIÇÃO<br/>
         QTD UN VL UNIT(R$) ST VL ITEM(R$)
      </div>
      <div className="text-center overflow-hidden whitespace-nowrap">{dashedLine}</div>

      {activeFuels.map((item: any, idx: number) => (
         <div key={idx} className={`${fontSize} mb-1`}>
            {item.code} {item.name}<br/>
            <div className="flex justify-between">
               <span>{to3Decimals(item.q)} {item.unit} X {to3Decimals(item.p)}</span>
               <span>{toCurrency(item.t)}</span>
            </div>
         </div>
      ))}

      <div className="text-center overflow-hidden whitespace-nowrap">{dashedLine}</div>

      <div className={`flex justify-between ${fontSize}`}>
         <span>QTD. TOTAL DE ITENS</span>
         <span>{activeFuels.length}</span>
      </div>
      <div className={`flex justify-between font-bold ${fontSize} my-1`}>
         <span>VALOR TOTAL R$</span>
         <span>{toCurrency(rawTotal)}</span>
      </div>
      <div className={`flex justify-between ${fontSize}`}>
         <span>FORMA PAGAMENTO</span>
         <span>VALOR PAGO R$</span>
      </div>
      <div className={`flex justify-between ${fontSize}`}>
         <span>{paymentMethodLabel}</span>
         <span>{toCurrency(rawTotal)}</span>
      </div>

      <div className="text-center overflow-hidden whitespace-nowrap">{dashedLine}</div>
      <div className={`${fontSize} text-center font-bold my-1`}>{layout.customTexts.consumerLabel}</div>
      <div className="text-center overflow-hidden whitespace-nowrap">{dashedLine}</div>

      <div className={`${fontSize} text-center my-1`}>
         NÚMERO {invoice.numero} SÉRIE {invoice.serie}<br/>
         EMISSÃO {invoice.dataEmissao} - VIA CONSUMIDOR
         <br/><br/>
         {layout.customTexts.footerMessage}
         <br/>
         <div className="break-all mt-1">{invoice.chaveAcesso}</div>
      </div>

      <div className={`${fontSize} text-center mt-2`}>
         PROTOCOLO: {invoice.protocolo || 'EM CONTINGENCIA'}
      </div>

      {qrCodeImageUrl && (
         <div className="flex flex-col items-center justify-center my-2">
            <img src={qrCodeImageUrl} alt="QR Code" className="w-20 h-20" />
            <div className="text-[8px] mt-1 text-center">Consulta via Leitor de QR Code</div>
         </div>
      )}
    </div>
  );
};

export default GuimaraesReceipt;