'use client';

import { useEffect } from 'react';
import { setupAxiosAuth } from '@/lib/auth-utils';

/**
 * Client component that sets up axios authentication
 * Should be mounted once in the app lifecycle
 */
export const AuthSetup = () => {
  useEffect(() => {
    setupAxiosAuth().catch(console.error);
  }, []);

  return null;
};
