import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserType = 'demo' | 'live';

interface UserContextType {
  userType: UserType;
  setUserType: (type: UserType) => void;
  toggleUserType: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [userType, setUserType] = useState<UserType>('demo');

  const toggleUserType = () => {
    setUserType(prev => prev === 'demo' ? 'live' : 'demo');
  };

  return (
    <UserContext.Provider value={{ userType, setUserType, toggleUserType }}>
      {children}
    </UserContext.Provider>
  );
};