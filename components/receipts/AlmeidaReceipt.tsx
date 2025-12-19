
import React from 'react';
import { LayoutConfig, ReceiptData } from '../../types';
import { toCurrency, to3Decimals } from '../../utils/formatters';

interface ReceiptProps {
  data: ReceiptData;
  layout: LayoutConfig;
  width: '58mm' | '80mm';
}

const AlmeidaReceipt: React.FC<ReceiptProps> = ({ data, layout, width }) => {
  const { posto, invoice, calculations } = data;
  const { rawTotal, valFederal, valEstadual, activeFuels, qrCodeImageUrl, paymentMethodLabel } = calculations;
  
  const fontSizeTiny = width === '58mm' ? 'text-[7px]' : 'text-[9px]';
  const fontSizeNormal = width === '58mm' ? 'text-[8.2px]' : 'text-[10px]';
  const fontSizeLarge = width === '58mm' ? 'text-[11px]' : 'text-[14px]';
  const fontSizeExtraLarge = width === '58mm' ? 'text-[13px]' : 'text-[16px]';
  
  const fontSizeNfceLine = width === '58mm' ? 'text-[7.2px]' : 'text-[9px]';
  
  const cleanKey = (invoice.chaveAcesso || '').replace(/\D/g, '');
  const formattedKey = cleanKey.length === 44 
    ? cleanKey.replace(/(\d{4})/g, '$1 ').trim()
    : '---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----';

  const kmValue = invoice.km || '------';
  // Exibe o bico gerado ou '00' caso ainda não exista
  const bicoValue = invoice.bico || '00';

  return (
    <div 
      style={{ maxWidth: width, minWidth: width }} 
      className="bg-white text-black p-0 font-mono leading-[1.05] text-center flex flex-col overflow-hidden py-4 select-none tracking-tighter"
    >
       {/* CABEÇALHO */}
       <div className="text-center space-y-0 px-1">
          <div className="text-[10px] font-normal uppercase">OE</div>
          <div className="font-normal text-[15px] leading-tight uppercase mb-1">{posto.razaoSocial || 'EMPRESA NÃO IDENTIFICADA'}</div>
          
          <div className={`${fontSizeTiny} font-normal leading-tight uppercase`}>
             CNPJ: {posto.cnpj || '00.000.000/0000-00'} {posto.razaoSocial}
          </div>
          <div className={`${fontSizeTiny} font-normal leading-tight uppercase`}>
             {posto.endereco || 'RODOVIA BR226, 0 TRIZIDELA BARRA DO CORDA-MA'} {posto.cep || ''}
          </div>
          <div className={`${fontSizeNormal} font-normal leading-tight mt-0.5`}>
             Fone:{posto.fone || '(00)0000-0000'} I.E.:{posto.inscEstadual || 'ISENTO'}
          </div>
          <div className={`${fontSizeNormal} font-normal leading-tight mt-1`}>
             Documento Auxiliar da Nota Fiscal de Consumidor Eletrnica
          </div>

          <div className="mt-1">
             <div className={`${fontSizeExtraLarge} font-bold uppercase tracking-tighter leading-none`}>EMITIDA EM CONTINGCIA</div>
             <div className={`${fontSizeNormal} font-normal`}>Pendente de autoriza</div>
          </div>
       </div>

       {/* TABELA DE ITENS */}
       <div className="w-full text-left mt-4 px-1">
          <div className={`flex font-normal ${fontSizeNormal} mb-1`}>
             <span className="w-[6%]">#</span>
             <span className="w-[18%]">Cdigo</span>
             <span className="w-[30%]">Descri</span>
             <span className="w-[12%] text-center">Qtde</span>
             <span className="w-[6%]">Un</span>
             <span className="flex-1 text-right whitespace-nowrap">Valor unit. Valor total</span>
          </div>
          
          {activeFuels.length > 0 ? activeFuels.map((item, idx) => (
             <div key={idx} className={`${fontSizeNormal} mb-2 leading-none`}>
                <div className="flex font-normal">
                   <span className="w-[8%]">{(idx + 1).toString().padStart(3, '0')}</span>
                   <span className="w-[20%]">{item.code}</span>
                   <span className="flex-1 truncate uppercase">{item.name}</span>
                </div>
                <div className="flex justify-end pr-0 font-normal">
                   <span className="tracking-tight">
                      {to3Decimals(item.q)} {item.unit} X {to3Decimals(item.p)}
                   </span>
                   <span className="ml-5 min-w-[60px] text-right">{toCurrency(item.t)}</span>
                </div>
             </div>
          )) : (
             <div className="text-center py-4 opacity-20 text-[10px]">Aguardando lançamento...</div>
          )}
       </div>

       {/* RESUMO TOTAIS */}
       <div className="mt-1 space-y-0.5 px-1">
          <div className={`${fontSizeNormal} flex justify-between font-normal`}>
             <span>Qtde. total de itens</span>
             <span className="text-right">{(activeFuels.length).toString().padStart(3, '0')}</span>
          </div>
          <div className={`${fontSizeLarge} font-bold flex justify-between items-end pt-1`}>
             <span className="uppercase text-[16px]">VALOR TOTAL R$</span>
             <span className="text-[20px] background-color: transparent leading-none">{toCurrency(rawTotal)}</span>
          </div>
       </div>

       {/* PAGAMENTO */}
       <div className={`mt-2 text-left px-1`}>
          <div className={`${fontSizeNormal} flex justify-between font-normal uppercase`}>
             <span>FORMA DE PAGAMENTO</span>
             <span>VALOR PAGO R$</span>
          </div>
          <div className={`${fontSizeNormal} flex justify-between font-normal`}>
             <span className="capitalize">{paymentMethodLabel.toLowerCase()}</span>
             <span className="text-[14px] font-bold leading-none">{toCurrency(rawTotal)}</span>
          </div>
       </div>

       {/* SEÇÃO DE CONSULTA */}
       <div className={`mt-6 space-y-0 px-1 text-center`}>
          <div className={`${fontSizeNormal} font-normal`}>Consulte pela Chave de Acesso em</div>
          <div className={`${fontSizeNormal} font-normal`}>www.sefaz.ma.gov.br/nfce/consulta</div>
          <div className="w-full flex justify-center mt-1">
             <div className="font-normal tracking-[-0.05em] leading-tight whitespace-nowrap text-[8.5px] sm:text-[9.5px]">
                {formattedKey}
             </div>
          </div>
          <div className="font-normal text-[13px] uppercase tracking-tighter mt-1">CONSUMIDOR N IDENTIFICADO</div>
       </div>

       {/* INFORMAÇÕES NFC-E */}
       <div className={`${fontSizeNfceLine} font-normal mt-5 mb-5 leading-tight text-center px-0.5 whitespace-nowrap tracking-[-0.03em]`}>
          NFC-e n {invoice.numero || '---------'} Srie {invoice.serie || '---'} {invoice.dataEmissao || '--/--/---- --:--:--'} Via Empresa
       </div>

       {/* REPETIÇÃO CONTINGÊNCIA */}
       <div className="text-center px-1 mb-2">
          <div className={`${fontSizeExtraLarge} font-bold uppercase tracking-tighter leading-none`}>EMITIDA EM CONTINGCIA</div>
          <div className={`${fontSizeNormal} font-normal`}>Pendente de autoriza</div>
       </div>

       {/* QR CODE */}
       <div className="flex flex-col items-center my-6">
          {qrCodeImageUrl && <img src={qrCodeImageUrl} alt="QR Code" className="w-44 h-44 mix-blend-multiply" />}
       </div>

       {/* RODAPÉ TÉCNICO */}
       <div className={`${fontSizeNormal} space-y-1 text-center px-1 mt-4`}>
          <div className="font-normal uppercase text-[12px] leading-none">PLACA: {invoice.placa || '-------'}</div>
          {/* Cálculo automático MED: exibe 00,99 se ainda não tiver bico */}
          <div className="font-normal uppercase text-[12px] leading-none">KM: {kmValue} MED:{bicoValue},99</div>
          <div className="font-normal uppercase text-[12px] leading-none">OPERADOR: {invoice.operador || '-------'}</div>
          
          <div className={`${fontSizeNormal} font-normal leading-[1.1] mt-5 mb-5 text-center px-4`}>
             ICMS monofasico sobre combustiveis cobrado anteriormente conform
             <br/>
             e Convenio ICMS 126/2024 e/ou 15/2023.
          </div>

          <div className={`${fontSizeNormal} font-normal leading-[1.2] mt-6 mb-8`}>
             Trib aprox: Federal:R${toCurrency(valFederal || 0.00)}
             <br/>
             Estadual:R${toCurrency(valEstadual || 0.00)}
             <br/>
             Municipal:R$0,00
             <br/>
             Fonte: IBPT.25.2.H
          </div>

          <div className="pt-4 text-center pb-10">
             <div className="font-bold text-[13px] leading-none">webPostoPDV</div>
             <div className="text-[11px] font-normal">http://www.webposto.com.br/</div>
          </div>
       </div>
    </div>
  );
};

export default AlmeidaReceipt;
