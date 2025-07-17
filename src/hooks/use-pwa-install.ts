"use client"

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Only run PWA logic on client side
    if (typeof window === 'undefined') return;

    // Check if app is already installed
    const checkIfInstalled = () => {
      // Check display mode
      if (window.matchMedia('(display-mode: standalone)').matches) {
        return true;
      }
      
      // Check for iOS standalone mode
      if ((window.navigator as { standalone?: boolean }).standalone === true) {
        return true;
      }
      
      // Check if launched from home screen
      if (window.matchMedia('(display-mode: minimal-ui)').matches) {
        return true;
      }
      
      return false;
    };

    if (checkIfInstalled()) {
      setIsInstalled(true);
      setIsInitialized(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      // Clear any stored dismissal since the app is now installed
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pwa-banner-dismissed');
      }
    };

    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    // Listen for the appinstalled event
    window.addEventListener('appinstalled', handleAppInstalled);

    // Mark as initialized after setting up listeners
    setIsInitialized(true);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installPWA = async () => {
    if (!deferredPrompt) {
      // Fallback: provide manual instructions for browsers that don't support the install prompt
      console.log('PWA install prompt not available. User should manually add to home screen.');
      return;
    }

    try {
      // Show the install prompt
      await deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
      }
      
      // Clear the deferredPrompt so it can only be used once
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Error during PWA installation:', error);
    }
  };

  // Provide a way to check if PWA features are supported
  const isPWASupported = () => {
    return typeof window !== 'undefined' && 'serviceWorker' in navigator;
  };

  return {
    isInstallable: isInitialized ? isInstallable : false,
    isInstalled: isInitialized ? isInstalled : false,
    isPWASupported: isPWASupported(),
    installPWA,
  };
}