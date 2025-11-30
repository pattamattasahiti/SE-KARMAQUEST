"""
Real-Time Pose Detection API Routes
Handles camera frame uploads and video processing
"""

from flask import Blueprint, request, jsonify, send_file
from app.services.pose_detection_service import get_pose_service
from app.services.video_pose_processor import get_video_processor
from app.services.rep_counter import get_supported_exercises
import logging
import tempfile
import os

logger = logging.getLogger(__name__)

bp = Blueprint('pose', __name__)


@bp.route('/detect', methods=['POST'])
def detect_pose():
    """
    Detect pose from camera frame
    
    Request Body:
        {
            "image": "base64_encoded_image_string",
            "session_id": "optional_session_id"
        }
    
    Response:
        {
            "success": true,
            "keypoints": [...],
            "form_analysis": {...},
            "skeleton_edges": [...]
        }
    """
    try:
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing image data'
            }), 400
        
        # Get pose detection service
        pose_service = get_pose_service()
        
        # Detect pose
        result = pose_service.detect_pose(data['image'])
        
        if not result['success']:
            return jsonify(result), 500
        
        return jsonify(result), 200
    
    except Exception as e:
        logger.error(f"Error in pose detection endpoint: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/analyze-frame', methods=['POST'])
def analyze_frame():
    """
    Analyze single frame for exercise form
    
    Request Body:
        {
            "image": "base64_encoded_image_string",
            "exercise_type": "squat" | "pushup" | "lunge",
            "session_id": "optional_session_id"
        }
    
    Response:
        {
            "success": true,
            "keypoints": [...],
            "form_analysis": {
                "knee_angle": 125.5,
                "phase": "down",
                "form_score": 85,
                "feedback": ["Go deeper"]
            }
        }
    """
    try:
        logger.info("=== Frame Analysis Request ===")
        data = request.get_json()
        
        if not data or 'image' not in data:
            logger.error("Missing image data in request")
            return jsonify({
                'success': False,
                'error': 'Missing image data'
            }), 400
        
        exercise_type = data.get('exercise_type', 'squat')
        logger.info(f"Exercise type: {exercise_type}")
        logger.info(f"Image data length: {len(data['image'])} chars")
        
        # Get pose detection service
        pose_service = get_pose_service()
        
        # Detect pose and analyze form
        logger.info("Calling pose detection service...")
        result = pose_service.detect_pose(data['image'])
        
        if not result['success']:
            logger.error(f"Pose detection failed: {result.get('error')}")
            return jsonify(result), 500
        
        # Add exercise type to response
        result['exercise_type'] = exercise_type
        
        logger.info(f"✓ Success! Returning {len(result.get('keypoints', []))} keypoints")
        return jsonify(result), 200
    
    except Exception as e:
        logger.error(f"Exception in frame analysis endpoint: {e}", exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/health', methods=['GET'])
def health_check():
    """Check if pose detection service is running"""
    try:
        pose_service = get_pose_service()
        return jsonify({
            'success': True,
            'message': 'Pose detection service is running',
            'model_loaded': pose_service.interpreter is not None
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/skeleton-edges', methods=['GET'])
def get_skeleton_edges():
    """
    Get skeleton edge connections for visualization
    
    Response:
        {
            "success": true,
            "edges": [
                {"from": 0, "to": 1, "color": "m"},
                {"from": 0, "to": 2, "color": "c"},
                ...
            ]
        }
    """
    try:
        pose_service = get_pose_service()
        edges = pose_service.get_skeleton_edges()
        
        return jsonify({
            'success': True,
            'edges': edges
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/exercises', methods=['GET'])
def get_exercises():
    """
    Get list of supported exercises for rep counting
    
    Response:
        {
            "success": true,
            "exercises": [
                {
                    "id": "squats",
                    "name": "Squats",
                    "down_threshold": 160,
                    "up_threshold": 90
                },
                ...
            ]
        }
    """
    try:
        exercises = get_supported_exercises()
        
        return jsonify({
            'success': True,
            'exercises': exercises
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/process-video', methods=['POST'])
def process_video():
    """
    Process uploaded video with pose detection and rep counting
    
    Request:
        - Multipart form data with video file
        - Field name: 'video'
        - Optional field: 'exercise_type' (squats, pushups, bicep_curls, shoulder_press, lunges)
    
    Response:
        - JSON with download URL for processed video and rep count
    """
    try:
        logger.info("=== Video Processing Request ===")
        
        # Check if video file is in request
        if 'video' not in request.files:
            logger.error("No video file in request")
            return jsonify({
                'success': False,
                'error': 'No video file provided'
            }), 400
        
        video_file = request.files['video']
        
        if video_file.filename == '':
            logger.error("Empty filename")
            return jsonify({
                'success': False,
                'error': 'Empty filename'
            }), 400
        
        # Get exercise type from form data (default to squats)
        exercise_type = request.form.get('exercise_type', 'squats')
        
        logger.info(f"Received video: {video_file.filename}")
        logger.info(f"Content type: {video_file.content_type}")
        logger.info(f"Exercise type: {exercise_type}")
        
        # Save uploaded video to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as tmp_input:
            video_file.save(tmp_input.name)
            input_path = tmp_input.name
            logger.info(f"Saved to temp file: {input_path}")
        
        # Create output path in a persistent temp directory
        import time
        output_filename = f"processed_{int(time.time() * 1000)}.mp4"
        output_dir = os.path.join(tempfile.gettempdir(), 'karmaquest_videos')
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, output_filename)
        
        # Process video
        logger.info("Starting video processing...")
        video_processor = get_video_processor()
        result = video_processor.process_video(input_path, output_path, exercise_type=exercise_type)
        
        # Clean up input file
        os.unlink(input_path)
        
        if not result['success']:
            logger.error(f"Processing failed: {result.get('error')}")
            return jsonify(result), 500
        
        # Get the actual output filename (might be compressed with different name)
        actual_output_path = result['output_path']
        actual_filename = os.path.basename(actual_output_path)
        
        logger.info(f"✓ Processing complete!")
        logger.info(f"  - Frames: {result['frame_count']}")
        logger.info(f"  - Duration: {result['duration']:.2f}s")
        logger.info(f"  - Exercise: {result['exercise_type']}")
        logger.info(f"  - Total Reps: {result['total_reps']}")
        logger.info(f"  - Form Score: {result['form_score']}/100 ({result['form_quality']})")
        logger.info(f"  - Output: {actual_output_path}")
        logger.info(f"  - Filename: {actual_filename}")
        
        # Return JSON with download URL using actual filename and form analysis
        return jsonify({
            'success': True,
            'download_url': f'/api/pose/download/{actual_filename}',
            'frame_count': result['frame_count'],
            'duration': result['duration'],
            'exercise_type': result['exercise_type'],
            'total_reps': result['total_reps'],
            'rep_timestamps': result['rep_timestamps'],
            'form_score': result['form_score'],
            'form_quality': result['form_quality'],
            'form_feedback': result['form_feedback'],
            'rep_scores': result['rep_scores']
        }), 200
    
    except Exception as e:
        logger.error(f"Exception in video processing: {e}", exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/download/<filename>', methods=['GET'])
def download_processed_video(filename):
    """
    Download a processed video file
    Stream it efficiently to client
    
    Response:
        - Processed video file (streamed)
    """
    try:
        output_dir = os.path.join(tempfile.gettempdir(), 'karmaquest_videos')
        file_path = os.path.join(output_dir, filename)
        
        print(f"[Video] Attempting to download: {file_path}")
        print(f"[Video] File exists: {os.path.exists(file_path)}")
        
        if not os.path.exists(file_path):
            print(f"[Video] ❌ File not found: {filename}")
            print(f"[Video] Directory contents: {os.listdir(output_dir) if os.path.exists(output_dir) else 'Directory does not exist'}")
            return jsonify({
                'success': False,
                'error': 'Video file not found. The video may have been cleaned up or expired.',
                'message': 'Processed videos are temporarily stored and automatically cleaned up after some time.'
            }), 404
        
        # Don't clean up when downloading - videos should persist
        # _cleanup_old_videos(output_dir, max_age_hours=1)
        
        print(f"[Video] ✅ Streaming video: {filename}")
        return send_file(
            file_path,
            mimetype='video/mp4',
            as_attachment=False,  # Stream instead of download
            download_name=filename
        )
    
    except Exception as e:
        logger.error(f"Exception in download: {e}", exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


def _cleanup_old_videos(directory, max_age_hours=1):
    """
    Delete video files older than max_age_hours
    Prevents disk space buildup
    """
    try:
        import time
        current_time = time.time()
        max_age_seconds = max_age_hours * 3600
        
        if not os.path.exists(directory):
            return
        
        deleted_count = 0
        for filename in os.listdir(directory):
            file_path = os.path.join(directory, filename)
            if os.path.isfile(file_path):
                file_age = current_time - os.path.getmtime(file_path)
                if file_age > max_age_seconds:
                    os.unlink(file_path)
                    deleted_count += 1
        
        if deleted_count > 0:
            logger.info(f"🗑️ Cleaned up {deleted_count} old video files")
                    
    except Exception as e:
        logger.error(f"Error cleaning up old videos: {e}")
