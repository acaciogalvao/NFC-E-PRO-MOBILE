
import React from 'react';
import { LayoutConfig } from '../../types';
import { toCurrency, to3Decimals } from '../../utils/formatters';

interface ReceiptProps {
  data: any;
  layout: LayoutConfig;
  width: '58mm' | '80mm';
}

const StandardReceipt: React.FC<ReceiptProps> = ({ data, layout, width }) => {
  const { posto, invoice, calculations } = data;
  const { rawTotal, valFederal, valEstadual, valMunicipal, activeFuels, qrCodeImageUrl, paymentMethodLabel } = calculations;

  // Definição de tamanhos baseada na largura da bobina
  const fontSize = width === '58mm' ? 'text-[8px]' : 'text-[9.5px]';
  const headerTitleSize = width === '58mm' ? 'text-[12px]' : 'text-[16px]';
  const tableHeaderSize = width === '58mm' ? 'text-[7px]' : 'text-[8.5px]';

  const formattedKey = invoice.chaveAcesso.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
  const emissionParts = invoice.dataEmissao ? invoice.dataEmissao.split(' ') : ['', ''];
  const timePart = emissionParts[1];

  /**
   * COLUNAS RÍGIDAS PARA ALINHAMENTO VERTICAL PERFEITO
   * px-1 em cada célula garante que o texto não encoste nas linhas imaginárias das colunas
   */
  const colSpecs = {
    it: 'w-[5%] shrink-0 text-left px-1',
    cod: 'w-[10%] shrink-0 text-left px-1',
    desc: 'w-[35%] shrink-0 text-left px-1 whitespace-nowrap overflow-visible', // Nome inteiro sem quebra
    qty: 'w-[15%] shrink-0 text-right px-1',
    un: 'w-[8%] shrink-0 text-center px-1',
    unit: 'w-[12%] shrink-0 text-right px-1',
    tot: 'w-[15%] shrink-0 text-right px-1'
  };

  return (
    <div style={{ maxWidth: width, minWidth: width }} className="bg-white text-black font-thermal leading-none text-center uppercase">
      {/* CONTAINER PRINCIPAL COM BORDA */}
      <div className="border-[1.5px] border-black flex flex-col items-stretch overflow-hidden">
        
        {/* CABEÇALHO DO POSTO */}
        <div className="p-4 border-b border-black flex flex-col gap-1">
          <div className={`font-black ${headerTitleSize} tracking-tighter`}>NFC-e</div>
          <div className="font-bold text-[11px] leading-tight">{posto.razaoSocial}</div>
          <div className={`${fontSize} tracking-tight opacity-90`}>
            CNPJ: {posto.cnpj} &nbsp;&nbsp; IE: {posto.inscEstadual}<br/>
            {posto.endereco}
          </div>
        </div>

        {/* TÍTULO DANFE */}
        <div className="py-3 px-4 border-b border-black">
          <div className={`${fontSize} font-bold leading-tight`}>{layout.customTexts.headerTitle}</div>
          {layout.customTexts.subHeader && (
            <div className="text-[7.5px] mt-1.5 font-medium opacity-80">{layout.customTexts.subHeader}</div>
          )}
        </div>

        {/* HEADER DA TABELA - ALINHADO COM OS ITENS */}
        <div className="border-b border-black bg-white">
           <div className={`flex font-bold px-3 py-2 ${tableHeaderSize} items-center border-b border-black/10`}>
              <span className={colSpecs.it}>IT</span>
              <span className={colSpecs.cod}>CÓD</span>
              <span className={colSpecs.desc}>DESCRIÇÃO</span>
              <span className={colSpecs.qty}>QTDE</span>
              <span className={colSpecs.un}>UN</span>
              <span className={colSpecs.unit}>V.UN</span>
              <span className={colSpecs.tot}>V.TOT</span>
           </div>
        </div>

        {/* LISTA DE PRODUTOS - SEM QUEBRAS E SEM TRUNCATE */}
        <div className="px-3 py-2 text-left bg-white">
           <div className="space-y-1.5">
             {activeFuels.map((item: any, idx: number) => (
                <div key={idx} className={`${fontSize} flex items-center tracking-tighter`}>
                   <span className={colSpecs.it}>{idx + 1}</span>
                   <span className={colSpecs.cod}>{item.code}</span>
                   <span className={`${colSpecs.desc} font-bold`}>{item.name}</span>
                   <span className={colSpecs.qty}>{to3Decimals(item.q)}</span>
                   <span className={colSpecs.un}>{item.unit}</span>
                   <span className={colSpecs.unit}>{toCurrency(item.p)}</span>
                   <span className={colSpecs.tot}>{toCurrency(item.t)}</span>
                </div>
             ))}
           </div>
        </div>

        {/* RESUMO DE VALORES */}
        <div className="px-5 py-3 border-t border-black text-left space-y-1.5 bg-white">
           <div className={`flex justify-between ${fontSize}`}>
              <span>Qtd. Total de Itens</span>
              <span className="font-bold">{activeFuels.length}</span>
           </div>
           <div className={`flex justify-between font-bold ${fontSize}`}>
              <span>Valor Total R$</span>
              <span>{toCurrency(rawTotal)}</span>
           </div>
           <div className={`flex justify-between ${fontSize}`}>
              <span>Valor Desconto R$</span>
              <span>0,00</span>
           </div>
           <div className={`flex justify-between font-bold ${fontSize} pt-2 border-t border-black/5`}>
              <span className="text-sm">Valor a Pagar R$</span>
              <span className="text-xl tracking-tighter">{toCurrency(rawTotal)}</span>
           </div>
           <div className={`flex justify-between font-bold ${fontSize} mt-1`}>
              <span>{paymentMethodLabel}</span>
              <span>{toCurrency(rawTotal)}</span>
           </div>
           <div className={`flex justify-between text-[8px] mt-3 font-medium opacity-70 border-t border-black pt-2`}>
              <span>Valor Total Tributos (Lei 12.741/2012)</span>
              <span className="font-bold">R$ {toCurrency(valFederal + valEstadual + valMunicipal)}</span>
           </div>
        </div>

        {/* CARD DE INFOS ADICIONAIS */}
        <div className="mx-4 my-3 border border-black p-3 text-center">
           <div className="font-bold text-[8.5px] mb-2 leading-tight underline underline-offset-2">{layout.customTexts.taxLabel}</div>
           <div className={`${fontSize} normal-case space-y-1 tracking-tight font-medium`}>
              <div className="font-bold mb-1">Placa: {invoice.placa} &nbsp;&nbsp; KM: {invoice.km}</div>
              <div className="text-[8.5px] flex justify-between px-2"><span>Impostos Federais:</span> <span>R$ {toCurrency(valFederal)}</span></div>
              <div className="text-[8.5px] flex justify-between px-2"><span>Impostos Estaduais:</span> <span>R$ {toCurrency(valEstadual)}</span></div>
              <div className="text-[8.5px] flex justify-between px-2"><span>Impostos Municipais:</span> <span>R$ {toCurrency(valMunicipal)}</span></div>
           </div>
        </div>

        {/* STATUS DA EMISSÃO */}
        <div className="font-black text-[10px] py-2 border-t border-black bg-white tracking-[0.2em]">EMISSÃO NORMAL</div>

        {/* DADOS FISCAIS DA NOTA */}
        <div className="border-t border-black p-4 space-y-3">
           <div className={`${fontSize} font-bold leading-tight text-center`}>
              N.º: {invoice.numero} &nbsp;&nbsp; Série: {invoice.serie} &nbsp;&nbsp; Emissão: {invoice.dataEmissao}<br/>
              <span className="text-[9px] font-black mt-1 inline-block">VIA CONSUMIDOR</span>
           </div>
           
           <div className="text-[8.5px] font-bold text-center px-2 leading-tight uppercase opacity-90">{layout.customTexts.footerMessage}</div>
           <div className="lowercase text-[8px] underline break-all font-medium text-center px-4 opacity-70 leading-none">{invoice.urlQrCode || 'http://www.sefaz.ma.gov.br/nfce/consulta'}</div>
           
           <div className="text-center pt-1">
              <div className="font-black text-[9.5px] mb-1">CHAVE DE ACESSO</div>
              <div className="text-[9px] font-mono tracking-tighter leading-tight border border-black/10 p-2 mx-1">{formattedKey}</div>
           </div>
        </div>

        {/* IDENTIFICAÇÃO DO CONSUMIDOR */}
        <div className="border-y border-black py-2.5 font-black text-[10px] text-center w-full tracking-widest">
           {layout.customTexts.consumerLabel}
        </div>

        {/* QR CODE E PROTOCOLO */}
        <div className="p-5 space-y-3 flex flex-col items-center">
           <div className="text-[8.5px] font-black mb-1 opacity-80 uppercase">Consulta via leitor de QR Code</div>
           {qrCodeImageUrl && (
             <img src={qrCodeImageUrl} alt="QR Code" className="w-40 h-40 mix-blend-multiply" />
           )}

           <div className="w-full border-t border-dashed border-black/20 mt-4 pt-3 flex flex-col gap-1">
             <div className="text-[9.5px] font-black tracking-tight text-center">
                Protocolo Autorização: {invoice.protocolo || '221250472440534'}
             </div>
             <div className="text-[10px] font-black text-center tabular-nums">
                {timePart}
             </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default StandardReceipt;
