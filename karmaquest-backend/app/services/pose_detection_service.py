"""
Real-Time Pose Detection Service
Uses MoveNet Lightning model for fast pose estimation
Based on ai-training/pose-detection-model1 notebook
"""

import tensorflow as tf
import numpy as np
import cv2
import base64
from io import BytesIO
from PIL import Image
import logging

logger = logging.getLogger(__name__)

# Keypoint dictionary (17 keypoints)
KEYPOINT_DICT = {
    'nose': 0,
    'left_eye': 1,
    'right_eye': 2,
    'left_ear': 3,
    'right_ear': 4,
    'left_shoulder': 5,
    'right_shoulder': 6,
    'left_elbow': 7,
    'right_elbow': 8,
    'left_wrist': 9,
    'right_wrist': 10,
    'left_hip': 11,
    'right_hip': 12,
    'left_knee': 13,
    'right_knee': 14,
    'left_ankle': 15,
    'right_ankle': 16
}

# Edge connections with colors (for visualization)
KEYPOINT_EDGE_INDS_TO_COLOR = {
    (0, 1): 'm',  # Face
    (0, 2): 'c',
    (1, 3): 'm',
    (2, 4): 'c',
    (0, 5): 'm',
    (0, 6): 'c',
    (5, 7): 'm',  # Arms
    (7, 9): 'm',
    (6, 8): 'c',
    (8, 10): 'c',
    (5, 6): 'y',  # Torso
    (5, 11): 'm',
    (6, 12): 'c',
    (11, 12): 'y',
    (11, 13): 'm',  # Legs
    (13, 15): 'm',
    (12, 14): 'c',
    (14, 16): 'c'
}

MIN_CROP_KEYPOINT_SCORE = 0.2


