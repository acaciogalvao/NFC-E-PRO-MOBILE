
import React from 'react';
import { LayoutConfig, ReceiptData } from '../../types';
import { toCurrency, to3Decimals } from '../../utils/formatters';

interface ReceiptProps {
  data: ReceiptData;
  layout: LayoutConfig;
  width: '58mm' | '80mm';
}

const AlmeidaReceipt: React.FC<ReceiptProps> = ({ data, layout, width }) => {
  const { posto, invoice, calculations } = data;
  const { rawTotal, valFederal, valEstadual, valMunicipal, activeFuels, qrCodeImageUrl, paymentMethodLabel } = calculations;
  
  const fontSizeLongLines = width === '58mm' ? 'text-[5.5px]' : 'text-[7.5px]';
  const fontSizeNormal = width === '58mm' ? 'text-[8px]' : 'text-[10px]';
  const containerPadding = width === '58mm' ? 'px-1' : 'px-4';
  
  const cleanKey = (invoice.chaveAcesso || '').replace(/\D/g, '');
  const formattedKey = cleanKey.length === 44 
    ? cleanKey.replace(/(\d{4})/g, '$1 ').trim()
    : '0000 0000 0000 0000 0000 0000 0000 0000 0000 0000 0000';

  return (
    <div style={{ maxWidth: width, minWidth: width }} className="bg-white text-black p-2 font-mono leading-tight text-center uppercase border border-black flex flex-col overflow-hidden py-3">
       <div className="text-[10px] mb-0.5 font-bold">OE</div>
       <div className="font-bold text-[12px] mb-1 leading-tight">{posto.razaoSocial}</div>
       <div className={`${fontSizeLongLines} mb-0.5 tracking-tighter`}>CNPJ: {posto.cnpj}</div>
       <div className={`${fontSizeLongLines} mb-0.5 tracking-tighter max-w-[95%] mx-auto`}>{posto.endereco}</div>
       <div className={`${fontSizeNormal} mb-2`}>Fone:{posto.fone} I.E.:{posto.inscEstadual}</div>
       <div className={`${fontSizeLongLines} mb-3 leading-tight`}>Documento Auxiliar da Nota Fiscal de Consumidor Eletrônica</div>

       {/* Itens centralizados no container, mas estrutura interna alinhada */}
       <div className={`w-full text-left mt-2 border-b border-black pb-2 ${containerPadding}`}>
          <div className={`flex font-bold ${fontSizeNormal} border-b border-black mb-1 pb-1.5`}>
             <span className="w-[12%]">#</span><span className="w-[20%]">Cdigo</span><span className="w-[68%]">Descri</span>
          </div>
          {activeFuels.map((item, idx) => (
             <div key={item.id || idx} className={`${fontSizeNormal} py-1.5 border-b border-black/5 last:border-0`}>
                <div className="flex font-bold">
                   <span className="w-[12%]">{(idx + 1).toString().padStart(3, '0')}</span>
                   <span className="w-[20%]">{item.code}</span>
                   <span className="w-[68%] truncate">{item.name}</span>
                </div>
                <div className="flex justify-end mt-1 opacity-90 italic">
                   <span>{to3Decimals(item.q)} {item.unit} X {to3Decimals(item.p)} = {toCurrency(item.t)}</span>
                </div>
             </div>
          ))}
       </div>

       <div className={`mt-2 space-y-2 ${containerPadding}`}>
          <div className={`${fontSizeNormal} flex justify-between`}><span className="font-bold">Qtde. total de itens</span><span className="font-bold">{(activeFuels.length).toString().padStart(3, '0')}</span></div>
          <div className="text-[14px] font-black flex justify-between py-2 border-y border-black"><span>Valor total R$</span><span>{toCurrency(rawTotal)}</span></div>
       </div>

       <div className={`mt-2 text-left ${containerPadding} border-b border-black pb-4`}>
          <div className={`${fontSizeNormal} flex justify-between font-bold opacity-60`}><span>FORMA DE PAGAMENTO</span><span>VALOR PAGO R$</span></div>
          <div className={`${fontSizeNormal} flex justify-between py-1.5`}><span>{paymentMethodLabel}</span><span className="font-bold">{toCurrency(rawTotal)}</span></div>
       </div>

       <div className="py-2 border-b border-black font-bold text-[10px] uppercase">
          EMISSÃO NORMAL
       </div>

       <div className={`my-4 space-y-1 ${containerPadding}`}>
          <div className={`${fontSizeNormal} font-bold`}>Consulte pela Chave de Acesso em</div>
          <div className="lowercase text-[9px] font-bold break-all font-mono">www.sefaz.ma.gov.br/nfce/consulta</div>
          <div className="text-[7px] font-bold tracking-tighter mt-2 py-1 break-all max-w-[95%] mx-auto">
            {formattedKey}
          </div>
          <div className="font-bold text-[10px] mt-2 tracking-widest leading-tight">CONSUMIDOR N IDENTIFICADO</div>
       </div>

       <div className={`${fontSizeLongLines} font-bold my-2 border-y border-dashed border-black/40 py-2.5 tracking-tighter leading-tight`}>
          NFC-e n {invoice.numero} Srie {invoice.serie} {invoice.dataEmissao} Via Empresa
       </div>

       {/* QR CODE */}
       {qrCodeImageUrl && (
         <div className="flex flex-col items-center my-4">
           <img src={qrCodeImageUrl} alt="QR Code" className="w-32 h-32 mix-blend-multiply" />
         </div>
       )}

       <div className={`${fontSizeNormal} space-y-2 mt-4 border-t border-black pt-3 ${containerPadding}`}>
          <div className="font-bold leading-tight">PLACA: {invoice.placa || '_______'} KM: {invoice.km || '_______'}<br/>OPERADOR: {invoice.operador || '_______'}</div>
          <div className="pt-2 font-bold leading-tight text-[8px] opacity-70">
             Trib aprox: Federal:R${toCurrency(valFederal)} Estadual:R${toCurrency(valEstadual)} Municipal:R${toCurrency(valMunicipal)}<br/>Fonte: IBPT
          </div>
          <div className="pt-5 pb-2 border-t border-dashed border-black/10"><div className="font-black text-[11px] opacity-50">webPostoPDV</div></div>
       </div>
    </div>
  );
};

export default AlmeidaReceipt;
