'use client';

import { useInputData } from '@/context/input-context';
import { DashboardPage } from '@/components/DashboardPage';

export default function DashboardPageComponent() {
  // Just to ensure the context is available on this page
  const { inputData } = useInputData();

  return (
    <DashboardPage />
  );
}