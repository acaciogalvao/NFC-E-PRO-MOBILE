import React from 'react';
import { Bluetooth } from 'lucide-react';

interface BluetoothButtonProps {
  onClick: () => void;
  isConnected: boolean;
}

const BluetoothButton: React.FC<BluetoothButtonProps> = ({ onClick, isConnected }) => {
  return (
    <button 
      onClick={onClick} 
      className={`p-2.5 rounded-xl glass-card transition-all ${isConnected ? 'text-emerald-400 border-emerald-500/50' : 'text-slate-400'}`}
      title="Conectar Impressora"
    >
      <Bluetooth size={20} />
    </button>
  );
};

export default BluetoothButton;