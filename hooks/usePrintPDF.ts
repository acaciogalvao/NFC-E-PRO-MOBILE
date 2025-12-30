
import { useState } from 'react';
import { generateReceiptPDF } from '../services/pdfGenerator';
import { TabId, InvoiceData } from '../components/shared/types';
import { useAppContext } from '../components/shared/context/AppContext';

export const usePrintPDF = (activeTab: TabId, invoiceData: InvoiceData) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { showToast, handleLogPrint, selectedModelId, savedModels } = useAppContext();

  const handleDownloadPDF = async () => {
    if (isProcessing) return;
    if (activeTab !== 'NOTA' && activeTab !== 'CUPOM') {
      showToast("Vá para a aba NFC-e ou Cupom para baixar", "info");
      return;
    }

    setIsProcessing(true);
    try {
      const modelName = selectedModelId 
        ? (savedModels?.find(m => m.id === selectedModelId)?.name || 'Rascunho') 
        : 'Rascunho';

      await generateReceiptPDF('printable-receipt', activeTab, invoiceData);
      
      handleLogPrint('PDF', modelName);
      showToast("PDF gerado com sucesso!", "success");
    } catch (error: any) {
      showToast(error.message || "Erro ao processar PDF", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  return { isProcessing, handleDownloadPDF };
};
