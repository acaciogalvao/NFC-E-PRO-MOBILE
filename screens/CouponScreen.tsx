import React, { useState } from 'react';
import { PostoData, InvoiceData, FuelItem, LayoutConfig } from '../types';
import { Printer, Layout, X, Search, Trash2, Settings2, CheckCircle2 } from 'lucide-react';

interface CouponScreenProps {
  postoData: PostoData;
  setPostoData: (data: PostoData) => void;
  invoiceData: InvoiceData;
  fuels: FuelItem[];
  layouts: LayoutConfig[];
  onDeleteLayout: (id: string) => void;
}

type PaperWidth = '58mm' | '80mm';

// --- HELPERS ---
const parseLocaleNumber = (val: string) => parseFloat(val.replace(/\./g, '').replace(',', '.')) || 0;
const toCurrency = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const to3Decimals = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

// Helper para Label de Pagamento
const getPaymentLabel = (method: string) => {
  if (method === 'CREDITO') return 'CRÉDITO';
  if (method === 'DEBITO') return 'DÉBITO';
  if (method === 'CARTAO') return 'CARTÃO';
  if (method === 'PIX') return 'PIX';
  return 'DINHEIRO';
};

// ==========================================
// RENDERIZADOR 1: MODELO PADRÃO (ICCar)
// ==========================================
const StandardReceipt: React.FC<{ data: any; layout: LayoutConfig; width: PaperWidth }> = ({ data, layout, width }) => {
  const { posto, invoice, calculations } = data;
  const { rawTotal, valTotalTributos, valFederal, valEstadual, valMunicipal, qrCodeImageUrl, paymentMethodLabel, activeFuels } = calculations;
  const [authDate, authTime] = invoice.dataEmissao ? invoice.dataEmissao.split(' ') : ['---', '---'];
  const cleanProtocol = invoice.protocolo ? invoice.protocolo.replace(/[^0-9]/g, '').slice(0, 15) : '';

  const baseFontSize = width === '58mm' ? '9px' : '10px';

  return (
    <div className="flex flex-col w-full mx-auto box-border bg-white text-black border border-black print:border-black print:border-solid" 
         style={{ 
           maxWidth: width, 
           minHeight: '100px',
           margin: '0 auto',
           fontFamily: 'Arial, Helvetica, sans-serif', 
           fontSize: baseFontSize, 
           lineHeight: '1.3' 
         }}>
      
      {/* 1. CABEÇALHO */}
      <div className="w-full border-b border-black px-1 py-2 text-center">
        <div className="font-bold italic mb-1" style={{ fontSize: '1.4em' }}>NFC-e</div>
        <div className="font-bold uppercase mb-1 leading-tight text-[1.1em]">{posto.razaoSocial || 'POSTO EXEMPLO LTDA'}</div>
        <div className="flex justify-between items-center text-[0.9em] uppercase mb-1 font-bold px-1">
           <span>CNPJ: {posto.cnpj}</span>
           <span>IE: {posto.inscEstadual}</span>
        </div>
        <div className="text-[0.9em] uppercase whitespace-pre-line font-normal leading-tight px-1">{posto.endereco || 'ENDEREÇO NÃO INFORMADO'}</div>
      </div>

      {/* 2. INFO DANFE */}
      <div className="w-full border-b border-black px-1 py-1 text-center bg-white">
        <div className="text-[0.9em] font-bold leading-tight uppercase py-1">
           DANFE NFC-e - Documento Auxiliar<br/>de Nota Fiscal de Consumidor Eletrônica
        </div>
        <div className="text-[0.8em] font-normal text-black pb-1">
           NFC-e não permite aproveitamento de crédito de ICMS
        </div>
      </div>

      {/* 3. ITENS */}
      <div className="w-full border-b border-black px-1 pt-3 pb-1">
         <div className="flex font-bold text-[0.9em] mb-1 pb-2 border-b border-black items-end leading-none">
            <span className="w-[10%]">It.</span>
            <span className="w-[15%]">Cód.</span>
            <span className="flex-1 px-1">Desc.</span>
            <span className="w-[15%] text-right">Qtd</span>
            <span className="w-[10%] text-center">Un</span>
            <span className="w-[15%] text-right">Unit</span>
            <span className="w-[17%] text-right">Total</span>
         </div>
         <div className="flex flex-col gap-0 pt-1">
           {activeFuels.map((item: any, idx: number) => (
             <div key={idx} className="flex text-[0.9em] items-start font-normal leading-tight py-1">
                <span className="w-[10%]">{idx + 1}</span>
                <span className="w-[15%] pr-1 break-all">{item.code}</span>
                <span className="flex-1 px-1 uppercase whitespace-normal leading-none">{item.name}</span>
                <span className="w-[15%] text-right whitespace-nowrap">{to3Decimals(item.q)}</span>
                <span className="w-[10%] text-center text-[0.8em]">{item.unit}</span>
                <span className="w-[15%] text-right">{to3Decimals(item.p)}</span>
                <span className="w-[17%] text-right font-semibold">{toCurrency(item.t)}</span>
             </div>
           ))}
         </div>
      </div>

      {/* 4. TOTAIS */}
      <div className="w-full border-b border-black px-2 py-2">
        <div className="flex justify-between text-[1em] font-normal mb-1">
           <span>Qtd. Total de Itens</span>
           <span>{activeFuels.length}</span>
        </div>
        <div className="flex justify-between text-[1.1em] font-bold mb-1">
           <span>Valor Total R$</span>
           <span>{toCurrency(rawTotal)}</span>
        </div>
        <div className="flex justify-between text-[1em] mb-2">
           <span>Desconto R$</span>
           <span>0,00</span>
        </div>
        
        <div className="flex justify-between text-[1.2em] font-bold mb-1">
           <span>Valor a Pagar R$</span>
           <span>{toCurrency(rawTotal)}</span>
        </div>
        
        <div className="flex justify-between text-[1.1em] items-center mb-1">
           <span className="capitalize font-bold">{paymentMethodLabel}</span>
           <span className="font-bold">{toCurrency(rawTotal)}</span>
        </div>

        <div className="flex justify-between text-[0.9em] font-bold pt-1">
           <span>Valor Total Tributos</span>
           <span>{toCurrency(valTotalTributos)}</span>
        </div>
      </div>
      
      {/* 5. INFO ADICIONAL */}
      <div className="w-full border-b border-black px-2 py-2">
        <div className="text-center text-[0.9em] font-bold uppercase mb-2">INFORMAÇÕES ADICIONAIS</div>
        
        {(invoice.placa || invoice.km || invoice.motorista || invoice.operador) && (
          <div className="text-center text-[0.9em] font-bold uppercase mb-2 leading-tight flex flex-wrap justify-center gap-x-3 gap-y-1 border border-black p-2 rounded-sm mx-1">
             {invoice.placa && <span>PLACA: {invoice.placa}</span>}
             {invoice.km && <span>KM: {invoice.km}</span>}
             {(invoice.placa || invoice.km) && (invoice.motorista || invoice.operador) && <span className="w-full h-0"></span>}
             {invoice.motorista && <span>MOT: {invoice.motorista}</span>}
             {invoice.operador && <span>OP: {invoice.operador}</span>}
          </div>
        )}

        <div className="text-center text-[0.9em] leading-tight text-black">
           Trib: R$ {toCurrency(valFederal)} Fed, R$ {toCurrency(valEstadual)} Est, R$ {toCurrency(valMunicipal)} Mun
        </div>
      </div>

      {/* 6. EMISSÃO */}
      {invoice.chaveAcesso ? (
        <>
          <div className="w-full border-b border-black text-center">
            <div className="font-bold text-[1em] uppercase tracking-wide border-b border-black py-1 mb-2 w-full block">EMISSÃO NORMAL</div>
            <div className="px-2 pb-2">
                <div className="text-[0.9em] font-bold mb-1">N.º: {invoice.numero} &nbsp;&nbsp; Série: {invoice.serie}</div>
                <div className="text-[0.9em] font-bold mb-2">Emissão: {authDate} {authTime} - Via Consumidor</div>
                
                <div className="text-[0.9em] font-bold mb-1">Consulte pela Chave de Acesso em:</div>
                <div className="text-[0.8em] font-normal mb-2 py-1 text-center leading-tight break-all">
                   http://www.nfce.sefaz.ma.gov.br/portal/consultarNFe.do?method=preFilterCupom
                </div>
                
                <div className="font-bold mb-1 text-[0.9em] uppercase mt-2">CHAVE DE ACESSO</div>
                <div className="text-[0.9em] font-sans font-bold leading-tight px-0 whitespace-nowrap tracking-tight py-1 rounded scale-x-90 origin-center">
                   {invoice.chaveAcesso.replace(/\s/g, '').match(/.{1,4}/g)?.join(' ')}
                </div>
            </div>
          </div>
          
          <div className="w-full border-b border-black py-2 font-bold uppercase text-[1em] text-center bg-white">
             {layout.customTexts.consumerLabel || 'CONSUMIDOR NÃO IDENTIFICADO'}
          </div>
        </>
      ) : null}

      {/* 7. QR CODE */}
      {(qrCodeImageUrl || cleanProtocol) && (
        <div className="w-full px-2 py-3 text-center">
            {qrCodeImageUrl && (
              <div className="flex flex-col items-center justify-center mb-1">
                 <div className="text-[0.9em] font-bold mb-1">Consulta via leitor de QR Code</div>
                 <img src={qrCodeImageUrl} alt="QR Code" className="w-32 h-32 object-contain border border-black p-1 bg-white" />
              </div>
            )}
            {cleanProtocol && (
              <div className="text-[0.9em] font-bold tracking-tight mt-1">
                Protocolo Autorização: {cleanProtocol}<br/>
                {authDate} {authTime}
              </div>
            )}
        </div>
      )}
    </div>
  );
};


