import React from 'react';
import { LayoutConfig } from '../../types';
import { toCurrency, to3Decimals, NFCE_PORTAL_URL } from '../../utils/formatters';

interface ReceiptProps {
  data: any;
  layout: LayoutConfig;
  width: '58mm' | '80mm';
}

const StandardReceipt: React.FC<ReceiptProps> = ({ data, layout, width }) => {
  const { posto, invoice, calculations } = data;
  const { rawTotal, valTotalTributos, valFederal, valEstadual, activeFuels, qrCodeImageUrl } = calculations;

  const fontSize = width === '58mm' ? 'text-[8px]' : 'text-[10px]';
  const smallText = width === '58mm' ? 'text-[7px]' : 'text-[9px]';
  const safePadding = "px-3"; 

  const cleanKey = (invoice.chaveAcesso || '').replace(/\D/g, '');
  const formattedKey = cleanKey.length === 44 
    ? cleanKey.replace(/(\d{4})/g, '$1 ').trim()
    : '0000 0000 0000 0000 0000 0000 0000 0000 0000 0000 0000';

  const addressLines = (posto.endereco || '').split('\n');
  const [datePart, timePart] = (invoice.dataEmissao || '').split(' ');

  // Definição rigorosa de larguras para alinhamento vertical perfeito entre header e itens
  const colWidths = {
    it: 'w-[10%]',
    cod: 'w-[15%]',
    desc: 'w-[45%]',
    total: 'w-[30%]'
  };

  return (
    <div 
      style={{ maxWidth: width, minWidth: width }} 
      className="bg-white text-black font-sans leading-tight text-center flex flex-col border border-black overflow-hidden"
    >
      {/* TÍTULO NFC-E */}
      <div className={`py-3 border-b border-black flex flex-col items-center justify-center ${safePadding}`}>
        <div className="font-black text-[22px] uppercase tracking-tighter leading-none">NFC-E</div>
      </div>

      {/* DADOS DO ESTABELECIMENTO */}
      <div className={`py-3 border-b border-black flex flex-col items-center justify-center space-y-1 uppercase ${safePadding}`}>
        <div className="font-black text-[11px] leading-tight">{posto.razaoSocial}</div>
        <div className={`${fontSize} font-bold`}>
          CNPJ: {posto.cnpj} &nbsp;&nbsp; IE: {posto.inscEstadual}
        </div>
        <div className={`${fontSize} font-bold leading-tight`}>
          {addressLines.map((line: string, i: number) => (
            <div key={i}>{line.trim()}</div>
          ))}
        </div>
      </div>

      {/* TÍTULO DO DOCUMENTO */}
      <div className={`py-2 border-b border-black flex flex-col items-center justify-center space-y-1 ${safePadding}`}>
        <div className="font-black text-[9px] tracking-tight leading-tight uppercase">
          {layout.customTexts.headerTitle}
        </div>
        {layout.customTexts.subHeader && (
          <div className="text-[8px] italic font-bold leading-tight">
            {layout.customTexts.subHeader}
          </div>
        )}
      </div>

      {/* CABEÇALHO DOS ITENS - CENTRALIZADO ENTRE AS LINHAS */}
      <div className={`border-b border-black h-9 flex items-center justify-center bg-gray-50/5 ${safePadding}`}>
        <div className={`flex w-full font-black ${smallText} leading-none text-center`}>
          <span className={`${colWidths.it}`}>IT</span>
          <span className={`${colWidths.cod}`}>CÓD</span>
          <span className={`${colWidths.desc}`}>DESCRIÇÃO</span>
          <span className={`${colWidths.total}`}>TOTAL(R$)</span>
        </div>
      </div>
        
      {/* LISTA DE ITENS */}
      <div className={`border-b border-black py-1 ${safePadding}`}>
        {activeFuels.map((item: any, idx: number) => (
          <div key={idx} className={`flex flex-col items-center py-2 border-b border-black/5 last:border-0`}>
            {/* Linha Principal do Item - Usando as mesmas larguras do Header */}
            <div className={`flex w-full items-center ${smallText} font-black uppercase text-center`}>
              <span className={`${colWidths.it}`}>{(idx + 1).toString().padStart(2, '0')}</span>
              <span className={`${colWidths.cod}`}>{item.code}</span>
              <span className={`${colWidths.desc} px-1`}>{item.name}</span>
              <span className={`${colWidths.total}`}>{toCurrency(item.t)}</span>
            </div>
            {/* Detalhes do Item (Segunda linha centralizada) */}
            <div className={`${smallText} font-bold opacity-70 mt-1`}>
              {to3Decimals(item.q)} {item.unit} X {to3Decimals(item.p)}
            </div>
          </div>
        ))}
      </div>

      {/* TOTAIS E PAGAMENTO */}
      <div className={`py-3 border-b border-black space-y-1.5 ${safePadding}`}>
        <div className={`flex justify-between ${fontSize} font-bold`}>
          <span>Qtd. Total de Itens</span>
          <span>{activeFuels.length}</span>
        </div>
        <div className={`flex justify-between ${fontSize} font-black border-t border-black/10 pt-1.5`}>
          <span>Valor a Pagar R$</span>
          <span className="text-[14px]">{toCurrency(rawTotal)}</span>
        </div>
        <div className={`flex justify-between ${smallText} font-bold opacity-70`}>
          <span>Valor Total Tributos (Lei 12.741)</span>
          <span>R$ {toCurrency(valTotalTributos)}</span>
        </div>
      </div>

      {/* TIPO DE EMISSÃO */}
      <div className="py-2 border-b border-black font-black text-[11px] uppercase flex items-center justify-center">
        EMISSÃO NORMAL
      </div>

      {/* INFORMAÇÕES ADICIONAIS */}
      <div className={`py-3 border-b border-black flex flex-col items-center justify-center space-y-1 ${safePadding}`}>
        <div className="font-black text-[9px] uppercase tracking-tighter">
          {layout.customTexts.taxLabel}
        </div>
        <div className={`${fontSize} font-bold`}>
          PLACA: {invoice.placa || '---'} &nbsp; KM: {invoice.km || '---'}
        </div>
        <div className={`${smallText} font-bold opacity-90`}>
          Federais: R$ {toCurrency(valFederal)} | Estaduais: R$ {toCurrency(valEstadual)}
        </div>
      </div>

      {/* DADOS FISCAIS DE EMISSÃO */}
      <div className={`py-4 border-b border-black flex flex-col items-center justify-center space-y-2 ${safePadding}`}>
        <div className="font-black text-[9px] uppercase leading-tight">
          N.º {invoice.numero || '---'} SÉRIE {invoice.serie || '001'} <br/> EMISSÃO {invoice.dataEmissao}
        </div>
        <div className="font-black text-[11px] uppercase tracking-widest border-y border-black/5 py-1 w-full">
          VIA CONSUMIDOR
        </div>
        <div className="pt-2">
          <div className={`${smallText} font-bold`}>Consulte pela Chave de Acesso em:</div>
          <div className="lowercase font-bold text-[8.5px] break-all leading-tight mt-1">{NFCE_PORTAL_URL}</div>
        </div>
        <div className="pt-2 w-full">
           <div className="font-black text-[8px] uppercase mb-1">CHAVE DE ACESSO</div>
           <div className="text-[8px] tracking-tighter font-black break-all leading-tight">
             {formattedKey}
           </div>
        </div>
      </div>

      {/* IDENTIFICAÇÃO DO CONSUMIDOR */}
      <div className="py-2 border-b border-black font-black text-[10px] uppercase flex items-center justify-center">
        {layout.customTexts.consumerLabel}
      </div>

      {/* QR CODE */}
      <div className={`py-6 border-b border-black flex flex-col items-center justify-center ${safePadding}`}>
        <div className="text-[9px] font-black uppercase mb-4 tracking-tight">CONSULTA VIA LEITOR DE QR CODE</div>
        <div className="bg-white p-1">
          {qrCodeImageUrl && <img src={qrCodeImageUrl} alt="QR Code" className="w-40 h-40" />}
        </div>
      </div>

      {/* PROTOCOLO FINAL */}
      <div className={`py-4 flex flex-col items-center justify-center text-[9px] font-black leading-tight uppercase ${safePadding}`}>
        <div>PROTOCOLO AUTORIZAÇÃO: {invoice.protocolo || '---'}</div>
        <div className="mt-1">{datePart} &nbsp; {timePart}</div>
      </div>
    </div>
  );
};

export default StandardReceipt;