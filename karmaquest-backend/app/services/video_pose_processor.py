"""
Video Pose Processing Service
Processes entire videos and returns processed video with keypoints overlay
Based on Jupyter notebook batch processing approach
Includes video compression to reduce file size and improve streaming
"""

import tensorflow as tf
import numpy as np
import cv2
import base64
import tempfile
import os
import subprocess
from io import BytesIO
from PIL import Image
import logging

logger = logging.getLogger(__name__)

from app.services.pose_detection_service import (
    PoseDetectionService,
    KEYPOINT_EDGE_INDS_TO_COLOR
)
from app.services.rep_counter import (
    AngleRepCounter,
    EXERCISE_CONFIGS,
    get_supported_exercises
)
from app.services.form_analyzer import AngleFormAnalyzer


class VideoPoseProcessor:
    """Process videos with pose detection and return annotated video"""
    
    def __init__(self):
        self.pose_service = PoseDetectionService()
        
    def process_video(self, video_path, output_path=None, exercise_type='squats'):
        """
        Process video file and return processed video with keypoints and rep counting
        
        Args:
            video_path: Path to input video file
            output_path: Path for output video (optional, will create temp if not provided)
            exercise_type: Type of exercise ('squats', 'pushups', 'bicep_curls', etc.)
            
        Returns:
            dict with output_path, frame_count, fps, keypoints_per_frame, total_reps
        """
        try:
            logger.info("="*70)
            logger.info("� STARTING END-TO-END PROCESSING")
            logger.info("="*70)
            logger.info(f"�📹 Processing video: {video_path}")
            logger.info(f"🏋️  Exercise type: {exercise_type}")
            logger.info("")
            
            # Validate exercise type
            if exercise_type not in EXERCISE_CONFIGS:
                logger.warning(f"Unknown exercise type: {exercise_type}, defaulting to squats")
                exercise_type = 'squats'
            
            # Initialize rep counter
            config = EXERCISE_CONFIGS[exercise_type]
            rep_counter = AngleRepCounter(
                down_threshold=config['down_threshold'],
                up_threshold=config['up_threshold'],
                min_frames_down=config['min_frames_down'],
                min_frames_up=config['min_frames_up']
            )
            angle_extractor = config['angle_extractor']
            
            # Open video
            cap = cv2.VideoCapture(video_path)
            if not cap.isOpened():
                raise Exception("Cannot open video file")
            
            # Get video properties
            fps = cap.get(cv2.CAP_PROP_FPS)
            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            
            logger.info(f"📊 Video Info:")
            logger.info(f"   Resolution: {frame_width}x{frame_height}")
            logger.info(f"   FPS: {fps}")
            logger.info(f"   Total Frames: {frame_count}")
            logger.info("")
            logger.info("🎬 Processing frames...")
            
            # Create output video writer
            if output_path is None:
                output_path = tempfile.mktemp(suffix='.mp4')
            
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            out = cv2.VideoWriter(output_path, fourcc, fps, (frame_width, frame_height))
            
            all_keypoints = []
            all_keypoints_array = []  # Store in numpy format for form analysis
            frame_idx = 0
            
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break
                
                # Convert BGR to RGB
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                
                # Preprocess and run inference
                input_image = self.pose_service.preprocess_frame(frame_rgb)
                keypoints_with_scores = self.pose_service.run_inference(input_image)
                keypoints_list = self.pose_service.extract_keypoints(keypoints_with_scores)
                
                # Store keypoints
                all_keypoints.append(keypoints_list)
                
                # Convert keypoints to numpy format for rep counting
                keypoints_array = self._convert_keypoints_to_array(keypoints_list)
                all_keypoints_array.append(keypoints_array)
                
                # Model 3: Calculate angle and update rep counter
                angle = angle_extractor(keypoints_array)
                rep_completed = rep_counter.update(angle, frame_idx)
                
                # Log rep completion (like notebook)
                if rep_completed:
                    logger.info(f"   ✅ Rep #{rep_counter.get_count()} at frame {frame_idx}")
                
                frame_idx += 1
                
                # Progress indicator (every 30 frames, like notebook)
                if frame_idx % 30 == 0:
                    logger.info(f"   Processed {frame_idx}/{frame_count} frames...")
            
            cap.release()
            
            # Get rep counting stats
            rep_stats = rep_counter.get_stats()
            
            # Model 2: Analyze form quality
            logger.info("")
            logger.info("🔍 Analyzing form quality...")
            form_analyzer = AngleFormAnalyzer(exercise_type=exercise_type)
            all_keypoints_np = np.array(all_keypoints_array)
            form_results = form_analyzer.analyze_video(
                all_keypoints_np, 
                rep_stats['rep_timestamps']
            )
            
            logger.info(f"   Form Score: {form_results['form_score']}/100 ({form_results['quality']})")
            logger.info(f"   Feedback: {form_results['feedback']}")
            logger.info("")
            
            # Second pass: Re-annotate video with form analysis
            logger.info("🎨 Creating annotated video with form analysis...")
            cap = cv2.VideoCapture(video_path)
            frame_idx = 0
            current_rep = 0
            rep_timestamps_list = rep_stats['rep_timestamps']
            
            # Reset rep counter for second pass
            rep_counter = AngleRepCounter(
                down_threshold=config['down_threshold'],
                up_threshold=config['up_threshold'],
                min_frames_down=config['min_frames_down'],
                min_frames_up=config['min_frames_up']
            )
            
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break
                
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                keypoints_list = all_keypoints[frame_idx]
                keypoints_array = all_keypoints_array[frame_idx]
                
                # Update rep counter
                angle = angle_extractor(keypoints_array)
                rep_completed = rep_counter.update(angle, frame_idx)
                
                # Get current rep's form data
                current_rep_idx = rep_counter.get_count() - 1
                if current_rep_idx >= 0 and current_rep_idx < len(form_results['rep_details']):
                    current_rep_data = form_results['rep_details'][current_rep_idx]
                else:
                    current_rep_data = None
                
                # Draw keypoints with form analysis
                annotated_frame = self._draw_keypoints_on_frame(
                    frame_rgb, 
                    keypoints_list,
                    frame_width,
                    frame_height,
                    rep_counter,
                    angle,
                    rep_completed,
                    form_data=current_rep_data
                )
                
                # Convert back to BGR for video writer
                annotated_frame_bgr = cv2.cvtColor(annotated_frame, cv2.COLOR_RGB2BGR)
                out.write(annotated_frame_bgr)
                
                frame_idx += 1
            
            cap.release()
            out.release()
            
            # Log completion (like notebook)
            logger.info("")
            logger.info("="*70)
            logger.info("✅ PROCESSING COMPLETE!")
            logger.info("="*70)
            logger.info(f"📊 Results:")
            logger.info(f"   Total Reps: {rep_stats['total_reps']}")
            logger.info(f"   Form Score: {form_results['form_score']}/100 ({form_results['quality']})")
            logger.info(f"   Frames Processed: {frame_idx}")
            logger.info(f"   Rep Timestamps: {rep_stats['rep_timestamps']}")
            logger.info(f"   Output Video: {output_path}")
            logger.info("")
            
            # Compress the video to reduce file size for efficient streaming
            compressed_path = self._compress_video(output_path)
            
            # Remove uncompressed version
            if compressed_path != output_path and os.path.exists(output_path):
                os.unlink(output_path)
            
            return {
                'success': True,
                'output_path': compressed_path,
                'frame_count': frame_idx,
                'fps': fps,
                'duration': frame_idx / fps,
                'total_keypoints': len(all_keypoints),
                'exercise_type': exercise_type,
                'total_reps': rep_stats['total_reps'],
                'rep_timestamps': rep_stats['rep_timestamps'],
                'angle_history': rep_stats['angle_history'],
                'form_score': form_results['form_score'],
                'form_quality': form_results['quality'],
                'form_feedback': form_results['feedback'],
                'rep_scores': form_results['rep_scores'],
                'rep_details': form_results['rep_details']
            }
            
        except Exception as e:
            logger.error(f"Error processing video: {e}", exc_info=True)
            return {
                'success': False,
                'error': str(e)
            }
    
    def _compress_video(self, input_path):
        """
        Compress video using FFmpeg to reduce file size by ~70-80%
        Uses H.264 codec with optimized settings for mobile streaming
        
        Args:
            input_path: Path to uncompressed video
            
        Returns:
            Path to compressed video
        """
        try:
            # Create compressed output path
            base, ext = os.path.splitext(input_path)
            compressed_path = f"{base}_compressed{ext}"
            
            logger.info(f"🗜️ Compressing video: {input_path}")
            
            # FFmpeg command for efficient compression
            # - CRF 28: Good balance between quality and file size (23=high quality, 28=medium, 32=lower)
            # - preset fast: Balance between speed and compression
            # - H.264: Universal codec support
            # - scale: Reduce resolution if needed (optional, can remove if you want original size)
            cmd = [
                'ffmpeg',
                '-i', input_path,
                '-c:v', 'libx264',          # H.264 codec
                '-crf', '28',                # Compression level (lower = better quality, larger file)
                '-preset', 'fast',           # Encoding speed
                '-movflags', '+faststart',   # Enable streaming
                '-pix_fmt', 'yuv420p',       # Pixel format for compatibility
                '-y',                        # Overwrite output
                compressed_path
            ]
            
            # Run FFmpeg
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout
            )
            
            if result.returncode != 0:
                logger.error(f"FFmpeg error: {result.stderr}")
                # If compression fails, return original
                return input_path
            
            # Check file sizes
            original_size = os.path.getsize(input_path)
            compressed_size = os.path.getsize(compressed_path)
            reduction = (1 - compressed_size / original_size) * 100
            
            logger.info(f"✓ Compression complete:")
            logger.info(f"  Original: {original_size / 1024 / 1024:.1f} MB")
            logger.info(f"  Compressed: {compressed_size / 1024 / 1024:.1f} MB")
            logger.info(f"  Reduction: {reduction:.1f}%")
            
            return compressed_path
            
        except subprocess.TimeoutExpired:
            logger.error("FFmpeg compression timed out")
            return input_path
        except FileNotFoundError:
            logger.warning("FFmpeg not found, skipping compression")
            return input_path
        except Exception as e:
            logger.error(f"Error compressing video: {e}")
            return input_path
    
    def _convert_keypoints_to_array(self, keypoints_list):
        """
        Convert keypoints list to numpy array format for rep counting
        
        Args:
            keypoints_list: List of keypoint dicts with x, y, score
            
        Returns:
            numpy array of shape (17, 3) with [x, y, confidence]
        
        Note: MoveNet returns [y, x, conf] but we store as [x, y, conf] for consistency
        """
        keypoints_array = np.zeros((17, 3))
        for i, kp in enumerate(keypoints_list):
            # Store as [x, y, confidence] format
            keypoints_array[i] = [kp['x'], kp['y'], kp['score']]
        return keypoints_array
    
    def _draw_keypoints_on_frame(self, frame, keypoints_list, width, height, 
                                 rep_counter=None, angle=None, rep_completed=False, form_data=None):
        """
        Draw keypoints and skeleton on frame with rep counting info and form analysis
        
        Args:
            frame: RGB numpy array
            keypoints_list: List of keypoint dicts with x, y, score
            width: Frame width
            height: Frame height
            rep_counter: AngleRepCounter instance
            angle: Current angle measurement
            rep_completed: Whether a rep was just completed
            form_data: Dict with form analysis for current rep (rep_score, checks)
            
        Returns:
            Annotated frame (RGB numpy array)
        """
        # Create copy to draw on
        output_frame = frame.copy()
        
        # Confidence threshold (same as notebook)
        threshold = 0.11
        
        # Color mapping (same as notebook)
        color_map = {
            'm': (255, 0, 255),    # Magenta (BGR -> RGB)
            'c': (0, 255, 255),    # Cyan
            'y': (255, 255, 0),    # Yellow
        }
        
        # Draw edges first (skeleton lines)
        for (idx1, idx2), color_key in KEYPOINT_EDGE_INDS_TO_COLOR.items():
            kp1 = keypoints_list[idx1]
            kp2 = keypoints_list[idx2]
            
            # Only draw if both keypoints are confident
            if kp1['score'] > threshold and kp2['score'] > threshold:
                x1 = int(kp1['x'] * width)
                y1 = int(kp1['y'] * height)
                x2 = int(kp2['x'] * width)
                y2 = int(kp2['y'] * height)
                
                color = color_map.get(color_key, (255, 255, 255))
                
                # Draw line (thickness 4 like notebook)
                cv2.line(output_frame, (x1, y1), (x2, y2), color, thickness=4)
        
        # Draw keypoints second (circles on top)
        for kp in keypoints_list:
            if kp['score'] > threshold:
                x = int(kp['x'] * width)
                y = int(kp['y'] * height)
                
                # Draw filled circle (bright pink, radius 6, matches notebook s=60 scaled down)
                cv2.circle(output_frame, (x, y), radius=6, color=(255, 20, 147), thickness=-1)
        
        # Add rep counting information (exactly like notebook)
        if rep_counter is not None:
            # Rep count (top-left, large green text)
            rep_text = f"Reps: {rep_counter.get_count()}"
            cv2.putText(output_frame, rep_text, (20, 50), 
                       cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 255, 0), 3)
            
            # Current angle (yellow text with larger size)
            if angle is not None:
                angle_text = f"Angle: {angle:.1f}"
                cv2.putText(output_frame, angle_text, (20, 100), 
                           cv2.FONT_HERSHEY_SIMPLEX, 1.2, (255, 255, 0), 3)
            
            # Current state (orange text)
            state_text = f"State: {rep_counter.get_state()}"
            cv2.putText(output_frame, state_text, (20, 145), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 165, 0), 2)
            
            # Form analysis (if available)
            if form_data is not None:
                rep_score = form_data['rep_score']
                score_pct = int(rep_score * 100)
                
                # Color-coded by quality
                if score_pct >= 90:
                    score_color = (0, 255, 0)  # Green - excellent
                elif score_pct >= 75:
                    score_color = (255, 255, 0)  # Yellow - good
                elif score_pct >= 60:
                    score_color = (255, 165, 0)  # Orange - acceptable
                else:
                    score_color = (255, 0, 0)  # Red - poor
                
                # Form score (below state)
                form_text = f"Form: {score_pct}%"
                cv2.putText(output_frame, form_text, (20, 190), 
                           cv2.FONT_HERSHEY_SIMPLEX, 1.0, score_color, 2)
                
                # Top 2 form issues (smaller text, right side)
                poor_checks = [c for c in form_data['checks'] if c['quality'] != 'good']
                poor_checks.sort(key=lambda x: x['score'])  # Worst first
                
                y_offset = 50
                for i, check in enumerate(poor_checks[:2]):
                    feedback = check['feedback']
                    # Wrap text if too long
                    if len(feedback) > 40:
                        feedback = feedback[:37] + "..."
                    cv2.putText(output_frame, feedback, (width - 450, y_offset), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 100, 100), 2)
                    y_offset += 30
            
            # Rep completion message with score (center of frame)
            if rep_completed:
                if form_data is not None:
                    score_pct = int(form_data['rep_score'] * 100)
                    complete_text = f"REP COMPLETE! Score: {score_pct}%"
                else:
                    complete_text = "REP COMPLETE!"
                
                # Calculate text size for centering
                text_size = cv2.getTextSize(complete_text, cv2.FONT_HERSHEY_SIMPLEX, 1.5, 4)[0]
                text_x = (width - text_size[0]) // 2
                text_y = height // 2
                
                cv2.putText(output_frame, complete_text, (text_x, text_y), 
                           cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 255, 0), 4)
        
        return output_frame


# Global processor instance
video_processor = None


def get_video_processor():
    """Get or create video processor instance"""
    global video_processor
    if video_processor is None:
        video_processor = VideoPoseProcessor()
    return video_processor
