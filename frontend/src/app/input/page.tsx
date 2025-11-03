'use client';

import { useInputData } from '@/context/input-context';
import { InputControlPage } from '@/components/InputControlPage';
import { useRouter } from 'next/navigation';

export default function InputPage() {
  const router = useRouter();
  const { inputData, setInputData } = useInputData();

  const handleStart = () => {
    // Navigate to the monitoring page
    router.push('/monitoring');
  };

  const handleInputModeChange = (mode: string) => {
    setInputData(prev => ({ ...prev, inputMode: mode }));
  };

  const handleSelectedFileChange = (file: File | null) => {
    setInputData(prev => ({ ...prev, selectedFile: file }));
  };

  const handleLatitudeChange = (lat: string) => {
    setInputData(prev => ({ ...prev, latitude: lat }));
  };

  const handleLongitudeChange = (lng: string) => {
    setInputData(prev => ({ ...prev, longitude: lng }));
  };

  const handleYawChange = (yaw: string) => {
    setInputData(prev => ({ ...prev, yaw: yaw }));
  };

  const handleSelectedCameraChange = (camera: string) => {
    setInputData(prev => ({ ...prev, selectedCamera: camera }));
  };

  return (
    <InputControlPage 
      onStart={handleStart}
      inputMode={inputData.inputMode}
      selectedFile={inputData.selectedFile}
      latitude={inputData.latitude}
      longitude={inputData.longitude}
      yaw={inputData.yaw}
      selectedCamera={inputData.selectedCamera}
      onInputModeChange={handleInputModeChange}
      onSelectedFileChange={handleSelectedFileChange}
      onLatitudeChange={handleLatitudeChange}
      onLongitudeChange={handleLongitudeChange}
      onYawChange={handleYawChange}
      onSelectedCameraChange={handleSelectedCameraChange}
    />
  );
}