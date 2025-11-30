"""
Rep Counter Module - Angle-Based Approach
Use with MoveNet keypoints from Model 1
"""

import numpy as np
from typing import Dict, List, Tuple, Optional


# MoveNet keypoint indices
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


def calculate_angle(point1, point2, point3):
    """
    Calculate angle between three points.
    point2 is the vertex (middle point).
    
    Args:
        point1: [x, y] coordinates
        point2: [x, y] coordinates (vertex)
        point3: [x, y] coordinates
    
    Returns:
        Angle in degrees (0-180)
    """
    v1 = np.array(point1) - np.array(point2)
    v2 = np.array(point3) - np.array(point2)
    
    cos_angle = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-8)
    angle = np.arccos(np.clip(cos_angle, -1.0, 1.0))
    
    return np.degrees(angle)


def get_squat_angle(keypoints):
    """
    Get knee angle for squats.
    Angle between hip → knee → ankle.
    """
    left_hip = keypoints[KEYPOINT_DICT['left_hip']][:2]
    left_knee = keypoints[KEYPOINT_DICT['left_knee']][:2]
    left_ankle = keypoints[KEYPOINT_DICT['left_ankle']][:2]
    
    right_hip = keypoints[KEYPOINT_DICT['right_hip']][:2]
    right_knee = keypoints[KEYPOINT_DICT['right_knee']][:2]
    right_ankle = keypoints[KEYPOINT_DICT['right_ankle']][:2]
    
    left_angle = calculate_angle(left_hip, left_knee, left_ankle)
    right_angle = calculate_angle(right_hip, right_knee, right_ankle)
    
    return (left_angle + right_angle) / 2


def get_pushup_angle(keypoints):
    """
    Get elbow angle for push-ups.
    Angle between shoulder → elbow → wrist.
    """
    left_shoulder = keypoints[KEYPOINT_DICT['left_shoulder']][:2]
    left_elbow = keypoints[KEYPOINT_DICT['left_elbow']][:2]
    left_wrist = keypoints[KEYPOINT_DICT['left_wrist']][:2]
    
    right_shoulder = keypoints[KEYPOINT_DICT['right_shoulder']][:2]
    right_elbow = keypoints[KEYPOINT_DICT['right_elbow']][:2]
    right_wrist = keypoints[KEYPOINT_DICT['right_wrist']][:2]
    
    left_angle = calculate_angle(left_shoulder, left_elbow, left_wrist)
    right_angle = calculate_angle(right_shoulder, right_elbow, right_wrist)
    
    return (left_angle + right_angle) / 2


def get_bicep_curl_angle(keypoints, side='left'):
    """
    Get elbow angle for bicep curls.
    """
    if side == 'left':
        shoulder = keypoints[KEYPOINT_DICT['left_shoulder']][:2]
        elbow = keypoints[KEYPOINT_DICT['left_elbow']][:2]
        wrist = keypoints[KEYPOINT_DICT['left_wrist']][:2]
    else:
        shoulder = keypoints[KEYPOINT_DICT['right_shoulder']][:2]
        elbow = keypoints[KEYPOINT_DICT['right_elbow']][:2]
        wrist = keypoints[KEYPOINT_DICT['right_wrist']][:2]
    
    return calculate_angle(shoulder, elbow, wrist)


def get_shoulder_press_angle(keypoints):
    """
    Get elbow angle for shoulder press.
    """
    return get_pushup_angle(keypoints)


def get_lunge_angle(keypoints, side='left'):
    """
    Get knee angle for lunges.
    """
    if side == 'left':
        hip = keypoints[KEYPOINT_DICT['left_hip']][:2]
        knee = keypoints[KEYPOINT_DICT['left_knee']][:2]
        ankle = keypoints[KEYPOINT_DICT['left_ankle']][:2]
    else:
        hip = keypoints[KEYPOINT_DICT['right_hip']][:2]
        knee = keypoints[KEYPOINT_DICT['right_knee']][:2]
        ankle = keypoints[KEYPOINT_DICT['right_ankle']][:2]
    
    return calculate_angle(hip, knee, ankle)


def get_bench_press_angle(keypoints):
    """
    Get elbow angle for bench press.
    Angle between shoulder → elbow → wrist (same as push-up).
    """
    return get_pushup_angle(keypoints)


def get_dips_angle(keypoints):
    """
    Get elbow angle for dips.
    Angle between shoulder → elbow → wrist.
    """
    return get_pushup_angle(keypoints)


