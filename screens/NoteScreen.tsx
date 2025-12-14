import React from 'react';
import { PostoData, InvoiceData, FuelItem, LayoutConfig } from '../types';
import { Layout, X } from 'lucide-react';

interface NoteScreenProps {
  postoData: PostoData;
  setPostoData: (data: PostoData) => void;
  invoiceData: InvoiceData;
  fuels: FuelItem[];
  layouts: LayoutConfig[];
  onDeleteLayout: (id: string) => void;
}

// --- HELPERS ---
const parseLocaleNumber = (val: string) => parseFloat(val.replace(/\./g, '').replace(',', '.')) || 0;
const toCurrency = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const to3Decimals = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const renderMultilineText = (text: string) => text ? text.split('\n').map((line, i) => <div key={i}>{line}</div>) : null;

// --- COMPONENTE DE COMPROVANTE DINÂMICO ---
const DynamicReceipt: React.FC<{ 
  config: LayoutConfig, 
  data: { posto: PostoData, invoice: InvoiceData, fuels: FuelItem[], calculations: any } 
}> = ({ config, data }) => {
  const { posto, invoice, fuels, calculations } = data;
  const { rawTotal, valTotalTributos, valFederal, valEstadual, qrCodeImageUrl, paymentMethodLabel, activeFuels } = calculations;

  // Força fonte mono para parecer impressora térmica
  const fontFamily = "font-mono";
  // Tamanho de fonte ajustado para escala real
  const fontSize = "text-[10px]";
  
  const DashedLine = () => (
    <div className="w-full border-b border-black border-dashed my-1 opacity-60" style={{ borderWidth: '1px', borderStyle: 'dashed' }} />
  );

  // Split Date and Time for Footer
  const [authDate, authTime] = invoice.dataEmissao ? invoice.dataEmissao.split(' ') : ['---', '---'];

  return (
    <div className={`flex flex-col h-full bg-[#fffcf5] text-black ${fontFamily} ${fontSize} leading-tight p-3 shadow-lg max-w-[320px] mx-auto`} style={{ fontVariantNumeric: 'tabular-nums' }}>
      
      {/* CABEÇALHO COM NFC-e */}
      <div className="text-center font-bold text-[14px] mb-1">NFC-e</div>
      
      <div className="text-center mb-2">
        <div className="font-bold text-[13px] uppercase tracking-wide mb-1">
          {posto.razaoSocial || 'POSTO EXEMPLO LTDA'}
        </div>
        <div className="uppercase text-[10px]">
          CNPJ: {posto.cnpj}
        </div>
        <div className="uppercase text-[10px]">
          IE: {posto.inscEstadual}
        </div>
        <div className="uppercase text-[10px] mt-1 px-2">
           {renderMultilineText(posto.endereco)}
        </div>
      </div>

      <DashedLine />

      <div className="text-center font-bold my-1">
         DANFE NFC-e - Documento Auxiliar da Nota<br/>Fiscal de Consumidor Eletrônica
      </div>
      <div className="text-center text-[9px] mb-1">
         NFC-e não permite aproveitamento de crédito de ICMS
      </div>

      <DashedLine />

      {/* TABELA DE ITENS (LAYOUT 2 LINHAS - PADRÃO TÉRMICO) */}
      <div className="w-full my-1">
         <div className="font-bold uppercase flex justify-between mb-1 text-[9px]">
            <span>ITEM CÓD DESCRIÇÃO</span>
            <span>VL. TOTAL</span>
         </div>
         <div className="font-bold uppercase text-[9px] mb-1 text-left">
            QTD. UN. VL. UNIT.
         </div>
         
         <div className="flex flex-col gap-1.5 mt-2">
           {activeFuels.map((item: any, idx: number) => (
             <div key={idx} className="flex flex-col">
                {/* Linha 1: Item, Cód, Nome */}
                <div className="flex justify-between font-bold uppercase">
                  <span className="truncate">
                    {String(idx + 1).padStart(3, '0')} {item.code} {item.name}
                  </span>
                  <span>
                    {toCurrency(item.t)}
                  </span>
                </div>
                {/* Linha 2: Detalhes Quantitativos */}
                <div className="flex justify-between text-[9px] pl-2">
                   <span>
                     {to3Decimals(item.q)} {item.unit} x {to3Decimals(item.p)}
                   </span>
                </div>
             </div>
           ))}
         </div>
      </div>

      <DashedLine />

      <div className="flex justify-between font-bold text-[11px] mt-1">
         <span>QTD. TOTAL DE ITENS</span>
         <span>{activeFuels.length}</span>
      </div>
      <div className="flex justify-between font-bold text-[11px]">
         <span>VALOR TOTAL R$</span>
         <span>{toCurrency(rawTotal)}</span>
      </div>
      <div className="flex justify-between font-bold text-[11px]">
         <span>DESCONTO R$</span>
         <span>0,00</span>
      </div>
      <div className="flex justify-between font-extrabold text-[14px] mt-1">
         <span>VALOR A PAGAR R$</span>
         <span>{toCurrency(rawTotal)}</span>
      </div>
      <div className="flex justify-between font-bold text-[11px] mt-1">
         <span>FORMA PAGAMENTO</span>
         <span>VALOR PAGO</span>
      </div>
      <div className="flex justify-between text-[11px]">
         <span className="capitalize">{paymentMethodLabel === 'DINHEIRO' ? 'Dinheiro' : paymentMethodLabel}</span>
         <span>{toCurrency(rawTotal)}</span>
      </div>

      <DashedLine />

      {/* IMPOSTOS & INFO ADICIONAL */}
      <div className="text-center text-[10px]">
         <div className="font-bold mb-1">Informação dos Tributos Totais Incidentes<br/>(Lei Federal 12.741/2012)</div>
         <div className="flex justify-between px-2">
            <span>Tributos Federais</span>
            <span>R$ {toCurrency(valFederal)}</span>
         </div>
         <div className="flex justify-between px-2">
            <span>Tributos Estaduais</span>
            <span>R$ {toCurrency(valEstadual)}</span>
         </div>
         <div className="flex justify-between px-2 mt-1 font-bold">
            <span>Total Aprox. Tributos:</span>
            <span>R$ {toCurrency(valTotalTributos)}</span>
         </div>
         <div className="text-[9px] italic mt-1 text-right px-2">Fonte: IBPT</div>
         
         <div className="mt-2 text-left px-2">
            <span className="font-bold">Observações:</span><br/>
            Placa: {invoice.placa || '---'} KM: {invoice.km || '---'}<br/>
            Mot: {invoice.motorista || '---'} Op: {invoice.operador || '---'}
         </div>
      </div>

      <DashedLine />

      <div className="text-center mb-1">
         <span className="font-bold">EMISSÃO NORMAL</span><br/>
         <span>Número: {invoice.numero} Série: {invoice.serie}</span><br/>
         <span>Emissão: {invoice.dataEmissao}</span>
      </div>

      <div className="text-center mb-2">
         <span className="font-bold">Consulte pela Chave de Acesso em</span><br/>
         <span className="text-[9px] block break-all leading-none mt-1">
           http://www.nfce.sefaz.ma.gov.br/portal/consultarNFCe.jsp
         </span>
      </div>

      <div className="text-center font-bold mb-1">CHAVE DE ACESSO</div>
      <div className="text-center font-bold tracking-widest text-[9px] mb-2 px-4 leading-normal break-all">
         {invoice.chaveAcesso}
      </div>

      <DashedLine />

      <div className="text-center font-bold my-1">CONSUMIDOR NÃO IDENTIFICADO</div>

      <div className="text-center font-bold mt-1 mb-1">Consulta via Leitor de QR Code</div>
      
      <div className="flex justify-center my-2">
         {qrCodeImageUrl ? (
           <img src={qrCodeImageUrl} alt="QR Code" className="w-32 h-32 object-contain mix-blend-multiply border border-slate-200 p-1 bg-white" />
         ) : (
           <div className="w-32 h-32 bg-slate-200 flex items-center justify-center text-[10px]">QR Code</div>
         )}
      </div>

      <div className="text-center text-[9px] mb-4">
         Protocolo de Autorização: {invoice.protocolo}<br/>
         Data de Autorização: {authDate}<br/>
         {authTime}
      </div>

    </div>
  );
};