class PoseDetectionService:
    """Service for real-time pose detection using MoveNet"""
    
    def __init__(self, model_path='models/movenet_lightning.tflite'):
        """Initialize the pose detection service"""
        self.model_path = model_path
        self.interpreter = None
        self.input_size = 192  # MoveNet Lightning input size
        self._load_model()
        
    def _load_model(self):
        """Load the TensorFlow Lite model"""
        try:
            self.interpreter = tf.lite.Interpreter(model_path=self.model_path)
            self.interpreter.allocate_tensors()
            logger.info(f"✓ MoveNet model loaded: {self.model_path}")
        except Exception as e:
            logger.error(f"❌ Failed to load model: {e}")
            raise
    
    def decode_base64_image(self, base64_string):
        """Decode base64 image to numpy array"""
        try:
            # Remove header if present
            if ',' in base64_string:
                base64_string = base64_string.split(',')[1]
            
            # Decode base64 to bytes
            img_bytes = base64.b64decode(base64_string)
            
            # Convert to PIL Image
            img = Image.open(BytesIO(img_bytes))
            
            # Convert to RGB numpy array
            img_array = np.array(img.convert('RGB'))
            
            return img_array
        except Exception as e:
            logger.error(f"Error decoding image: {e}")
            raise
    
    def preprocess_frame(self, image):
        """Preprocess image for MoveNet (resize to 192x192)"""
        # Resize to model input size
        image_resized = cv2.resize(image, (self.input_size, self.input_size))
        
        # Convert to uint8 tensor
        input_image = np.expand_dims(image_resized, axis=0).astype(np.uint8)
        
        return input_image
    
    def run_inference(self, input_image):
        """Run MoveNet inference on preprocessed image"""
        # Get input/output details
        input_details = self.interpreter.get_input_details()
        output_details = self.interpreter.get_output_details()
        
        # Set input tensor
        self.interpreter.set_tensor(input_details[0]['index'], input_image)
        
        # Run inference
        self.interpreter.invoke()
        
        # Get keypoints with scores
        keypoints_with_scores = self.interpreter.get_tensor(output_details[0]['index'])
        
        return keypoints_with_scores
    
    def extract_keypoints(self, keypoints_with_scores):
        """Extract keypoints in a clean format"""
        # Shape: (1, 1, 17, 3) -> Extract the 17 keypoints
        keypoints = keypoints_with_scores[0, 0]
        
        # Convert to list of dicts for JSON serialization
        keypoints_list = []
        for i, (name, idx) in enumerate(KEYPOINT_DICT.items()):
            y, x, score = keypoints[idx]
            keypoints_list.append({
                'name': name,
                'index': idx,
                'x': float(x),
                'y': float(y),
                'score': float(score)
            })
        
        return keypoints_list
    
    def calculate_angle(self, p1, p2, p3):
        """Calculate angle between three points (in degrees)"""
        # Vector from p2 to p1
        v1 = np.array([p1['x'] - p2['x'], p1['y'] - p2['y']])
        
        # Vector from p2 to p3
        v2 = np.array([p3['x'] - p2['x'], p3['y'] - p2['y']])
        
        # Calculate angle
        angle_rad = np.arctan2(v2[1], v2[0]) - np.arctan2(v1[1], v1[0])
        angle_deg = np.abs(angle_rad * 180.0 / np.pi)
        
        if angle_deg > 180.0:
            angle_deg = 360.0 - angle_deg
        
        return float(angle_deg)
    
    def analyze_squat_form(self, keypoints_list):
        """Analyze squat form from keypoints"""
        # Convert list to dict for easy access
        keypoints_dict = {kp['name']: kp for kp in keypoints_list}
        
        # Extract leg keypoints
        left_hip = keypoints_dict['left_hip']
        left_knee = keypoints_dict['left_knee']
        left_ankle = keypoints_dict['left_ankle']
        
        right_hip = keypoints_dict['right_hip']
        right_knee = keypoints_dict['right_knee']
        right_ankle = keypoints_dict['right_ankle']
        
        # Check visibility
        min_confidence = 0.3
        left_leg_visible = (
            left_hip['score'] > min_confidence and
            left_knee['score'] > min_confidence and
            left_ankle['score'] > min_confidence
        )
        
        right_leg_visible = (
            right_hip['score'] > min_confidence and
            right_knee['score'] > min_confidence and
            right_ankle['score'] > min_confidence
        )
        
        if not (left_leg_visible or right_leg_visible):
            return {
                'knee_angle': None,
                'phase': 'unknown',
                'form_score': 0,
                'feedback': ['Cannot detect legs clearly']
            }
        
        # Calculate knee angles
        left_knee_angle = None
        right_knee_angle = None
        
        if left_leg_visible:
            left_knee_angle = self.calculate_angle(left_hip, left_knee, left_ankle)
        
        if right_leg_visible:
            right_knee_angle = self.calculate_angle(right_hip, right_knee, right_ankle)
        
        # Average knee angle
        if left_knee_angle and right_knee_angle:
            knee_angle = (left_knee_angle + right_knee_angle) / 2
        elif left_knee_angle:
            knee_angle = left_knee_angle
        else:
            knee_angle = right_knee_angle
        
        # Determine squat phase
        SQUAT_DOWN_THRESHOLD = 120
        SQUAT_UP_THRESHOLD = 160
        
        if knee_angle < SQUAT_DOWN_THRESHOLD:
            phase = 'down'
        elif knee_angle > SQUAT_UP_THRESHOLD:
            phase = 'up'
        else:
            phase = 'transition'
        
        # Form analysis
        feedback = []
        form_score = 100
        
        if knee_angle > 140 and phase == 'down':
            feedback.append('Go deeper')
            form_score = 70
        
        if knee_angle < 90:
            feedback.append('Excellent depth!')
            form_score = 100
        
        return {
            'knee_angle': float(knee_angle),
            'left_knee_angle': float(left_knee_angle) if left_knee_angle else None,
            'right_knee_angle': float(right_knee_angle) if right_knee_angle else None,
            'phase': phase,
            'form_score': form_score,
            'feedback': feedback
        }
    
    def get_skeleton_edges(self):
        """Get skeleton edge connections for visualization"""
        edges = []
        for (idx1, idx2), color in KEYPOINT_EDGE_INDS_TO_COLOR.items():
            edges.append({
                'from': idx1,
                'to': idx2,
                'color': color
            })
        return edges
    
    def detect_pose(self, base64_image):
        """
        Main function: Detect pose from base64 encoded image
        
        Args:
            base64_image: Base64 encoded image string
            
        Returns:
            dict with keypoints, form analysis, and skeleton edges
        """
        try:
            logger.info("Starting pose detection...")
            
            # 1. Decode image
            logger.info("Decoding image...")
            image = self.decode_base64_image(base64_image)
            logger.info(f"Image decoded: shape={image.shape}")
            
            # 2. Preprocess
            logger.info("Preprocessing image...")
            input_image = self.preprocess_frame(image)
            logger.info(f"Image preprocessed: shape={input_image.shape}")
            
            # 3. Run inference
            logger.info("Running TensorFlow inference...")
            keypoints_with_scores = self.run_inference(input_image)
            logger.info(f"Inference complete: {keypoints_with_scores.shape}")
            
            # 4. Extract keypoints
            logger.info("Extracting keypoints...")
            keypoints_list = self.extract_keypoints(keypoints_with_scores)
            logger.info(f"Extracted {len(keypoints_list)} keypoints")
            
            # DEBUG: Log keypoint details
            visible_count = sum(1 for kp in keypoints_list if kp['score'] > 0.11)
            avg_score = sum(kp['score'] for kp in keypoints_list) / len(keypoints_list)
            logger.info(f"Visible keypoints (>0.11): {visible_count}/17, Avg score: {avg_score:.3f}")
            logger.info(f"Sample keypoints: {keypoints_list[:3]}")
            
            # 5. Analyze form
            logger.info("Analyzing form...")
            form_analysis = self.analyze_squat_form(keypoints_list)
            logger.info(f"Form analysis: {form_analysis}")
            
            # 6. Get skeleton edges
            edges = self.get_skeleton_edges()
            
            result = {
                'success': True,
                'keypoints': keypoints_list,
                'form_analysis': form_analysis,
                'skeleton_edges': edges,
                'image_size': {
                    'width': int(image.shape[1]),
                    'height': int(image.shape[0])
                }
            }
            
            logger.info("Pose detection complete!")
            return result
        
        except Exception as e:
            logger.error(f"Error in pose detection: {e}", exc_info=True)
            return {
                'success': False,
                'error': str(e)
            }


# Global service instance (initialized when app starts)
pose_service = None


def get_pose_service():
    """Get or create the pose detection service instance"""
    global pose_service
    if pose_service is None:
        pose_service = PoseDetectionService()
    return pose_service