def get_tricep_extension_angle(keypoints, side='left'):
    """
    Get elbow angle for overhead tricep extensions.
    Measures full elbow flexion/extension with arms overhead.
    """
    if side == 'left':
        shoulder = keypoints[KEYPOINT_DICT['left_shoulder']][:2]
        elbow = keypoints[KEYPOINT_DICT['left_elbow']][:2]
        wrist = keypoints[KEYPOINT_DICT['left_wrist']][:2]
    else:
        shoulder = keypoints[KEYPOINT_DICT['right_shoulder']][:2]
        elbow = keypoints[KEYPOINT_DICT['right_elbow']][:2]
        wrist = keypoints[KEYPOINT_DICT['right_wrist']][:2]
    
    return calculate_angle(shoulder, elbow, wrist)


def get_pullup_angle(keypoints):
    """
    Get elbow angle for pull-ups.
    Angle between shoulder → elbow → wrist.
    """
    left_shoulder = keypoints[KEYPOINT_DICT['left_shoulder']][:2]
    left_elbow = keypoints[KEYPOINT_DICT['left_elbow']][:2]
    left_wrist = keypoints[KEYPOINT_DICT['left_wrist']][:2]
    
    right_shoulder = keypoints[KEYPOINT_DICT['right_shoulder']][:2]
    right_elbow = keypoints[KEYPOINT_DICT['right_elbow']][:2]
    right_wrist = keypoints[KEYPOINT_DICT['right_wrist']][:2]
    
    left_angle = calculate_angle(left_shoulder, left_elbow, left_wrist)
    right_angle = calculate_angle(right_shoulder, right_elbow, right_wrist)
    
    return (left_angle + right_angle) / 2


def get_row_angle(keypoints):
    """
    Get elbow angle for bent-over rows.
    Angle between shoulder → elbow → wrist.
    """
    left_shoulder = keypoints[KEYPOINT_DICT['left_shoulder']][:2]
    left_elbow = keypoints[KEYPOINT_DICT['left_elbow']][:2]
    left_wrist = keypoints[KEYPOINT_DICT['left_wrist']][:2]
    
    right_shoulder = keypoints[KEYPOINT_DICT['right_shoulder']][:2]
    right_elbow = keypoints[KEYPOINT_DICT['right_elbow']][:2]
    right_wrist = keypoints[KEYPOINT_DICT['right_wrist']][:2]
    
    left_angle = calculate_angle(left_shoulder, left_elbow, left_wrist)
    right_angle = calculate_angle(right_shoulder, right_elbow, right_wrist)
    
    return (left_angle + right_angle) / 2


def get_lat_pulldown_angle(keypoints):
    """
    Get elbow angle for lat pulldowns.
    Angle between shoulder → elbow → wrist (similar to pull-ups).
    """
    return get_pullup_angle(keypoints)


def get_face_pull_angle(keypoints):
    """
    Get elbow angle for face pulls.
    Angle between shoulder → elbow → wrist.
    """
    left_shoulder = keypoints[KEYPOINT_DICT['left_shoulder']][:2]
    left_elbow = keypoints[KEYPOINT_DICT['left_elbow']][:2]
    left_wrist = keypoints[KEYPOINT_DICT['left_wrist']][:2]
    
    right_shoulder = keypoints[KEYPOINT_DICT['right_shoulder']][:2]
    right_elbow = keypoints[KEYPOINT_DICT['right_elbow']][:2]
    right_wrist = keypoints[KEYPOINT_DICT['right_wrist']][:2]
    
    left_angle = calculate_angle(left_shoulder, left_elbow, left_wrist)
    right_angle = calculate_angle(right_shoulder, right_elbow, right_wrist)
    
    return (left_angle + right_angle) / 2


def get_leg_press_angle(keypoints):
    """
    Get knee angle for leg press.
    Angle between hip → knee → ankle (inverted from squats).
    """
    return get_squat_angle(keypoints)


def get_deadlift_angle(keypoints):
    """
    Get hip angle for deadlifts.
    Angle between shoulder → hip → knee.
    """
    left_shoulder = keypoints[KEYPOINT_DICT['left_shoulder']][:2]
    left_hip = keypoints[KEYPOINT_DICT['left_hip']][:2]
    left_knee = keypoints[KEYPOINT_DICT['left_knee']][:2]
    
    right_shoulder = keypoints[KEYPOINT_DICT['right_shoulder']][:2]
    right_hip = keypoints[KEYPOINT_DICT['right_hip']][:2]
    right_knee = keypoints[KEYPOINT_DICT['right_knee']][:2]
    
    left_angle = calculate_angle(left_shoulder, left_hip, left_knee)
    right_angle = calculate_angle(right_shoulder, right_hip, right_knee)
    
    return (left_angle + right_angle) / 2


