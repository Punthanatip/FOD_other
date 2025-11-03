import { useState, useEffect, useRef } from 'react';
import { Circle, Square, AlertTriangle, StopCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';

interface Detection {
  cls: string;
  conf: number;
  bbox_xywh: [number, number, number, number]; // [x, y, width, height]
}

interface DetectionResponse {
  ts: string;
  model: string;
  fps: number;
  detections: Detection[];
}

interface MonitoringPageProps {
  inputMode?: string;
  selectedFile?: File | null;
  selectedCamera?: string;
  latitude?: string;
  longitude?: string;
  yaw?: string;
}

export function MonitoringPage({ 
  inputMode = 'live', 
  selectedFile, 
  selectedCamera = 'RWY-01L-CAM-01',
  latitude = '',
  longitude = '',
  yaw = ''
}: MonitoringPageProps) {
  const [isRecording, setIsRecording] = useState(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState([75]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [detections, setDetections] = useState<Detection[]>([]);
  
  // Handle webcam stream when in live mode
  useEffect(() => {
    let stream: MediaStream | null = null;

    if (inputMode === 'live' && isRecording) {
      const startWebcam = async () => {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }, 
            audio: false 
          });
          
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error('Error accessing webcam:', err);
          // Show error message in the video area
        }
      };

      startWebcam();
    }

    // Cleanup function
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [inputMode, isRecording]);
  
  // Real-time detection using the video feed
  useEffect(() => {
    let detectionInterval: NodeJS.Timeout | null = null;

    if (isRecording && inputMode === 'live' && videoRef.current) {
      // Start detection interval - capture frame every ~100ms
      detectionInterval = setInterval(async () => {
        if (!videoRef.current) return;
        
        try {
          // Prepare canvas to convert video frame to image blob
          const video = videoRef.current;
          const canvas = canvasRef.current;
          if (!canvas) return;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          
          // Set canvas dimensions to match video
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          // Draw current video frame to canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Convert canvas to JPEG blob and send to proxy
          canvas.toBlob(async (blob) => {
            if (!blob) return;
            
            try {
              const formData = new FormData();
              formData.append('file', blob, 'frame.jpg');
              
              const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/proxy/detect`, {
                method: 'POST',
                body: formData,
              });
              
              if (response.ok) {
                const result: DetectionResponse = await response.json();
                // Filter detections based on confidence threshold
                const filteredDetections = result.detections.filter(det => det.conf >= confidenceThreshold[0] / 100);
                setDetections(filteredDetections);
              }
            } catch (error) {
              console.error('Error sending frame to AI:', error);
            }
          }, 'image/jpeg', 0.7);
        } catch (error) {
          console.error('Error during detection:', error);
        }
      }, 100); // Capture every 100ms
    }

    // Clear interval when not recording or not in live mode
    return () => {
      if (detectionInterval) {
        clearInterval(detectionInterval);
      }
    };
  }, [isRecording, inputMode, confidenceThreshold]);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'bg-[#FF3B30]';
    if (confidence >= 0.75) return 'bg-[#FFCC00]';
    return 'bg-[#34C759]';
  };

  const getConfidenceTextColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-[#FF3B30]';
    if (confidence >= 0.75) return 'text-[#FFCC00]';
    return 'text-[#34C759]';
  };

  return (
    <div className="h-[calc(100vh-80px)] flex">
      {/* Main Video Feed Area (70%) */}
      <div className="flex-[0.7] p-6 flex flex-col">
        <div className="flex-1 bg-[#000000] rounded-xl relative overflow-hidden border border-[#2C2C2E]">
          {/* Video/Image/Camera Feed from Input */}
          <div className="absolute inset-0 flex items-center justify-center">
            {inputMode === 'live' ? (
              <div className="w-full h-full bg-[#000000] flex items-center justify-center relative">
                <video 
                  ref={videoRef}
                  autoPlay 
                  muted 
                  playsInline
                  className="w-full h-full object-contain"
                />
                {/* Canvas for drawing detection bboxes - hidden but used for processing */}
                <canvas 
                  ref={canvasRef} 
                  className="hidden"
                />
                
                {/* Canvas overlay for drawing detection boxes */}
                <div className="absolute inset-0">
                  {detections.map((det, idx) => {
                    // Convert xywh to absolute coordinates on the video element
                    const video = videoRef.current;
                    if (!video) return null;
                    
                    const videoRect = video.getBoundingClientRect();
                    const scaleX = video.videoWidth / videoRect.width;
                    const scaleY = video.videoHeight / videoRect.height;
                    
                    const [x, y, width, height] = det.bbox_xywh;
                    const left = (x / scaleX) + 'px';
                    const top = (y / scaleY) + 'px';
                    const w = (width / scaleX) + 'px';
                    const h = (height / scaleY) + 'px';
                    
                    return (
                      <div
                        key={idx}
                        className="absolute border-2 border-red-500"
                        style={{
                          left,
                          top,
                          width: w,
                          height: h,
                        }}
                      >
                        <div className="absolute -top-6 left-0 bg-red-500 text-white text-xs px-2 py-1 rounded">
                          {`Conf: ${(det.conf * 100).toFixed(1)}%`}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="absolute inset-0 bg-[#000000]/50 flex items-center justify-center">
                  <div className="text-center text-[#8E8E93]">
                    <div className="text-lg">WEBCAM FEED</div>
                    <div className="text-sm">{selectedCamera || 'Accessing webcam...'}</div>
                  </div>
                </div>
              </div>
            ) : selectedFile ? (
              selectedFile.type.startsWith('image/') ? (
                <img 
                  src={URL.createObjectURL(selectedFile)} 
                  alt="Selected input" 
                  className="w-full h-full object-contain"
                />
              ) : (
                <video 
                  className="w-full h-full object-contain" 
                  src={URL.createObjectURL(selectedFile)} 
                  autoPlay 
                  muted 
                  playsInline
                />
              )
            ) : (
              <div className="w-full h-full bg-[#000000] flex items-center justify-center">
                <div className="text-center text-[#8E8E93]">
                  <div className="text-lg">NO INPUT SELECTED</div>
                  <div className="text-sm">Go back to input page to select a source</div>
                </div>
              </div>
            )}
          </div>



          {/* Control Overlay */}
          <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
            <div className="bg-[#1A1A1A]/90 backdrop-blur rounded-lg px-4 py-2 flex items-center gap-4">
              <div className="flex items-center gap-2">
                {isRecording && (
                  <span className="flex items-center gap-2">
                    <Circle className="w-3 h-3 fill-[#FF3B30] text-[#FF3B30] animate-pulse" />
                    <span className="text-[#FF3B30]">REC</span>
                  </span>
                )}
              </div>
              <div className="text-[#8E8E93] text-sm">
                {new Date().toLocaleTimeString()}
              </div>
            </div>

            <div className="bg-[#1A1A1A]/90 backdrop-blur rounded-lg px-4 py-2">
              <div className="text-[#8E8E93] text-sm">{selectedCamera || 'Camera Feed'}</div>
            </div>
          </div>

          {/* Bottom Control Panel */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-[#1A1A1A]/90 backdrop-blur rounded-lg p-4">
              <div className="flex items-center gap-6">
                <Button
                  onClick={() => setIsRecording(!isRecording)}
                  variant="destructive"
                  className="bg-[#FF3B30] hover:bg-[#D62F24]"
                >
                  <StopCircle className="w-4 h-4 mr-2" />
                  {isRecording ? 'STOP' : 'START'}
                </Button>

                <div className="flex-1 flex items-center gap-4">
                  <span className="text-white text-sm whitespace-nowrap">Confidence Threshold:</span>
                  <Slider
                    value={confidenceThreshold}
                    onValueChange={setConfidenceThreshold}
                    max={100}
                    step={5}
                    className="flex-1"
                  />
                  <span className="text-[#007BFF] min-w-[3rem]">{confidenceThreshold[0]}%</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#34C759] rounded-full"></span>
                  <span className="text-[#34C759] text-sm">Connected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Event Log & Alert Sidebar (30%) */}
      <div className="flex-[0.3] bg-[#1A1A1A] border-l border-[#2C2C2E] flex flex-col">
        <div className="p-6 border-b border-[#2C2C2E]">
          <h3 className="text-white mb-2">Detection Events</h3>
          <p className="text-[#8E8E93] text-sm">Real-time FOD alerts</p>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {detections.length > 0 ? (
              detections.map((det, idx) => (
                <div key={idx} className="p-3 bg-[#2C2C2E] rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className={`font-medium ${getConfidenceTextColor(det.conf)}`}>
                      Detection #{idx + 1}
                    </span>
                    <Badge variant="outline" className={getConfidenceColor(det.conf)}>
                      {(det.conf * 100).toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="text-sm text-[#8E8E93] mt-1">
                    Class: {det.cls} | BBox: [{det.bbox_xywh[0].toFixed(1)}, {det.bbox_xywh[1].toFixed(1)}, 
                    {det.bbox_xywh[2].toFixed(1)}, {det.bbox_xywh[3].toFixed(1)}]
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-[#8E8E93]" />
                <p className="text-[#8E8E93]">No detections yet</p>
                <p className="text-[#8E8E93] text-sm mt-2">
                  {isRecording ? 'Analyzing feed...' : 'Start recording to detect FOD objects'}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Statistics Panel */}
        <div className="p-6 border-t border-[#2C2C2E] bg-[#121212]">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[#8E8E93] text-sm mb-1">Current Detections</div>
              <div className="text-white">{detections.length}</div>
            </div>
            <div>
              <div className="text-[#8E8E93] text-sm mb-1">Active Status</div>
              <div className={`text-sm ${isRecording ? 'text-[#34C759]' : 'text-[#8E8E93]'}`}>
                {isRecording ? 'Detecting' : 'Inactive'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
