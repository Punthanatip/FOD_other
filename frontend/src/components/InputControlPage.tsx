import { useState } from 'react';
import { Upload, Video, Camera, MapPin } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface InputControlPageProps {
  onStart: () => void;
  inputMode?: string;
  selectedFile?: File | null;
  latitude?: string;
  longitude?: string;
  yaw?: string;
  selectedCamera?: string;
  onInputModeChange?: (mode: string) => void;
  onSelectedFileChange?: (file: File | null) => void;
  onLatitudeChange?: (lat: string) => void;
  onLongitudeChange?: (lng: string) => void;
  onYawChange?: (yaw: string) => void;
  onSelectedCameraChange?: (camera: string) => void;
}

export function InputControlPage({ 
  onStart, 
  inputMode = 'image',
  selectedFile = null,
  latitude = '',
  longitude = '',
  yaw = '',
  selectedCamera = '',
  onInputModeChange,
  onSelectedFileChange,
  onLatitudeChange,
  onLongitudeChange,
  onYawChange,
  onSelectedCameraChange
}: InputControlPageProps) {

  const isFormValid = () => {
    if (inputMode === 'live') {
      return selectedCamera && latitude && longitude && yaw;
    }
    return selectedFile && latitude && longitude && yaw;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onSelectedFileChange) {
      const file = e.target.files[0];
      onSelectedFileChange(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0] && onSelectedFileChange) {
      const file = e.dataTransfer.files[0];
      onSelectedFileChange(file);
    }
  };

  // Function to send a test event to the backend
  const handleTestEvent = async () => {
    try {
      const testPayload = {
        ts: new Date().toISOString(),
        object_class: "Bolt",
        object_count: 1,
        confidence: 0.9,
        latitude: parseFloat(latitude || '0'),
        longitude: parseFloat(longitude || '0'),
        source: "ui",
        source_ref: "dev",
        bbox: { x: 100, y: 100, width: 50, height: 50 },
        meta: { test: true, user: "dev" }
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/events/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload)
      });

      if (response.ok) {
        alert('Test event sent successfully!');
        console.log('Test event response:', await response.json());
      } else {
        alert('Failed to send test event');
        console.error('Test event error:', response.status, await response.text());
      }
    } catch (error) {
      alert('Error sending test event');
      console.error('Test event error:', error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h2 className="text-white mb-2">Detection Input & Configuration</h2>
        <p className="text-[#8E8E93]">Select your input source and configure detection parameters</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Input Section */}
        <div className="lg:col-span-2">
          <div className="bg-[#1A1A1A] rounded-xl border border-[#2C2C2E] p-6">
            <h3 className="text-white mb-4">Input Source</h3>
            
            <Tabs value={inputMode} onValueChange={(value) => onInputModeChange && onInputModeChange(value)}>
              <TabsList className="grid w-full grid-cols-3 bg-[#2C2C2E]">
                <TabsTrigger value="image" className="data-[state=active]:bg-[#007BFF]">
                  <Upload className="w-4 h-4 mr-2" />
                  Image Upload
                </TabsTrigger>
                <TabsTrigger value="video" className="data-[state=active]:bg-[#007BFF]">
                  <Video className="w-4 h-4 mr-2" />
                  Video Upload
                </TabsTrigger>
                <TabsTrigger value="live" className="data-[state=active]:bg-[#007BFF]">
                  <Camera className="w-4 h-4 mr-2" />
                  Live Camera
                </TabsTrigger>
              </TabsList>

              <TabsContent value="image" className="mt-6">
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-[#2C2C2E] rounded-lg p-12 text-center hover:border-[#007BFF] transition-colors cursor-pointer"
                >
                  <Upload className="w-12 h-12 mx-auto mb-4 text-[#8E8E93]" />
                  <p className="text-white mb-2">
                    {selectedFile ? selectedFile.name : 'Drag and drop an image here'}
                  </p>
                  <p className="text-[#8E8E93] text-sm mb-4">or click to browse</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload">
                    <Button variant="outline" className="cursor-pointer" asChild>
                      <span>Select Image</span>
                    </Button>
                  </label>
                </div>
              </TabsContent>

              <TabsContent value="video" className="mt-6">
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-[#2C2C2E] rounded-lg p-12 text-center hover:border-[#007BFF] transition-colors cursor-pointer"
                >
                  <Video className="w-12 h-12 mx-auto mb-4 text-[#8E8E93]" />
                  <p className="text-white mb-2">
                    {selectedFile ? selectedFile.name : 'Drag and drop a video here'}
                  </p>
                  <p className="text-[#8E8E93] text-sm mb-4">or click to browse</p>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="video-upload"
                  />
                  <label htmlFor="video-upload">
                    <Button variant="outline" className="cursor-pointer" asChild>
                      <span>Select Video</span>
                    </Button>
                  </label>
                </div>
              </TabsContent>

              <TabsContent value="live" className="mt-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="camera-select" className="text-white mb-2 block">
                      Select Camera Feed
                    </Label>
                    <Select value={selectedCamera} onValueChange={(value) => onSelectedCameraChange && onSelectedCameraChange(value)}>
                      <SelectTrigger id="camera-select" className="bg-[#2C2C2E] border-[#3C3C3E]">
                        <SelectValue placeholder="Choose a camera..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rwy-01l-cam-01">RWY-01L-CAM-01</SelectItem>
                        <SelectItem value="rwy-01l-cam-02">RWY-01L-CAM-02</SelectItem>
                        <SelectItem value="rwy-19r-cam-01">RWY-19R-CAM-01</SelectItem>
                        <SelectItem value="rwy-19r-cam-02">RWY-19R-CAM-02</SelectItem>
                        <SelectItem value="taxiway-a-cam-01">TAXIWAY-A-CAM-01</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {selectedCamera && (
                    <div className="bg-[#000000] rounded-lg aspect-video flex items-center justify-center">
                      <div className="text-center">
                        <Camera className="w-16 h-16 mx-auto mb-3 text-[#8E8E93]" />
                        <p className="text-[#8E8E93]">Camera feed will appear here</p>
                        <p className="text-[#8E8E93] text-sm mt-1">{selectedCamera.toUpperCase()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Metadata & Controls Section */}
        <div className="space-y-6">
          <div className="bg-[#1A1A1A] rounded-xl border border-[#2C2C2E] p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-[#007BFF]" />
              <h3 className="text-white">Location Metadata</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="latitude" className="text-white mb-2 block">
                  Latitude (°)
                </Label>
                <Input
                  id="latitude"
                  type="text"
                  placeholder="e.g., 40.6413"
                  value={latitude}
                  onChange={(e) => onLatitudeChange && onLatitudeChange(e.target.value)}
                  className="bg-[#2C2C2E] border-[#3C3C3E]"
                />
              </div>
              
              <div>
                <Label htmlFor="longitude" className="text-white mb-2 block">
                  Longitude (°)
                </Label>
                <Input
                  id="longitude"
                  type="text"
                  placeholder="e.g., -73.7781"
                  value={longitude}
                  onChange={(e) => onLongitudeChange && onLongitudeChange(e.target.value)}
                  className="bg-[#2C2C2E] border-[#3C3C3E]"
                />
              </div>
              
              <div>
                <Label htmlFor="yaw" className="text-white mb-2 block">
                  Yaw Angle (°)
                </Label>
                <Input
                  id="yaw"
                  type="text"
                  placeholder="e.g., 180"
                  value={yaw}
                  onChange={(e) => onYawChange && onYawChange(e.target.value)}
                  className="bg-[#2C2C2E] border-[#3C3C3E]"
                />
              </div>
            </div>
          </div>

          <div className="bg-[#1A1A1A] rounded-xl border border-[#2C2C2E] p-6">
            <h3 className="text-white mb-4">System Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[#8E8E93]">AI Model</span>
                <span className="flex items-center gap-2 text-[#34C759]">
                  <span className="w-2 h-2 bg-[#34C759] rounded-full"></span>
                  Ready
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8E8E93]">Database</span>
                <span className="flex items-center gap-2 text-[#34C759]">
                  <span className="w-2 h-2 bg-[#34C759] rounded-full"></span>
                  Connected
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8E8E93]">Network</span>
                <span className="flex items-center gap-2 text-[#34C759]">
                  <span className="w-2 h-2 bg-[#34C759] rounded-full"></span>
                  Online
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={onStart}
              disabled={!isFormValid()}
              className="w-full h-12 bg-[#007BFF] hover:bg-[#0066D6] disabled:bg-[#2C2C2E] disabled:text-[#8E8E93]"
            >
              START DETECTION
            </Button>
            
            <Button
              onClick={handleTestEvent}
              className="w-full h-12 bg-[#4F46E5] hover:bg-[#4338CA]"
            >
              Send Test Event
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
