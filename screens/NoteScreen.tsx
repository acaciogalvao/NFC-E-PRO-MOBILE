import React, { useState } from 'react';
import { PostoData, InvoiceData, FuelItem, LayoutConfig } from '../types';
import { Layout, X, Search, Trash2 } from 'lucide-react';

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

// Helper para arredondamento bancário (2 casas) para garantir consistência na soma
const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

// ==========================================
// RENDERIZADOR 1: MODELO PADRÃO (Réplica Fiel da Foto NFC-e)
// ==========================================
const StandardReceipt: React.FC<{ data: any; layout: LayoutConfig }> = ({ data, layout }) => {
  const { posto, invoice, calculations } = data;
  const { rawTotal, valTotalTributos, valFederal, valEstadual, valMunicipal, qrCodeImageUrl, paymentMethodLabel, activeFuels } = calculations;
  const [authDate, authTime] = invoice.dataEmissao ? invoice.dataEmissao.split(' ') : ['---', '---'];

  // Limpa o protocolo para exibir apenas os números
  const cleanProtocol = invoice.protocolo ? invoice.protocolo.replace(/[^0-9]/g, '').slice(0, 15) : '---';

  // Linha Separadora Preta Sólida (Igual Impressora Térmica)
  const Separator = () => (
    <div className="w-full border-b border-black my-1" style={{ borderWidth: '1px' }} />
  );

  return (
    <div className="flex flex-col bg-white text-black p-2 pb-10 shadow-lg max-w-[340px] mx-auto print:max-w-full print:shadow-none print:p-0 print:m-0 print:pb-0" 
         style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '10px', lineHeight: '1.2' }}>
      
      {/* HEADER */}
      
      {/* 1. Título NFC-e: Centralizado, Grande, Negrito e Itálico */}
      <div className="text-center font-bold italic text-[16px] mb-2 text-black">
        NFC-e
      </div>
      
      {/* 2. Razão Social */}
      <div className="text-left font-bold text-[11px] uppercase mb-0.5 text-black">
        {posto.razaoSocial || 'POSTO EXEMPLO LTDA'}
      </div>

      {/* 3. CNPJ e IE: Justificados (um em cada ponta) */}
      <div className="flex justify-between items-center text-[10px] uppercase mb-0.5 font-bold text-black">
         <span>CNPJ: {posto.cnpj}</span>
         <span>Insc. Estadual: {posto.inscEstadual}</span>
      </div>

      {/* 4. Endereço */}
      <div className="text-left text-[10px] uppercase whitespace-pre-line font-normal mb-1 text-black leading-tight">
         {posto.endereco || 'ENDEREÇO NÃO INFORMADO'}
      </div>

      <Separator />

      {/* 5. DANFE Box */}
      <div className="text-center text-[10px] mt-0.5 font-bold leading-tight text-black">
         DANFE NFC-e - Documento Auxiliar de Nota Fiscal<br/>de Consumidor Eletrônica
      </div>
      
      <div className="text-center text-[9px] mt-0.5 mb-1 font-normal text-black">
         NFC-e não permite aproveitamento de crédito de ICMS
      </div>

      <Separator />

      {/* ITEMS HEADER */}
      <div className="w-full my-0.5">
         <div className="flex font-bold text-[9px] mb-1 pb-0.5 border-b border-black">
            <span className="w-[20px]">It.</span>
            <span className="w-[35px]">Cód.</span>
            <span className="flex-1">Descrição</span>
            <span className="w-[45px] text-right">Qtde Un</span>
            <span className="w-[45px] text-right">Vl.Unit</span>
            <span className="w-[45px] text-right">Vl.Total</span>
         </div>
         
         {/* ITEMS LIST */}
         <div className="flex flex-col gap-0.5">
           {activeFuels.map((item: any, idx: number) => (
             <div key={idx} className="flex text-[9px] items-start font-normal">
                <span className="w-[20px]">{idx + 1}</span>
                <span className="w-[35px] truncate pr-1">{item.code}</span>
                <span className="flex-1 truncate pr-1 uppercase">{item.name}</span>
                <span className="w-[45px] text-right whitespace-nowrap">{to3Decimals(item.q)} {item.unit}</span>
                <span className="w-[45px] text-right">{to3Decimals(item.p)}</span>
                <span className="w-[45px] text-right">{toCurrency(item.t)}</span>
             </div>
           ))}
         </div>
      </div>

      <Separator />

      {/* TOTAIS */}
      <div className="flex justify-between text-[10px] mt-0.5 font-normal">
         <span>Qtd. Total de Itens</span>
         <span>{activeFuels.length}</span>
      </div>
      <div className="flex justify-between text-[10px] font-bold mt-0.5">
         <span>Valor Total R$</span>
         <span>{toCurrency(rawTotal)}</span>
      </div>
      <div className="flex justify-between text-[10px] mt-0.5">
         <span>Valor Desconto R$</span>
         <span>0,00</span>
      </div>
      <div className="flex justify-between text-[10px] font-bold mt-0.5">
         <span>Valor a Pagar R$</span>
         <span>{toCurrency(rawTotal)}</span>
      </div>
      <div className="flex justify-between text-[10px] mt-0.5">
         <span className="capitalize">{paymentMethodLabel === 'DINHEIRO' ? 'Dinheiro' : paymentMethodLabel}</span>
         <span>{toCurrency(rawTotal)}</span>
      </div>
      
      {/* Total Tributos - Separado por linha pontilhada ou sólida fina */}
      <div className="border-t border-black border-dashed my-1"></div>
      
      <div className="flex justify-between text-[9px]">
         <span>Valor Total Tributos (Lei 12.741/2012)</span>
         <span>{toCurrency(valTotalTributos)}</span>
      </div>

      {/* INFO ADICIONAIS */}
      <div className="text-center text-[9px] font-bold uppercase mt-2 mb-0.5">
         INFORMAÇÕES ADICIONAIS DE INTERESSE DO CONTRIBUINTE
      </div>
      
      <div className="text-center text-[9px] mb-1 leading-tight">
         Total Impostos Federais: R$ {toCurrency(valFederal)}<br/>
         Total Impostos Estaduais: R$ {toCurrency(valEstadual)}<br/>
         Total Impostos Municipais: R$ {toCurrency(valMunicipal)} (aprox. 0%)
      </div>

      <Separator />

      {/* EMISSÃO */}
      <div className="text-center mb-0.5 font-bold text-[10px] uppercase tracking-wide">
         EMISSÃO NORMAL
      </div>
      
      <div className="mb-1">
        <div className="text-center text-[9px] font-bold mb-0.5">
           N.º: {invoice.numero} Série: {invoice.serie} Emissão: {authDate} {authTime}
        </div>
        <div className="text-center text-[9px] font-bold mb-1">
           Via Consumidor
        </div>
        
        <div className="text-center mb-0.5 text-[9px]">
           Consulte pela Chave de Acesso em:
        </div>
        <div className="text-center mb-1 text-[8px] break-all leading-tight px-1 font-normal">
           http://www.nfce.sefaz.ma.gov.br/portal/consultarNFe.do?method=preFilterCupom
        </div>
        
        <div className="text-center font-bold mb-0.5 text-[9px] uppercase">CHAVE DE ACESSO</div>
        <div className="text-center text-[9px] mb-1 font-sans font-bold leading-tight px-2 tracking-wide">
            {invoice.chaveAcesso.replace(/\s/g, '').match(/.{1,4}/g)?.join(' ')}
        </div>
      </div>

      <Separator />

      {/* CONSUMIDOR */}
      <div className="text-center font-bold uppercase py-1 text-[10px]">
         {layout.customTexts.consumerLabel || 'CONSUMIDOR NÃO IDENTIFICADO'}
      </div>

      <Separator />

      {/* QR CODE */}
      <div className="text-center font-bold mt-1 mb-1 text-[9px]">Consulta via leitor de QR Code</div>
      <div className="flex justify-center my-1">
         {qrCodeImageUrl ? (
           <img src={qrCodeImageUrl} alt="QR Code" className="w-28 h-28 object-contain" />
         ) : (
           <div className="w-28 h-28 bg-slate-50 flex items-center justify-center text-[8px] border border-slate-300">QR Code</div>
         )}
      </div>

      <div className="text-center text-[9px] font-normal tracking-tight mb-2">
         Protocolo Autorização: {cleanProtocol} {authDate} {authTime}
      </div>
      
      {invoice.placa && (
         <div className="text-center font-bold text-[10px] mb-2 border-t border-black pt-1 border-dashed">
             PLACA: {invoice.placa} KM: {invoice.km}
         </div>
      )}
      
      <div className="h-4 print:hidden"></div>
    </div>
  );
};


