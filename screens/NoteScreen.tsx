import React from 'react';
import { PostoData, InvoiceData, FuelItem } from '../types';
import { Printer, ZoomIn, ZoomOut } from 'lucide-react';

interface NoteScreenProps {
  postoData: PostoData;
  setPostoData: (data: PostoData) => void;
  invoiceData: InvoiceData;
  fuels: FuelItem[];
}

// --- HELPERS ---
const parseLocaleNumber = (val: string) => parseFloat(val.replace(/\./g, '').replace(',', '.')) || 0;
const toCurrency = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const to3Decimals = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });

// Helper para Label de Pagamento
const getPaymentLabel = (method: string) => {
  if (method === 'CREDITO') return 'CRÉDITO';
  if (method === 'DEBITO') return 'DÉBITO';
  if (method === 'CARTAO') return 'CARTÃO';
  if (method === 'PIX') return 'PIX';
  return 'DINHEIRO';
};

// COMPONENTE: DANFE MODELO 55 (A4 - Baseado na Imagem do Usuário)
const DanfeReceipt: React.FC<{ data: any }> = ({ data }) => {
  const { posto, invoice, calculations } = data;
  const { rawTotal, valFederal, valEstadual, valMunicipal, activeFuels } = calculations;
  const [authDate, authTime] = invoice.dataEmissao ? invoice.dataEmissao.split(' ') : ['__/__/____', '__:__:__'];

  // Formatação da Chave de Acesso (blocos de 4)
  const formatAccessKey = (key: string) => key.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  const cleanKey = invoice.chaveAcesso.replace(/\D/g, '') || '00000000000000000000000000000000000000000000';
  const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${cleanKey}&scale=2&height=12&incltext=false`;

  // Estilos de Borda Comuns
  const borderClass = "border border-black";
  const labelClass = "text-[7px] font-bold uppercase mb-[1px]";
  const valueClass = "text-[9px] font-normal uppercase truncate";

  return (
    <div className="bg-white text-black font-sans mx-auto box-border p-4 print:p-0 print:m-0"
         style={{ width: '210mm', minHeight: '297mm' }}>
      
      {/* 1. HEADER / EMITENTE */}
      <div className={`grid grid-cols-12 gap-0 ${borderClass} mb-2`}>
        {/* LOGO / ENDEREÇO (Col 1-5) */}
        <div className="col-span-5 border-r border-black p-2 flex flex-col justify-center items-center text-center">
            <div className="font-bold text-sm uppercase mb-2">{posto.razaoSocial || 'RAZÃO SOCIAL DO EMITENTE'}</div>
            <div className="text-[8px] leading-tight">
                {posto.endereco}<br/>
                CEP: 00000-000 - FONE: (00) 0000-0000
            </div>
        </div>

        {/* DANFE BLOCK (Col 6-7) */}
        <div className="col-span-2 border-r border-black p-1 flex flex-col items-center justify-center">
            <div className="font-bold text-[10px]">DANFE</div>
            <div className="text-[6px] text-center leading-tight mb-1">DOCUMENTO AUXILIAR DA NOTA FISCAL ELETRÔNICA</div>
            <div className="w-full grid grid-cols-3 text-[8px] border border-black mb-1">
                <div className="col-span-1 text-center border-r border-black flex flex-col justify-center">
                    <span className="block text-[5px]">0-ENTRADA</span>
                    <span className="block text-[5px]">1-SAÍDA</span>
                </div>
                <div className="col-span-2 font-bold text-lg text-center flex items-center justify-center">
                    1
                </div>
            </div>
            <div className="text-[9px] font-bold">Nº {invoice.numero || '000.000.000'}</div>
            <div className="text-[8px]">SÉRIE: {invoice.serie || '000'}</div>
            <div className="text-[8px]">FOLHA 1/1</div>
        </div>

        {/* BARCODE / CHAVE (Col 8-12) */}
        <div className="col-span-5 p-2 flex flex-col justify-between h-full">
            <div className="flex flex-col items-center mb-1">
                {/* Simulated Barcode */}
                <img src={barcodeUrl} alt="Barcode" className="h-10 w-full object-fill" />
            </div>
            <div>
                <div className={labelClass}>CHAVE DE ACESSO</div>
                <div className="text-[10px] font-bold tracking-widest">{formatAccessKey(cleanKey)}</div>
            </div>
            <div className="mt-1 text-center">
                <div className="text-[8px] leading-tight">Consulta de autenticidade no portal nacional da NF-e www.nfe.fazenda.gov.br/portal ou no site da Sefaz Autorizadora</div>
            </div>
        </div>
      </div>

      {/* 2. NATUREZA DA OPERAÇÃO */}
      <div className={`grid grid-cols-12 ${borderClass} mb-2`}>
        <div className="col-span-7 border-r border-black p-1">
            <div className={labelClass}>NATUREZA DA OPERAÇÃO</div>
            <div className={valueClass}>VENDA DE COMBUSTÍVEL OU LUB. ADQ. DE TERCEIROS</div>
        </div>
        <div className="col-span-5 p-1">
            <div className={labelClass}>PROTOCOLO DE AUTORIZAÇÃO DE USO</div>
            <div className={valueClass}>{invoice.protocolo} - {authDate} {authTime}</div>
        </div>
      </div>

      {/* 3. INSCRIÇÕES */}
      <div className={`grid grid-cols-12 ${borderClass} mb-2`}>
        <div className="col-span-4 border-r border-black p-1">
            <div className={labelClass}>INSCRIÇÃO ESTADUAL</div>
            <div className={valueClass}>{posto.inscEstadual}</div>
        </div>
        <div className="col-span-4 border-r border-black p-1">
            <div className={labelClass}>INSCRIÇÃO ESTADUAL DO SUBST. TRIB.</div>
            <div className={valueClass}></div>
        </div>
        <div className="col-span-4 p-1">
            <div className={labelClass}>CNPJ</div>
            <div className={valueClass}>{posto.cnpj}</div>
        </div>
      </div>

      {/* 4. DESTINATÁRIO / REMETENTE */}
      <div className="mb-2">
          <div className="bg-gray-200 border border-black border-b-0 px-1 py-0.5 text-[8px] font-bold uppercase">DESTINATÁRIO / REMETENTE</div>
          <div className={borderClass}>
            <div className="grid grid-cols-12 border-b border-black">
                <div className="col-span-7 border-r border-black p-1">
                    <div className={labelClass}>NOME / RAZÃO SOCIAL</div>
                    <div className={valueClass}>{invoice.motorista || invoice.operador || 'CONSUMIDOR FINAL'}</div>
                </div>
                <div className="col-span-3 border-r border-black p-1">
                    <div className={labelClass}>CNPJ / CPF</div>
                    <div className={valueClass}>000.000.000-00</div>
                </div>
                <div className="col-span-2 p-1">
                    <div className={labelClass}>DATA DA EMISSÃO</div>
                    <div className={valueClass}>{authDate}</div>
                </div>
            </div>
            <div className="grid grid-cols-12 border-b border-black">
                <div className="col-span-6 border-r border-black p-1">
                    <div className={labelClass}>ENDEREÇO</div>
                    <div className={valueClass}>ENDEREÇO DO CLIENTE, S/N</div>
                </div>
                <div className="col-span-4 border-r border-black p-1">
                    <div className={labelClass}>BAIRRO / DISTRITO</div>
                    <div className={valueClass}>CENTRO</div>
                </div>
                <div className="col-span-2 p-1">
                    <div className={labelClass}>DATA DA SAÍDA/ENTRADA</div>
                    <div className={valueClass}>{authDate}</div>
                </div>
            </div>
            <div className="grid grid-cols-12">
                <div className="col-span-4 border-r border-black p-1">
                    <div className={labelClass}>MUNICÍPIO</div>
                    <div className={valueClass}>CIDADE</div>
                </div>
                <div className="col-span-1 border-r border-black p-1">
                    <div className={labelClass}>UF</div>
                    <div className={valueClass}>MA</div>
                </div>
                <div className="col-span-2 border-r border-black p-1">
                    <div className={labelClass}>FONE / FAX</div>
                    <div className={valueClass}></div>
                </div>
                <div className="col-span-3 border-r border-black p-1">
                    <div className={labelClass}>INSCRIÇÃO ESTADUAL</div>
                    <div className={valueClass}>ISENTO</div>
                </div>
                <div className="col-span-2 p-1">
                    <div className={labelClass}>HORA SAÍDA</div>
                    <div className={valueClass}>{authTime}</div>
                </div>
            </div>
          </div>
      </div>

      {/* 5. CÁLCULO DO IMPOSTO */}
      <div className="mb-2">
          <div className="bg-gray-200 border border-black border-b-0 px-1 py-0.5 text-[8px] font-bold uppercase">CÁLCULO DO IMPOSTO</div>
          <div className={`grid grid-cols-10 ${borderClass}`}>
              <div className="col-span-2 border-r border-black p-1">
                  <div className={labelClass}>BASE DE CÁLC. DO ICMS</div>
                  <div className={`${valueClass} text-right`}>R$ 0,00</div>
              </div>
              <div className="col-span-2 border-r border-black p-1">
                  <div className={labelClass}>VALOR DO ICMS</div>
                  <div className={`${valueClass} text-right`}>R$ 0,00</div>
              </div>
              <div className="col-span-2 border-r border-black p-1">
                  <div className={labelClass}>BASE CÁLC. ICMS SUBST.</div>
                  <div className={`${valueClass} text-right`}>R$ 0,00</div>
              </div>
              <div className="col-span-2 border-r border-black p-1">
                  <div className={labelClass}>VALOR DO ICMS SUBST.</div>
                  <div className={`${valueClass} text-right`}>R$ 0,00</div>
              </div>
              <div className="col-span-2 p-1">
                  <div className={labelClass}>VALOR TOTAL DOS PRODUTOS</div>
                  <div className={`${valueClass} text-right`}>R$ {toCurrency(rawTotal)}</div>
              </div>

              {/* Linha 2 dos Impostos */}
              <div className="col-span-2 border-r border-t border-black p-1">
                  <div className={labelClass}>VALOR DO FRETE</div>
                  <div className={`${valueClass} text-right`}>R$ 0,00</div>
              </div>
              <div className="col-span-2 border-r border-t border-black p-1">
                  <div className={labelClass}>VALOR DO SEGURO</div>
                  <div className={`${valueClass} text-right`}>R$ 0,00</div>
              </div>
              <div className="col-span-2 border-r border-t border-black p-1">
                  <div className={labelClass}>DESCONTO</div>
                  <div className={`${valueClass} text-right`}>R$ 0,00</div>
              </div>
              <div className="col-span-2 border-r border-t border-black p-1">
                  <div className={labelClass}>OUTRAS DESP. ACESS.</div>
                  <div className={`${valueClass} text-right`}>R$ 0,00</div>
              </div>
              <div className="col-span-2 border-t border-black p-1 bg-gray-100">
                  <div className={labelClass}>VALOR TOTAL DA NOTA</div>
                  <div className={`${valueClass} text-right font-bold text-[10px]`}>R$ {toCurrency(rawTotal)}</div>
              </div>
          </div>
      </div>

      {/* 6. TRANSPORTADOR / VOLUMES */}
      <div className="mb-2">
          <div className="bg-gray-200 border border-black border-b-0 px-1 py-0.5 text-[8px] font-bold uppercase">TRANSPORTADOR / VOLUMES TRANSPORTADOS</div>
          <div className={borderClass}>
             <div className="grid grid-cols-12 border-b border-black">
                <div className="col-span-5 border-r border-black p-1">
                    <div className={labelClass}>RAZÃO SOCIAL</div>
                    <div className={valueClass}>O MESMO</div>
                </div>
                <div className="col-span-2 border-r border-black p-1">
                    <div className={labelClass}>FRETE POR CONTA</div>
                    <div className={valueClass}>9-SEM FRETE</div>
                </div>
                <div className="col-span-2 border-r border-black p-1">
                    <div className={labelClass}>CÓDIGO ANTT</div>
                    <div className={valueClass}></div>
                </div>
                <div className="col-span-1 border-r border-black p-1">
                    <div className={labelClass}>PLACA DO VEÍC</div>
                    <div className={valueClass}>{invoice.placa}</div>
                </div>
                <div className="col-span-1 border-r border-black p-1">
                    <div className={labelClass}>UF</div>
                    <div className={valueClass}>MA</div>
                </div>
                <div className="col-span-1 p-1">
                    <div className={labelClass}>CNPJ/CPF</div>
                    <div className={valueClass}></div>
                </div>
             </div>
             <div className="grid grid-cols-12">
                 <div className="col-span-5 border-r border-black p-1">
                    <div className={labelClass}>ENDEREÇO</div>
                    <div className={valueClass}></div>
                 </div>
                 <div className="col-span-4 border-r border-black p-1">
                    <div className={labelClass}>MUNICÍPIO</div>
                    <div className={valueClass}></div>
                 </div>
                 <div className="col-span-1 border-r border-black p-1">
                    <div className={labelClass}>UF</div>
                    <div className={valueClass}></div>
                 </div>
                 <div className="col-span-2 p-1">
                    <div className={labelClass}>INSCRIÇÃO ESTADUAL</div>
                    <div className={valueClass}></div>
                 </div>
             </div>
          </div>
      </div>

      {/* 7. DADOS DOS PRODUTOS / SERVIÇOS */}
      <div className="mb-2">
         <div className="bg-gray-200 border border-black border-b-0 px-1 py-0.5 text-[8px] font-bold uppercase">DADOS DOS PRODUTOS / SERVIÇOS</div>
         <div className={`border border-black min-h-[300px]`}>
            {/* Tabela Header */}
            <div className="grid grid-cols-12 border-b border-black text-[7px] font-bold text-center bg-gray-100">
               <div className="col-span-1 border-r border-black py-1">CÓDIGO</div>
               <div className="col-span-4 border-r border-black py-1">DESCRIÇÃO DOS PRODUTOS / SERVIÇOS</div>
               <div className="col-span-1 border-r border-black py-1">NCM/SH</div>
               <div className="col-span-1 border-r border-black py-1">CST</div>
               <div className="col-span-1 border-r border-black py-1">CFOP</div>
               <div className="col-span-1 border-r border-black py-1">UNID</div>
               <div className="col-span-1 border-r border-black py-1">QUANT.</div>
               <div className="col-span-1 border-r border-black py-1">V.UNIT.</div>
               <div className="col-span-1 py-1">V.TOTAL</div>
            </div>

            {/* Tabela Rows */}
            {activeFuels.map((item: any, idx: number) => (
                <div key={idx} className="grid grid-cols-12 border-b border-gray-300 text-[8px] text-center font-mono">
                    <div className="col-span-1 border-r border-gray-300 py-1 px-1">{item.code}</div>
                    <div className="col-span-4 border-r border-gray-300 py-1 px-1 text-left">{item.name}</div>
                    <div className="col-span-1 border-r border-gray-300 py-1">27101921</div>
                    <div className="col-span-1 border-r border-gray-300 py-1">060</div>
                    <div className="col-span-1 border-r border-gray-300 py-1">5655</div>
                    <div className="col-span-1 border-r border-gray-300 py-1">{item.unit}</div>
                    <div className="col-span-1 border-r border-gray-300 py-1">{to3Decimals(item.q)}</div>
                    <div className="col-span-1 border-r border-gray-300 py-1">{to3Decimals(item.p)}</div>
                    <div className="col-span-1 py-1 font-bold">{toCurrency(item.t)}</div>
                </div>
            ))}
            
            {/* Linhas vazias para preencher espaço se necessário */}
            {activeFuels.length < 5 && Array.from({ length: 5 - activeFuels.length }).map((_, i) => (
                <div key={`empty-${i}`} className="grid grid-cols-12 border-b border-transparent text-[8px] h-4">
                    <div className="col-span-12"></div>
                </div>
            ))}
         </div>
      </div>

      {/* 8. CÁLCULO DO ISSQN (Vazio normalmente para combustíveis) */}
      <div className="mb-2">
         <div className="bg-gray-200 border border-black border-b-0 px-1 py-0.5 text-[8px] font-bold uppercase">CÁLCULO DO ISSQN</div>
         <div className={`grid grid-cols-4 ${borderClass}`}>
             <div className="p-1 border-r border-black">
                 <div className={labelClass}>INSCRIÇÃO MUNICIPAL</div>
             </div>
             <div className="p-1 border-r border-black">
                 <div className={labelClass}>VALOR TOTAL DOS SERVIÇOS</div>
                 <div className={`${valueClass} text-right`}>R$ 0,00</div>
             </div>
             <div className="p-1 border-r border-black">
                 <div className={labelClass}>BASE DE CÁLCULO DO ISSQN</div>
                 <div className={`${valueClass} text-right`}>R$ 0,00</div>
             </div>
             <div className="p-1">
                 <div className={labelClass}>VALOR DO ISSQN</div>
                 <div className={`${valueClass} text-right`}>R$ 0,00</div>
             </div>
         </div>
      </div>

      {/* 9. DADOS ADICIONAIS */}
      <div>
         <div className="bg-gray-200 border border-black border-b-0 px-1 py-0.5 text-[8px] font-bold uppercase">DADOS ADICIONAIS</div>
         <div className={`grid grid-cols-12 ${borderClass} min-h-[100px]`}>
            {/* INFORMAÇÕES COMPLEMENTARES com texto legal */}
            <div className="col-span-8 border-r border-black p-1">
                <div className={labelClass}>INFORMAÇÕES COMPLEMENTARES</div>
                <div className="text-[7px] leading-tight text-justify">
                    Trib Aprox.: R$ {toCurrency(valFederal)} Federal, R$ {toCurrency(valEstadual)} Estadual, R$ {toCurrency(valMunicipal)} Municipal. Fonte: IBPT.
                    <br/>
                    {invoice.motorista && <span>MOTORISTA: {invoice.motorista}. </span>}
                    {invoice.placa && <span>PLACA: {invoice.placa}. </span>}
                    {invoice.km && <span>KM: {invoice.km}. </span>}
                    {invoice.operador && <span>OPERADOR: {invoice.operador}. </span>}
                    <br/><br/>
                    Documento emitido por ME ou EPP optante pelo Simples Nacional. Não gera direito a crédito fiscal de IPI.
                </div>
            </div>
            {/* RESERVADO AO FISCO */}
            <div className="col-span-4 p-1">
                <div className={labelClass}>RESERVADO AO FISCO</div>
            </div>
         </div>
      </div>

    </div>
  );
};


// --- TELA PRINCIPAL (CONTROLLER) ---
const NoteScreen: React.FC<NoteScreenProps> = ({ postoData, invoiceData, fuels }) => {
  const [zoomLevel, setZoomLevel] = React.useState(0.5); // Zoom inicial para caber na tela do celular

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

  const parseTaxInput = (val: string) => parseFloat(val.replace(/\./g, '').replace(',', '.')) || 0;
  
  const pctFederal = parseTaxInput(invoiceData.impostos.federal);
  const pctEstadual = parseTaxInput(invoiceData.impostos.estadual);
  const pctMunicipal = parseTaxInput(invoiceData.impostos.municipal);

  const valFederal = rawTotal * (pctFederal / 100);
  const valEstadual = rawTotal * (pctEstadual / 100);
  const valMunicipal = rawTotal * (pctMunicipal / 100);
  const valTotalTributos = valFederal + valEstadual + valMunicipal;

  const paymentMethodLabel = getPaymentLabel(invoiceData.formaPagamento);

  const calcData = { rawTotal, valTotalTributos, valFederal, valEstadual, valMunicipal, paymentMethodLabel, activeFuels };
  const fullData = { posto: postoData, invoice: invoiceData, calculations: calcData };

  return (
    <div className="flex flex-col items-center min-h-full pb-10 bg-slate-100/50 dark:bg-transparent">
      
      {/* Controles de Zoom (Apenas Tela) */}
      <div className="w-full max-w-[340px] flex items-center justify-between mt-4 mb-2 print:hidden px-4">
         <span className="text-xs font-bold text-slate-500 uppercase">Visualização A4</span>
         <div className="flex gap-2">
            <button onClick={() => setZoomLevel(Math.max(0.3, zoomLevel - 0.1))} className="p-2 bg-white rounded shadow text-slate-600"><ZoomOut size={16}/></button>
            <span className="text-xs self-center font-mono w-10 text-center">{(zoomLevel * 100).toFixed(0)}%</span>
            <button onClick={() => setZoomLevel(Math.min(1.5, zoomLevel + 0.1))} className="p-2 bg-white rounded shadow text-slate-600"><ZoomIn size={16}/></button>
         </div>
      </div>

      {/* ÁREA DE VISUALIZAÇÃO SCROLLÁVEL */}
      <div className="w-full overflow-auto p-4 flex justify-center bg-slate-200/50 dark:bg-slate-900/50 print:bg-white print:p-0 print:block">
        <div 
          id="printable-receipt"
          className="bg-white shadow-2xl print:shadow-none print:transform-none origin-top transition-transform"
          style={{ 
             transform: `scale(${zoomLevel})`,
             marginBottom: `-${(1 - zoomLevel) * 297}mm` // Compensa o espaço branco gerado pelo scale na tela, na impressão o transform é removido
          }} 
        >
          <DanfeReceipt data={fullData} />
        </div>
      </div>

      <div className="mt-8 text-[10px] text-slate-400 dark:text-slate-500 print:hidden text-center max-w-[300px]">
        <Printer size={16} className="mx-auto mb-1 opacity-50" />
        Modelo DANFE NF-e 55 (A4).<br/>
        Para imprimir corretamente, use folha A4.
      </div>

    </div>
  );
};

export default NoteScreen;