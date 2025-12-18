
export type TabId = 'EDITAR' | 'PRECOS' | 'NOTA' | 'CUPOM' | 'PAGAMENTO' | 'DADOS';

export type PaymentMethod = 'DINHEIRO' | 'PIX' | 'CARTAO' | 'CREDITO' | 'DEBITO';

export type BluetoothRemoteGATTCharacteristic = any;

export interface LayoutConfig {
  id: string;
  name: string;
  fontFamily: 'MONO' | 'SANS';
  fontSize: 'SMALL' | 'MEDIUM';
  textAlign: 'LEFT' | 'CENTER';
  showSidebars: boolean; 
  showBorders: boolean; 
  showHeader: boolean;
  showConsumer: boolean;
  showQrCode: boolean;
  showFooter: boolean;
  density: 'COMPACT' | 'COMFORTABLE';
  customTexts: {
    headerTitle: string;
    subHeader: string;
    taxLabel: string;
    consumerLabel: string;
    footerMessage: string;
  };
}

export interface FuelItem {
  id: string;
  productId?: string;
  code: string;
  name: string;
  quantity: string;
  unitPrice: string; 
  unitPriceCard?: string; 
  unit: string;
  total: string;
}

export interface ActiveFuelItem extends FuelItem {
  q: number;
  p: number;
  t: number;
}

export interface ReceiptCalculations {
  rawTotal: number;
  valTotalTributos: number;
  valFederal: number;
  valEstadual: number;
  valMunicipal: number;
  activeFuels: ActiveFuelItem[];
  qrCodeImageUrl: string;
  paymentMethodLabel: string;
}

export interface ReceiptData {
  posto: PostoData;
  invoice: InvoiceData;
  fuels?: FuelItem[];
  calculations: ReceiptCalculations;
}

export type PixKeyType = 'CNPJ' | 'CPF' | 'EMAIL' | 'TELEFONE' | 'ALEATORIA';

export interface PostoData {
  razaoSocial: string;
  cnpj: string;
  inscEstadual: string;
  endereco: string;
  fone: string;
  activeLayoutId: string;
  chavePix?: string;
  tipoChavePix?: PixKeyType;
}

export interface TaxRates {
  federal: string;
  estadual: string;
  municipal: string;
}

export interface InvoiceData {
  placa: string;
  km: string;
  operador: string;
  motorista: string;
  dataEmissao: string;
  numero: string;
  serie: string;
  chaveAcesso: string;
  protocolo: string;
  urlQrCode: string;
  formaPagamento: PaymentMethod;
  detalheCodigo?: string;
  impostos: {
    federal: string;
    estadual: string;
    municipal: string;
  };
}

export interface PriceItem {
  id: string;
  code: string;
  name: string;
  unit: string;
  price: string;
  priceCard?: string;
}

export interface SavedModel {
  id: string;
  name: string;
  updatedAt: string;
  postoData: PostoData;
  prices: PriceItem[];
  taxRates: TaxRates;
  invoiceData: InvoiceData;
  fuels: FuelItem[];
}