// ==========================================
// RENDERIZADOR 2: MODELO TÉRMICO REAL (Epson/Bematech Style)
// ==========================================
const ThermalRealReceipt: React.FC<{ data: any; layout: LayoutConfig }> = ({ data, layout }) => {
  const { posto, invoice, calculations } = data;
  const { rawTotal, valTotalTributos, valFederal, valEstadual, valMunicipal, qrCodeImageUrl, paymentMethodLabel, activeFuels } = calculations;
  const [authDate, authTime] = invoice.dataEmissao ? invoice.dataEmissao.split(' ') : ['---', '---'];

  const DashedLine = () => (
    <div className="w-full border-b border-black border-dashed my-1" style={{ borderWidth: '1px' }} />
  );

  return (
    <div className={`flex flex-col bg-white text-black font-mono text-[10px] leading-none p-2 shadow-lg max-w-[320px] mx-auto uppercase print:max-w-full print:shadow-none print:p-0`}>
      
      {/* 1. CABEÇALHO EMPRESA */}
      <div className="text-center mb-2">
         {posto.cnpj && <div>CNPJ: {posto.cnpj.replace(/\D/g,'').replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")}</div>}
         <div className="font-bold whitespace-pre-line">{posto.razaoSocial}</div>
         <div className="whitespace-pre-line leading-tight mt-1">{posto.endereco}</div>
      </div>

      <div className="text-center mb-1 font-bold whitespace-pre-wrap">
         {layout.customTexts.headerTitle}
      </div>

      <DashedLine />

      {/* 2. ITENS (LAYOUT EPSON) */}
      <div className="w-full">
         <div className="flex mb-1">
            <span className="w-[30px]">COD</span>
            <span className="flex-1">DESCRIÇÃO</span>
            <span className="w-[80px] text-right">TOT R$</span>
         </div>
         <div className="flex mb-1 text-[9px]">
            <span className="flex-1">QTD UN x VL UNIT R$</span>
            <span className="w-[80px] text-right">(VL TRIB)</span>
         </div>

         <DashedLine />
         
         {activeFuels.map((item: any, idx: number) => (
             <div key={idx} className="mb-1">
                <div className="flex">
                   <span className="w-[30px]">{item.code}</span>
                   <span className="flex-1 truncate">{item.name}</span>
                   <span className="w-[80px] text-right">{toCurrency(item.t)}</span>
                </div>
                <div className="flex text-[9px] pl-[30px]">
                   <span className="flex-1">
                      {to3Decimals(item.q).replace('.',',')} {item.unit} x {to3Decimals(item.p).replace('.',',')}
                   </span>
                </div>
             </div>
         ))}
      </div>

      <DashedLine />

      {/* 3. TOTAIS */}
      <div className="flex justify-between font-bold">
         <span>QTD. TOTAL DE ITENS</span>
         <span>{activeFuels.length}</span>
      </div>
      <div className="flex justify-between font-bold text-[12px] mt-1">
         <span>VALOR TOTAL R$</span>
         <span>{toCurrency(rawTotal)}</span>
      </div>
      <div className="flex justify-between mt-1">
         <span>FORMA DE PAGAMENTO</span>
         <span>VALOR PAGO R$</span>
      </div>
      <div className="flex justify-between">
         <span>{paymentMethodLabel}</span>
         <span>{toCurrency(rawTotal)}</span>
      </div>
      <div className="flex justify-between mt-1">
         <span>Troco R$</span>
         <span>0,00</span>
      </div>

      <DashedLine />

      {/* 4. IMPOSTOS E INFOS */}
      <div className="text-center mb-1">
         {layout.customTexts.footerMessage}<br/>
         http://www.nfce.sefaz.ma.gov.br
      </div>
      <div className="text-center font-bold mb-1 break-all px-4">
         {invoice.chaveAcesso.replace(/\s/g, '')}
      </div>

      <div className="text-center mb-1">
         {layout.customTexts.consumerLabel}
      </div>

      <div className="text-center mb-2">
         NFC-e nº {invoice.numero} Série {invoice.serie} {authDate} {authTime}
      </div>
      <div className="text-center mb-2">
         Protocolo de Autorização: {invoice.protocolo}
      </div>

      <div className="flex justify-center mb-2">
         {qrCodeImageUrl ? (
           <img src={qrCodeImageUrl} alt="QR Code" className="w-24 h-24 object-contain rendering-pixelated" />
         ) : (
           <div className="w-24 h-24 border border-dashed flex items-center justify-center">QR CODE</div>
         )}
      </div>

      <div className="text-center text-[9px]">
         Trib Aprox R$: {toCurrency(valFederal)} Fed, {toCurrency(valEstadual)} Est, {toCurrency(valMunicipal)} Mun
      </div>
      <div className="text-center text-[9px] mt-1">
         Fonte: IBPT
      </div>
      
      {invoice.placa && (
         <div className="text-center font-bold mt-2 border-t border-black border-dashed pt-1">
            PLACA: {invoice.placa} | KM: {invoice.km}
         </div>
      )}
    </div>
  );
};

// ==========================================
// RENDERIZADOR 3: MODELO GUIMARÃES (Réplica Exata da Foto)
// ==========================================
const GuimaraesReceipt: React.FC<{ data: any; layout: LayoutConfig }> = ({ data, layout }) => {
  const { posto, invoice, calculations } = data;
  const { rawTotal, valTotalTributos, valFederal, valEstadual, valMunicipal, qrCodeImageUrl, paymentMethodLabel, activeFuels } = calculations;
  const [authDate, authTime] = invoice.dataEmissao ? invoice.dataEmissao.split(' ') : ['---', '---'];

  // Função auxiliar para replicar o separador exato da foto
  const DashedSeparator = () => (
    <div className="w-full border-b border-dashed border-black my-1 opacity-70" style={{ borderWidth: '1px' }}></div>
  );

  return (
    <div className="flex flex-col bg-white text-black font-mono text-[10px] leading-tight p-2 shadow-lg max-w-[320px] mx-auto uppercase tracking-tighter print:max-w-full print:shadow-none print:p-0">
      
      {/* --- CABEÇALHO --- */}
      <div className="text-left mb-1">
         {posto.cnpj && <div>CNPJ: {posto.cnpj.replace(/\D/g,'').replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")}  IE: {posto.inscEstadual || '---'}</div>}
         <div className="font-bold my-1 whitespace-pre-line leading-tight">{posto.razaoSocial || 'AUTO POSTO GUIMARAES LTDA'}</div>
         <div className="whitespace-pre-line leading-tight">
            {posto.endereco || 'IMPERATRIZ - MA'}
         </div>
      </div>

      <div className="text-center mt-2 mb-1 whitespace-pre-wrap">
         {layout.customTexts.headerTitle}
      </div>

      <DashedSeparator />

      {/* --- ITENS --- */}
      <div className="w-full mb-1">
         <div className="flex justify-between mb-1 font-bold">
            <span>CODIGO</span>
            <span className="text-center">DESCRIÇÃO</span>
            <span>TOTAL</span>
         </div>
         <div className="flex justify-between mb-1 text-[9px]">
            <span>QTD. UN.</span>
            <span className="text-center">VL UNIT(R$)</span>
            <span>VL TR(R$)</span>
         </div>
         
         <DashedSeparator />
         
         {activeFuels.map((item: any, idx: number) => (
             <div key={idx} className="mb-2">
                {/* Linha 1: Código + Nome + Total */}
                <div className="flex justify-between">
                   <div className="flex gap-2 overflow-hidden">
                     <span className="w-4">{idx + 1}</span>
                     <span className="truncate">{item.name}</span>
                   </div>
                   <span className="text-right whitespace-nowrap">{toCurrency(item.t)}</span>
                </div>
                {/* Linha 2: Quantidade + Unidade + Preço */}
                <div className="flex justify-between text-[10px]">
                   <div className="flex gap-1">
                      <span>{to3Decimals(item.q).replace('.',',')}</span>
                      <span>{item.unit}</span>
                      <span className="mx-1">x</span>
                      <span>{to3Decimals(item.p).replace('.',',')}</span>
                   </div>
                   {/* Espaço para info tributária opcional se houvesse */}
                </div>
             </div>
         ))}
      </div>

      <DashedSeparator />

      {/* --- TOTAIS --- */}
      <div className="flex justify-between font-bold text-[10px]">
         <span>Qtde. Total de Itens</span>
         <span>{activeFuels.length}</span>
      </div>
      <div className="flex justify-between font-bold text-[11px] mt-1">
         <span>Valor Total R$</span>
         <span>{toCurrency(rawTotal)}</span>
      </div>
      
      <div className="flex justify-between mt-2 font-bold">
         <span>FORMA PAGAMENTO</span>
         <span>Valor Pago R$</span>
      </div>
      <div className="flex justify-between">
         <span>{paymentMethodLabel === 'DINHEIRO' ? 'Dinheiro' : paymentMethodLabel}</span>
         <span>{toCurrency(rawTotal)}</span>
      </div>

      <DashedSeparator />

      {/* --- INFO FISCAL / RODAPÉ --- */}
      <div className="text-center mb-1">
         {layout.customTexts.footerMessage}
      </div>
      <div className="text-center text-[9px] mb-1 break-all">
         http://nfce.sefaz.ma.gov.br/portal/consultarNFCe.jsp
      </div>
      <div className="text-center font-bold mb-1 break-all px-1 tracking-widest text-[9px]">
         {invoice.chaveAcesso.replace(/\s/g, '')}
      </div>

      <div className="text-center font-bold mt-2 mb-1">
         {layout.customTexts.consumerLabel}
      </div>

      <div className="text-center mb-1">
         NFC-e nº: {invoice.numero} Série: {invoice.serie} {authDate} {authTime}
      </div>
      <div className="text-center mb-2">
         Protocolo de Autorização: {invoice.protocolo}
         <br/>Data de Autorização: {authDate} {authTime}
      </div>

      <div className="flex justify-center mb-2">
         {qrCodeImageUrl ? (
           <img src={qrCodeImageUrl} alt="QR Code" className="w-24 h-24 object-contain rendering-pixelated border border-white" />
         ) : (
           <div className="w-24 h-24 border border-dashed flex items-center justify-center">QR CODE</div>
         )}
      </div>

      <div className="text-left text-[9px] mt-1">
         {layout.customTexts.taxLabel} Total R$ {toCurrency(valTotalTributos)}
         <br/>
         R$ {toCurrency(valFederal)} Federal e {toCurrency(valEstadual)} Estadual
      </div>

      {invoice.placa && (
         <div className="text-left font-bold mt-2 border-t border-dashed border-black pt-1">
            PLACA: {invoice.placa} | KM: {invoice.km} | MOT: {invoice.motorista}
         </div>
      )}

      {/* Rodapé da Software House conforme foto */}
      <div className="text-right mt-4 text-[9px] font-bold transform -rotate-90 origin-bottom-right absolute bottom-20 -right-4 hidden">
        Adaptive Business - 3.23.02.15 - www.adaptive.com.br
      </div>
      
      <div className="text-right mt-6 text-[8px] opacity-70">
         Adaptive Business - 3.23.02.15 - www.adaptive.com.br
      </div>

    </div>
  );
};


// --- TELA PRINCIPAL (CONTROLLER) ---
const NoteScreen: React.FC<NoteScreenProps> = ({ postoData, setPostoData, invoiceData, fuels, layouts, onDeleteLayout }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Cálculos Compartilhados
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

  // Impostos (CORREÇÃO DE CÁLCULO)
  // Utiliza round2 para garantir que cada componente seja arredondado individualmente
  // antes de ser somado, garantindo que a soma (Federal + Estadual + Municipal) seja
  // exatamente igual ao "Total Tributos" exibido.
  const parseTaxInput = (val: string) => parseFloat(val.replace(/\./g, '').replace(',', '.')) || 0;
  
  const pctFederal = parseTaxInput(invoiceData.impostos.federal);
  const pctEstadual = parseTaxInput(invoiceData.impostos.estadual);
  const pctMunicipal = parseTaxInput(invoiceData.impostos.municipal);

  const valFederal = round2(rawTotal * (pctFederal / 100));
  const valEstadual = round2(rawTotal * (pctEstadual / 100));
  const valMunicipal = round2(rawTotal * (pctMunicipal / 100));
  const valTotalTributos = valFederal + valEstadual + valMunicipal;

  const qrCodeImageUrl = invoiceData.urlQrCode ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(invoiceData.urlQrCode)}` : null;
  const paymentMethodLabel = isCard ? 'CARTÃO' : (invoiceData.formaPagamento === 'PIX' ? 'PIX' : 'DINHEIRO');

  const calcData = { rawTotal, valTotalTributos, valFederal, valEstadual, valMunicipal, qrCodeImageUrl, paymentMethodLabel, activeFuels };
  const fullData = { posto: postoData, invoice: invoiceData, fuels, calculations: calcData };

  // Encontra layout atual
  const currentLayout = layouts.find(l => l.id === postoData.activeLayoutId) || layouts[0];

  // Lógica de Filtro dos Layouts
  const filteredLayouts = layouts.filter(l => 
    l.name.toUpperCase().includes(searchTerm.toUpperCase())
  );

  return (
    <div className="flex flex-col items-center min-h-full pb-10 bg-slate-100/50 dark:bg-transparent">
      
      {/* SELETOR DE LAYOUTS */}
      <div className="w-full max-w-[340px] mb-4 bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 print:hidden mt-2">
         <div className="flex justify-between items-center mb-2">
           <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1">
             <Layout size={14} /> Selecionar Modelo Visual
           </label>
         </div>

         {/* CAMPO DE BUSCA */}
         <div className="relative mb-3">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
               <Search size={14} />
            </div>
            <input 
               type="text"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
               placeholder="BUSCAR MODELO..."
               className="w-full pl-9 pr-3 py-2 text-xs bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-md outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200 font-bold placeholder:font-normal placeholder:text-slate-400"
            />
            {searchTerm && (
               <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
               >
                  <X size={14} />
               </button>
            )}
         </div>
         
         {/* LISTA DE MODELOS COM SCROLL */}
         <div className="flex gap-2 overflow-x-auto pt-4 pb-2 px-1 no-scrollbar snap-x">
           {filteredLayouts.length === 0 && (
              <div className="w-full text-center py-4 text-xs text-slate-400 italic border border-dashed border-slate-200 dark:border-slate-700 rounded">
                 Nenhum modelo encontrado.
              </div>
           )}
           {filteredLayouts.map(l => (
             <div key={l.id} className="relative group shrink-0 snap-start mt-2">
               <button
                 onClick={() => setPostoData({ ...postoData, activeLayoutId: l.id })}
                 className={`px-3 py-2 text-[10px] font-bold rounded border transition-colors whitespace-nowrap min-w-[100px] flex flex-col items-center justify-center gap-1
                   ${postoData.activeLayoutId === l.id 
                     ? 'bg-slate-800 dark:bg-slate-600 text-white border-slate-800 dark:border-slate-600 shadow-md ring-2 ring-offset-2 ring-slate-800 dark:ring-slate-600 dark:ring-offset-slate-900' 
                     : 'bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'
                   }`}
               >
                 <span className="truncate max-w-[120px]">{l.name}</span>
                 {postoData.activeLayoutId === l.id && <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>}
               </button>

               <button 
                onClick={(e) => { e.stopPropagation(); onDeleteLayout(l.id); }}
                className="absolute -top-3 -right-1 bg-red-500 text-white rounded-full p-1.5 shadow-md hover:bg-red-600 transition-transform hover:scale-110 z-10 border border-white dark:border-slate-800"
                title="Excluir este layout"
                >
                <Trash2 size={12} />
                </button>
             </div>
           ))}
         </div>
      </div>

      {/* ÁREA DE VISUALIZAÇÃO */}
      <div 
        id="printable-receipt"
        className="w-full max-w-[340px] shadow-2xl relative box-border mx-auto transition-all"
        style={{ padding: '0px' }} 
      >
        {currentLayout.id === 'modelo_termico_real' ? (
           <ThermalRealReceipt data={fullData} layout={currentLayout} />
        ) : currentLayout.id === 'modelo_guimaraes' ? (
           <GuimaraesReceipt data={fullData} layout={currentLayout} />
        ) : (
           <StandardReceipt data={fullData} layout={currentLayout} />
        )}
      </div>

      <div className="mt-4 text-[10px] text-slate-400 dark:text-slate-500 print:hidden text-center max-w-[300px]">
        O comprovante acima simula a impressão térmica de 80mm. Utilize o botão de Imprimir para melhores resultados.
      </div>

    </div>
  );
};

export default NoteScreen;