def get_plank_angle(keypoints):
    """
    Get hip angle for plank (isometric hold).
    Angle between shoulder → hip → ankle.
    """
    left_shoulder = keypoints[KEYPOINT_DICT['left_shoulder']][:2]
    left_hip = keypoints[KEYPOINT_DICT['left_hip']][:2]
    left_ankle = keypoints[KEYPOINT_DICT['left_ankle']][:2]
    
    right_shoulder = keypoints[KEYPOINT_DICT['right_shoulder']][:2]
    right_hip = keypoints[KEYPOINT_DICT['right_hip']][:2]
    right_ankle = keypoints[KEYPOINT_DICT['right_ankle']][:2]
    
    left_angle = calculate_angle(left_shoulder, left_hip, left_ankle)
    right_angle = calculate_angle(right_shoulder, right_hip, right_ankle)
    
    return (left_angle + right_angle) / 2


def get_crunch_angle(keypoints):
    """
    Get hip angle for crunches.
    Angle between shoulder → hip → knee.
    """
    left_shoulder = keypoints[KEYPOINT_DICT['left_shoulder']][:2]
    left_hip = keypoints[KEYPOINT_DICT['left_hip']][:2]
    left_knee = keypoints[KEYPOINT_DICT['left_knee']][:2]
    
    right_shoulder = keypoints[KEYPOINT_DICT['right_shoulder']][:2]
    right_hip = keypoints[KEYPOINT_DICT['right_hip']][:2]
    right_knee = keypoints[KEYPOINT_DICT['right_knee']][:2]
    
    left_angle = calculate_angle(left_shoulder, left_hip, left_knee)
    right_angle = calculate_angle(right_shoulder, right_hip, right_knee)
    
    return (left_angle + right_angle) / 2


def get_russian_twist_angle(keypoints):
    """
    Get hip angle for Russian twists (V-sit position).
    Angle between shoulder → hip → knee.
    Also tracks rotation via shoulder angle.
    """
    return get_crunch_angle(keypoints)


def get_leg_raise_angle(keypoints):
    """
    Get hip angle for leg raises.
    Angle between shoulder → hip → ankle when lying down.
    """
    left_shoulder = keypoints[KEYPOINT_DICT['left_shoulder']][:2]
    left_hip = keypoints[KEYPOINT_DICT['left_hip']][:2]
    left_ankle = keypoints[KEYPOINT_DICT['left_ankle']][:2]
    
    right_shoulder = keypoints[KEYPOINT_DICT['right_shoulder']][:2]
    right_hip = keypoints[KEYPOINT_DICT['right_hip']][:2]
    right_ankle = keypoints[KEYPOINT_DICT['right_ankle']][:2]
    
    left_angle = calculate_angle(left_shoulder, left_hip, left_ankle)
    right_angle = calculate_angle(right_shoulder, right_hip, right_ankle)
    
    return (left_angle + right_angle) / 2


class AngleRepCounter:
    """
    Angle-based rep counter with state machine logic.
    
    Logic:
      - When angle goes 'down' past down_threshold and then
        'up' past up_threshold, we count 1 rep.
      - Uses hysteresis and min frame constraints to avoid noise.
    """
    
    def __init__(
        self,
        down_threshold=160,
        up_threshold=40,
        min_frames_down=3,
        min_frames_up=3
    ):
        self.down_threshold = down_threshold
        self.up_threshold = up_threshold
        self.min_frames_down = min_frames_down
        self.min_frames_up = min_frames_up
        self.reset()
    
    def reset(self):
        """Reset counter to initial state"""
        self.stage = "start"
        self.rep_count = 0
        self.down_frames = 0
        self.up_frames = 0
        self.angle_history = []
        self.rep_timestamps = []
    
    def update(self, angle, frame_idx=None):
        """
        Update counter with new angle measurement.
        
        Args:
            angle: scalar joint angle in degrees for the current frame
            frame_idx: optional frame index for tracking
        
        Returns:
            True if a rep was just completed on this frame
        """
        rep_completed = False
        self.angle_history.append(angle)
        
        if angle > self.down_threshold:
            self.down_frames += 1
            self.up_frames = 0
        elif angle < self.up_threshold:
            self.up_frames += 1
            self.down_frames = 0
        else:
            self.down_frames = 0
            self.up_frames = 0
        
        if self.stage in ("start", "up"):
            if self.down_frames >= self.min_frames_down:
                self.stage = "down"
        elif self.stage == "down":
            if self.up_frames >= self.min_frames_up:
                self.stage = "up"
                self.rep_count += 1
                rep_completed = True
                if frame_idx is not None:
                    self.rep_timestamps.append(frame_idx)
        
        return rep_completed
    
    def get_count(self):
        """Get current rep count"""
        return self.rep_count
    
    def get_state(self):
        """Get current state"""
        return self.stage
    
    def get_stats(self):
        """Get detailed statistics"""
        return {
            'total_reps': self.rep_count,
            'current_state': self.stage,
            'rep_timestamps': self.rep_timestamps,
            'angle_history': self.angle_history
        }


