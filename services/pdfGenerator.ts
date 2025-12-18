import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { TabId, InvoiceData } from '../types';

export const generateReceiptPDF = async (
  elementId: string, 
  activeTab: TabId, 
  invoiceData: InvoiceData
): Promise<void> => {
  const input = document.getElementById(elementId);
  if (!input) {
    throw new Error("Elemento para PDF não encontrado");
  }

  const canvas = await html2canvas(input, { 
    scale: 3, 
    useCORS: true, 
    logging: false,
    backgroundColor: '#ffffff'
  });
  
  const imgData = canvas.toDataURL('image/png');
  const filename = `${activeTab === 'NOTA' ? 'NFCe' : 'CUPOM'}-${invoiceData.numero || 'DOC'}.pdf`;

  let pdf;
  if (activeTab === 'NOTA') {
    pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  } else {
    const pdfWidth = 80;
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [pdfWidth, pdfHeight] });
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  }

  pdf.save(filename);
};