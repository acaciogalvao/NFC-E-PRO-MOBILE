import React from 'react';
import { LayoutConfig } from '../../types';
import { toCurrency, to3Decimals, NFCE_PORTAL_URL } from '../../utils/formatters';

interface ReceiptProps {
  data: any;
  layout: LayoutConfig;
  width: '58mm' | '80mm';
}

const GuimaraesReceipt: React.FC<ReceiptProps> = ({ data, layout, width }) => {
  const { posto, invoice, calculations } = data;
  const { rawTotal, valTotalTributos, activeFuels, qrCodeImageUrl, paymentMethodLabel } = calculations;

  const fontSize = width === '58mm' ? 'text-[9px]' : 'text-[11px]';
  const containerPadding = width === '58mm' ? 'px-1' : 'px-4';

  const cleanKey = (invoice.chaveAcesso || '').replace(/\D/g, '');
  const formattedKey = cleanKey.length === 44 
    ? cleanKey.replace(/(\d{4})/g, '$1 ').trim()
    : '0000 0000 0000 0000 0000 0000 0000 0000 0000 0000 0000';

  return (
    <div 
      style={{ maxWidth: width, minWidth: width }} 
      className="bg-white text-black font-mono leading-tight text-center border border-black flex flex-col overflow-hidden py-2"
    >
      {/* TÍTULO DO POSTO */}
      <div className="font-bold p-2 uppercase text-[12px] leading-tight">
        {posto.razaoSocial}
      </div>
      
      <div className={`${fontSize} p-2 border-y border-black uppercase leading-tight space-y-1`}>
         <div>CNPJ: {posto.cnpj}</div>
         <div className="max-w-[95%] mx-auto">{posto.endereco}</div>
         {posto.fone && <div>FONE: {posto.fone}</div>}
      </div>

      <div className={`${fontSize} font-bold p-2 border-b border-black uppercase leading-tight`}>
        {layout.customTexts.headerTitle}
      </div>
      
      {/* Itens alinhados para não quebrar a estrutura da tabela */}
      <div className={`text-left ${fontSize} font-bold p-2 border-b border-black`}>
         CÓDIGO DESCRIÇÃO<br/>
         QTD UN VL UNIT(R$) ST VL ITEM(R$)
      </div>

      <div className={`py-1 border-b border-black ${containerPadding} space-y-2 text-left`}>
        {activeFuels.map((item: any, idx: number) => (
           <div key={idx} className={`${fontSize}`}>
              <div className="font-bold uppercase">{item.code} {item.name}</div>
              <div className="flex justify-between">
                 <span>{to3Decimals(item.q)} {item.unit} X {to3Decimals(item.p)}</span>
                 <span className="font-bold">{toCurrency(item.t)}</span>
              </div>
           </div>
        ))}
      </div>

      <div className={`p-2 border-b border-black space-y-1 ${containerPadding}`}>
        <div className={`flex justify-between ${fontSize}`}>
           <span>QTD. TOTAL DE ITENS</span>
           <span className="font-bold">{activeFuels.length}</span>
        </div>
        <div className={`flex justify-between font-bold ${fontSize} border-y border-black py-1 my-1`}>
           <span>VALOR TOTAL R$</span>
           <span>{toCurrency(rawTotal)}</span>
        </div>

        <div className={`${fontSize} space-y-0.5 pt-1`}>
           <div className="flex justify-between uppercase font-bold">
              <span>FORMA PAGAMENTO</span>
              <span>VALOR R$</span>
           </div>
           <div className="flex justify-between uppercase">
              <span>{paymentMethodLabel}</span>
              <span className="font-bold">{toCurrency(rawTotal)}</span>
           </div>
           <div className="text-[8px] flex justify-between font-bold opacity-75 mt-2">
              <span>TRIBUTOS APROXIMADOS R$</span>
              <span>{toCurrency(valTotalTributos)}</span>
           </div>
        </div>
      </div>

      <div className="py-1 border-b border-black font-bold text-[10px] uppercase">
        EMISSÃO NORMAL
      </div>

      <div className={`${fontSize} font-bold p-2 border-b border-black uppercase`}>
        {layout.customTexts.consumerLabel}
      </div>

      <div className={`${fontSize} p-2 border-b border-black space-y-2 uppercase leading-tight`}>
         <div>
            Nº: {invoice.numero} SÉRIE: {invoice.serie}<br/>
            EMISSÃO: {invoice.dataEmissao}<br/>
            <span className="font-bold">OPERADOR: {invoice.operador}</span>
         </div>
         
         <div className="pt-1">
            <div className="font-bold lowercase underline text-[10px] break-all">{NFCE_PORTAL_URL}</div>
         </div>

         <div className="pt-1">
            <div className="font-bold text-[9px] mb-1">CHAVE DE ACESSO</div>
            <div className="text-[7px] tracking-tighter font-bold break-all max-w-[90%] mx-auto">
               {formattedKey}
            </div>
         </div>
      </div>

      {/* QR CODE */}
      {qrCodeImageUrl && (
         <div className="flex flex-col items-center justify-center p-4">
            <img src={qrCodeImageUrl} alt="QR Code" className="w-28 h-28" />
            <div className="text-[9px] mt-2 font-bold uppercase">VIA CONSUMIDOR</div>
         </div>
      )}

      <div className={`${fontSize} p-2 font-bold uppercase border-t border-black`}>
         Protocolo: {invoice.protocolo || '---'}
      </div>
    </div>
  );
};

export default GuimaraesReceipt;