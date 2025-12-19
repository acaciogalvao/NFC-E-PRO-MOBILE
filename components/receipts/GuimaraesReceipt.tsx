
import React from 'react';
import { LayoutConfig, ReceiptData } from '../../types';
import { toCurrency, to3Decimals, NFCE_PORTAL_URL } from '../../utils/formatters';

interface ReceiptProps {
  data: ReceiptData;
  layout: LayoutConfig;
  width: '58mm' | '80mm';
}

const GuimaraesReceipt: React.FC<ReceiptProps> = ({ data, layout, width }) => {
  const { posto, invoice, calculations } = data;
  const { rawTotal, valTotalTributos, valFederal, valEstadual, activeFuels, qrCodeImageUrl, paymentMethodLabel } = calculations;

  const fontSize = width === '58mm' ? 'text-[8.5px]' : 'text-[10px]';
  const smallFontSize = width === '58mm' ? 'text-[7.5px]' : 'text-[9px]';
  const containerPadding = "px-2";

  const cleanKey = (invoice.chaveAcesso || '').replace(/\D/g, '');
  const formattedKey = cleanKey.length === 44 
    ? cleanKey.replace(/(\d{4})/g, '$1 ').trim()
    : '0000 0000 0000 0000 0000 0000 0000 0000 0000 0000 0000';

  const addressLines = (posto.endereco || '').split('\n');

  // Formatação de KM (ODON) conforme foto: 741.779,0
  const kmValue = invoice.km || '0';
  const formattedKm = parseFloat(kmValue.replace(/\D/g, '') || '0').toLocaleString('pt-BR');

  // Código dinâmico do BICO gerado automaticamente
  // Seguindo a sua solicitação: "esse codigo [2] deve ser gerado automaticamente"
  const bicoCode = invoice.bico || ' ';

  return (
    <div 
      style={{ maxWidth: width, minWidth: width }} 
      className="bg-white text-black font-mono leading-tight flex flex-col overflow-hidden py-4 select-none"
    >
      {/* CABEÇALHO - CENTRALIZADO */}
      <div className={`space-y-0.5 ${fontSize} px-1 text-center`}>
        <div>CNPJ: {posto.cnpj}</div>
        <div className="font-bold uppercase leading-tight">{posto.razaoSocial}</div>
        <div className="text-[7.5px] sm:text-[9px] leading-none">
           {addressLines.map((line, i) => (
             <div key={i}>{line.trim()}</div>
           ))}
        </div>
      </div>

      {/* TÍTULO DO DOCUMENTO - CENTRALIZADO */}
      <div className={`${fontSize} py-2 mt-1 text-center whitespace-pre-wrap leading-tight`}>
        Documento Auxiliar<br/>da Nota Fiscal de Consumidor Eletrônica
      </div>

      {/* DIVISOR */}
      <div className="border-t border-black border-dashed w-full my-1"></div>

      {/* CABEÇALHO DA TABELA */}
      <div className={`flex flex-col ${fontSize} ${containerPadding}`}>
        <div className="flex w-full">
          <span className="w-[15%] text-left">CODIGO</span>
          <span className="w-[60%] text-left">DESCRICAO</span>
          <span className="w-[25%] text-right">TOTAL</span>
        </div>
        <div className={`flex w-full ${smallFontSize}`}>
          <span className="w-[15%]"></span>
          <div className="w-[85%] flex">
            <span className="w-[35%] text-left">QTD. UN.</span>
            <span className="w-[65%] text-left pl-2">VL. UNIT(R$)</span>
          </div>
        </div>
      </div>

      {/* DIVISOR */}
      <div className="border-t border-black border-dashed w-full my-1"></div>

      {/* LISTA DE ITENS */}
      <div className={`space-y-2 ${containerPadding}`}>
        {activeFuels.length > 0 ? activeFuels.map((item: any, idx: number) => {
          const itemPctFederal = (valFederal / rawTotal) * item.t;
          const itemPctEstadual = (valEstadual / rawTotal) * item.t;

          return (
            <div key={idx} className={`${fontSize} text-left flex flex-col`}>
              <div className="flex items-start">
                <span className="w-[15%]">{idx + 1}</span>
                <span className="w-[60%] font-bold uppercase truncate pr-1">{item.name}</span>
                <span className="w-[25%] text-right font-bold">{toCurrency(item.t)}</span>
              </div>
              <div className={`${smallFontSize} flex ml-[15%] font-normal`}>
                <span className="w-[35%]">{to3Decimals(item.q)} {item.unit}</span>
                <span className="w-[65%] pl-2">{to3Decimals(item.p)}</span>
              </div>
              <div className={`text-[7.5px] italic opacity-80 mt-0.5 ml-[15%] leading-none`}>
                 Trib. R$: {toCurrency(itemPctFederal)} Federal e {toCurrency(itemPctEstadual)} Estadual
              </div>
            </div>
          );
        }) : (
          <div className={`${fontSize} text-center py-4 text-gray-400 italic`}>Nenhum item adicionado</div>
        )}
      </div>

      {/* DIVISOR */}
      <div className="border-t border-black border-dashed w-full my-1"></div>

      {/* RESUMO TOTAIS */}
      <div className={`py-1 space-y-0.5 ${containerPadding} ${fontSize}`}>
        <div className="flex justify-between items-center">
           <span>Qtde. total de itens</span>
           <span className="text-right">{to3Decimals(activeFuels.reduce((acc, f) => acc + f.q, 0))}</span>
        </div>
        <div className="flex justify-between items-center">
           <span>Valor total R$</span>
           <span className="text-right font-bold">{toCurrency(rawTotal)}</span>
        </div>
        
        <div className="flex justify-between mt-2 text-[8px] sm:text-[9.5px] opacity-70">
           <span>FORMA PAGAMENTO</span>
           <span>VALOR PAGO R$</span>
        </div>
        <div className="flex justify-between items-center">
           <span className="capitalize">{paymentMethodLabel.toLowerCase()}</span>
           <span className="font-bold">{toCurrency(rawTotal)}</span>
        </div>
      </div>

      {/* DIVISOR */}
      <div className="border-t border-black border-dashed w-full my-1"></div>

      {/* CONSULTA */}
      <div className={`py-1 space-y-1 ${containerPadding} ${fontSize} text-center`}>
        <div className="leading-tight">Consulte pela Chave de Acesso em</div>
        <div className="lowercase break-all text-[8px] sm:text-[9px]">{NFCE_PORTAL_URL}</div>
        <div className="text-[9.5px] sm:text-[10.5px] tracking-tight mt-1 font-bold">
           {formattedKey}
        </div>
      </div>

      {/* DIVISOR */}
      <div className="border-t border-black border-dashed w-full my-1"></div>

      {/* CONSUMIDOR */}
      <div className={`py-1 font-bold ${fontSize} uppercase text-center`}>
         CONSUMIDOR NÃO IDENTIFICADO
      </div>

      {/* DIVISOR */}
      <div className="border-t border-black border-dashed w-full my-1"></div>

      {/* DADOS FISCAIS */}
      <div className={`py-1 space-y-0.5 ${containerPadding} ${fontSize} leading-tight text-center`}>
         <div className="font-bold">NFC-e NR: {invoice.numero || '---'} Série:{invoice.serie || '---'} {invoice.dataEmissao}</div>
         <div className="mt-1">
           Protocolo de Autorização: <span className="font-bold">{invoice.protocolo || '---'}</span>
           <br/>
           Data de Autorização: <span className="font-bold">{invoice.dataEmissao || '---'}</span>
         </div>
      </div>

      {/* QR CODE */}
      <div className="flex flex-col items-center justify-center py-4">
         {qrCodeImageUrl && <img src={qrCodeImageUrl} alt="QR Code" className="w-32 h-32 mix-blend-multiply" />}
      </div>

      {/* TRIBUTOS GERAIS */}
      <div className={`py-1 space-y-0.5 ${containerPadding} ${smallFontSize} text-center`}>
         <div>Tributos Incidentes (Lei federal 12.741/12)</div>
         <div className="font-bold">Total R$ {toCurrency(valTotalTributos)}</div>
         <div>R$: {toCurrency(valFederal)} Federal e {toCurrency(valEstadual)} Estadual</div>
      </div>

      {/* DIVISOR RODAPÉ */}
      <div className="border-t border-black border-dashed w-full my-1"></div>

      {/* INFORMAÇÕES TÉCNICAS - CENTRALIZADO (ESTILO ADAPTIVE) */}
      <div className={`py-1 ${containerPadding} ${fontSize} text-center flex flex-col items-center`}>
         <div className="font-bold whitespace-nowrap mb-0.5 tracking-tighter">
            {invoice.detalheCodigo || `#CF:B01 EI0550800,620 EF0550927,830 V0,000`}
         </div>
         
         <div className="space-y-0.5">
            {/* LINHA CODIGO (BICO AUTOMÁTICO) / IE */}
            <div className="flex justify-center gap-2">
               <span>Codigo:[{bicoCode}]</span>
               <span>IE/RG: [{posto.inscEstadual || ' '}]</span>
            </div>
            
            {/* LINHA PLACA / ODON */}
            <div className="flex justify-center gap-2">
               <span>PLACA: {invoice.placa || '---'}</span>
               <span>ODON: {formattedKm},0</span>
            </div>
            
            {/* LINHA MOT / REQ */}
            <div className="flex justify-center">
               <span className="whitespace-pre">MOT: {invoice.motorista?.toUpperCase() || '---'}</span>
               <span className="ml-12">REQ:</span>
            </div>
         </div>

         {/* MENSAGENS FINAIS - CENTRALIZADO */}
         <div className="text-center mt-1.5 space-y-0.5">
            <div className={`${smallFontSize}`}>100 -- Autorizado o uso da NF-e</div>
            <div className={`${smallFontSize} font-bold`}>DANFE REIMPRESSÃO</div>
            <div className="text-[7.5px] sm:text-[9px] mt-2 opacity-80 pt-1 leading-none">
               Adaptive Business - 3.23.02.15 - www.adaptive.com.br
            </div>
         </div>
      </div>
    </div>
  );
};

export default GuimaraesReceipt;
