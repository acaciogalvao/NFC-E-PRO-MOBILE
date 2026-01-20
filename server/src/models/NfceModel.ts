import mongoose, { Schema, Document } from 'mongoose';

export interface INfce extends Document {
  name: string;
  postoData: {
    razaoSocial: string;
    cnpj: string;
    inscEstadual: string;
    endereco: string;
    activeLayoutId: string;
    chavePix: string;
    tipoChavePix: string;
  };
  prices: Array<{
    id: string;
    code: string;
    name: string;
    unit: string;
    price: string;
    priceCard: string;
  }>;
  taxRates: {
    federal: string;
    estadual: string;
    municipal: string;
  };
  invoiceData: {
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
    formaPagamento: string;
    impostos: {
      federal: string;
      estadual: string;
      municipal: string;
    };
  };
  fuels: Array<{
    id: string;
    productId: string;
    code: string;
    name: string;
    quantity: string;
    unitPrice: string;
    unitPriceCard: string;
    unit: string;
    total: string;
  }>;
}

const NfceModelSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    postoData: {
      razaoSocial: { type: String, default: '' },
      cnpj: { type: String, default: '' },
      inscEstadual: { type: String, default: '' },
      endereco: { type: String, default: '' },
      activeLayoutId: { type: String, default: 'padrao_iccar' },
      chavePix: { type: String, default: '' },
      tipoChavePix: { type: String, default: 'CNPJ' },
    },
    prices: [
      {
        id: String,
        code: String,
        name: String,
        unit: String,
        price: String,
        priceCard: String,
      },
    ],
    taxRates: {
      federal: { type: String, default: '0,00' },
      estadual: { type: String, default: '0,00' },
      municipal: { type: String, default: '0,00' },
    },
    invoiceData: {
      placa: String,
      km: String,
      operador: String,
      motorista: String,
      dataEmissao: String,
      numero: String,
      serie: String,
      chaveAcesso: String,
      protocolo: String,
      urlQrCode: String,
      formaPagamento: { type: String, default: 'DINHEIRO' },
      impostos: {
        federal: { type: String, default: '0,00' },
        estadual: { type: String, default: '0,00' },
        municipal: { type: String, default: '0,00' },
      },
    },
    fuels: [
      {
        id: String,
        productId: String,
        code: String,
        name: String,
        quantity: String,
        unitPrice: String,
        unitPriceCard: String,
        unit: String,
        total: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

NfceModelSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (_doc, ret) {
    delete ret._id;
  },
});

export default mongoose.model<INfce>('NfceModel', NfceModelSchema);
