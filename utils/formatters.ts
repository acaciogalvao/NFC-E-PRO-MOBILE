
// Utilitários de Formatação e Parseamento

export const parseLocaleNumber = (stringNumber: string) => {
  if (!stringNumber) return 0;
  const str = String(stringNumber);
  const cleanStr = str.replace(/[^\d,.-]/g, ''); 
  if (!cleanStr) return 0;
  const normalized = cleanStr.replace(/\./g, '').replace(',', '.');
  const val = parseFloat(normalized);
  return isFinite(val) ? val : 0;
};

export const toCurrency = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const to3Decimals = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });

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
  return v.replace(/^(\d{3})(\d{3})(\d{3})(\d{1,2})/, "$1.$2.$3-$4").slice(0, 14);
};

export const formatPhone = (v: string) => {
  v = v.replace(/\D/g, "");
  if (v.length <= 2) return v;
  if (v.length <= 7) return v.replace(/^(\d{2})(\d+)/, "($1) $2");
  return v.replace(/^(\d{2})(\d{5})(\d+)/, "($1) $2-$3").slice(0, 15);
};

export const formatPixKey = (value: string, type: 'CNPJ' | 'CPF' | 'EMAIL' | 'TELEFONE' | 'ALEATORIA') => {
  if (type === 'CPF') return formatCPF(value);
  if (type === 'CNPJ') return formatCNPJ(value);
  if (type === 'TELEFONE') return formatPhone(value);
  if (type === 'EMAIL') return value.toLowerCase().trim();
  if (type === 'ALEATORIA') return value.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 36);
  return value;
};

export const formatMoneyMask = (value: string) => {
  const numeric = value.replace(/\D/g, '');
  if (!numeric) return '';
  const floatVal = parseFloat(numeric) / 100;
  if (isNaN(floatVal)) return '';
  return floatVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const formatQuantityInput = (value: string) => {
  let clean = value.replace(/[^0-9,]/g, '');
  const parts = clean.split(',');
  if (parts.length > 2) {
    clean = parts[0] + ',' + parts.slice(1).join('');
  }
  const integerPart = parts[0];
  const decimalPart = parts.length > 1 ? ',' + parts[1] : '';
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return formattedInteger + decimalPart;
};

export const validateCNPJ = (cnpj: string): boolean => {
  cnpj = cnpj.replace(/[^\d]+/g, '');
  if (cnpj === '') return true; 
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1+$/.test(cnpj)) return false;
  return true; 
};

// --- LÓGICA FISCAL NFC-e (MANUAL 7.0) ---

export const calculateDV = (key43: string): string => {
  let sum = 0;
  let weight = 2;
  for (let i = key43.length - 1; i >= 0; i--) {
    sum += parseInt(key43[i]) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  const remainder = sum % 11;
  const dv = (remainder === 0 || remainder === 1) ? 0 : 11 - remainder;
  return dv.toString();
};

export const generateNfceAccessKey = (data: {
  uf: string;
  cnpj: string;
  serie: string;
  numero: string;
  tpEmis: string;
  dataEmissao?: string;
}) => {
  const uf = data.uf.padStart(2, '0');
  let aamm = '';
  if (data.dataEmissao) {
    const parts = data.dataEmissao.split(' ')[0].split('/');
    if (parts.length === 3) aamm = parts[2].slice(-2) + parts[1];
  }
  if (!aamm) {
    const now = new Date();
    aamm = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
  const cnpj = data.cnpj.replace(/\D/g, '').padStart(14, '0');
  const mod = '65';
  const serie = data.serie.replace(/\D/g, '').padStart(3, '0');
  const nNF = data.numero.replace(/\D/g, '').padStart(9, '0');
  const tpEmis = data.tpEmis || '1';
  const cNF = Math.floor(10000000 + Math.random() * 90000000).toString();
  const key43 = `${uf}${aamm}${cnpj}${mod}${serie}${nNF}${tpEmis}${cNF}`;
  const dv = calculateDV(key43);
  return key43 + dv;
};

export const generateNfceQrCodeUrl = (chave: string, ambiente: string = '1') => {
  if (!chave || chave.length !== 44) return 'http://www.nfce.sefaz.ma.gov.br/portal/consultarNFCe.jsp';
  // Padrão solicitado: http://www.nfce.sefaz.ma.gov.br/portal/consultarNFCe.jsp?p=[CHAVE]|2|[AMBIENTE]|1|
  return `http://www.nfce.sefaz.ma.gov.br/portal/consultarNFCe.jsp?p=${chave}|2|${ambiente}|1|`; 
};

export const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

export const generatePixPayload = (key: string, merchantName: string, city: string = 'IMPERATRIZ', amount?: number, type?: string) => {
  if (!key) return '';
  let cleanKey = key.trim();
  const onlyDigits = cleanKey.replace(/\D/g, '');
  if (type === 'TELEFONE') {
    cleanKey = onlyDigits.startsWith('55') ? `+${onlyDigits}` : `+55${onlyDigits}`;
  } else if (type === 'CPF' || type === 'CNPJ') {
    cleanKey = onlyDigits;
  } else if (type === 'EMAIL') {
    cleanKey = cleanKey.toLowerCase().replace(/\s/g, '');
  }
  const sanitize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9\s]/g, "").toUpperCase().trim();
  const cleanName = sanitize(merchantName || 'RECEBEDOR').substring(0, 25);
  const cleanCity = sanitize(city || 'IMPERATRIZ').substring(0, 15);
  const f = (id: string, val: string) => {
    const size = String(val.length).padStart(2, '0');
    return `${id}${size}${val}`;
  };
  let payload = '';
  payload += f('00', '01'); 
  const gui = f('00', 'br.gov.bcb.pix');
  const keyField = f('01', cleanKey);
  payload += f('26', gui + keyField);
  payload += f('52', '0000'); 
  payload += f('53', '986'); 
  if (amount && amount > 0) payload += f('54', amount.toFixed(2));
  payload += f('58', 'BR');
  payload += f('59', cleanName);
  payload += f('60', cleanCity);
  payload += f('62', f('05', '***'));
  payload += '6304';
  const getCRC16 = (data: string) => {
    let crc = 0xFFFF;
    const polynomial = 0x1021;
    for (let i = 0; i < data.length; i++) {
      crc ^= data.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        crc = (crc & 0x8000) ? (crc << 1) ^ polynomial : (crc << 1);
      }
    }
    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
  };
  return payload + getCRC16(payload);
};
