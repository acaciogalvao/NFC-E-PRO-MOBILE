
import { SavedModel, PostoData, InvoiceData, LayoutConfig } from '../types';

export const LOCAL_STORAGE_KEY_LAYOUTS = 'nfce_pro_layouts_v4'; 
export const LOCAL_STORAGE_KEY_MODELS = 'nfce_models_db_v1';
export const LOCAL_STORAGE_KEY_ACTIVE_ID = 'nfce_pro_active_id_v1';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'; 


export const BLANK_POSTO: PostoData = {
  razaoSocial: '',
  cnpj: '',
  inscEstadual: '',
  endereco: '',
  cep: '',
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
  detalheCodigo: '',
  bico: '' // Inicia vazio
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
    showSeparatorLines: true,
    upperCaseAll: true,
    lineSpacing: 'TIGHT',
    density: 'COMPACT',
    customTexts: {
      headerTitle: 'DANFE NFC-e - Documento Auxiliar da Nota Fiscal\nde Consumidor Eletrônica',
      subHeader: 'NFC-e não permite aproveitamento de crédito de ICMS',
      taxLabel: 'Informações Adicionais de Interesse do Contribuinte',
      consumerLabel: 'Consumidor não identificado',
      footerMessage: 'Consulte pela Chave de Acesso em:',
      extraNotes: ''
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
    showSeparatorLines: true,
    upperCaseAll: true,
    lineSpacing: 'NORMAL',
    density: 'COMPACT',
    customTexts: {
      headerTitle: 'Documento Auxiliar\nda Nota Fiscal de Consumidor Eletrônica',
      subHeader: '',
      taxLabel: '',
      consumerLabel: 'CONSUMIDOR NÃO IDENTIFICADO',
      footerMessage: 'Consulte pela Chave de Acesso em\nhttp://nfce.sefaz.ma.gov.br/portal/consultarNFCe.jsp',
      extraNotes: 'Adaptive Business - 3.23.02.15 - www.adaptive.com.br'
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
    showSeparatorLines: true,
    upperCaseAll: true,
    lineSpacing: 'TIGHT',
    density: 'COMPACT',
    customTexts: {
      headerTitle: 'Documento Auxiliar da Nota Fiscal de Consumidor Eletrônica',
      subHeader: '',
      taxLabel: 'ICMS monofásico sobre combustíveis cobrado anteriormente conforme Convênio ICMS 126/2024.',
      consumerLabel: 'CONSUMIDOR NÃO IDENTIFICADO',
      footerMessage: 'webPostoPDV',
      extraNotes: ''
    }
  }
];

export const ICCAR_DEFAULT_MODEL: SavedModel = {
  id: 'iccar_padrao_fixo',
  name: 'POSTO ICCAR LTDA',
  updatedAt: new Date().toISOString(),
  postoData: {
    razaoSocial: 'POSTO ICCAR LTDA',
    cnpj: '02.280.133/0047-77',
    inscEstadual: '124846041',
    endereco: 'ROD BR 010, 25\nJARDIM TROPICAL, IMPERATRIZ - MA',
    cep: '65900-000',
    fone: "",
    activeLayoutId: 'padrao_iccar',
    chavePix: '02.280.133/0047-77',
    tipoChavePix: 'CNPJ'
  },
  taxRates: { federal: '5,82', estadual: '20,32', municipal: '0,00' },
  prices: [
    { id: '1', code: 'BS10', name: 'DIESEL S10', unit: 'L', price: '5,510', priceCard: '6,000' },
    { id: '2', code: 'BGC', name: 'GASOLINA ADITIVADA', unit: 'L', price: '5,890', priceCard: '5,890' },
  ],
  invoiceData: { 
    ...BLANK_INVOICE, 
    impostos: { federal: '5,82', estadual: '20,32', municipal: '0,00' } 
  },
  fuels: []
};

export const GUIMARAES_DEFAULT_MODEL: SavedModel = {
  id: 'guimaraes_modelo_fixo',
  name: 'AUTO POSTO GUIMARAES LTDA',
  updatedAt: new Date().toISOString(),
  postoData: {
    razaoSocial: 'AUTO POSTO GUIMARAES LTDA',
    cnpj: '02.855.790/0001-12',
    inscEstadual: '', 
    endereco: 'BR 010, SN - KM 1350 - MARANHÃO NOVO\nIMPERATRIZ - MA',
    cep: '65900-000',
    fone: '', 
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
    impostos: { federal: '9,50', estadual: '20,10', municipal: '0,00' }
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
    endereco: 'RODOVIA BR226, 0 - TRIZIDELA',
    cep: '65950-000',
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
    bico: '', // Inicia totalmente vazio
    impostos: { federal: '9,50', estadual: '20,10', municipal: '0,00' }
  },
  fuels: []
};
