from fastapi import FastAPI, File, UploadFile
from pydantic import BaseModel
from ultralytics import YOLO
import cv2
import numpy as np
import time
from typing import List, Optional
import io


class Detection(BaseModel):
    cls: str
    conf: float
    bbox_xywh: List[float]  # [x, y, width, height]


class DetectionResponse(BaseModel):
    ts: str
    model: str
    fps: float
    detections: List[Detection]


# Load the model
model = YOLO('/models/best.pt')

app = FastAPI(title='AI Detection Service')


@app.get('/health')
async def health():
    return {'ok': True, 'model_loaded': True}


@app.post('/v1/detect', response_model=DetectionResponse)
async def detect(file: UploadFile = File(...)):
    start_time = time.time()
    
    # Read the uploaded image file
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # Perform inference
    results = model(img)
    
    # Prepare detections
    detections = []
    for det in results[0].boxes:
        if det.conf[0] > 0.5:  # Only include confident detections
            bbox = det.xyxy[0].cpu().numpy()  # x1, y1, x2, y2
            # Convert to xywh format
            x = float(bbox[0])
            y = float(bbox[1])
            w = float(bbox[2] - x)
            h = float(bbox[3] - y)
            
            detection = Detection(
                cls=str(int(det.cls[0])),
                conf=float(det.conf[0]),
                bbox_xywh=[x, y, w, h]
            )
            detections.append(detection)
    
    # Calculate FPS based on processing time
    processing_time = time.time() - start_time
    fps = 1.0 / processing_time if processing_time > 0 else 0.0
    
    return DetectionResponse(
        ts=time.strftime('%Y-%m-%dT%H:%M:%S.%fZ', time.gmtime()),
        model='best.pt',
        fps=fps,
        detections=detections
    )