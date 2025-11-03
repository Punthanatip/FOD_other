import { create } from 'zustand';

// Type definitions
export interface DetectionEvent {
  id: string;
  timestamp: string;
  objectType: string;
  confidence: number;
  location: string;
  status: 'detected' | 'cleared' | 'pending';
}

export interface DashboardCard {
  title: string;
  value: string | number;
  change?: string;
  icon?: string;
}

export interface ChartData {
  name: string;
  value: number;
}

export interface DashboardData {
  detectionEvents: DetectionEvent[];
  cards: DashboardCard[];
  hourlyDetections: ChartData[];
  detectionTypes: ChartData[];
  detectionLocations: ChartData[];
  systemStatus: {
    aiModel: 'ready' | 'processing' | 'offline';
    database: 'connected' | 'disconnected';
    network: 'online' | 'offline';
  };
}

// Mock data for dashboard
const generateMockDashboardData = (): DashboardData => {
  const detectionTypes = [
    { name: 'Nut', value: 24 },
    { name: 'Bolt', value: 19 },
    { name: 'Wire', value: 15 },
    { name: 'Rock', value: 12 },
    { name: 'Paper', value: 8 },
    { name: 'Other', value: 5 },
  ];

  const hourlyDetections = Array.from({ length: 12 }, (_, i) => ({
    name: `${i * 2}:00`,
    value: Math.floor(Math.random() * 15),
  }));

  const detectionLocations = [
    { name: 'Runway 1L', value: 42 },
    { name: 'Runway 1R', value: 31 },
    { name: 'Taxiway A', value: 28 },
    { name: 'Taxiway B', value: 21 },
    { name: 'Perimeter', value: 19 },
  ];

  return {
    detectionEvents: Array.from({ length: 8 }, (_, i) => ({
      id: `event-${Date.now()}-${i}`,
      timestamp: new Date(Date.now() - i * 15 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      objectType: ['Nut', 'Bolt', 'Wire', 'Rock', 'Paper'][Math.floor(Math.random() * 5)],
      confidence: parseFloat((0.7 + Math.random() * 0.3).toFixed(2)),
      location: ['Runway 1L', 'Runway 1R', 'Taxiway A', 'Taxiway B', 'Perimeter'][Math.floor(Math.random() * 5)],
      status: i % 3 === 0 ? 'cleared' : i % 3 === 1 ? 'pending' : 'detected',
    })),
    cards: [
      {
        title: 'Active Detections',
        value: Math.floor(Math.random() * 10).toString(),
        change: '+2',
      },
      {
        title: 'Today\'s Detections',
        value: (Math.floor(Math.random() * 50) + 20).toString(),
        change: '+12%',
      },
      {
        title: 'Detection Rate',
        value: (Math.random() * 10 + 85).toFixed(1) + '%',
        change: '+3.2%',
      },
      {
        title: 'Avg. Response Time',
        value: (Math.random() * 5 + 2).toFixed(1) + ' min',
        change: '-0.4 min',
      },
    ],
    hourlyDetections,
    detectionTypes,
    detectionLocations,
    systemStatus: {
      aiModel: 'ready',
      database: 'connected',
      network: 'online',
    },
  };
};

// Zustand store for dashboard data
interface DashboardStore {
  dashboardData: DashboardData;
  updateData: () => void;
  refreshData: () => Promise<void>;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  dashboardData: generateMockDashboardData(),
  updateData: () => {
    set({ dashboardData: generateMockDashboardData() });
  },
  refreshData: async () => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    set({ dashboardData: generateMockDashboardData() });
  },
}));

// Function to get fresh mock data (for non-store usage)
export const getMockDashboardData = (): DashboardData => {
  return generateMockDashboardData();
};