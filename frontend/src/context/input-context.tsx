'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface InputData {
  inputMode: string;
  selectedFile: File | null;
  latitude: string;
  longitude: string;
  yaw: string;
  selectedCamera: string;
}

interface InputContextType {
  inputData: InputData;
  setInputData: (data: InputData) => void;
}

const InputContext = createContext<InputContextType | undefined>(undefined);

export function InputProvider({ children }: { children: ReactNode }) {
  const [inputData, setInputData] = useState<InputData>({
    inputMode: 'image',
    selectedFile: null,
    latitude: '',
    longitude: '',
    yaw: '',
    selectedCamera: ''
  });

  return (
    <InputContext.Provider value={{ inputData, setInputData }}>
      {children}
    </InputContext.Provider>
  );
}

export function useInputData() {
  const context = useContext(InputContext);
  if (context === undefined) {
    throw new Error('useInputData must be used within an InputProvider');
  }
  return context;
}