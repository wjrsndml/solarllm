import React, { createContext, useContext } from 'react';

interface TabContextType {
  switchToTab: (tabKey: string) => void;
}

// 创建上下文
export const TabContext = createContext<TabContextType | undefined>(undefined);

// 自定义Hook，便于在组件中使用上下文
export const useTabContext = (): TabContextType => {
  const context = useContext(TabContext);
  if (!context) {
    throw new Error('useTabContext must be used within a TabProvider');
  }
  return context;
};

interface TabProviderProps {
  children: React.ReactNode;
  switchToTab: (tabKey: string) => void;
}

// 提供者组件
export const TabProvider: React.FC<TabProviderProps> = ({ children, switchToTab }) => {
  return (
    <TabContext.Provider value={{ switchToTab }}>
      {children}
    </TabContext.Provider>
  );
};
