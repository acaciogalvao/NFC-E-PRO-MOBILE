import { useState, useEffect } from 'react';

export const useAppActions = () => {
  const [showModelModal, setShowModelModal] = useState(false);
  const [actionModal, setActionModal] = useState<{ 
    type: 'NONE' | 'RENAME' | 'DELETE' | 'RESET_ALL' | 'NEW_MODEL', 
    targetId?: string, 
    name?: string 
  }>({ type: 'NONE' });
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setInstallPrompt(null);
  };

  return {
    showModelModal, setShowModelModal,
    actionModal, setActionModal,
    installPrompt, handleInstallClick
  };
};