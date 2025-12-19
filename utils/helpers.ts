
// Utilitários de Formatação e Parseamento

export const parseLocaleNumber = (stringNumber: string) => {
  if (!stringNumber) return 0;
  const str = String(stringNumber);
  const cleanStr = str.replace(/\./g, '').replace(',', '.');
  const val = parseFloat(cleanStr);
  return isFinite(val) ? val : 0;
};

export const toCurrency = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const to3Decimals = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });

export const round2 = (num: number) => Math.round(num * 100) / 100;

export const NFCE_PORTAL_URL = 'http://www.sefaz.ma.gov.br/nfce/consulta';

export const formatCNPJ = (v: string) => {
  v = v.replace(/\D/g, "");
  if (v.length <= 2) return v;
  if (v.length <= 5) return v.replace(/^(\d{2})(\d+)/, "$1.$2");
  if (v.length <= 8) return v.replace(/^(\d{2})(\d{3})(\d+)/, "$1.$2.$3");
  if (v.length <= 12) return v.replace(/^(\d{2})(\d{3})(\d{3})(\d+)/, "$1.$2.$3/$4");
  return v.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d+)/, "$1.$2.$3/$4-$5").slice(0, 18);
};

export const formatCPF = (v: string) => {
  v = v.replace(/\D/g, "");
  if (v.length <= 3) return v;
  if (v.length <= 6) return v.replace(/^(\d{3})(\d+)/, "$1.$2");
  if (v.length <= 9) return v.replace(/^(\d{3})(\d{3})(\d+)/, "$1.$2.$3");
  return v.replace(/^(\d{3})(\d{3})(\d{3})(\d+)/, "$1.$2.$3-$4").slice(0, 14);
};

export const formatPhone = (v: string) => {
  v = v.replace(/\D/g, "");
  if (v.length <= 2) return v;
  if (v.length <= 7) return v.replace(/^(\d{2})(\d+)/, "($1) $2");
  return v.replace(/^(\d{2})(\d{5})(\d+)/, "($1) $2-$3").slice(0, 15);
};

export const formatEmailPix = (v: string) => {
  let email = v.toLowerCase();
  const comIndex = email.indexOf('.com');
  if (comIndex !== -1) {
    return email.substring(0, comIndex + 4);
  }
  return email;
};

export const formatPixKey = (value: string, type: string) => {
  switch (type) {
    case 'CNPJ': return formatCNPJ(value);
    case 'CPF': return formatCPF(value);
    case 'TELEFONE': return formatPhone(value);
    case 'EMAIL': return formatEmailPix(value);
    case 'ALEATORIA': return value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 36);
    default: return value;
  }
};

export const formatMoneyMask = (value: string) => {
  const numeric = value.replace(/\D/g, '');
  if (!numeric) return '0,00';
  const floatVal = parseFloat(numeric) / 100;
  return floatVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const formatQuantityInput = (value: string) => {
  const numeric = value.replace(/\D/g, '');
  if (!numeric) return '0,000';
  const floatVal = parseFloat(numeric) / 1000;
  return floatVal.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
};

export const moneyToFloat = (str: string) => {
  if (!str) return 0;
  const numeric = str.replace(/\D/g, '');
  return parseFloat(numeric) / 100;
};

export const quantityToFloat = (str: string) => {
  if (!str) return 0;
  const numeric = str.replace(/\D/g, '');
  return parseFloat(numeric) / 1000;
};

export const generateNfceAccessKey = (data: any) => {
  const cNF = Math.floor(10000000 + Math.random() * 90000000).toString();
  const cnpj = (data.cnpj || '').replace(/\D/g, '').padStart(14, '0');
  return `212502${cnpj}65001${(data.numero || '0').padStart(9, '0')}1${cNF}0`;
};

export const generateNfceQrCodeUrl = (
  chave: string, 
  ambiente: string = '1', 
  uf: string = 'ma', 
  versao: string = '2', 
  csc: string = '1'
) => {
  const cleanChave = chave.replace(/\s/g, '');
  return `https://www.sefaz.${uf.toLowerCase()}.gov.br/nfce/consulta?p=${cleanChave}|${versao}|${ambiente}|${csc}`;
};

/**
 * GERAÇÃO DE PAYLOAD PIX DINÂMICO (PADRÃO BRASIL / EMV)
 * Corrigido para calcular comprimentos e CRC16 real.
 */
export const generatePixPayload = (key: string, name: string, city: string, amount: number, type: string) => {
  const cleanKey = type === 'EMAIL' ? key : key.replace(/\D/g, '');
  const cleanName = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().slice(0, 25);
  const cleanCity = (city || 'IMPERATRIZ').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().slice(0, 15);

  const formatField = (id: string, val: string) => {
    const len = val.length.toString().padStart(2, '0');
    return `${id}${len}${val}`;
  };

  const merchantAccountInfo = formatField('00', 'br.gov.bcb.pix') + formatField('01', cleanKey);
  
  let payload = '000201'; // Payload Format Indicator
  payload += formatField('26', merchantAccountInfo);
  payload += '52040000'; // Merchant Category Code (MCC)
  payload += '5303986'; // Transaction Currency (BRL)
  
  if (amount > 0) {
    payload += formatField('54', amount.toFixed(2));
  }
  
  payload += '5802BR'; // Country Code
  payload += formatField('59', cleanName);
  payload += formatField('60', cleanCity);
  payload += formatField('62', formatField('05', '***')); // Additional Data (TXID)
  payload += '6304'; // CRC16 Prefix

  // Cálculo de CRC16 CCITT (Polinômio 0x1021)
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= (payload.charCodeAt(i) << 8);
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) crc = (crc << 1) ^ 0x1021;
      else crc <<= 1;
    }
  }
  
  const finalCrc = (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
  return payload + finalCrc;
};
