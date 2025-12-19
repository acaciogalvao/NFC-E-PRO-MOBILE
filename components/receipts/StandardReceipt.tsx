import React from 'react';
import { LayoutConfig, ReceiptData } from '../../types';
import { toCurrency, to3Decimals, NFCE_PORTAL_URL } from '../../utils/formatters';

interface ReceiptProps {
  data: ReceiptData;
  layout: LayoutConfig;
  width: '58mm' | '80mm';
}

const StandardReceipt: React.FC<ReceiptProps> = ({ data, layout, width }) => {
  const { posto, invoice, calculations } = data;
  const { rawTotal, valTotalTributos, valFederal, valEstadual, activeFuels, qrCodeImageUrl, paymentMethodLabel } = calculations;

  // Configurações de fonte baseadas na largura do papel
  const fontSize = width === '58mm' ? 'text-[7px]' : 'text-[9px]';
  const headerFontSize = width === '58mm' ? 'text-[10px]' : 'text-[12px]';
  const tableFontSize = width === '58mm' ? 'text-[6px]' : 'text-[8.5px]';
  const safePadding = "px-3";

  const cleanKey = (invoice.chaveAcesso || '').replace(/\D/g, '');
  const formattedKey = cleanKey.length === 44 
    ? cleanKey.replace(/(\d{4})/g, '$1 ').trim()
    : '0000 0000 0000 0000 0000 0000 0000 0000 0000 0000 0000';

  const addressLines = (posto.endereco || '').split('\n');

  // Definição de colunas para o estilo "tabela densa"
  const colWidths = {
    it: 'w-[5%]',
    cod: 'w-[10%]',
    desc: 'w-[35%]',
    qty: 'w-[15%]',
    un: 'w-[5%]',
    unit: 'w-[15%]',
    total: 'w-[15%]'
  };

  return (
    <div 
      style={{ maxWidth: width, minWidth: width }} 
      className="bg-white text-black font-sans leading-tight text-center flex flex-col border border-black overflow-hidden py-1"
    >
      {/* SEÇÃO 1: CABEÇALHO PRINCIPAL */}
      <div className={`py-1 border-b border-black flex flex-col items-center justify-center ${safePadding}`}>
        <div className="font-black text-[20px] uppercase tracking-tighter leading-none mb-1">NFC-e</div>
        <div className={`font-black ${headerFontSize} uppercase leading-tight`}>{posto.razaoSocial}</div>
        <div className={`${fontSize} font-bold mt-0.5`}>
          CNPJ: {posto.cnpj} &nbsp;&nbsp; Insc. Estadual: {posto.inscEstadual || 'ISENTO'}
        </div>
        <div className={`${fontSize} font-bold leading-tight`}>
          {addressLines.map((line: string, i: number) => (
            <div key={i}>{line.trim()}</div>
          ))}
        </div>
      </div>

      {/* SEÇÃO 2: TÍTULO DO DOCUMENTO */}
      <div className={`py-1.5 border-b border-black flex flex-col items-center justify-center ${safePadding}`}>
        <div className="font-black text-[9px] uppercase leading-tight">
          DANFE NFC-e - Documento Auxiliar de Nota Fiscal<br/>de Consumidor Eletrônica
        </div>
        <div className="text-[7px] font-bold mt-1 leading-tight">
          {layout.customTexts.subHeader || 'NFC-e não permite aproveitamento de crédito de ICMS'}
        </div>
      </div>

      {/* SEÇÃO 3: CABEÇALHO DA TABELA */}
      <div className={`border-b border-black h-7 flex items-center justify-center ${safePadding}`}>
        <div className={`flex w-full font-black ${tableFontSize} leading-none text-left`}>
          <span className={colWidths.it}>It.</span>
          <span className={colWidths.cod}>Cód.</span>
          <span className={colWidths.desc}>Descrição</span>
          <span className={`${colWidths.qty} text-right`}>Qtde</span>
          <span className={`${colWidths.un} text-center`}>Un</span>
          <span className={`${colWidths.unit} text-right`}>Vl.Unit</span>
          <span className={`${colWidths.total} text-right`}>Vl.Total</span>
        </div>
      </div>
        
      {/* SEÇÃO 4: LISTA DE PRODUTOS */}
      <div className={`border-b border-black py-0.5 ${safePadding}`}>
        {activeFuels.map((item: any, idx: number) => (
          <div key={idx} className={`flex w-full items-start py-1 ${tableFontSize} font-bold text-left leading-tight`}>
            <span className={colWidths.it}>{idx + 1}</span>
            <span className={colWidths.cod}>{item.code}</span>
            <span className={`${colWidths.desc} pr-1 break-words`}>{item.name}</span>
            <span className={`${colWidths.qty} text-right`}>{to3Decimals(item.q)}</span>
            <span className={`${colWidths.un} text-center`}>{item.unit}</span>
            <span className={`${colWidths.unit} text-right`}>{to3Decimals(item.p)}</span>
            <span className={`${colWidths.total} text-right`}>{toCurrency(item.t)}</span>
          </div>
        ))}
      </div>

      {/* SEÇÃO 5: TOTAIS E PAGAMENTO */}
      <div className={`py-2 border-b border-black space-y-0.5 ${safePadding} text-left`}>
        <div className={`flex justify-between ${fontSize} font-bold`}>
          <span>Qtd. Total de Itens</span>
          <span>{activeFuels.length}</span>
        </div>
        <div className={`flex justify-between ${fontSize} font-bold`}>
          <span>Valor Total R$</span>
          <span>{toCurrency(rawTotal)}</span>
        </div>
        <div className={`flex justify-between ${fontSize} font-bold`}>
          <span>Valor Desconto R$</span>
          <span>0,00</span>
        </div>
        <div className={`flex justify-between ${fontSize} font-black pt-0.5 border-t border-black/5`}>
          <span>Valor a Pagar R$</span>
          <span>{toCurrency(rawTotal)}</span>
        </div>
        <div className={`flex justify-between ${fontSize} font-black`}>
          <span className="uppercase">{paymentMethodLabel}</span>
          <span>{toCurrency(rawTotal)}</span>
        </div>
        <div className={`flex justify-between ${fontSize} font-bold pt-1 opacity-80`}>
          <span className="text-[7.5px]">Valor Total Tributos (Lei 12.741/2012)</span>
          <span className="text-[7.5px]">{toCurrency(valTotalTributos)}</span>
        </div>
      </div>

      {/* SEÇÃO 6: INFORMAÇÕES ADICIONAIS */}
      <div className={`py-2 border-b border-black space-y-1 ${safePadding}`}>
        <div className="font-black text-[8.5px] uppercase tracking-tight">
          {layout.customTexts.taxLabel || 'INFORMAÇÕES ADICIONAIS DE INTERESSE DO CONTRIBUINTE'}
        </div>
        <div className={`${fontSize} font-bold uppercase`}>
          Placa: {invoice.placa || '---'} KM: {invoice.km || '---'}
        </div>
        <div className={`${fontSize} font-bold leading-tight opacity-90`}>
          Total Impostos Federais: R$ {toCurrency(valFederal)} <br/>
          Total Impostos Estaduais: R$ {toCurrency(valEstadual)} <br/>
          Total Impostos Municipais: R$ 0,00 (aprox. 0%)
        </div>
      </div>

      {/* SEÇÃO 7: STATUS DE EMISSÃO */}
      <div className="py-1.5 border-b border-black font-black text-[10px] uppercase flex items-center justify-center">
        EMISSÃO NORMAL
      </div>

      {/* SEÇÃO 8: DADOS FISCAIS */}
      <div className={`py-3 border-b border-black flex flex-col items-center justify-center space-y-2 ${safePadding}`}>
        <div className="font-black text-[9px] uppercase leading-tight">
          N.º: {invoice.numero || '---'} &nbsp; Série: {invoice.serie || '001'} &nbsp; Emissão: {invoice.dataEmissao}
        </div>
        {/* Via Consumidor Centralizado abaixo da série */}
        <div className="font-black text-[10px] uppercase tracking-widest bg-black/5 py-1 w-full text-center">
          Via Consumidor
        </div>
        <div className="pt-1">
          <div className={`${fontSize} font-bold`}>Consulte pela Chave de Acesso em:</div>
          <div className="lowercase font-bold text-[8.5px] break-all leading-tight mt-1">{NFCE_PORTAL_URL}</div>
        </div>
        <div className="pt-1 w-full">
           <div className="font-black text-[8px] uppercase mb-1">CHAVE DE ACESSO</div>
           <div className="text-[8.5px] tracking-tighter font-black break-all leading-tight px-2">
             {formattedKey}
           </div>
        </div>
      </div>

      {/* SEÇÃO 9: CONSUMIDOR */}
      <div className="py-2 border-b border-black font-black text-[10px] uppercase flex items-center justify-center">
        {layout.customTexts.consumerLabel || 'CONSUMIDOR NÃO IDENTIFICADO'}
      </div>

      {/* SEÇÃO 10: QR CODE - Instrução movida para cima */}
      <div className={`py-5 border-b border-black flex flex-col items-center justify-center ${safePadding}`}>
        <div className="text-[9px] font-black uppercase mb-3 tracking-tight">Consulta via leitor de QR Code</div>
        <div className="bg-white p-1">
          {qrCodeImageUrl && <img src={qrCodeImageUrl} alt="QR Code" className="w-48 h-48" />}
        </div>
      </div>

      {/* SEÇÃO 11: PROTOCOLO FINAL - Nome alterado para Protocolo Autorização */}
      <div className={`py-3 flex flex-col items-center justify-center text-[9px] font-black leading-tight uppercase ${safePadding}`}>
        <div>Protocolo Autorização : {invoice.protocolo || '---'}</div>
        <div className="mt-1">{invoice.dataEmissao}</div>
      </div>
    </div>
  );
};

export default StandardReceipt;