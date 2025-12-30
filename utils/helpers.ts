
// Utilitários de Formatação e Auxílio

/**
 * Converte strings em formato brasileiro (1.234,56) ou internacional (1234.56) 
 * para um float real do JavaScript.
 */
export const parseLocaleNumber = (val: any) => {
  if (typeof val === 'number') return val;
  if (val === null || val === undefined) return 0;
  
  let s = String(val).trim();
  if (!s) return 0;

  // Se a string contém vírgula, tratamos como formato PT-BR
  // Ex: "1.234,56" -> removemos o ponto e trocamos a vírgula por ponto
  if (s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.');
  }
  
  const res = parseFloat(s);
  return isFinite(res) ? res : 0;
};

export const toCurrency = (val: number) => {
  const safeVal = isFinite(val) ? val : 0;
  return safeVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const to3Decimals = (val: number) => {
  const safeVal = isFinite(val) ? val : 0;
  return safeVal.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
};

export const round2 = (num: number) => Math.round((num || 0) * 100) / 100;

export const NFCE_PORTAL_URL = 'http://www.nfce.sefaz.ma.gov.br/portal/consultaNFe.do?method=preFilterCupom';

export const formatCNPJ = (v: any) => {
  if (!v) return "";
  let val = String(v).replace(/\D/g, "");
  if (val.length <= 2) return val;
  if (val.length <= 5) return val.replace(/^(\d{2})(\d+)/, "$1.$2");
  if (val.length <= 8) return val.replace(/^(\d{2})(\d{3})(\d+)/, "$1.$2.$3");
  if (val.length <= 12) return val.replace(/^(\d{2})(\d{3})(\d{3})(\d+)/, "$1.$2.$3/$4");
  return val.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d+)/, "$1.$2.$3/$4-$5").slice(0, 18);
};

export const formatCPF = (v: any) => {
  if (!v) return "";
  let val = String(v).replace(/\D/g, "");
  if (val.length <= 3) return val;
  if (val.length <= 6) return val.replace(/^(\d{3})(\d+)/, "$1.$2");
  if (val.length <= 9) return val.replace(/^(\d{3})(\d{3})(\d+)/, "$1.$2.$3");
  return val.replace(/^(\d{3})(\d{3})(\d{3})(\d+)/, "$1.$2.$3-$4").slice(0, 14);
};

export const formatCEP = (v: any) => {
  if (!v) return "";
  let val = String(v).replace(/\D/g, "");
  if (val.length <= 5) return val;
  return val.replace(/^(\d{5})(\d+)/, "$1-$2").slice(0, 9);
};

export const formatPhone = (v: any) => {
  if (!v) return "";
  let val = String(v).replace(/\D/g, "");
  if (val.length <= 2) return val;
  if (val.length <= 7) return val.replace(/^(\d{2})(\d+)/, "($1) $2");
  return val.replace(/^(\d{2})(\d{5})(\d+)/, "($1) $2-$3").slice(0, 15);
};

export const formatPixKey = (value: any, type: string) => {
  if (!value) return "";
  switch (type) {
    case 'CNPJ': return formatCNPJ(value);
    case 'CPF': return formatCPF(value);
    case 'TELEFONE': return formatPhone(value);
    case 'EMAIL': return String(value).toLowerCase().trim();
    case 'ALEATORIA': return String(value).trim();
    default: return String(value);
  }
};

export const formatMoneyMask = (value: any) => {
  if (value === null || value === undefined) return '0,00';
  const numeric = String(value).replace(/\D/g, '');
  if (!numeric) return '0,00';
  const floatVal = parseFloat(numeric) / 100;
  return floatVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const formatQuantityInput = (value: any) => {
  if (value === null || value === undefined) return '0,000';
  const numeric = String(value).replace(/\D/g, '');
  if (!numeric) return '0,000';
  const floatVal = parseFloat(numeric) / 1000;
  return floatVal.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
};

export const moneyToFloat = (str: any) => {
  if (!str) return 0;
  return parseLocaleNumber(str);
};

export const quantityToFloat = (str: any) => {
  if (!str) return 0;
  return parseLocaleNumber(str);
};

export const generateNfceAccessKey = (data: any) => {
  const cNF = Math.floor(10000000 + Math.random() * 90000000).toString();
  const cnpj = (data.cnpj || '').replace(/\D/g, '').padStart(14, '0');
  return `212502${cnpj}65001${(data.numero || '0').padStart(9, '0')}1${cNF}0`;
};

export const generateNfceQrCodeUrl = (
  chave: string
) => {
  if (!chave) return "";
  const cleanChave = String(chave).replace(/\s/g, '');
  return `http://www.nfce.sefaz.ma.gov.br/portal/consultaNFe.do?method=preFilterCupom&chave=${cleanChave}`;
};

/**
 * GERAÇÃO DE PAYLOAD PIX PROFISSIONAL (BRCODE)
 */
export const generatePixPayload = (key: string, name: string, city: string, amount: number, type: string) => {
  let cleanKey = '';
  const safeKey = String(key || '');
  if (type === 'TELEFONE') {
    cleanKey = safeKey.replace(/\D/g, '');
    if (!cleanKey.startsWith('55')) {
      cleanKey = '55' + cleanKey;
    }
    cleanKey = '+' + cleanKey; 
  } else if (type === 'CNPJ' || type === 'CPF') {
    cleanKey = safeKey.replace(/\D/g, '');
  } else if (type === 'EMAIL') {
    cleanKey = safeKey.toLowerCase().trim();
  } else {
    cleanKey = safeKey.trim();
  }

  const sanitize = (s: string) => (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9 ]/gi, "")
    .toUpperCase()
    .trim();

  const finalName = sanitize(name || 'ESTABELECIMENTO').slice(0, 25);
  const finalCity = sanitize(city || 'CIDADE').slice(0, 15);

  const f = (id: string, val: string) => {
    const len = val.length.toString().padStart(2, '0');
    return `${id}${len}${val}`;
  };

  const merchantAccountInfo = f('00', 'br.gov.bcb.pix') + f('01', cleanKey);

  let payload = '000201'; 
  payload += '010211';   
  payload += f('26', merchantAccountInfo); 
  payload += '52040000'; 
  payload += '5303986';  
  
  if (amount > 0) {
    payload += f('54', amount.toFixed(2)); 
  }
  
  payload += '5802BR'; 
  payload += f('59', finalName); 
  payload += f('60', finalCity); 
  payload += f('62', f('05', '***')); 
  
  payload += '6304'; 

  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  
  const finalCrc = crc.toString(16).toUpperCase().padStart(4, '0');
  const result = payload + finalCrc;
  
  return result;
};
