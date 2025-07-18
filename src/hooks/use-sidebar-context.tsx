import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type SidebarContextType = {
  isLeftSidebarCollapsed: boolean;
  setLeftSidebarCollapsed: (collapsed: boolean) => void;
  isRightSidebarCollapsed: boolean;
  setRightSidebarCollapsed: (collapsed: boolean) => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function useSidebarContext() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebarContext must be used within a SidebarProvider');
  }
  return context;
}

export function SidebarStateProvider({ children }: { children: ReactNode }) {
  const [isLeftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [isRightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);

  useEffect(() => {
    const leftCollapsed = localStorage.getItem('leftSidebarCollapsed');
    if (leftCollapsed) {
      setLeftSidebarCollapsed(JSON.parse(leftCollapsed));
    }
    const rightCollapsed = localStorage.getItem('rightSidebarCollapsed');
    if (rightCollapsed) {
      setRightSidebarCollapsed(JSON.parse(rightCollapsed));
    }
  }, []);

  const handleSetLeftSidebarCollapsed = (collapsed: boolean) => {
    setLeftSidebarCollapsed(collapsed);
    localStorage.setItem('leftSidebarCollapsed', JSON.stringify(collapsed));
  };

  const handleSetRightSidebarCollapsed = (collapsed: boolean) => {
    setRightSidebarCollapsed(collapsed);
    localStorage.setItem('rightSidebarCollapsed', JSON.stringify(collapsed));
  };

  return (
    <SidebarContext.Provider value={{
      isLeftSidebarCollapsed,
      setLeftSidebarCollapsed: handleSetLeftSidebarCollapsed,
      isRightSidebarCollapsed,
      setRightSidebarCollapsed: handleSetRightSidebarCollapsed
    }}>
      {children}
    </SidebarContext.Provider>
  );
} 