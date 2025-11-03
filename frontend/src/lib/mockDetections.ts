import { useEffect, useRef } from 'react';

// Type definition for detection boxes
export interface DetectionBox {
  id: string;
  x: number;      // Percentage from left (0-100)
  y: number;      // Percentage from top (0-100)
  width: number;  // Width as percentage of video width
  height: number; // Height as percentage of video height
  label: string;
  confidence: number;
}

let mockDetections: DetectionBox[] = [];

// Function to generate random detection boxes
const generateRandomDetections = (): DetectionBox[] => {
  const count = Math.floor(Math.random() * 5); // 0-4 detections
  const detections: DetectionBox[] = [];

  for (let i = 0; i < count; i++) {
    detections.push({
      id: `mock-${Date.now()}-${i}`,
      x: Math.random() * 80, // Keep within 0-80% to avoid edges
      y: Math.random() * 80,
      width: 5 + Math.random() * 15, // 5-20% of width
      height: 5 + Math.random() * 15, // 5-20% of height
      label: ['Nut', 'Bolt', 'Wire', 'Rock', 'Paper'][Math.floor(Math.random() * 5)],
      confidence: 0.7 + Math.random() * 0.3, // 0.7-1.0 confidence
    });
  }

  return detections;
};

// Function to start generating mock detections
export const startMockDetections = (callback: (detections: DetectionBox[]) => void) => {
  // Generate initial detections
  mockDetections = generateRandomDetections();
  callback(mockDetections);

  // Set up interval to update detections every ~200ms
  const interval = setInterval(() => {
    mockDetections = generateRandomDetections();
    callback(mockDetections);
  }, 200);

  // Return function to stop the interval
  return () => clearInterval(interval);
};

// Function to get current detections
export const getCurrentDetections = (): DetectionBox[] => {
  return mockDetections;
};