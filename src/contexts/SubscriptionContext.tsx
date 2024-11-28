import React, { createContext, useContext, useState, useCallback } from 'react';

interface SubscriptionContextType {
  isSubscriptionModalOpen: boolean;
  openSubscriptionModal: () => void;
  closeSubscriptionModal: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

  const openSubscriptionModal = useCallback(() => {
    try {
      setIsSubscriptionModalOpen(true);
    } catch (error) {
      console.error('打开订阅模态框失败:', error);
      throw error;
    }
  }, []);

  const closeSubscriptionModal = useCallback(() => {
    try {
      setIsSubscriptionModalOpen(false);
    } catch (error) {
      console.error('关闭订阅模态框失败:', error);
      throw error;
    }
  }, []);

  return (
    <SubscriptionContext.Provider 
      value={{ 
        isSubscriptionModalOpen, 
        openSubscriptionModal, 
        closeSubscriptionModal 
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}; 