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
  const { rawTotal, valTotalTributos, valFederal, valEstadual, valMunicipal, qrCodeImageUrl, paymentMethodLabel, activeFuels } = calculations;

  // Configuração Visual Baseada na Foto
  const fontFamily = "font-mono"; // Fonte monoespaçada padrão
  const fontSize = "text-[10px]"; // Tamanho reduzido
  
  // Linha Sólida Preta Fina (Igual Foto)
  const SolidLine = () => (
    <div className="w-full border-b border-black my-1" style={{ borderWidth: '0.5px' }} />
  );

  // Split Date and Time for Footer
  const [authDate, authTime] = invoice.dataEmissao ? invoice.dataEmissao.split(' ') : ['---', '---'];

  return (
    <div className={`flex flex-col h-full bg-white text-black ${fontFamily} ${fontSize} leading-tight p-3 shadow-lg max-w-[340px] mx-auto`} style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.3px' }}>
      
      {/* CABEÇALHO GRANDE */}
      <div className="text-center font-bold text-[16px] mb-2 uppercase">NFC-e</div>
      
      {/* DADOS DO POSTO (ALINHADOS A ESQUERDA IGUAL FOTO) */}
      <div className="text-left mb-1">
        <div className="font-bold text-[12px] uppercase mb-0.5">
          {posto.razaoSocial || 'POSTO EXEMPLO LTDA'}
        </div>
        <div className="uppercase text-[10px] flex gap-2">
          <span>CNPJ: {posto.cnpj}</span>
          <span>Insc. Estadual: {posto.inscEstadual}</span>
        </div>
        {/* Endereço */}
        <div className="uppercase text-[10px] mt-0.5 whitespace-pre-line">
           {posto.endereco || 'ENDEREÇO NÃO INFORMADO'}
        </div>
      </div>

      <SolidLine />

      <div className="text-center my-1">
         DANFE NFC-e - Documento Auxiliar de Nota Fiscal<br/>de Consumidor Eletrônica
      </div>
      <div className="text-center text-[9px] mb-1">
         NFC-e não permite aproveitamento de crédito de ICMS
      </div>

      <SolidLine />

      {/* TABELA DE ITENS (FORMATO TABULAR DA FOTO) */}
      <div className="w-full my-1">
         {/* Cabeçalho da Tabela */}
         <div className="flex font-normal text-[9px] mb-1 border-b border-black pb-0.5">
            <span className="w-[15px]">It.</span>
            <span className="w-[35px]">Cód.</span>
            <span className="flex-1">Descrição</span>
            <span className="w-[45px] text-right">Qtde Un</span>
            <span className="w-[40px] text-right">Vl.Unit</span>
            <span className="w-[45px] text-right">Vl.Total</span>
         </div>
         
         {/* Linhas da Tabela */}
         <div className="flex flex-col gap-1">
           {activeFuels.map((item: any, idx: number) => (
             <div key={idx} className="flex text-[9px] items-start">
                <span className="w-[15px]">{idx + 1}</span>
                <span className="w-[35px] truncate pr-1">{item.code}</span>
                <span className="flex-1 truncate pr-1 uppercase">{item.name}</span>
                <span className="w-[45px] text-right whitespace-nowrap">{to3Decimals(item.q)} {item.unit}</span>
                <span className="w-[40px] text-right">{to3Decimals(item.p)}</span>
                <span className="w-[45px] text-right">{toCurrency(item.t)}</span>
             </div>
           ))}
         </div>
      </div>

      <SolidLine />

      {/* TOTAIS (FUNDO CINZA CLARO NA FOTO, AQUI LIMPO COM ALINHAMENTO) */}
      <div className="flex justify-between text-[10px] mt-0.5">
         <span>Qtd. Total de Itens</span>
         <span>{activeFuels.length}</span>
      </div>
      <div className="flex justify-between text-[10px]">
         <span>Valor Total R$</span>
         <span>{toCurrency(rawTotal)}</span>
      </div>
      <div className="flex justify-between text-[10px]">
         <span>Valor Desconto R$</span>
         <span>0,00</span>
      </div>
      <div className="flex justify-between text-[10px]">
         <span>Valor a Pagar R$</span>
         <span>{toCurrency(rawTotal)}</span>
      </div>
      <div className="flex justify-between text-[10px]">
         <span className="capitalize">{paymentMethodLabel === 'DINHEIRO' ? 'Dinheiro' : paymentMethodLabel}</span>
         <span>{toCurrency(rawTotal)}</span>
      </div>
      <div className="flex justify-between text-[10px] mt-1">
         <span>Valor Total Tributos (Lei 12.741/2012)</span>
         <span>{toCurrency(valTotalTributos)}</span>
      </div>

      <SolidLine />

      {/* INFO ADICIONAL (ALINHADO AO CENTRO IGUAL FOTO) */}
      <div className="text-center text-[10px] font-bold uppercase my-1">
         INFORMAÇÕES ADICIONAIS DE INTERESSE DO CONTRIBUINTE
      </div>
      
      <div className="text-center text-[10px] px-2 mb-1">
         {invoice.placa && <span>Placa: {invoice.placa} </span>}
         {invoice.km && <span>KM: {invoice.km}</span>}
         <br/>
         <div className="text-[9px] mt-0.5">
            Total Impostos Federais: R$ {toCurrency(valFederal)}<br/>
            Total Impostos Estaduais: R$ {toCurrency(valEstadual)}<br/>
            Total Impostos Municipais: R$ {toCurrency(valMunicipal)}
         </div>
      </div>

      <SolidLine />

      <div className="text-center mb-1 font-bold text-[10px] uppercase">
         EMISSÃO NORMAL
      </div>
      
      <div className="bg-slate-100/50 p-1 border border-slate-200/50">
        <div className="text-center text-[10px] font-bold">
           N.º: {invoice.numero} Série: {invoice.serie}
        </div>
        <div className="text-center text-[10px] font-bold">
           Via Consumidor
        </div>
        
        <div className="text-center mt-2 text-[9px]">
           Consulte pela Chave de Acesso em:<br/>
           <span className="break-all">http://www.nfce.sefaz.ma.gov.br/portal/consultarNFe.do?method=preFilterCupom</span>
        </div>

        <div className="text-center font-bold mt-2 text-[10px]">CHAVE DE ACESSO</div>
        <div className="text-center text-[9px] mb-2 px-1 tracking-widest font-mono">
           {invoice.chaveAcesso}
        </div>
        
        <div className="text-center text-[9px] mb-1">
            {invoice.chaveAcesso.replace(/\s/g, '').match(/.{1,4}/g)?.join(' ')}
        </div>
      </div>

      <SolidLine />

      <div className="text-center font-bold uppercase my-1">CONSUMIDOR NÃO IDENTIFICADO</div>

      <SolidLine />

      <div className="text-center font-bold mt-1 mb-1 text-[10px]">Consulta via leitor de QR Code</div>
      
      <div className="flex justify-center my-2">
         {qrCodeImageUrl ? (
           <img src={qrCodeImageUrl} alt="QR Code" className="w-32 h-32 object-contain" />
         ) : (
           <div className="w-32 h-32 bg-slate-100 flex items-center justify-center text-[10px] border border-slate-300">QR Code</div>
         )}
      </div>

      <div className="text-center text-[9px] mt-1 text-slate-500">
         Protocolo Autorização: {invoice.protocolo} {authDate}<br/>
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

  const calcData = { rawTotal, valTotalTributos, valFederal, valEstadual, valMunicipal, qrCodeImageUrl, paymentMethodLabel, activeFuels };
  const fullData = { posto: postoData, invoice: invoiceData, fuels, calculations: calcData };

  // Encontra configuração atual
  const currentLayout = layouts.find(l => l.id === postoData.activeLayoutId) || layouts[0];

  return (
    <div className="flex flex-col items-center min-h-full pb-10 bg-slate-100/50 dark:bg-transparent">
      
      {/* --- BARRA DE SELEÇÃO DE LAYOUTS --- */}
      <div className="w-full max-w-[340px] mb-4 bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 print:hidden mt-2">
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
        className="w-full max-w-[340px] shadow-2xl relative box-border mx-auto transition-all"
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