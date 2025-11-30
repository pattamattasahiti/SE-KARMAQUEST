# MoveNet Model Setup

## Download the MoveNet Model

The `movenet_singlepose_lightning.tflite` model is required for pose detection.

### Option 1: Download from TensorFlow Hub
```bash
wget https://tfhub.dev/google/lite-model/movenet/singlepose/lightning/tflite/int8/4?lite-format=tflite -O movenet_singlepose_lightning.tflite
```

### Option 2: Download from Google Cloud
```bash
wget https://storage.googleapis.com/tfhub-lite-models/google/lite-model/movenet/singlepose/lightning/tflite/int8/4.tflite -O movenet_singlepose_lightning.tflite
```

### After downloading:
Place the file in:
```
karmaquest-mobileapp/assets/models/movenet_singlepose_lightning.tflite
```

## Model Specifications
- **Input**: 192x192x3 RGB image (uint8 or float32)
- **Output**: 17 keypoints with (y, x, confidence) format
- **Size**: ~3MB
- **Performance**: ~30ms on mobile CPU
- **Accuracy**: High for single-person pose detection

## Keypoint Indices (MoveNet):
0: Nose
1: Left Eye
2: Right Eye  
3: Left Ear
4: Right Ear
5: Left Shoulder
6: Right Shoulder
7: Left Elbow
8: Right Elbow
9: Left Wrist
10: Right Wrist
11: Left Hip
12: Right Hip
13: Left Knee
14: Right Knee
15: Left Ankle
16: Right Ankle
