const mongoose = require('mongoose');

const NfceModelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  
  // Dados do Posto
  postoData: {
    razaoSocial: { type: String, default: '' },
    cnpj: { type: String, default: '' },
    inscEstadual: { type: String, default: '' },
    endereco: { type: String, default: '' },
    activeLayoutId: { type: String, default: 'padrao_iccar' },
    chavePix: { type: String, default: '' },
    tipoChavePix: { type: String, default: 'CNPJ' }
  },

  // Lista de Preços (Catálogo)
  prices: [{
    id: String,
    code: String,
    name: String,
    unit: String,
    price: String,
    priceCard: String
  }],

  // Taxas de Impostos Padrão
  taxRates: {
    federal: { type: String, default: '0,00' },
    estadual: { type: String, default: '0,00' },
    municipal: { type: String, default: '0,00' }
  },

  // Dados da Nota Fiscal (Invoice)
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
      municipal: { type: String, default: '0,00' }
    }
  },

  // Combustíveis lançados na nota
  fuels: [{
    id: String,
    productId: String,
    code: String,
    name: String,
    quantity: String,
    unitPrice: String,
    unitPriceCard: String,
    unit: String,
    total: String
  }]

}, { 
  timestamps: true // Cria created_at e updated_at automaticamente
});

// Transforma o _id do MongoDB em id (string) para facilitar no Frontend
NfceModelSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
  }
});

module.exports = mongoose.model('NfceModel', NfceModelSchema);