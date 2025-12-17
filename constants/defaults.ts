
import { SavedModel, PostoData, InvoiceData, LayoutConfig } from '../types';

// --- CONSTANTES ---
export const LOCAL_STORAGE_KEY_LAYOUTS = 'nfce_pro_layouts_v4'; 
export const LOCAL_STORAGE_KEY_MODELS = 'nfce_models_db_v1';

export const BLANK_POSTO: PostoData = {
  razaoSocial: '',
  cnpj: '',
  inscEstadual: '',
  endereco: '',
  fone: '',
  activeLayoutId: 'padrao_iccar',
  chavePix: '',
  tipoChavePix: 'CNPJ'
};

export const BLANK_INVOICE: InvoiceData = {
  placa: '',
  km: '',
  operador: '',
  motorista: '',
  dataEmissao: '',
  numero: '',
  serie: '',
  chaveAcesso: '',
  protocolo: '',
  urlQrCode: '',
  formaPagamento: 'DINHEIRO',
  impostos: { federal: '0,00', estadual: '0,00', municipal: '0,00' },
  detalheCodigo: ''
};

export const DEFAULT_LAYOUTS: LayoutConfig[] = [
  {
    id: 'padrao_iccar',
    name: 'Modelo Realista (Posto ICCAR)',
    fontFamily: 'SANS',
    fontSize: 'SMALL',
    textAlign: 'CENTER',
    showSidebars: true,
    showBorders: false,
    showHeader: true,
    showConsumer: true,
    showQrCode: true,
    showFooter: true,
    density: 'COMPACT',
    customTexts: {
      headerTitle: 'DANFE NFC-e - Documento Auxiliar de Nota Fiscal\nde Consumidor Eletrônica',
      subHeader: 'NFC-e não permite aproveitamento de crédito de ICMS',
      taxLabel: 'INFORMAÇÕES ADICIONAIS DE INTERESSE DO CONTRIBUINTE',
      consumerLabel: 'CONSUMIDOR NÃO IDENTIFICADO',
      footerMessage: 'Consulte pela Chave de Acesso em:'
    }
  },
  {
    id: 'modelo_guimaraes',
    name: 'Modelo Auto Posto Guimarães',
    fontFamily: 'MONO',
    fontSize: 'SMALL',
    textAlign: 'LEFT',
    showSidebars: false,
    showBorders: false,
    showHeader: true,
    showConsumer: true,
    showQrCode: true,
    showFooter: true,
    density: 'COMPACT',
    customTexts: {
      headerTitle: 'Documento Auxiliar\nda Nota Fiscal de Consumidor Eletrônica',
      subHeader: '',
      taxLabel: '',
      consumerLabel: 'CONSUMIDOR NÃO IDENTIFICADO',
      footerMessage: 'Consulte pela Chave de Acesso em\nhttp://nfce.sefaz.ma.gov.br/portal/consultarNFCe.jsp'
    }
  },
  {
    id: 'modelo_almeida',
    name: 'Modelo Posto Almeida (WebPosto)',
    fontFamily: 'MONO',
    fontSize: 'SMALL',
    textAlign: 'CENTER',
    showSidebars: false,
    showBorders: false,
    showHeader: true,
    showConsumer: true,
    showQrCode: true,
    showFooter: true,
    density: 'COMPACT',
    customTexts: {
      headerTitle: 'Documento Auxiliar da Nota Fiscal de Consumidor Eletrônica',
      subHeader: 'EMITIDA EM CONTINGENCIA\nPendente de autoriza',
      taxLabel: 'ICMS monofasico sobre combustiveis cobrado anteriormente conform e Convenio ICMS 126/2024 e/ou 15/2023.',
      consumerLabel: 'CONSUMIDOR N IDENTIFICADO',
      footerMessage: 'EMITIDA EM CONTINGENCIA\nPendente de autoriza\n\nwebPostoPDV\nhttp://www.webposto.com.br/'
    }
  }
];

