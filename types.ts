
export type TabId = 'EDITAR' | 'PRECOS' | 'NOTA' | 'PAGAMENTO' | 'API';

export interface FuelItem {
  id: string;
  productId?: string; // Link to the master PriceItem for auto-updates
  code: string;
  name: string;
  quantity: string;
  unitPrice: string;
  unit: string;
}

export interface PostoData {
  razaoSocial: string;
  cnpj: string;
  inscEstadual: string;
  endereco: string;
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
}

export interface SavedModel {
  id: string;
  name: string;
  postoData: PostoData;
  prices: PriceItem[];
}