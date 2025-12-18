import { useState } from 'react';
import { generateReceiptPDF } from '../services/pdfGenerator';
import { TabId, InvoiceData } from '../types';
import { useAppContext } from '../context/AppContext';

export const usePrintPDF = (activeTab: TabId, invoiceData: InvoiceData) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { showToast } = useAppContext();

  const handleDownloadPDF = async () => {
    if (isProcessing) return;
    if (activeTab !== 'NOTA' && activeTab !== 'CUPOM') {
      showToast("Vá para a aba NFC-e ou Cupom para baixar", "info");
      return;
    }

    setIsProcessing(true);
    try {
      await generateReceiptPDF('printable-receipt', activeTab, invoiceData);
      showToast("PDF gerado com sucesso!", "success");
    } catch (error: any) {
      showToast(error.message || "Erro ao processar PDF", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  return { isProcessing, handleDownloadPDF };
};