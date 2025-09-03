import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UserRole } from '@/lib/role-utils';

interface ImpersonationContextType {
  impersonatedRole: UserRole | null;
  setImpersonatedRole: (role: UserRole | null) => void;
  isImpersonating: boolean;
  actualRole: UserRole | null;
  setActualRole: (role: UserRole | null) => void;
  effectiveRole: UserRole | null;
}

const ImpersonationContext = createContext<ImpersonationContextType | null>(null);

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const [impersonatedRole, setImpersonatedRole] = useState<UserRole | null>(null);
  const [actualRole, setActualRole] = useState<UserRole | null>(null);

  const isImpersonating = impersonatedRole !== null;
  const effectiveRole = isImpersonating ? impersonatedRole : actualRole;

  return (
    <ImpersonationContext.Provider value={{
      impersonatedRole,
      setImpersonatedRole,
      isImpersonating,
      actualRole,
      setActualRole,
      effectiveRole
    }}>
      {children}
    </ImpersonationContext.Provider>
  );
}

export function useImpersonation() {
  const context = useContext(ImpersonationContext);
  if (!context) {
    throw new Error('useImpersonation must be used within an ImpersonationProvider');
  }
  return context;
}