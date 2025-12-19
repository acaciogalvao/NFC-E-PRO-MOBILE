
// Utilitários de Formatação e Auxílio

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

export const NFCE_PORTAL_URL = 'http://www.nfce.sefaz.ma.gov.br/portal/consultaNFe.do?method=preFilterCupom';

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

export const formatCEP = (v: string) => {
  v = v.replace(/\D/g, "");
  if (v.length <= 5) return v;
  return v.replace(/^(\d{5})(\d+)/, "$1-$2").slice(0, 9);
};

export const formatPhone = (v: string) => {
  v = v.replace(/\D/g, "");
  if (v.length <= 2) return v;
  if (v.length <= 7) return v.replace(/^(\d{2})(\d+)/, "($1) $2");
  return v.replace(/^(\d{2})(\d{5})(\d+)/, "($1) $2-$3").slice(0, 15);
};

export const formatPixKey = (value: string, type: string) => {
  switch (type) {
    case 'CNPJ': return formatCNPJ(value);
    case 'CPF': return formatCPF(value);
    case 'TELEFONE': return formatPhone(value);
    case 'EMAIL': return value.toLowerCase().trim();
    case 'ALEATORIA': return value.trim();
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
  chave: string
) => {
  const cleanChave = chave.replace(/\s/g, '');
  return `http://www.nfce.sefaz.ma.gov.br/portal/consultaNFe.do?method=preFilterCupom&chave=${cleanChave}`;
};

/**
 * GERAÇÃO DE PAYLOAD PIX PROFISSIONAL (BRCODE)
 */
export const generatePixPayload = (key: string, name: string, city: string, amount: number, type: string) => {
  let cleanKey = '';
  if (type === 'TELEFONE') {
    cleanKey = key.replace(/\D/g, '');
    if (!cleanKey.startsWith('55')) {
      cleanKey = '55' + cleanKey;
    }
    cleanKey = '+' + cleanKey; 
  } else if (type === 'CNPJ' || type === 'CPF') {
    cleanKey = key.replace(/\D/g, '');
  } else if (type === 'EMAIL') {
    cleanKey = key.toLowerCase().trim();
  } else {
    cleanKey = key.trim();
  }

  const sanitize = (s: string) => s
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
  
  console.debug("[PIX] Payload Final:", result);
  return result;
};
