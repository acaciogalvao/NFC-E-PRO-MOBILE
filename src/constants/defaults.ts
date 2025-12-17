import { SavedModel, PostoData, InvoiceData, LayoutConfig } from '../types';

// --- CONSTANTES ---
export const LOCAL_STORAGE_KEY_LAYOUTS = 'nfce_pro_layouts_v4'; 
export const LOCAL_STORAGE_KEY_MODELS = 'nfce_models_db_v1';

export const BLANK_POSTO: PostoData = {
  razaoSocial: '',
  cnpj: '',
  inscEstadual: '',
  endereco: '',
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
    name: 'Modelo Moderno (ICCar)',
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
      taxLabel: 'Informações Adicionais de Interesse do Contribuinte',
      consumerLabel: 'CONSUMIDOR NÃO IDENTIFICADO',
      footerMessage: 'Consulte pela Chave de Acesso em'
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

// --- MODELO PADRÃO ICCAR (FIXO - LIMPO) ---
export const ICCAR_DEFAULT_MODEL: SavedModel = {
  id: 'iccar_padrao_fixo',
  name: 'POSTO ICCAR LTDA (Padrão)',
  updatedAt: new Date().toISOString(),
  postoData: {
    razaoSocial: 'POSTO ICCAR LTDA',
    cnpj: '02.280.133/0047-77',
    inscEstadual: '124846041',
    endereco: 'ROD BR 010, 25\nJARDIM TROPICAL, IMPERATRIZ - MA',
    activeLayoutId: 'padrao_iccar',
    chavePix: '02.280.133/0047-77',
    tipoChavePix: 'CNPJ'
  },
  taxRates: { federal: '5,8258', estadual: '20,3272', municipal: '0,00' },
  prices: [
    { id: '1', code: '1', name: 'GASOLINA COMUM', unit: 'L', price: '5,590', priceCard: '5,590' },
    { id: '2', code: '2', name: 'ETANOL COMUM', unit: 'L', price: '3,490', priceCard: '3,490' },
    { id: '3', code: '3', name: 'DIESEL S10', unit: 'L', price: '5,890', priceCard: '5,890' },
  ],
  invoiceData: { ...BLANK_INVOICE, impostos: { federal: '5,8258', estadual: '20,3272', municipal: '0,00' } },
  fuels: []
};

// --- MODELO NOVO GUIMARÃES (LIMPO) ---
export const GUIMARAES_DEFAULT_MODEL: SavedModel = {
  id: 'guimaraes_modelo_fixo',
  name: 'AUTO POSTO GUIMARAES LTDA',
  updatedAt: new Date().toISOString(),
  postoData: {
    razaoSocial: 'AUTO POSTO GUIMARAES LTDA',
    cnpj: '02.855.790/0001-12',
    inscEstadual: '', 
    endereco: 'BR 010, SN - KM 1350 - MARANHÃO NOVO\nIMPERATRIZ - MA',
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
    // Dados Fiscais Iniciam VAZIOS para não aparecerem automaticamente
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

// --- MODELO POSTO ALMEIDA 2 (BASEADO NA FOTO) ---
export const ALMEIDA_DEFAULT_MODEL: SavedModel = {
  id: 'almeida_modelo_fixo',
  name: 'POSTO ALMEIDA 2',
  updatedAt: new Date().toISOString(),
  postoData: {
    razaoSocial: 'ANTONIO DE ALMEIDA CHAVES-ME',
    cnpj: '10.254.688/0002-70',
    inscEstadual: '122047940',
    endereco: 'RODOVIA BR226, 0 TRIZIDELA\nBARRA DO CORDA-MA 65950-000\nFone:(99)8511-4995',
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
    numero: '000165032',
    serie: '001',
    dataEmissao: '09/12/2025 08:29:52',
    chaveAcesso: '2125 1210 2546 8800 0270 6500 1000 1650 3290 0259 2399',
    protocolo: '', // Contingência geralmente não tem protocolo imediato
    urlQrCode: 'http://www.sefaz.ma.gov.br/nfce/consulta',
    formaPagamento: 'DINHEIRO',
    impostos: { federal: '9,5000', estadual: '20,1000', municipal: '0,00' },
    placa: 'OIB4E39',
    km: '740406',
    motorista: '',
    operador: 'ADIEL',
    detalheCodigo: ''
  },
  fuels: [] // O usuário adicionará os itens
};