'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('SW registered successfully on:', window.location.origin, registration);
            
            // Handle updates
            registration.addEventListener('updatefound', () => {
              console.log('SW update found');
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed') {
                    if (navigator.serviceWorker.controller) {
                      console.log('SW updated, new content available');
                    } else {
                      console.log('SW installed for the first time');
                    }
                  }
                });
              }
            });
          })
          .catch((registrationError) => {
            console.error('SW registration failed on:', window.location.origin, registrationError);
          });
      });
    } else {
      console.log('Service Worker not supported in this browser');
    }
  }, []);

  return null;
}