// --- MODELO PADRÃO ICCAR (REALISTA DA FOTO) ---
export const ICCAR_DEFAULT_MODEL: SavedModel = {
  id: 'iccar_padrao_fixo',
  name: 'POSTO ICCAR LTDA',
  updatedAt: new Date().toISOString(),
  postoData: {
    razaoSocial: 'POSTO ICCAR LTDA',
    cnpj: '02.280.133/0047-77',
    inscEstadual: '124846041',
    endereco: 'ROD BR 010, 25\nJARDIM TROPICAL, IMPERATRIZ - MA',
    fone: '(99) 3524-1111',
    activeLayoutId: 'padrao_iccar',
    chavePix: '02.280.133/0047-77',
    tipoChavePix: 'CNPJ'
  },
  taxRates: { federal: '5,8258', estadual: '20,3272', municipal: '0,00' },
  prices: [
    { id: '1', code: '1', name: 'BS10 DIESEL BS10', unit: 'L', price: '5,510', priceCard: '5,510' },
    { id: '2', code: '2', name: 'GASOLINA ADITIVADA', unit: 'L', price: '5,890', priceCard: '5,890' },
  ],
  invoiceData: { 
    ...BLANK_INVOICE, 
    placa: 'OIB4C39',
    km: '740076',
    operador: 'SISTEMA',
    numero: '59784',
    serie: '1',
    urlQrCode: 'http://www.nfce.sefaz.ma.gov.br/portal/consultanFe.do?method=preFilterCupom',
    impostos: { federal: '5,8258', estadual: '20,3272', municipal: '0,00' } 
  },
  fuels: []
};

// ... (Outros modelos permanecem iguais)
export const GUIMARAES_DEFAULT_MODEL: SavedModel = {
  id: 'guimaraes_modelo_fixo',
  name: 'AUTO POSTO GUIMARAES LTDA',
  updatedAt: new Date().toISOString(),
  postoData: {
    razaoSocial: 'AUTO POSTO GUIMARAES LTDA',
    cnpj: '02.855.790/0001-12',
    inscEstadual: '', 
    endereco: 'BR 010, SN - KM 1350 - MARANHÃO NOVO\nIMPERATRIZ - MA',
    fone: '(99) 3525-2222',
    activeLayoutId: 'modelo_guimaraes',
    chavePix: '',
    tipoChavePix: 'CNPJ'
  },
  taxRates: { federal: '9,50', estadual: '20,10', municipal: '0,00' },
  prices: [
    { id: '1', code: '2', name: 'OLEO DIESEL B S10', unit: 'L', price: '5,990', priceCard: '5,990' }
  ],
  invoiceData: {
    ...BLANK_INVOICE,
    numero: '',
    serie: '',
    dataEmissao: '',
    protocolo: '',
    chaveAcesso: '',
    urlQrCode: '',
    impostos: { federal: '9,5005', estadual: '20,1000', municipal: '0,00' },
    placa: '',
    km: '',
    motorista: '',
    operador: '',
    detalheCodigo: ''
  },
  fuels: []
};

export const ALMEIDA_DEFAULT_MODEL: SavedModel = {
  id: 'almeida_modelo_fixo',
  name: 'POSTO ALMEIDA 2',
  updatedAt: new Date().toISOString(),
  postoData: {
    razaoSocial: 'ANTONIO DE ALMEIDA CHAVES-ME',
    cnpj: '10.254.688/0002-70',
    inscEstadual: '122047940',
    endereco: 'RODOVIA BR226, 0 TRIZIDELA\nBARRA DO CORDA-MA 65950-000\nFone:(99)8511-4995',
    fone: '(99) 8511-4995',
    activeLayoutId: 'modelo_almeida',
    chavePix: '',
    tipoChavePix: 'CNPJ'
  },
  taxRates: { federal: '9,50', estadual: '20,10', municipal: '0,00' },
  prices: [
    { id: '1', code: '000002', name: 'DIESEL S10', unit: 'L', price: '5,730', priceCard: '5,730' }
  ],
  invoiceData: {
    ...BLANK_INVOICE,
    numero: '',
    serie: '',
    dataEmissao: '',
    chaveAcesso:"",
    protocolo: '',
    urlQrCode: 'http://www.sefaz.ma.gov.br/nfce/consulta',
    formaPagamento: 'DINHEIRO',
    impostos: { federal: '9,5000', estadual: '20,1000', municipal: '0,00' },
  
  },
  fuels: []
};
