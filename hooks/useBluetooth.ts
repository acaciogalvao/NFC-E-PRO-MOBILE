
import { useState } from 'react';
import { BluetoothRemoteGATTCharacteristic } from '../components/shared/types';
import { connectBluetoothPrinter } from '../services/bluetooth';
import { useAppContext } from '../components/shared/context/AppContext';

export const useBluetooth = () => {
  const [printCharacteristic, setPrintCharacteristic] = useState<BluetoothRemoteGATTCharacteristic | null>(null);
  const { showToast } = useAppContext();

  const handleBluetoothConnect = async () => {
    try {
      const char = await connectBluetoothPrinter();
      if (char) {
        setPrintCharacteristic(char);
        showToast(`Impressora Conectada!`, "success");
      }
    } catch (e: any) {
      showToast(e.message || "Erro conexão BT", "error");
    }
  };

  return { printCharacteristic, handleBluetoothConnect };
};