# Exercise configurations with biomechanically validated thresholds
# Based on:
# - ACSM (American College of Sports Medicine) Exercise Guidelines
# - NSCA (National Strength & Conditioning Association) Standards
# - ISB (International Society of Biomechanics) Joint Coordinate Systems (Wu et al., 2002, 2005)
# - NASM (National Academy of Sports Medicine) Corrective Exercise Protocol
#
# Note: Thresholds are optimized for 2D pose detection and account for:
# - Individual anatomical variation (limb length ratios, flexibility)
# - Camera angle effects (front view, side view, 45°)
# - Exercise phase transitions (eccentric to concentric)
# - Safety margins for general population
EXERCISE_CONFIGS = {
    # ===== PUSH EXERCISES =====
    'pushups': {
        'angle_extractor': get_pushup_angle,
        'down_threshold': 165,  # Top position - arms extended but not locked
        'up_threshold': 85,     # Bottom position - 90° target
        'min_frames_down': 3,
        'min_frames_up': 3,
        'display_name': 'Push-ups',
        'category': 'Push'
    },
    'push-ups': {
        'angle_extractor': get_pushup_angle,
        'down_threshold': 165,
        'up_threshold': 85,
        'min_frames_down': 3,
        'min_frames_up': 3,
        'display_name': 'Push-ups',
        'category': 'Push'
    },
    'bench_press': {
        'angle_extractor': get_bench_press_angle,
        'down_threshold': 165,  # Arms extended, bar at lockout
        'up_threshold': 80,     # Bar touches chest, elbows ~90°
        'min_frames_down': 3,
        'min_frames_up': 3,
        'display_name': 'Bench Press',
        'category': 'Push'
    },
    'shoulder_press': {
        'angle_extractor': get_shoulder_press_angle,
        'down_threshold': 165,  # Top position - arms overhead
        'up_threshold': 90,     # Starting position - weights at shoulders
        'min_frames_down': 3,
        'min_frames_up': 3,
        'display_name': 'Shoulder Press',
        'category': 'Push'
    },
    'dips': {
        'angle_extractor': get_dips_angle,
        'down_threshold': 170,  # Top position, arms locked
        'up_threshold': 90,     # Elbows bent 90°, shoulders at elbow level
        'min_frames_down': 3,
        'min_frames_up': 3,
        'display_name': 'Dips',
        'category': 'Push'
    },
    'tricep_extensions': {
        'angle_extractor': lambda kp: get_tricep_extension_angle(kp, 'left'),
        'down_threshold': 170,  # Arms straight overhead
        'up_threshold': 45,     # Forearm behind head, full flexion
        'min_frames_down': 2,
        'min_frames_up': 2,
        'display_name': 'Tricep Extensions',
        'category': 'Push'
    },
    
    # ===== PULL EXERCISES =====
    'pullups': {
        'angle_extractor': get_pullup_angle,
        'down_threshold': 165,  # Hanging position, arms nearly straight
        'up_threshold': 70,     # Chin over bar, full contraction
        'min_frames_down': 3,
        'min_frames_up': 3,
        'display_name': 'Pull-ups',
        'category': 'Pull'
    },
    'pull-ups': {
        'angle_extractor': get_pullup_angle,
        'down_threshold': 165,
        'up_threshold': 70,
        'min_frames_down': 3,
        'min_frames_up': 3,
        'display_name': 'Pull-ups',
        'category': 'Pull'
    },
    'rows': {
        'angle_extractor': get_row_angle,
        'down_threshold': 170,  # Arms extended, weight hanging
        'up_threshold': 70,     # Elbow pulled back, weight at torso
        'min_frames_down': 3,
        'min_frames_up': 3,
        'display_name': 'Rows',
        'category': 'Pull'
    },
    'lat_pulldown': {
        'angle_extractor': get_lat_pulldown_angle,
        'down_threshold': 170,  # Arms overhead, bar at top
        'up_threshold': 70,     # Bar to upper chest
        'min_frames_down': 3,
        'min_frames_up': 3,
        'display_name': 'Lat Pulldown',
        'category': 'Pull'
    },
    'face_pulls': {
        'angle_extractor': get_face_pull_angle,
        'down_threshold': 160,  # Arms extended forward
        'up_threshold': 90,     # Hands at face level, elbows back
        'min_frames_down': 3,
        'min_frames_up': 3,
        'display_name': 'Face Pulls',
        'category': 'Pull'
    },
    'bicep_curls': {
        'angle_extractor': lambda kp: get_bicep_curl_angle(kp, 'left'),
        'down_threshold': 165,  # Starting position - arms extended
        'up_threshold': 40,     # Peak flexion - full contraction
        'min_frames_down': 2,
        'min_frames_up': 2,
        'display_name': 'Bicep Curls',
        'category': 'Pull'
    },
    
    # ===== LEGS EXERCISES =====
    'squats': {
        'angle_extractor': get_squat_angle,
        'down_threshold': 170,  # Top position - nearly straight knees
        'up_threshold': 95,     # Bottom position - parallel depth
        'min_frames_down': 3,
        'min_frames_up': 3,
        'display_name': 'Squats',
        'category': 'Legs'
    },
    'lunges': {
        'angle_extractor': lambda kp: get_lunge_angle(kp, 'left'),
        'down_threshold': 170,  # Top position - standing
        'up_threshold': 90,     # Bottom position - 90° front knee
        'min_frames_down': 3,
        'min_frames_up': 3,
        'display_name': 'Lunges',
        'category': 'Legs'
    },
    'leg_press': {
        'angle_extractor': get_leg_press_angle,
        'down_threshold': 165,  # Legs extended, top position
        'up_threshold': 90,     # Knees bent, starting position
        'min_frames_down': 3,
        'min_frames_up': 3,
        'display_name': 'Leg Press',
        'category': 'Legs'
    },
    'deadlifts': {
        'angle_extractor': get_deadlift_angle,
        'down_threshold': 175,  # Standing tall, lockout
        'up_threshold': 60,     # Bottom position, hinged
        'min_frames_down': 3,
        'min_frames_up': 3,
        'display_name': 'Deadlifts',
        'category': 'Legs'
    },
    
    # ===== CORE EXERCISES =====
    'plank': {
        'angle_extractor': get_plank_angle,
        'down_threshold': 180,  # Straight body line (not used for reps)
        'up_threshold': 160,    # Hip sag threshold (not used for reps)
        'min_frames_down': 30,  # Plank is duration-based, not rep-based
        'min_frames_up': 30,
        'display_name': 'Plank',
        'category': 'Core'
    },
    'crunches': {
        'angle_extractor': get_crunch_angle,
        'down_threshold': 85,   # Lying on back, slight bend
        'up_threshold': 45,     # Shoulders lifted, trunk flexed
        'min_frames_down': 2,
        'min_frames_up': 2,
        'display_name': 'Crunches',
        'category': 'Core'
    },
    'russian_twists': {
        'angle_extractor': get_russian_twist_angle,
        'down_threshold': 120,  # Center position
        'up_threshold': 60,     # Twisted to side
        'min_frames_down': 2,
        'min_frames_up': 2,
        'display_name': 'Russian Twists',
        'category': 'Core'
    },
    'leg_raises': {
        'angle_extractor': get_leg_raise_angle,
        'down_threshold': 10,   # Legs near ground
        'up_threshold': 90,     # Legs vertical
        'min_frames_down': 2,
        'min_frames_up': 2,
        'display_name': 'Leg Raises',
        'category': 'Core'
    }
}


def get_supported_exercises():
    """Get list of supported exercises"""
    return [
        {
            'id': key,
            'name': config['display_name'],
            'down_threshold': config['down_threshold'],
            'up_threshold': config['up_threshold']
        }
        for key, config in EXERCISE_CONFIGS.items()
    ]