// ==========================================
// RENDERIZADOR 2: MODELO TÉRMICO REAL (Epson/Bematech Style)
// ==========================================
const ThermalRealReceipt: React.FC<{ data: any; layout: LayoutConfig; width: PaperWidth }> = ({ data, layout, width }) => {
  const { posto, invoice, calculations } = data;
  const { rawTotal, valTotalTributos, valFederal, valEstadual, valMunicipal, qrCodeImageUrl, paymentMethodLabel, activeFuels } = calculations;
  const [authDate, authTime] = invoice.dataEmissao ? invoice.dataEmissao.split(' ') : ['---', '---'];
  
  const baseFontSize = width === '58mm' ? '9px' : '10px';

  const DashedLine = () => (
    <div className="w-full border-b border-black border-dashed my-3" style={{ borderWidth: '1px' }} />
  );

  return (
    <div className={`flex flex-col bg-white text-black font-mono leading-relaxed p-4 print:p-0 print:w-full`}
         style={{ maxWidth: width, margin: '0 auto', fontSize: baseFontSize }}>
      <div className="text-center mb-2">
         {posto.cnpj && <div className="font-bold">CNPJ: {posto.cnpj.replace(/\D/g,'').replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")}</div>}
         <div className="font-bold whitespace-pre-line text-[1.1em] my-1">{posto.razaoSocial}</div>
         <div className="whitespace-pre-line leading-tight">{posto.endereco}</div>
      </div>
      <div className="text-center mb-1 font-bold whitespace-pre-wrap leading-tight">{layout.customTexts.headerTitle}</div>
      
      {layout.customTexts.subHeader && (
        <div className="text-center mb-1 font-bold uppercase whitespace-pre-wrap leading-tight text-[1.1em] scale-y-110">
           {layout.customTexts.subHeader}
        </div>
      )}

      <DashedLine />
      <div className="w-full">
         <div className="flex mb-2 font-bold border-b border-black border-dashed pb-1">
            <span className="w-[15%]">COD</span>
            <span className="flex-1">DESCRIÇÃO</span>
            <span className="w-[20%] text-right">R$</span>
         </div>
         <div className="flex text-[0.9em] mb-1">
            <span className="flex-1">Qtde. Un.</span>
            <span className="w-[40%] text-right">Valor unit. Valor total</span>
         </div>
         <DashedLine />
         {activeFuels.map((item: any, idx: number) => (
             <div key={idx} className="mb-2">
                <div className="flex font-bold">
                   <span className="w-[15%]">{item.code}</span>
                   <span className="flex-1 truncate">{item.name}</span>
                </div>
                <div className="flex text-[0.9em] justify-end">
                   <span>{to3Decimals(item.q).replace('.',',')} {item.unit} X {to3Decimals(item.p).replace('.',',')} &nbsp;&nbsp; {toCurrency(item.t)}</span>
                </div>
             </div>
         ))}
      </div>
      <DashedLine />
      <div className="flex justify-between font-bold">
         <span>Qtde. total de itens</span>
         <span>{activeFuels.length.toString().padStart(3, '0')}</span>
      </div>
      <div className="flex justify-between font-bold text-[1.3em] mt-2 uppercase">
         <span>Valor total R$</span>
         <span>{toCurrency(rawTotal)}</span>
      </div>
      <div className="flex justify-between mt-2 font-bold uppercase">
         <span>FORMA DE PAGAMENTO</span>
         <span>VALOR PAGO R$</span>
      </div>
      <div className="flex justify-between">
         <span className="capitalize">{paymentMethodLabel}</span>
         <span>{toCurrency(rawTotal)}</span>
      </div>
      <DashedLine />
      <div className="text-center mb-2 leading-tight text-[0.9em] whitespace-pre-wrap">
         {layout.customTexts.footerMessage}
      </div>
      
      {invoice.chaveAcesso && (
         <>
            {!layout.customTexts.footerMessage?.includes('http') && (
               <div className="text-center text-[0.8em] mb-1">Consulte pela Chave de Acesso em<br/>www.sefaz.ma.gov.br/nfce/consulta</div>
            )}
            <div className="text-center font-bold mb-2 break-all px-2 tracking-wide text-[0.85em] leading-tight">{invoice.chaveAcesso.replace(/\s/g, '').match(/.{1,4}/g)?.join(' ')}</div>
            <div className="text-center mb-2 font-bold uppercase text-[1.1em]">{layout.customTexts.consumerLabel}</div>
            <div className="text-center mb-2 text-[0.9em]">NFC-e n {invoice.numero} Série {invoice.serie} {authDate} {authTime} Via Empresa</div>
         </>
      )}

      {layout.customTexts.subHeader && (
        <div className="text-center mb-2 font-bold uppercase whitespace-pre-wrap leading-tight text-[1.1em] scale-y-110">
           {layout.customTexts.subHeader}
        </div>
      )}

      {invoice.protocolo && <div className="text-center mb-2">Prot: {invoice.protocolo}</div>}
      
      {qrCodeImageUrl && (
         <div className="flex justify-center mb-2 mt-2">
            <img src={qrCodeImageUrl} alt="QR Code" className="w-32 h-32 object-contain rendering-pixelated" />
         </div>
      )}

      <div className="text-center font-bold uppercase text-[0.9em] space-y-1 mt-2">
         {invoice.placa && <div>PLACA: {invoice.placa}</div>}
         {invoice.km && <div>KM: {invoice.km} MED:{toCurrency(rawTotal / parseFloat(invoice.km || '1') * 10)}</div>} 
         {invoice.operador && <div>OPERADOR: {invoice.operador}</div>}
      </div>

      <div className="text-center text-[0.9em] mt-2 whitespace-pre-wrap leading-tight">
         {layout.customTexts.taxLabel || `ICMS monofasico sobre combustiveis cobrado anteriormente conform e Convenio ICMS 126/2024 e/ou 15/2023.`}
      </div>

      <div className="text-center text-[0.9em] mt-1">
         Trib aprox: Federal:R${toCurrency(valFederal)} Estadual:R${toCurrency(valEstadual)} Municipal:R${toCurrency(valMunicipal)}
      </div>
      <div className="text-center text-[0.9em]">Fonte: IBPT 25.2.H</div>

      {invoice.detalheCodigo && (
         <div className="text-center text-[0.9em] mt-2 font-bold whitespace-pre-line">
            {invoice.detalheCodigo}
         </div>
      )}
    </div>
  );
};

// ==========================================
// RENDERIZADOR 3: MODELO GUIMARÃES
// ==========================================
const GuimaraesReceipt: React.FC<{ data: any; layout: LayoutConfig; width: PaperWidth }> = ({ data, layout, width }) => {
  const { posto, invoice, calculations } = data;
  const { rawTotal, valTotalTributos, valFederal, valEstadual, valMunicipal, qrCodeImageUrl, paymentMethodLabel, activeFuels } = calculations;
  const [authDate, authTime] = invoice.dataEmissao ? invoice.dataEmissao.split(' ') : ['---', '---'];
  
  const baseFontSize = width === '58mm' ? '9px' : '10px';

  const DashedSeparator = () => (
    <div className="w-full border-b border-dashed border-black my-3" style={{ borderWidth: '1px', borderStyle: 'dashed' }}></div>
  );

  return (
    <div className="flex flex-col bg-[#fcfcfc] text-black p-4 print:p-0 print:w-full"
         style={{ maxWidth: width, margin: '0 auto', fontFamily: "'Courier New', Courier, monospace", fontSize: baseFontSize, lineHeight: '1.3' }}>
      
      {/* CABEÇALHO */}
      <div className="text-center mb-2 leading-tight font-bold">
         {posto.cnpj && <div className="mb-1">CNPJ: {posto.cnpj.replace(/\D/g,'').replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")}</div>}
         <div className="font-bold my-1 whitespace-pre-line text-[1.1em]">{posto.razaoSocial}</div>
         <div className="whitespace-pre-line">{posto.endereco}</div>
      </div>

      <div className="text-center mb-1 font-bold leading-tight" style={{ fontSize: '1.1em' }}>
         {layout.customTexts.headerTitle}
      </div>

      <DashedSeparator />

      <div className="w-full mb-1 font-bold">
         <div className="flex mb-1">
            <span className="w-[15%]">COD</span>
            <span className="flex-1 text-center pr-2">DESCRIÇÃO</span>
            <span className="w-[18%] text-right">TOTAL</span>
         </div>
         <div className="flex mb-1 justify-between text-[0.9em] pb-1">
            <span className="pl-[5%]">QTD. UN.</span>
            <span className="pr-[18%]">VL. UNIT</span>
         </div>
         
         <DashedSeparator />
         
         {activeFuels.map((item: any, idx: number) => {
             const itemPct = item.t / rawTotal;
             const iFed = valFederal * itemPct;
             const iEst = valEstadual * itemPct;
             
             return (
             <div key={idx} className="mb-3 leading-tight">
                <div className="flex font-bold">
                   <div className="w-[12%]">{item.code}</div>
                   <div className="flex-1">{item.name}</div>
                </div>
                <div className="flex justify-between pl-[10px] mt-1">
                    <div className="flex gap-2 text-[0.95em]">
                      <span>{to3Decimals(item.q).replace('.',',')} {item.unit}</span>
                      <span className="pl-2">{to3Decimals(item.p).replace('.',',')}</span>
                    </div>
                    <span className="font-bold">{toCurrency(item.t)}</span>
                </div>
                <div className="text-[0.85em] pl-[10px] font-normal mt-0.5 text-black">
                   Trib. R$: {toCurrency(iFed)} Fed, {toCurrency(iEst)} Est
                </div>
             </div>
             );
         })}
      </div>

      <DashedSeparator />

      <div className="flex justify-between font-bold mb-1">
         <span>Qtde. Total de Itens</span>
         <span>{to3Decimals(activeFuels.length).replace(',000',',000')}</span> 
      </div>
      <div className="flex justify-between font-bold mt-1 text-[1.2em]">
         <span>Valor Total R$</span>
         <span>{toCurrency(rawTotal)}</span>
      </div>
      
      <div className="flex justify-between mt-2 font-bold">
         <span>FORMA PAGAMENTO</span>
         <span>VALOR PAGO</span>
      </div>
      <div className="flex justify-between font-bold">
         <span>{paymentMethodLabel}</span>
         <span>{toCurrency(rawTotal)}</span>
      </div>

      <DashedSeparator />

      {invoice.chaveAcesso ? (
        <>
          <div className="text-center mb-1 font-bold mt-2">
             Consulte pela Chave de Acesso em
          </div>
          <div className="text-center mb-2 font-bold break-all leading-tight px-2 text-[0.9em]">
             http://nfce.sefaz.ma.gov.br/portal/consultarNFCe.jsp
          </div>
          
          <div className="text-center mb-2 break-all px-1 tracking-widest text-[1.1em] font-bold leading-tight bg-gray-50 print:bg-white py-1 rounded">
             {invoice.chaveAcesso.replace(/\s/g, '').match(/.{1,4}/g)?.join(' ')}
          </div>

          <div className="text-center font-bold mt-2 mb-2 border-y border-dashed border-black py-2 text-[1.1em]">
             {layout.customTexts.consumerLabel}
          </div>

          <div className="text-center font-bold mb-1 mt-1 text-[1.1em]">
             NFC-e NR: {invoice.numero} Série:{invoice.serie} {authDate} {authTime}
          </div>
        </>
      ) : null}

      {invoice.protocolo && (
        <>
          <div className="text-center font-bold mb-0">
             Protocolo: {invoice.protocolo}
          </div>
          <div className="text-center font-bold mb-1">
             Data: {authDate} {authTime}
          </div>
        </>
      )}

      {qrCodeImageUrl && (
        <div className="flex justify-center mb-2 mt-3">
           <img src={qrCodeImageUrl} alt="QR Code" className="w-32 h-32 object-contain rendering-pixelated" />
        </div>
      )}

      <div className="text-center text-[0.9em] mt-2 font-bold leading-tight">
         Tributos Incidentes (Lei Federal 12.741/12)<br/>
         <span className="text-[1.1em]">Total R$ {toCurrency(valTotalTributos)}</span>
      </div>
      <div className="text-center text-[0.9em] mt-0 font-bold">
         R$: {toCurrency(valFederal)} Federal e {toCurrency(valEstadual)} Estadual
      </div>

      <DashedSeparator />

      <div className="font-bold text-[0.9em] leading-tight mt-1 space-y-1 uppercase">
         {invoice.detalheCodigo && <div>{invoice.detalheCodigo}</div>}
         
         {(invoice.chaveAcesso || invoice.protocolo) && <div>Codigo:[030] IE/RG: []</div>}
         
         {invoice.placa && (
            <div>PLACA: {invoice.placa} ODON: {invoice.km}</div>
         )}
         {invoice.motorista && (
            <div>MOT: {invoice.motorista}</div>
         )}
         {invoice.operador && (
            <div className="text-right">REQ: {invoice.operador}</div>
         )}
         
         {invoice.protocolo && (
            <>
               <div className="text-center mt-3">100 - Autorizado o uso da NF-e</div>
               <div className="text-center text-[1.2em] mt-1">DANFE REIMPRESSÃO</div>
            </>
         )}
         <div className="text-right mt-3 normal-case text-[0.9em] text-black">Adaptive Business - 3.23.02.15 - www.adaptive.com.br</div>
      </div>

    </div>
  );
};


const CouponScreen: React.FC<CouponScreenProps> = ({ postoData, setPostoData, invoiceData, fuels, layouts, onDeleteLayout }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [paperWidth, setPaperWidth] = useState<PaperWidth>('80mm');

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

  const parseTaxInput = (val: string) => parseFloat(val.replace(/\./g, '').replace(',', '.')) || 0;
  
  const pctFederal = parseTaxInput(invoiceData.impostos.federal);
  const pctEstadual = parseTaxInput(invoiceData.impostos.estadual);
  const pctMunicipal = parseTaxInput(invoiceData.impostos.municipal);

  const valFederal = round2(rawTotal * (pctFederal / 100));
  const valEstadual = round2(rawTotal * (pctEstadual / 100));
  const valMunicipal = round2(rawTotal * (pctMunicipal / 100));
  const valTotalTributos = valFederal + valEstadual + valMunicipal;

  const qrCodeImageUrl = invoiceData.urlQrCode ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(invoiceData.urlQrCode)}` : null;
  const paymentMethodLabel = getPaymentLabel(invoiceData.formaPagamento);

  const calcData = { rawTotal, valTotalTributos, valFederal, valEstadual, valMunicipal, qrCodeImageUrl, paymentMethodLabel, activeFuels };
  const fullData = { posto: postoData, invoice: invoiceData, fuels, calculations: calcData };

  // Encontra layout atual
  const currentLayout = layouts.find(l => l.id === postoData.activeLayoutId) || layouts[0];

  const filteredLayouts = layouts.filter(l => 
    l.name.toUpperCase().includes(searchTerm.toUpperCase())
  );

  return (
    <div className="flex flex-col items-center min-h-full pb-10 bg-slate-100/50 dark:bg-transparent">
      
      {/* CONFIGURAÇÃO DE CUPOM (VISÍVEL APENAS NA TELA DE CUPOM) */}
      <div className="w-full max-w-[340px] mb-2 print:hidden mt-2 space-y-2">
         
         <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
               <Settings2 size={16} />
               <span className="text-xs font-bold uppercase">Largura</span>
            </div>
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded border border-slate-200 dark:border-slate-700">
               <button 
                  onClick={() => setPaperWidth('58mm')}
                  className={`px-3 py-1 text-[10px] font-bold rounded transition-colors ${paperWidth === '58mm' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800'}`}
               >
                  58mm
               </button>
               <button 
                  onClick={() => setPaperWidth('80mm')}
                  className={`px-3 py-1 text-[10px] font-bold rounded transition-colors ${paperWidth === '80mm' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800'}`}
               >
                  80mm
               </button>
            </div>
         </div>

         {/* SELETOR DE MODELOS TÉRMICOS */}
         <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1">
                <Layout size={14} /> Estilo do Cupom
              </label>
            </div>

            <div className="relative mb-3">
               <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Search size={14} />
               </div>
               <input 
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
                  placeholder="BUSCAR ESTILO..."
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
            
            <div className="flex gap-2 overflow-x-auto pt-4 pb-2 px-1 no-scrollbar snap-x">
              {filteredLayouts.length === 0 && (
                 <div className="w-full text-center py-4 text-xs text-slate-400 italic border border-dashed border-slate-200 dark:border-slate-700 rounded">
                    Nenhum estilo encontrado.
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
      </div>

      <div className="text-[10px] text-slate-400 mt-2 mb-2 uppercase tracking-wider font-bold print:hidden flex items-center gap-1">
         <CheckCircle2 size={12} className="text-green-500" />
         Visualização de Cupom
      </div>

      {/* ÁREA DE VISUALIZAÇÃO COM CONTAINER DE ALTO CONTRASTE */}
      <div className="w-fit bg-white p-3 rounded-xl shadow-lg border border-slate-200 mb-4 flex justify-center print:bg-transparent print:p-0 print:border-none print:shadow-none print:w-full print:max-w-none print:block">
        <div 
          id="printable-receipt"
          className="relative box-border transition-all print:shadow-none print:m-0 print:w-full print:absolute print:top-0 print:left-0"
          style={{ width: 'fit-content' }} 
        >
          {/* RENDERIZAÇÃO CONDICIONAL DO MODELO TÉRMICO */}
          {currentLayout.id === 'modelo_termico_real' || currentLayout.id === 'modelo_almeida' ? (
             <ThermalRealReceipt data={fullData} layout={currentLayout} width={paperWidth} />
          ) : currentLayout.id === 'modelo_guimaraes' ? (
             <GuimaraesReceipt data={fullData} layout={currentLayout} width={paperWidth} />
          ) : (
             <StandardReceipt data={fullData} layout={currentLayout} width={paperWidth} />
          )}
        </div>
      </div>

      <div className="mt-4 text-[10px] text-slate-400 dark:text-slate-500 print:hidden text-center max-w-[300px]">
        <Printer size={16} className="mx-auto mb-1 opacity-50" />
        Documento formatado para impressão térmica.
      </div>

    </div>
  );
};

export default CouponScreen;