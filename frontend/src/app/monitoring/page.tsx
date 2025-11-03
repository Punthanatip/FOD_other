'use client';

import { useInputData } from '@/context/input-context';
import { MonitoringPage } from '@/components/MonitoringPage';

export default function MonitoringPageComponent() {
  const { inputData } = useInputData();

  return (
    <MonitoringPage
      inputMode={inputData.inputMode}
      selectedFile={inputData.selectedFile}
      selectedCamera={inputData.selectedCamera}
      latitude={inputData.latitude}
      longitude={inputData.longitude}
      yaw={inputData.yaw}
    />
  );
}