
import { BluetoothRemoteGATTCharacteristic } from '../components/shared/types';

export const connectBluetoothPrinter = async (): Promise<BluetoothRemoteGATTCharacteristic | null> => {
  if (!(navigator as any).bluetooth) {
    throw new Error("Bluetooth não disponível no seu navegador.");
  }
  
  try {
    const device = await (navigator as any).bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
    });

    if (device && device.gatt) {
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
      const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');
      return characteristic;
    }
    return null;
  } catch (error: any) {
    // Se o usuário cancelar, apenas relança o erro sem poluir o console com 'Error'
    if (error.name === 'NotFoundError') {
      throw error;
    }
    console.error('Bluetooth Connection Error:', error);
    throw error;
  }
};