// --- TELA PRINCIPAL ---
const NoteScreen: React.FC<NoteScreenProps> = ({ postoData, setPostoData, invoiceData, fuels, layouts, onDeleteLayout }) => {
  // Cálculos
  const isCard = invoiceData.formaPagamento === 'CARTAO' || invoiceData.formaPagamento === 'CREDITO' || invoiceData.formaPagamento === 'DEBITO';
  const activeFuels = fuels.map(item => {
    const q = parseLocaleNumber(item.quantity);
    let p = parseLocaleNumber(item.unitPrice);
    if (isCard && item.unitPriceCard && parseLocaleNumber(item.unitPriceCard) > 0) {
      p = parseLocaleNumber(item.unitPriceCard);
    }
    return { ...item, q, p, t: q * p };
  });
  const rawTotal = activeFuels.reduce((acc, item) => acc + item.t, 0);

  // LÓGICA DE IMPOSTOS (Porcentagem digitada)
  const parseTaxInput = (val: string) => parseFloat(val.replace(/\./g, '').replace(',', '.')) || 0;
  
  // As entradas agora são PORCENTAGENS
  const pctFederal = parseTaxInput(invoiceData.impostos.federal);
  const pctEstadual = parseTaxInput(invoiceData.impostos.estadual);
  const pctMunicipal = parseTaxInput(invoiceData.impostos.municipal);

  // O "Calculo" do valor em R$ para o rodapé (TOTAL * (PORCENTAGEM / 100))
  const valFederal = rawTotal * (pctFederal / 100);
  const valEstadual = rawTotal * (pctEstadual / 100);
  const valMunicipal = rawTotal * (pctMunicipal / 100);
  const valTotalTributos = valFederal + valEstadual + valMunicipal;

  const qrCodeImageUrl = invoiceData.urlQrCode ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(invoiceData.urlQrCode)}` : null;
  const paymentMethodLabel = isCard ? 'CARTÃO' : (invoiceData.formaPagamento === 'PIX' ? 'PIX' : 'DINHEIRO');

  const calcData = { rawTotal, valTotalTributos, valFederal, valEstadual, qrCodeImageUrl, paymentMethodLabel, activeFuels };
  const fullData = { posto: postoData, invoice: invoiceData, fuels, calculations: calcData };

  // Encontra configuração atual
  const currentLayout = layouts.find(l => l.id === postoData.activeLayoutId) || layouts[0];

  return (
    <div className="flex flex-col items-center min-h-full pb-10 bg-slate-100/50 dark:bg-transparent">
      
      {/* --- BARRA DE SELEÇÃO DE LAYOUTS --- */}
      <div className="w-full max-w-[320px] mb-4 bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 print:hidden mt-2">
         <div className="flex justify-between items-center mb-2">
           <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1">
             <Layout size={14} /> Selecionar Modelo Visual
           </label>
         </div>
         
         <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
           {layouts.map(l => (
             <div key={l.id} className="relative group shrink-0">
               <button
                 onClick={() => setPostoData({ ...postoData, activeLayoutId: l.id })}
                 className={`px-3 py-2 text-[10px] font-bold rounded border transition-colors whitespace-nowrap
                   ${postoData.activeLayoutId === l.id 
                     ? 'bg-slate-800 dark:bg-slate-600 text-white border-slate-800 dark:border-slate-600 shadow-md' 
                     : 'bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'
                   }`}
               >
                 {l.name}
               </button>
               {postoData.activeLayoutId === l.id && l.id !== 'padrao_iccar' && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteLayout(l.id); }}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow hover:bg-red-600"
                    title="Excluir este layout"
                  >
                    <X size={10} />
                  </button>
               )}
             </div>
           ))}
         </div>
      </div>

      {/* --- PREVIEW AREA --- */}
      <div 
        id="printable-receipt"
        className="w-full max-w-[320px] shadow-2xl relative box-border mx-auto transition-all"
        style={{ padding: '0px' }} 
      >
        <DynamicReceipt config={currentLayout} data={fullData} />
      </div>

      <div className="mt-4 text-[10px] text-slate-400 dark:text-slate-500 print:hidden text-center max-w-[300px]">
        O comprovante acima simula a impressão térmica de 80mm. Utilize o botão de Imprimir para melhores resultados.
      </div>

    </div>
  );
};

export default NoteScreen;