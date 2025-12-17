
import React from 'react';
import { Printer, ZoomIn, ZoomOut } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { parseLocaleNumber, toCurrency, to3Decimals, generatePixPayload, generateNfceQrCodeUrl } from '../utils/formatters';

// COMPONENTE: DANFE MODELO 65 (A4 SIMULADO)
const DanfeReceipt: React.FC<{ data: any }> = ({ data }) => {
  const { posto, invoice, calculations } = data;
  const { rawTotal, valFederal, valEstadual, valMunicipal, activeFuels, qrCodeImageUrl } = calculations;
  const [authDate, authTime] = invoice.dataEmissao ? invoice.dataEmissao.split(' ') : ['__/__/____', '__:__:__'];
  const cleanKey = invoice.chaveAcesso.replace(/\D/g, '') || '00000000000000000000000000000000000000000000';
  const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${cleanKey}&scale=2&height=12&incltext=false`;
  const borderClass = "border border-black";
  const labelClass = "text-[7px] font-bold uppercase mb-[1px]";
  const valueClass = "text-[9px] font-normal uppercase truncate";

  return (
    <div className="bg-white text-black font-sans mx-auto box-border p-8 print:p-0 print:m-0" style={{ width: '210mm', minHeight: '297mm' }}>
      {/* 1. HEADER */}
      <div className={`grid grid-cols-12 gap-0 ${borderClass} mb-2`}>
        <div className="col-span-5 border-r border-black p-3 flex flex-col justify-center items-center text-center">
            <div className="font-bold text-base uppercase mb-2">{posto.razaoSocial}</div>
            <div className="text-[9px] leading-tight">{posto.endereco}<br/>Fone: {posto.fone}</div>
        </div>
        <div className="col-span-2 border-r border-black p-2 flex flex-col items-center justify-center text-center">
            <div className="font-bold text-xs uppercase">DANFE NFC-e</div>
            <div className="text-[10px] font-bold mt-1">Doc. Auxiliar</div>
            <div className="text-[9px] mt-1 font-bold">Nº {invoice.numero}</div>
            <div className="text-[8px]">SÉRIE: {invoice.serie}</div>
        </div>
        <div className="col-span-5 p-3 flex flex-col justify-between h-full">
            <div className="flex flex-col items-center mb-1"><img src={barcodeUrl} alt="Barcode" className="h-12 w-full object-fill" /></div>
            <div><div className={labelClass}>CHAVE DE ACESSO</div><div className="text-[11px] font-bold tracking-widest">{cleanKey.replace(/(\d{4})(?=\d)/g, '$1 ')}</div></div>
        </div>
      </div>

      {/* 2. CÁLCULO IMPOSTO */}
      <div className="mb-4">
          <div className="bg-gray-100 border border-black border-b-0 px-2 py-1 text-[8px] font-bold uppercase">CÁLCULO DO IMPOSTO</div>
          <div className={`grid grid-cols-10 ${borderClass}`}>
              <div className="col-span-2 border-r border-black p-2"><div className={labelClass}>BASE CÁLC. ICMS</div><div className={`${valueClass} text-right`}>R$ 0,00</div></div>
              <div className="col-span-2 border-r border-black p-2"><div className={labelClass}>VALOR ICMS</div><div className={`${valueClass} text-right`}>R$ 0,00</div></div>
              <div className="col-span-3 border-r border-black p-2"><div className={labelClass}>VALOR TOTAL PRODUTOS</div><div className={`${valueClass} text-right font-bold`}>R$ {toCurrency(rawTotal)}</div></div>
              <div className="col-span-3 p-2 bg-gray-50"><div className={labelClass}>VALOR TOTAL DA NOTA</div><div className={`${valueClass} text-right font-black text-xs`}>R$ {toCurrency(rawTotal)}</div></div>
          </div>
      </div>

      {/* 3. PRODUTOS */}
      <div className="mb-4 flex-1">
         <div className="bg-gray-100 border border-black border-b-0 px-2 py-1 text-[8px] font-bold uppercase">DADOS DOS PRODUTOS / SERVIÇOS</div>
         <div className={`border border-black min-h-[450px]`}>
            <div className="grid grid-cols-12 bg-gray-50 border-b border-black text-[7px] font-bold text-center py-1 uppercase">
                <div className="col-span-1 border-r border-black">CÓDIGO</div>
                <div className="col-span-5 border-r border-black">DESCRIÇÃO</div>
                <div className="col-span-1 border-r border-black">UNID</div>
                <div className="col-span-1 border-r border-black">QTD</div>
                <div className="col-span-2 border-r border-black">V.UNIT</div>
                <div className="col-span-2">V.TOTAL</div>
            </div>
            {activeFuels.map((item: any, idx: number) => (
                <div key={idx} className="grid grid-cols-12 border-b border-gray-200 text-[8px] text-center py-1.5 font-mono">
                    <div className="col-span-1 border-r border-gray-200 px-1">{item.code}</div>
                    <div className="col-span-5 border-r border-gray-200 px-2 text-left">{item.name}</div>
                    <div className="col-span-1 border-r border-gray-200">{item.unit}</div>
                    <div className="col-span-1 border-r border-gray-200">{to3Decimals(item.q)}</div>
                    <div className="col-span-2 border-r border-gray-200">{to3Decimals(item.p)}</div>
                    <div className="col-span-2 font-bold">{toCurrency(item.t)}</div>
                </div>
            ))}
         </div>
      </div>

      {/* 4. RODAPÉ COM QR CODE */}
      <div className="grid grid-cols-12 gap-4 mt-4">
         <div className="col-span-8 space-y-2">
            <div className="border border-black p-2 min-h-[100px]">
               <div className={labelClass}>INFORMAÇÕES COMPLEMENTARES</div>
               <div className="text-[8px] leading-relaxed">
                  Tributos Totais (Lei 12.741/2012): Federal R$ {toCurrency(valFederal)} | Estadual R$ {toCurrency(valEstadual)} | Municipal R$ {toCurrency(valMunicipal)}.<br/>
                  Forma de Pagamento: {invoice.formaPagamento}<br/>
                  Operador: {invoice.operador || 'SISTEMA'}<br/>
                  Placa: {invoice.placa} | KM: {invoice.km} | Motorista: {invoice.motorista || 'NÃO INFORMADO'}<br/>
                  {posto.razaoSocial} agradece a preferência!
               </div>
            </div>
            <div className="text-[7px] italic text-gray-500">Documento Auxiliar de Nota Fiscal de Consumidor Eletrônica gerado via simulador.</div>
         </div>
         <div className="col-span-4 flex flex-col items-center justify-center border border-black p-2 bg-gray-50">
            {qrCodeImageUrl && <img src={qrCodeImageUrl} alt="QR Code" className="w-24 h-24 mb-1" />}
            <div className="text-[6px] font-bold text-center uppercase">Consulta via leitor de QR Code</div>
            <div className="text-[5px] text-center opacity-40 mt-1 break-all px-2">{invoice.urlQrCode}</div>
         </div>
      </div>
    </div>
  );
};

const NoteScreen: React.FC = () => {
  const { postoData, invoiceData, fuels } = useAppContext();
  const [zoomLevel, setZoomLevel] = React.useState(0.5);

  const isCard = ['CARTAO', 'CREDITO', 'DEBITO'].includes(invoiceData.formaPagamento);
  const activeFuels = fuels.map(item => {
    const q = parseLocaleNumber(item.quantity);
    let p = parseLocaleNumber((isCard && item.unitPriceCard && parseLocaleNumber(item.unitPriceCard) > 0) ? item.unitPriceCard : item.unitPrice);
    return { ...item, q, p, t: q * p };
  });
  const rawTotal = activeFuels.reduce((acc, item) => acc + item.t, 0);

  const pctFederal = parseLocaleNumber(invoiceData.impostos.federal);
  const pctEstadual = parseLocaleNumber(invoiceData.impostos.estadual);
  const pctMunicipal = parseLocaleNumber(invoiceData.impostos.municipal);

  const valFederal = rawTotal * (pctFederal / 100);
  const valEstadual = rawTotal * (pctEstadual / 100);
  const valMunicipal = rawTotal * (pctMunicipal / 100);

  // Lógica de QR Code: Prioriza Pix para pagamento, senão gera URL oficial SEFAZ-MA
  let qrCodeData = '';
  if (invoiceData.formaPagamento === 'PIX' && postoData.chavePix) {
    qrCodeData = generatePixPayload(
      postoData.chavePix, 
      postoData.razaoSocial, 
      'IMPERATRIZ', 
      rawTotal, 
      postoData.tipoChavePix
    );
  } else {
    qrCodeData = generateNfceQrCodeUrl(invoiceData.chaveAcesso, '1');
  }

  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrCodeData)}`;
  
  const fullData = { 
    posto: postoData, 
    invoice: invoiceData, 
    calculations: { rawTotal, valFederal, valEstadual, valMunicipal, activeFuels, qrCodeImageUrl } 
  };

  return (
    <div className="flex flex-col items-center min-h-full pb-10 bg-slate-100/50 dark:bg-transparent">
      <div className="w-full max-w-[340px] flex items-center justify-between mt-4 mb-2 print:hidden px-4">
         <span className="text-xs font-bold text-slate-500 uppercase">DANFE NFC-e (A4)</span>
         <div className="flex gap-2">
            <button onClick={() => setZoomLevel(Math.max(0.3, zoomLevel - 0.1))} className="p-2 bg-white rounded shadow text-slate-600"><ZoomOut size={16}/></button>
            <span className="text-xs self-center font-mono w-10 text-center">{(zoomLevel * 100).toFixed(0)}%</span>
            <button onClick={() => setZoomLevel(Math.min(1.5, zoomLevel + 0.1))} className="p-2 bg-white rounded shadow text-slate-600"><ZoomIn size={16}/></button>
         </div>
      </div>
      <div className="w-full overflow-auto p-4 flex justify-center bg-slate-200/50 dark:bg-slate-900/50 print:bg-white print:p-0 print:block">
        <div id="printable-receipt" className="bg-white shadow-2xl print:shadow-none print:transform-none origin-top transition-transform" style={{ transform: `scale(${zoomLevel})`, marginBottom: `-${(1 - zoomLevel) * 297}mm` }}>
          <DanfeReceipt data={fullData} />
        </div>
      </div>
    </div>
  );
};

export default NoteScreen;
