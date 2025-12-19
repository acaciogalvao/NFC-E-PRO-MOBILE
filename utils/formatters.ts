
/**
 * Unificação de Utilitários
 * Este arquivo agora atua como um proxy para helpers.ts para garantir integridade.
 */
import * as helpers from './helpers';

export const parseLocaleNumber = helpers.parseLocaleNumber;
export const toCurrency = helpers.toCurrency;
export const to3Decimals = helpers.to3Decimals;
export const round2 = helpers.round2;
export const NFCE_PORTAL_URL = helpers.NFCE_PORTAL_URL;
export const formatCNPJ = helpers.formatCNPJ;
export const formatCPF = helpers.formatCPF;
export const formatPhone = helpers.formatPhone;
export const formatPixKey = helpers.formatPixKey;
export const formatMoneyMask = helpers.formatMoneyMask;
export const formatQuantityInput = helpers.formatQuantityInput;
export const moneyToFloat = helpers.moneyToFloat;
export const quantityToFloat = helpers.quantityToFloat;
export const generateNfceAccessKey = helpers.generateNfceAccessKey;
export const generateNfceQrCodeUrl = helpers.generateNfceQrCodeUrl;
export const generatePixPayload = helpers.generatePixPayload;
