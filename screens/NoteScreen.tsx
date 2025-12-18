import React from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { parseLocaleNumber, toCurrency, to3Decimals, generatePixPayload, generateNfceQrCodeUrl } from '../utils/helpers';

const DanfeReceipt: React.FC<{ data: any }> = ({ data }) => {
  const { posto, invoice, calculations } = data;
  const { rawTotal, valFederal, valEstadual, activeFuels, qrCodeImageUrl } = calculations;
  const cleanKey = (invoice.chaveAcesso || '').replace(/\D/g, '') || '00000000000000000000000000000000000000000000';
  const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${cleanKey}&scale=2&height=12&incltext=false`;
  
  const borderClass = "border border-black";
  const labelClass = "text-[7px] font-bold uppercase mb-[1px]";

  return (
    <div className="bg-white text-black font-sans mx-auto box-border p-8 print:p-0 print:m-0" style={{ width: '210mm', minHeight: '297mm' }}>
      <div className={`grid grid-cols-12 gap-0 ${borderClass} mb-2`}>
        <div className="col-span-5 border-r border-black p-3 flex flex-col justify-center items-center text-center">
            <div className="font-bold text-base uppercase mb-1 leading-tight">{posto.razaoSocial}</div>
            <div className="text-[9px] leading-tight">{posto.endereco}{posto.fone && <><br/>Fone: {posto.fone}</>}</div>
            <div className="text-[9px] font-bold mt-1">CNPJ: {posto.cnpj} - IE: {posto.inscEstadual}</div>
        </div>
        <div className="col-span-2 border-r border-black p-2 flex flex-col items-center justify-center text-center">
            <div className="font-bold text-xs uppercase">DANFE NFC-e</div>
            <div className="text-[10px] font-bold mt-1">Nº {invoice.numero || '_____'}</div>
            <div className="text-[8px]">SÉRIE: {invoice.serie || '001'}</div>
        </div>
        <div className="col-span-5 p-3 flex flex-col justify-between h-full">
            <div className="flex flex-col items-center mb-1">
              <img src={barcodeUrl} alt="Barcode" className="h-10 w-full object-fill" />
            </div>
            <div className="grid grid-cols-1 gap-2">
              <div>
                <div className={labelClass}>CHAVE DE ACESSO</div>
                <div className="text-[10.5px] font-bold tracking-widest">{cleanKey.replace(/(\d{4})(?=\d)/g, '$1 ')}</div>
              </div>
              <div className="flex justify-between items-end border-t border-black/10 pt-1">
                <div className="flex-1">
                  <div className={labelClass}>PROTOCOLO DE AUTORIZAÇÃO DE USO</div>
                  <div className="text-[10px] font-bold">{invoice.protocolo || '---'}</div>
                </div>
              </div>
            </div>
        </div>
      </div>
      <div className="mb-4">
          <div className="bg-gray-100 border border-black border-b-0 px-2 py-1 text-[8px] font-bold uppercase">CÁLCULO DO IMPOSTO E TOTAIS</div>
          <div className={`grid grid-cols-10 ${borderClass}`}>
              <div className="col-span-10 p-2 bg-gray-50 flex justify-between items-center">
                <div className={labelClass}>VALOR TOTAL A PAGAR</div>
                <div className="text-xl font-black text-indigo-700">R$ {toCurrency(rawTotal)}</div>
              </div>
          </div>
      </div>
      <div className="mb-4 flex-1">
         <div className="bg-gray-100 border border-black border-b-0 px-2 py-1 text-[8px] font-bold uppercase">DADOS DOS PRODUTOS / SERVIÇOS</div>
         <div className={`border border-black min-h-[500px] flex flex-col`}>
            <div className="grid grid-cols-12 bg-gray-50 border-b border-black text-[7px] font-bold text-center py-1 uppercase">
                <div className="col-span-1 border-r border-black">CÓD</div>
                <div className="col-span-5 border-r border-black text-left pl-2">DESCRIÇÃO</div>
                <div className="col-span-1 border-r border-black">QTD</div>
                <div className="col-span-1 border-r border-black">UN</div>
                <div className="col-span-2 border-r border-black">V.UNIT</div>
                <div className="col-span-2">V.TOTAL</div>
            </div>
            {activeFuels.map((item: any, idx: number) => (
                <div key={idx} className="grid grid-cols-12 border-b border-gray-100 text-[8.5px] text-center py-2 font-mono">
                    <div className="col-span-1 border-r border-gray-100 px-1">{item.code}</div>
                    <div className="col-span-5 border-r border-gray-100 px-2 text-left uppercase">{item.name}</div>
                    <div className="col-span-1 border-r border-gray-100">{to3Decimals(item.q)}</div>
                    <div className="col-span-1 border-r border-gray-100">{item.unit}</div>
                    <div className="col-span-2 border-r border-gray-100">{to3Decimals(item.p)}</div>
                    <div className="col-span-2 font-bold">{toCurrency(item.t)}</div>
                </div>
            ))}
         </div>
      </div>
      <div className="grid grid-cols-12 gap-4 mt-auto">
         <div className="col-span-8 border border-black p-4">
            <div className={labelClass}>INFORMAÇÕES COMPLEMENTARES</div>
            <div className="text-[8.5px] leading-relaxed uppercase space-y-1">
               <p><span className="font-bold">Trib Totais:</span> Federal R$ {toCurrency(valFederal)} | Estadual R$ {toCurrency(valEstadual)}.</p>
               <p><span className="font-bold">Pagamento:</span> {invoice.formaPagamento} | <span className="font-bold">Placa:</span> {invoice.placa || '---'} | <span className="font-bold">KM:</span> {invoice.km || '---'}</p>
               <p><span className="font-bold">Motorista:</span> {invoice.motorista || '---'} | <span className="font-bold">Operador:</span> {invoice.operador || '---'}</p>
               <p><span className="font-bold">Consulta SEFAZ:</span> http://www.sefaz.ma.gov.br/nfce/consulta</p>
            </div>
         </div>
         <div className="col-span-4 border border-black p-2 flex flex-col items-center justify-center bg-gray-50">
            {qrCodeImageUrl && <img src={qrCodeImageUrl} alt="QR Code" className="w-28 h-28 mb-1" />}
            <span className="text-[7px] font-bold">CONSULTE PELO QR CODE</span>
         </div>
      </div>
    </div>
  );
};

const NoteScreen: React.FC = () => {
  const { postoData, invoiceData, fuels } = useAppContext();
  const [zoomLevel, setZoomLevel] = React.useState(0.5);
  
  const activeFuels = fuels.map(item => {
    const q = parseLocaleNumber(item.quantity);
    const t = parseLocaleNumber(item.total);
    const p = q > 0 ? t / q : 0;
    return { ...item, q, p, t };
  });
  
  const rawTotal = activeFuels.reduce((acc, item) => acc + item.t, 0);
  const pctFederal = parseLocaleNumber(invoiceData.impostos.federal);
  const pctEstadual = parseLocaleNumber(invoiceData.impostos.estadual);
  const valFederal = rawTotal * (pctFederal / 100);
  const valEstadual = rawTotal * (pctEstadual / 100);

  let qrCodeData = (invoiceData.formaPagamento === 'PIX' && postoData.chavePix) 
    ? generatePixPayload(postoData.chavePix, postoData.razaoSocial, 'IMPERATRIZ', rawTotal, postoData.tipoChavePix)
    : generateNfceQrCodeUrl(invoiceData.chaveAcesso, '1');

  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrCodeData)}`;
  const fullData = { posto: postoData, invoice: invoiceData, calculations: { rawTotal, valFederal, valEstadual, activeFuels, qrCodeImageUrl } };

  return (
    <div className="flex flex-col items-center min-h-full pb-10">
      <div className="w-full max-w-[340px] flex items-center justify-between mt-4 mb-4 px-4 no-print">
         <span className="text-xs font-black text-slate-500 uppercase tracking-widest">DANFE NFC-e A4</span>
         <div className="flex gap-2">
            <button onClick={() => setZoomLevel(Math.max(0.3, zoomLevel - 0.1))} className="p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-lg text-slate-600 dark:text-slate-300 transition-active active:scale-95 transition-all"><ZoomOut size={18}/></button>
            <button onClick={() => setZoomLevel(Math.min(1.5, zoomLevel + 0.1))} className="p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-lg text-slate-600 dark:text-slate-300 transition-active active:scale-95 transition-all"><ZoomIn size={18}/></button>
         </div>
      </div>
      <div className="w-full overflow-auto p-4 flex justify-center bg-slate-200/30 dark:bg-slate-900/40 rounded-3xl min-h-[600px] border border-white/5">
        <div id="printable-receipt" className="bg-white origin-top transition-all duration-300 shadow-2xl" style={{ transform: `scale(${zoomLevel})`, marginBottom: `-${(1 - zoomLevel) * 297}mm` }}>
          <DanfeReceipt data={fullData} />
        </div>
      </div>
    </div>
  );
};

export default NoteScreen;