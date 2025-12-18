
import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const useAppActions = () => {
  const [showModelModal, setShowModelModal] = useState(false);
  const [actionModal, setActionModal] = useState<{ 
    type: 'NONE' | 'RENAME' | 'DELETE' | 'RESET_ALL' | 'NEW_MODEL', 
    targetId?: string, 
    name?: string 
  }>({ type: 'NONE' });
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
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
