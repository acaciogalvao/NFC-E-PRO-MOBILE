import React from 'react';
import { PostoData, InvoiceData, FuelItem } from '../types';

interface NoteScreenProps {
  postoData: PostoData;
  invoiceData: InvoiceData;
  fuels: FuelItem[];
}

const NoteScreen: React.FC<NoteScreenProps> = ({ postoData, invoiceData, fuels }) => {
  // --- Parsing and Formatting Helpers ---
  const parseLocaleNumber = (val: string) => {
    if (!val) return 0;
    return parseFloat(val.replace(/\./g, '').replace(',', '.')) || 0;
  };

  const toCurrency = (val: number) => 
    val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
  // Format exactly like the photo (3 decimals for quantity and unit price)
  const to3Decimals = (val: number) =>
    val.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });

  // Calculate Totals
  const rawTotal = fuels.reduce((acc, fuel) => {
    return acc + (parseLocaleNumber(fuel.quantity) * parseLocaleNumber(fuel.unitPrice));
  }, 0);

  // Calculate Taxes based on configured percentages
  const parseTax = (val: string) => parseFloat(val.replace(',', '.')) || 0;
  const valFederal = rawTotal * (parseTax(invoiceData.impostos.federal) / 100);
  const valEstadual = rawTotal * (parseTax(invoiceData.impostos.estadual) / 100);
  const valMunicipal = rawTotal * (parseTax(invoiceData.impostos.municipal) / 100);
  const valTotalTributos = valFederal + valEstadual + valMunicipal;

  // QR Code URL
  const qrCodeImageUrl = invoiceData.urlQrCode 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(invoiceData.urlQrCode)}`
    : null;

  // Split address into lines if needed or display as block
  const addressLines = (postoData.endereco || '').split('\n');

  return (
    <div className="flex justify-center items-start min-h-full pb-10">
      
      {/* Thermal Paper Container */}
      <div 
        className="bg-white w-full max-w-[360px] p-2 text-slate-900 leading-tight shadow-2xl relative"
        style={{ fontFamily: "Arial, sans-serif" }} // Using Arial to match the Sans-serif photo look
      >
        
        {/* === HEADER BOX === */}
        <div className="border border-black p-1 mb-1">
          <h1 className="text-center font-bold text-lg mb-1">NFC-e</h1>
          
          <div className="text-[11px] font-bold uppercase">
            <p className="mb-0.5">{postoData.razaoSocial || 'POSTO ICCAR LTDA'}</p>
            <p className="mb-0.5">
              CNPJ: {postoData.cnpj} <span className="ml-2">Insc. Estadual: {postoData.inscEstadual}</span>
            </p>
            {addressLines.map((line, i) => (
              <p key={i} className="mb-0.5">{line}</p>
            ))}
          </div>

          <div className="border-t border-black my-1"></div>

          <div className="text-center text-[11px] font-bold">
            <p>DANFE NFC-e - Documento Auxiliar de Nota Fiscal de Consumidor Eletrônica</p>
          </div>

          <div className="text-center text-[10px] mt-1 font-normal">
            NFC-e não permite aproveitamento de crédito de ICMS
          </div>
        </div>

        {/* === ITEMS TABLE === */}
        <div className="border border-black border-t-0 p-1 mb-1 relative -mt-2 pt-2">
          {/* Table Header */}
          <div className="flex text-[10px] mb-1 border-b border-black pb-0.5">
             <div className="w-4 text-left">It.</div>
             <div className="w-8 text-left">Cód.</div>
             <div className="flex-1 text-left">Descrição</div>
             <div className="w-10 text-right">Qtde</div>
             <div className="w-6 text-center">Un</div>
             <div className="w-10 text-right">Vl.Unit</div>
             <div className="w-12 text-right">Vl.Total</div>
          </div>

          {/* Table Rows */}
          <div className="text-[10px]">
            {fuels.map((item, idx) => {
               const q = parseLocaleNumber(item.quantity);
               const p = parseLocaleNumber(item.unitPrice);
               const t = q * p;
               return (
                <div key={idx} className="flex mb-1">
                  <div className="w-4 text-left">{idx + 1}</div>
                  <div className="w-8 text-left">{item.code}</div>
                  <div className="flex-1 text-left uppercase truncate">{item.name}</div>
                  <div className="w-10 text-right">{to3Decimals(q)}</div>
                  <div className="w-6 text-center">{item.unit}</div>
                  <div className="w-10 text-right">{to3Decimals(p)}</div>
                  <div className="w-12 text-right">{toCurrency(t)}</div>
                </div>
               );
            })}
          </div>
        </div>

        {/* === TOTALS SECTION === */}
        <div className="border border-black border-t-0 p-1 mb-1 relative -mt-2 pt-2 bg-slate-100/50">
           <div className="text-[11px] leading-snug">
              <div className="flex justify-between">
                <span>Qtd. Total de Itens</span>
                <span>{fuels.length}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Valor Total R$</span>
                <span>{toCurrency(rawTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Valor Desconto R$</span>
                <span>0,00</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Valor a Pagar R$</span>
                <span>{toCurrency(rawTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Dinheiro</span>
                <span>{toCurrency(rawTotal)}</span>
              </div>
              <div className="flex justify-between text-[10px] mt-1">
                <span>Valor Total Tributos (Lei 12.741/2012)</span>
                <span>{toCurrency(valTotalTributos)}</span>
              </div>
           </div>
        </div>

        {/* === TAX INFO BOX === */}
        <div className="border border-black p-1 text-center mb-1">
          <p className="text-[10px] font-bold uppercase mb-1">INFORMAÇÕES ADICIONAIS DE INTERESSE DO CONTRIBUINTE</p>
          <div className="text-[10px] leading-tight text-slate-700">
             <p>Placa: {invoiceData.placa} KM: {invoiceData.km}</p>
             <p>Total Impostos Federais: R$ {toCurrency(valFederal)}</p>
             <p>Total Impostos Estaduais: R$ {toCurrency(valEstadual)}</p>
             <p>Total Impostos Municipais: R$ {toCurrency(valMunicipal)} (aprox. 0%)</p>
          </div>
        </div>

        {/* === FOOTER EMISSION INFO === */}
        <div className="border border-black p-1 text-center mb-1 bg-slate-100/50">
          <p className="font-bold text-[11px] uppercase border-b border-black pb-1 mb-1">EMISSÃO NORMAL</p>
          <div className="text-[10px] font-bold">
             N.º: {invoiceData.numero} Série: {invoiceData.serie} Emissão: {invoiceData.dataEmissao}
             <br/>
             Via Consumidor
          </div>
          <div className="text-[10px] mt-2">
             <p>Consulte pela Chave de Acesso em:</p>
             <p className="break-all">http://www.nfce.sefaz.ma.gov.br/portal/consultaNFe.do? method=preFilterCupom</p>
          </div>
          <div className="mt-2 text-[10px]">
             <p className="font-bold uppercase">CHAVE DE ACESSO</p>
             <p className="font-normal tracking-wide">{invoiceData.chaveAcesso}</p>
          </div>
        </div>

        {/* === CONSUMER ID === */}
        <div className="border border-black p-1 text-center font-bold text-[11px] uppercase mb-4 bg-slate-100/50">
           CONSUMIDOR NÃO IDENTIFICADO
        </div>

        {/* === QR CODE SECTION (Bottom) === */}
        <div className="flex flex-col items-center justify-center">
            {/* The photo has QR code at bottom or side, usually bottom for long receipts */}
            <div className="w-32 h-32 mb-1">
               {qrCodeImageUrl && <img src={qrCodeImageUrl} alt="QR Code" className="w-full h-full object-contain" />}
            </div>
            <p className="text-[10px] text-center">Consulta via Leitor de QR Code</p>
            <div className="text-[9px] text-right w-full mt-2 pr-2 text-slate-500 origin-bottom-right rotate-0">
               Protocolo Autorização: {invoiceData.protocolo}
            </div>
        </div>

      </div>
    </div>
  );
};

export default NoteScreen;