import React from 'react';
import { Download, Printer, Loader2 } from 'lucide-react';

interface ActionButtonsProps {
  onDownload: () => void;
  onPrint: () => void;
  isDownloading: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ onDownload, onPrint, isDownloading }) => {
  return (
    <div className="flex items-center gap-2">
      <button 
        onClick={onDownload} 
        disabled={isDownloading}
        className={`p-2.5 rounded-xl glass-card transition-all ${isDownloading ? 'text-indigo-400' : 'text-slate-400'}`}
        title="Baixar PDF"
      >
        {isDownloading ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
      </button>
      <button 
        onClick={onPrint} 
        className="p-2.5 rounded-xl glass-card text-slate-400"
        title="Imprimir"
      >
        <Printer size={20} />
      </button>
    </div>
  );
};

export default ActionButtons;