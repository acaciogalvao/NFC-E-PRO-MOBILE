
export type TabId = 'EDITAR' | 'PRECOS' | 'NOTA' | 'CUPOM' | 'PAGAMENTO' | 'DADOS';

export type PaymentMethod = 'DINHEIRO' | 'PIX' | 'CARTAO' | 'CREDITO' | 'DEBITO';

// Configuração completa do visual do comprovante
export interface LayoutConfig {
  id: string;
  name: string;
  fontFamily: 'MONO' | 'SANS';
  fontSize: 'SMALL' | 'MEDIUM';
  textAlign: 'LEFT' | 'CENTER';
  
  // Visibilidade (Estrutura)
  showSidebars: boolean; 
  showBorders: boolean; 
  showHeader: boolean;
  showConsumer: boolean;
  showQrCode: boolean;
  showFooter: boolean;
  
  density: 'COMPACT' | 'COMFORTABLE';

  // Customização de Textos (Novo)
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
  unitPrice: string; // Preço a vista/dinheiro
  unitPriceCard?: string; // Preço no cartão (opcional)
  unit: string;
  total: string;
}

export type PixKeyType = 'CNPJ' | 'CPF' | 'EMAIL' | 'TELEFONE' | 'ALEATORIA';

export interface PostoData {
  razaoSocial: string;
  cnpj: string;
  inscEstadual: string;
  endereco: string;
  fone: string; // Novo campo
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
  detalheCodigo?: string; // Novo campo para o código específico do Guimarães
  // Armazena VALORES MONETÁRIOS (R$) exatos digitados pelo usuário
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
  invoiceData: InvoiceData; // Salva dados completos da nota (números, impostos, pagamento)
  fuels: FuelItem[]; // Salva os itens da nota
  impostos?: { // Legacy support for older saved models
    federal: string;
    estadual: string;
    municipal: string;
  };
}

export interface BluetoothRemoteGATTCharacteristic {
  writeValue(value: BufferSource): Promise<void>;
}

export interface BluetoothRemoteGATTService {
  getCharacteristic(characteristic: string): Promise<BluetoothRemoteGATTCharacteristic>;
}

export interface BluetoothRemoteGATTServer {
  connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryService(service: string): Promise<BluetoothRemoteGATTService>;
}

export interface BluetoothDevice {
  id: string;
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
  addEventListener(type: string, listener: (event: any) => void): void;
}
