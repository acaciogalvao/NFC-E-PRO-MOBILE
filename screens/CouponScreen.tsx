
import React, { useState } from 'react';
import { Trash2, Settings2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { parseLocaleNumber, toCurrency, to3Decimals, round2, generatePixPayload, generateNfceQrCodeUrl } from '../utils/helpers';
import StandardReceipt from '../components/receipts/StandardReceipt';
import GuimaraesReceipt from '../components/receipts/GuimaraesReceipt';
import AlmeidaReceipt from '../components/receipts/AlmeidaReceipt';

type PaperWidth = '58mm' | '80mm';

const getPaymentLabel = (method: string) => {
  if (method === 'CREDITO') return 'CRÉDITO';
  if (method === 'DEBITO') return 'DÉBITO';
  if (method === 'CARTAO') return 'CARTÃO';
  if (method === 'PIX') return 'PIX';
  return 'DINHEIRO';
};

const CouponScreen: React.FC = () => {
  const { postoData, setPostoData, invoiceData, fuels, customLayouts, handleDeleteLayout } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [paperWidth, setPaperWidth] = useState<PaperWidth>('80mm');

  const isCard = invoiceData.formaPagamento === 'CARTAO' || invoiceData.formaPagamento === 'CREDITO' || invoiceData.formaPagamento === 'DEBITO';
  const isPix = invoiceData.formaPagamento === 'PIX';

  const activeFuels = fuels.map(item => {
    const q = parseLocaleNumber(item.quantity);
    let p = parseLocaleNumber(item.unitPrice);
    if (isCard && item.unitPriceCard && parseLocaleNumber(item.unitPriceCard) > 0) p = parseLocaleNumber(item.unitPriceCard);
    return { ...item, q, p, t: q * p };
  });
  const rawTotal = activeFuels.reduce((acc, item) => acc + item.t, 0);

  const pctFederal = parseLocaleNumber(invoiceData.impostos.federal);
  const pctEstadual = parseLocaleNumber(invoiceData.impostos.estadual);
  const pctMunicipal = parseLocaleNumber(invoiceData.impostos.municipal);

  const valFederal = round2(rawTotal * (pctFederal / 100));
  const valEstadual = round2(rawTotal * (pctEstadual / 100));
  const valMunicipal = round2(rawTotal * (pctMunicipal / 100));
  const valTotalTributos = valFederal + valEstadual + valMunicipal;

  // QR Code só é exibido se a nota foi gerada (tem chave de acesso)
  // Ou se for PIX (que tem sua própria lógica de exibição dependendo do fluxo)
  let qrCodeImageUrl = '';
  if (invoiceData.chaveAcesso) {
    const qrCodeData = generateNfceQrCodeUrl(invoiceData.chaveAcesso);
    qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrCodeData)}`;
  } else if (isPix && postoData.chavePix && rawTotal > 0) {
    // Caso especial: Se for PIX, podemos querer mostrar o QR Code de pagamento
    // Mas o usuário pediu "qrcode de todas as notas só depois de gerar", 
    // então vamos omitir até o NFC-e estar pronto se for essa a intenção restrita.
    // Se o usuário quiser o PIX antes, descomentar a linha abaixo.
    // const pixPayload = generatePixPayload(postoData.chavePix, postoData.razaoSocial, 'IMPERATRIZ', rawTotal, postoData.tipoChavePix);
    // qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pixPayload)}`;
  }

  const paymentMethodLabel = getPaymentLabel(invoiceData.formaPagamento);
  const calcData = { rawTotal, valTotalTributos, valFederal, valEstadual, valMunicipal, qrCodeImageUrl, paymentMethodLabel, activeFuels };
  const fullData = { posto: postoData, invoice: invoiceData, fuels, calculations: calcData };
  const currentLayout = customLayouts.find(l => l.id === postoData.activeLayoutId) || customLayouts[0];
  const filteredLayouts = customLayouts.filter(l => l.name.toUpperCase().includes(searchTerm.toUpperCase()));

  return (
    <div className="flex flex-col items-center min-h-full pb-10 bg-slate-100/50 dark:bg-transparent">
      <div className="w-full max-w-[340px] mb-2 print:hidden mt-2 space-y-2">
         <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400"><Settings2 size={16} /><span className="text-xs font-bold uppercase">Largura</span></div>
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded border border-slate-200 dark:border-slate-700">
               <button onClick={() => setPaperWidth('58mm')} className={`px-3 py-1 text-[10px] font-bold rounded ${paperWidth === '58mm' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500'}`}>58mm</button>
               <button onClick={() => setPaperWidth('80mm')} className={`px-3 py-1 text-[10px] font-bold rounded ${paperWidth === '80mm' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500'}`}>80mm</button>
            </div>
         </div>
         <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="relative mb-3"><input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value.toUpperCase())} placeholder="BUSCAR ESTILO..." className="w-full pl-3 pr-3 py-2 text-xs bg-slate-100 dark:bg-slate-700/50 border rounded-md outline-none focus:border-blue-500 transition-all uppercase" /></div>
            <div className="flex gap-2 overflow-x-auto pt-4 pb-2 px-1 no-scrollbar snap-x">
              {filteredLayouts.map(l => (
                <div key={l.id} className="relative group shrink-0 snap-start mt-2">
                  <button onClick={() => setPostoData({ ...postoData, activeLayoutId: l.id })} className={`px-3 py-2 text-[10px] font-bold rounded border whitespace-nowrap min-w-[100px] flex flex-col items-center justify-center gap-1 transition-all ${postoData.activeLayoutId === l.id ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200'}`}><span className="truncate max-w-[120px] uppercase">{l.name}</span></button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteLayout(l.id); }} className="absolute -top-3 -right-1 bg-red-500 text-white rounded-full p-1.5 shadow-md z-10 hover:bg-red-600 transition-colors"><Trash2 size={12} /></button>
                </div>
              ))}
            </div>
         </div>
      </div>
      <div className="w-fit bg-white p-3 rounded-xl shadow-lg border border-slate-200 mb-4 flex justify-center print:bg-transparent print:p-0 print:border-none print:shadow-none print:w-full print:max-w-none print:block transition-all animate-fade-in">
        <div id="printable-receipt" className="relative box-border transition-all">
             {currentLayout.id === 'modelo_guimaraes' && <GuimaraesReceipt data={fullData} layout={currentLayout} width={paperWidth} />}
             {currentLayout.id === 'modelo_almeida' && <AlmeidaReceipt data={fullData} layout={currentLayout} width={paperWidth} />}
             {currentLayout.id !== 'modelo_guimaraes' && currentLayout.id !== 'modelo_almeida' && <StandardReceipt data={fullData} layout={currentLayout} width={paperWidth} />}
        </div>
      </div>
    </div>
  );
};

export default CouponScreen;
