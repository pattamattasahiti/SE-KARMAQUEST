"""
Form Analyzer Module - Model 2
Angle-based form analysis for exercise quality assessment
Based on Model 2 notebook implementation
"""

import numpy as np
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)

# MoveNet keypoint indices (same as rep_counter)
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
    
    Returns: Angle in degrees (0-180)
    """
    v1 = np.array(point1) - np.array(point2)
    v2 = np.array(point3) - np.array(point2)
    
    cos_angle = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-8)
    angle = np.arccos(np.clip(cos_angle, -1.0, 1.0))
    
    return np.degrees(angle)


def extract_all_angles(keypoints):
    """
    Extract all 8 joint angles from keypoints.
    
    Args:
        keypoints: array of shape (17, 3) with [x, y, confidence]
    
    Returns:
        dict with 8 angles
    """
    # Extract keypoint positions (x, y only)
    left_shoulder = keypoints[KEYPOINT_DICT['left_shoulder']][:2]
    right_shoulder = keypoints[KEYPOINT_DICT['right_shoulder']][:2]
    left_elbow = keypoints[KEYPOINT_DICT['left_elbow']][:2]
    right_elbow = keypoints[KEYPOINT_DICT['right_elbow']][:2]
    left_wrist = keypoints[KEYPOINT_DICT['left_wrist']][:2]
    right_wrist = keypoints[KEYPOINT_DICT['right_wrist']][:2]
    left_hip = keypoints[KEYPOINT_DICT['left_hip']][:2]
    right_hip = keypoints[KEYPOINT_DICT['right_hip']][:2]
    left_knee = keypoints[KEYPOINT_DICT['left_knee']][:2]
    right_knee = keypoints[KEYPOINT_DICT['right_knee']][:2]
    left_ankle = keypoints[KEYPOINT_DICT['left_ankle']][:2]
    right_ankle = keypoints[KEYPOINT_DICT['right_ankle']][:2]
    
    # Calculate all 8 angles
    angles = {
        'left_knee': calculate_angle(left_hip, left_knee, left_ankle),
        'right_knee': calculate_angle(right_hip, right_knee, right_ankle),
        'left_elbow': calculate_angle(left_shoulder, left_elbow, left_wrist),
        'right_elbow': calculate_angle(right_shoulder, right_elbow, right_wrist),
        'left_hip': calculate_angle(left_shoulder, left_hip, left_knee),
        'right_hip': calculate_angle(right_shoulder, right_hip, right_knee),
        'left_shoulder': calculate_angle(left_elbow, left_shoulder, left_hip),
        'right_shoulder': calculate_angle(right_elbow, right_shoulder, right_hip)
    }
    
    return angles


# Exercise-specific form rules with biomechanically validated ranges
# Based on:
# - ACSM (American College of Sports Medicine) Position Stands
# - NSCA (National Strength & Conditioning Association) Exercise Technique Manual
# - NASM (National Academy of Sports Medicine) Corrective Exercise Continuum
# - FMS (Functional Movement Screen) Standards
# - ACE (American Council on Exercise) Exercise Science Textbook
#
# Angle ranges account for:
# - Anatomical variation (15-20% variance across population)
# - 2D projection effects from different camera angles
# - Safety margins for injury prevention
# - Performance standards for trained vs untrained individuals
FORM_RULES = {
    'squats': {
        'checks': [
            {
                'name': 'depth',
                'description': 'Squat depth (knee angle at bottom)',
                'angle': 'knee',
                'phase': 'min',
                'ideal_range': (85, 95),
                'acceptable_range': (75, 105),
                'weight': 0.4,
                'feedback': {
                    'good': 'Perfect depth! Thighs parallel to ground.',
                    'acceptable': 'Good depth, could go slightly deeper for full ROM.',
                    'poor': 'Squat deeper - aim for thighs parallel to ground (90°).'
                }
            },
            {
                'name': 'knee_alignment',
                'description': 'Knee stability (bilateral symmetry)',
                'angle': 'knee',
                'phase': 'symmetry',
                'ideal_range': (0, 3),
                'acceptable_range': (0, 8),
                'weight': 0.3,
                'feedback': {
                    'good': 'Excellent knee alignment and symmetry!',
                    'acceptable': 'Slight knee asymmetry - focus on balanced loading.',
                    'poor': 'Keep knees aligned - push them out over toes, check stance width.'
                }
            },
            {
                'name': 'back_neutral',
                'description': 'Back position (hip flexion angle)',
                'angle': 'hip',
                'phase': 'range',
                'ideal_range': (145, 165),
                'acceptable_range': (130, 175),
                'weight': 0.3,
                'feedback': {
                    'good': 'Perfect back position - neutral spine maintained!',
                    'acceptable': 'Good back position, minor lean is acceptable.',
                    'poor': 'Keep chest up and back straight - avoid excessive forward lean.'
                }
            }
        ]
    },
    'pushups': {
        'checks': [
            {
                'name': 'elbow_depth',
                'description': 'Push-up depth (elbow angle at bottom)',
                'angle': 'elbow',
                'phase': 'min',
                'ideal_range': (80, 90),
                'acceptable_range': (70, 100),
                'weight': 0.4,
                'feedback': {
                    'good': 'Perfect depth - chest near ground!',
                    'acceptable': 'Good depth, try to reach 90° elbow flexion.',
                    'poor': 'Go deeper - bend elbows to 90° for full ROM.'
                }
            },
            {
                'name': 'body_alignment',
                'description': 'Straight body (hip extension)',
                'angle': 'hip',
                'phase': 'range',
                'ideal_range': (170, 180),
                'acceptable_range': (160, 180),
                'weight': 0.35,
                'feedback': {
                    'good': 'Perfect body alignment - straight line maintained!',
                    'acceptable': 'Good alignment, engage core to prevent hip sag.',
                    'poor': 'Keep hips level - avoid sagging (strengthen core) or piking.'
                }
            },
            {
                'name': 'elbow_flare',
                'description': 'Elbow position (shoulder angle)',
                'angle': 'shoulder',
                'phase': 'range',
                'ideal_range': (75, 105),
                'acceptable_range': (65, 115),
                'weight': 0.25,
                'feedback': {
                    'good': 'Perfect elbow position - 45° from body!',
                    'acceptable': 'Good form, watch elbow flare for shoulder safety.',
                    'poor': 'Keep elbows at 45° from body - avoid excessive flaring (>60°).'
                }
            }
        ]
    },
    'push-ups': {  # Alias for pushups
        'checks': [
            {
                'name': 'elbow_depth',
                'description': 'Push-up depth (elbow angle at bottom)',
                'angle': 'elbow',
                'phase': 'min',
                'ideal_range': (80, 90),
                'acceptable_range': (70, 100),
                'weight': 0.4,
                'feedback': {
                    'good': 'Perfect depth - chest near ground!',
                    'acceptable': 'Good depth, try to reach 90° elbow flexion.',
                    'poor': 'Go deeper - bend elbows to 90° for full ROM.'
                }
            },
            {
                'name': 'body_alignment',
                'description': 'Straight body (hip extension)',
                'angle': 'hip',
                'phase': 'range',
                'ideal_range': (170, 180),
                'acceptable_range': (160, 180),
                'weight': 0.6,
                'feedback': {
                    'good': 'Perfect body alignment - straight line maintained!',
                    'acceptable': 'Good alignment, engage core to prevent hip sag.',
                    'poor': 'Keep hips level - avoid sagging (strengthen core) or piking.'
                }
            }
        ]
    },
    'bench_press': {
        'checks': [
            {
                'name': 'elbow_depth',
                'description': 'Bar touches chest (elbow angle)',
                'angle': 'elbow',
                'phase': 'min',
                'ideal_range': (75, 85),
                'acceptable_range': (65, 95),
                'weight': 0.5,
                'feedback': {
                    'good': 'Perfect depth - bar touches chest!',
                    'acceptable': 'Good depth, lower bar to chest for full ROM.',
                    'poor': 'Lower the bar to chest - aim for 80° elbow angle.'
                }
            },
            {
                'name': 'elbow_extension',
                'description': 'Full arm extension at top',
                'angle': 'elbow',
                'phase': 'max',
                'ideal_range': (165, 175),
                'acceptable_range': (155, 180),
                'weight': 0.5,
                'feedback': {
                    'good': 'Perfect lockout - arms fully extended!',
                    'acceptable': 'Good extension, lock out elbows at top.',
                    'poor': 'Extend arms fully at top - complete the rep.'
                }
            }
        ]
    },
    'shoulder_press': {
        'checks': [
            {
                'name': 'press_extension',
                'description': 'Full arm extension overhead',
                'angle': 'elbow',
                'phase': 'max',
                'ideal_range': (170, 180),
                'acceptable_range': (160, 180),
                'weight': 0.5,
                'feedback': {
                    'good': 'Perfect extension - arms fully extended overhead!',
                    'acceptable': 'Good extension, try to lock out elbows fully.',
                    'poor': 'Extend arms fully overhead - don\'t stop short of lockout.'
                }
            },
            {
                'name': 'back_stability',
                'description': 'Neutral spine (hip angle, avoid arching)',
                'angle': 'hip',
                'phase': 'range',
                'ideal_range': (170, 180),
                'acceptable_range': (165, 180),
                'weight': 0.5,
                'feedback': {
                    'good': 'Perfect posture - neutral spine, no arching!',
                    'acceptable': 'Good posture, engage core to prevent back arch.',
                    'poor': 'Avoid arching back - engage core, keep torso vertical.'
                }
            }
        ]
    },
    'dips': {
        'checks': [
            {
                'name': 'dip_depth',
                'description': 'Dip depth (elbow angle)',
                'angle': 'elbow',
                'phase': 'min',
                'ideal_range': (85, 95),
                'acceptable_range': (75, 105),
                'weight': 0.6,
                'feedback': {
                    'good': 'Perfect depth - elbows at 90°!',
                    'acceptable': 'Good depth, aim for 90° elbow bend.',
                    'poor': 'Go deeper - lower until elbows reach 90°.'
                }
            },
            {
                'name': 'arm_extension',
                'description': 'Full extension at top',
                'angle': 'elbow',
                'phase': 'max',
                'ideal_range': (168, 178),
                'acceptable_range': (160, 180),
                'weight': 0.4,
                'feedback': {
                    'good': 'Perfect lockout - arms fully extended!',
                    'acceptable': 'Good extension, lock out at top.',
                    'poor': 'Extend arms fully at top position.'
                }
            }
        ]
    },
    'tricep_extensions': {
        'checks': [
            {
                'name': 'elbow_flexion',
                'description': 'Full elbow flexion (forearm behind head)',
                'angle': 'elbow',
                'phase': 'min',
                'ideal_range': (40, 50),
                'acceptable_range': (30, 60),
                'weight': 0.5,
                'feedback': {
                    'good': 'Perfect flexion - full tricep stretch!',
                    'acceptable': 'Good range, lower forearm more behind head.',
                    'poor': 'Lower forearm more - aim for 45° elbow angle.'
                }
            },
            {
                'name': 'elbow_extension',
                'description': 'Full elbow extension overhead',
                'angle': 'elbow',
                'phase': 'max',
                'ideal_range': (168, 178),
                'acceptable_range': (160, 180),
                'weight': 0.5,
                'feedback': {
                    'good': 'Perfect extension - arms straight overhead!',
                    'acceptable': 'Good extension, lock out elbows fully.',
                    'poor': 'Extend arms fully overhead - complete the rep.'
                }
            }
        ]
    },
    'pullups': {
        'checks': [
            {
                'name': 'pull_height',
                'description': 'Chin over bar (elbow flexion)',
                'angle': 'elbow',
                'phase': 'min',
                'ideal_range': (65, 75),
                'acceptable_range': (55, 85),
                'weight': 0.6,
                'feedback': {
                    'good': 'Perfect height - chin over bar!',
                    'acceptable': 'Good pull, get chin higher over bar.',
                    'poor': 'Pull higher - chin must clear the bar.'
                }
            },
            {
                'name': 'full_extension',
                'description': 'Full arm extension at bottom',
                'angle': 'elbow',
                'phase': 'max',
                'ideal_range': (163, 173),
                'acceptable_range': (155, 180),
                'weight': 0.4,
                'feedback': {
                    'good': 'Perfect extension - full range of motion!',
                    'acceptable': 'Good extension, fully extend arms at bottom.',
                    'poor': 'Extend arms fully at bottom - avoid partial reps.'
                }
            }
        ]
    },
    'pull-ups': {  # Alias
        'checks': [
            {
                'name': 'pull_height',
                'description': 'Chin over bar (elbow flexion)',
                'angle': 'elbow',
                'phase': 'min',
                'ideal_range': (65, 75),
                'acceptable_range': (55, 85),
                'weight': 0.6,
                'feedback': {
                    'good': 'Perfect height - chin over bar!',
                    'acceptable': 'Good pull, get chin higher over bar.',
                    'poor': 'Pull higher - chin must clear the bar.'
                }
            },
            {
                'name': 'full_extension',
                'description': 'Full arm extension at bottom',
                'angle': 'elbow',
                'phase': 'max',
                'ideal_range': (163, 173),
                'acceptable_range': (155, 180),
                'weight': 0.4,
                'feedback': {
                    'good': 'Perfect extension - full range of motion!',
                    'acceptable': 'Good extension, fully extend arms at bottom.',
                    'poor': 'Extend arms fully at bottom - avoid partial reps.'
                }
            }
        ]
    },
    'rows': {
        'checks': [
            {
                'name': 'row_depth',
                'description': 'Elbow pulled back (elbow angle)',
                'angle': 'elbow',
                'phase': 'min',
                'ideal_range': (65, 75),
                'acceptable_range': (55, 85),
                'weight': 0.6,
                'feedback': {
                    'good': 'Perfect row - elbow pulled back fully!',
                    'acceptable': 'Good pull, pull elbow further back.',
                    'poor': 'Pull elbow back more - upper arm past torso.'
                }
            },
            {
                'name': 'arm_extension',
                'description': 'Full arm extension at start',
                'angle': 'elbow',
                'phase': 'max',
                'ideal_range': (168, 178),
                'acceptable_range': (160, 180),
                'weight': 0.4,
                'feedback': {
                    'good': 'Perfect extension - full range of motion!',
                    'acceptable': 'Good extension, fully extend arms.',
                    'poor': 'Extend arms fully at start - avoid partial reps.'
                }
            }
        ]
    },
    'lat_pulldown': {
        'checks': [
            {
                'name': 'pulldown_depth',
                'description': 'Bar to upper chest (elbow angle)',
                'angle': 'elbow',
                'phase': 'min',
                'ideal_range': (65, 75),
                'acceptable_range': (55, 85),
                'weight': 0.6,
                'feedback': {
                    'good': 'Perfect pull - bar to upper chest!',
                    'acceptable': 'Good pull, bring bar lower to chest.',
                    'poor': 'Pull bar to upper chest - full contraction.'
                }
            },
            {
                'name': 'full_extension',
                'description': 'Full arm extension at top',
                'angle': 'elbow',
                'phase': 'max',
                'ideal_range': (168, 178),
                'acceptable_range': (160, 180),
                'weight': 0.4,
                'feedback': {
                    'good': 'Perfect extension - full range of motion!',
                    'acceptable': 'Good extension, fully extend arms at top.',
                    'poor': 'Extend arms fully at top - complete the rep.'
                }
            }
        ]
    },
    'face_pulls': {
        'checks': [
            {
                'name': 'pull_depth',
                'description': 'Hands to face level (elbow angle)',
                'angle': 'elbow',
                'phase': 'min',
                'ideal_range': (85, 95),
                'acceptable_range': (75, 105),
                'weight': 0.6,
                'feedback': {
                    'good': 'Perfect pull - hands at face level!',
                    'acceptable': 'Good pull, bring hands closer to face.',
                    'poor': 'Pull hands to face level - elbows back.'
                }
            },
            {
                'name': 'arm_extension',
                'description': 'Arms extended forward at start',
                'angle': 'elbow',
                'phase': 'max',
                'ideal_range': (158, 168),
                'acceptable_range': (150, 175),
                'weight': 0.4,
                'feedback': {
                    'good': 'Perfect starting position - arms extended!',
                    'acceptable': 'Good extension, extend arms fully forward.',
                    'poor': 'Extend arms fully forward at start.'
                }
            }
        ]
    },
    'bicep_curls': {
        'checks': [
            {
                'name': 'curl_depth',
                'description': 'Full curl (elbow flexion at peak)',
                'angle': 'elbow',
                'phase': 'min',
                'ideal_range': (35, 45),
                'acceptable_range': (30, 55),
                'weight': 0.5,
                'feedback': {
                    'good': 'Perfect curl depth - full bicep contraction!',
                    'acceptable': 'Good curl, try to bring forearm closer to bicep.',
                    'poor': 'Curl higher - aim for full flexion (30-40°) to maximize activation.'
                }
            },
            {
                'name': 'elbow_stability',
                'description': 'Elbow stays stationary (shoulder stability)',
                'angle': 'shoulder',
                'phase': 'range',
                'ideal_range': (165, 180),
                'acceptable_range': (155, 180),
                'weight': 0.5,
                'feedback': {
                    'good': 'Perfect elbow position - no swinging, full bicep isolation!',
                    'acceptable': 'Good form, minor elbow movement - keep elbows pinned.',
                    'poor': 'Keep elbows stationary at sides - no swinging or momentum.'
                }
            }
        ]
    },
    'leg_press': {
        'checks': [
            {
                'name': 'knee_flexion',
                'description': 'Knee bend at start position',
                'angle': 'knee',
                'phase': 'min',
                'ideal_range': (85, 95),
                'acceptable_range': (75, 105),
                'weight': 0.5,
                'feedback': {
                    'good': 'Perfect starting position - 90° knee bend!',
                    'acceptable': 'Good position, adjust seat for 90° knees.',
                    'poor': 'Adjust starting position - knees should be at 90°.'
                }
            },
            {
                'name': 'knee_extension',
                'description': 'Full leg extension at top',
                'angle': 'knee',
                'phase': 'max',
                'ideal_range': (163, 173),
                'acceptable_range': (155, 180),
                'weight': 0.5,
                'feedback': {
                    'good': 'Perfect extension - legs fully extended!',
                    'acceptable': 'Good extension, extend legs fully.',
                    'poor': 'Extend legs fully - don\'t stop short of lockout.'
                }
            }
        ]
    },
    'deadlifts': {
        'checks': [
            {
                'name': 'hip_hinge',
                'description': 'Hip angle at bottom (bent position)',
                'angle': 'hip',
                'phase': 'min',
                'ideal_range': (55, 65),
                'acceptable_range': (45, 75),
                'weight': 0.5,
                'feedback': {
                    'good': 'Perfect hip hinge - correct starting position!',
                    'acceptable': 'Good hinge, maintain hip bend at bottom.',
                    'poor': 'Hinge at hips more - maintain neutral spine.'
                }
            },
            {
                'name': 'hip_extension',
                'description': 'Full hip extension at top (lockout)',
                'angle': 'hip',
                'phase': 'max',
                'ideal_range': (173, 183),
                'acceptable_range': (165, 185),
                'weight': 0.5,
                'feedback': {
                    'good': 'Perfect lockout - standing tall, hips extended!',
                    'acceptable': 'Good lockout, drive hips fully forward.',
                    'poor': 'Complete the lockout - stand fully upright.'
                }
            }
        ]
    },
    'plank': {
        'checks': [
            {
                'name': 'body_alignment',
                'description': 'Straight body line (hip angle)',
                'angle': 'hip',
                'phase': 'mean',
                'ideal_range': (175, 185),
                'acceptable_range': (165, 190),
                'weight': 1.0,
                'feedback': {
                    'good': 'Perfect plank - straight body line maintained!',
                    'acceptable': 'Good plank, engage core to prevent sag.',
                    'poor': 'Keep hips level - avoid sagging or piking.'
                }
            }
        ]
    },
    'crunches': {
        'checks': [
            {
                'name': 'trunk_flexion',
                'description': 'Trunk flexion (hip angle decrease)',
                'angle': 'hip',
                'phase': 'min',
                'ideal_range': (40, 50),
                'acceptable_range': (30, 60),
                'weight': 0.7,
                'feedback': {
                    'good': 'Perfect crunch - good trunk flexion!',
                    'acceptable': 'Good crunch, lift shoulders higher.',
                    'poor': 'Lift shoulders more - focus on trunk flexion.'
                }
            },
            {
                'name': 'controlled_descent',
                'description': 'Return to starting position',
                'angle': 'hip',
                'phase': 'max',
                'ideal_range': (80, 90),
                'acceptable_range': (70, 100),
                'weight': 0.3,
                'feedback': {
                    'good': 'Perfect control - good starting position!',
                    'acceptable': 'Good control, maintain consistent form.',
                    'poor': 'Control the descent - return to starting position.'
                }
            }
        ]
    },
    'russian_twists': {
        'checks': [
            {
                'name': 'v_sit_position',
                'description': 'V-sit angle (hip angle)',
                'angle': 'hip',
                'phase': 'mean',
                'ideal_range': (95, 115),
                'acceptable_range': (85, 125),
                'weight': 1.0,
                'feedback': {
                    'good': 'Perfect V-sit position maintained!',
                    'acceptable': 'Good position, maintain consistent V-sit.',
                    'poor': 'Maintain V-sit position throughout - hips at 90-110°.'
                }
            }
        ]
    },
    'leg_raises': {
        'checks': [
            {
                'name': 'leg_height',
                'description': 'Legs raised to vertical (hip flexion)',
                'angle': 'hip',
                'phase': 'max',
                'ideal_range': (85, 95),
                'acceptable_range': (75, 105),
                'weight': 0.6,
                'feedback': {
                    'good': 'Perfect height - legs vertical!',
                    'acceptable': 'Good height, raise legs higher.',
                    'poor': 'Raise legs to 90° - vertical position.'
                }
            },
            {
                'name': 'controlled_lower',
                'description': 'Lower legs without touching ground',
                'angle': 'hip',
                'phase': 'min',
                'ideal_range': (5, 15),
                'acceptable_range': (0, 25),
                'weight': 0.4,
                'feedback': {
                    'good': 'Perfect control - legs near but not touching ground!',
                    'acceptable': 'Good control, don\'t rest legs on ground.',
                    'poor': 'Keep legs off ground - maintain tension.'
                }
            }
        ]
    },
    'lunges': {
        'checks': [
            {
                'name': 'lunge_depth',
                'description': 'Knee angle at bottom (front leg)',
                'angle': 'knee',
                'phase': 'min',
                'ideal_range': (85, 95),
                'acceptable_range': (80, 105),
                'weight': 0.4,
                'feedback': {
                    'good': 'Perfect lunge depth - 90° front knee!',
                    'acceptable': 'Good depth, aim for 90° front knee bend.',
                    'poor': 'Lower your hips - aim for 90° front knee, shin vertical.'
                }
            },
            {
                'name': 'torso_upright',
                'description': 'Upright torso (hip angle)',
                'angle': 'hip',
                'phase': 'range',
                'ideal_range': (165, 180),
                'acceptable_range': (155, 180),
                'weight': 0.6,
                'feedback': {
                    'good': 'Perfect upright posture - chest up!',
                    'acceptable': 'Good posture, try to stay more vertical.',
                    'poor': 'Keep torso upright - chest up, don\'t lean forward excessively.'
                }
            }
        ]
    }
}


class AngleFormAnalyzer:
    """
    Angle-based form analyzer using rules engine.
    No ML training required - uses predefined thresholds and rules.
    """
    
    def __init__(self, exercise_type='squats'):
        if exercise_type not in FORM_RULES:
            raise ValueError(f"Unknown exercise: {exercise_type}. "
                           f"Supported: {list(FORM_RULES.keys())}")
        
        self.exercise_type = exercise_type
        self.rules = FORM_RULES[exercise_type]
        self.reset()
    
    def reset(self):
        """Reset analyzer state"""
        self.all_angles = []
        self.rep_angles = []
    
    def analyze_rep(self, keypoints_rep):
        """
        Analyze form quality for a single rep.
        
        Args:
            keypoints_rep: array of shape (num_frames, 17, 3)
        
        Returns:
            dict with rep score and violations
        """
        # Extract angles for all frames in this rep
        rep_angles = []
        for frame_keypoints in keypoints_rep:
            angles = extract_all_angles(frame_keypoints)
            rep_angles.append(angles)
        
        # Calculate statistics for each angle
        angle_stats = self._calculate_angle_stats(rep_angles)
        
        # Apply form checks
        check_results = []
        total_score = 0.0
        
        for check in self.rules['checks']:
            result = self._apply_check(check, angle_stats)
            check_results.append(result)
            total_score += result['score'] * check['weight']
        
        return {
            'rep_score': total_score,
            'checks': check_results,
            'angle_stats': angle_stats
        }
    
    def _calculate_angle_stats(self, rep_angles):
        """Calculate summary statistics for each angle across the rep."""
        stats = {}
        
        # Get all angle names
        angle_names = rep_angles[0].keys()
        
        for angle_name in angle_names:
            values = [frame[angle_name] for frame in rep_angles]
            
            stats[angle_name] = {
                'min': np.min(values),
                'max': np.max(values),
                'mean': np.mean(values),
                'std': np.std(values),
                'rom': np.max(values) - np.min(values)
            }
        
        # Calculate symmetry (left vs right)
        stats['knee_symmetry'] = abs(
            stats['left_knee']['mean'] - stats['right_knee']['mean']
        )
        stats['elbow_symmetry'] = abs(
            stats['left_elbow']['mean'] - stats['right_elbow']['mean']
        )
        stats['hip_symmetry'] = abs(
            stats['left_hip']['mean'] - stats['right_hip']['mean']
        )
        
        return stats
    
    def _apply_check(self, check, angle_stats):
        """Apply a single form check."""
        angle_name = check['angle']
        phase = check['phase']
        ideal_min, ideal_max = check['ideal_range']
        accept_min, accept_max = check['acceptable_range']
        
        # Get relevant value based on phase
        if phase == 'symmetry':
            value = angle_stats[f"{angle_name}_symmetry"]
        elif phase == 'range':
            # For 'range' phase, check the mean angle
            if f"left_{angle_name}" in angle_stats:
                left_val = angle_stats[f"left_{angle_name}"]['mean']
                right_val = angle_stats[f"right_{angle_name}"]['mean']
                value = (left_val + right_val) / 2
            else:
                value = angle_stats[angle_name]['mean']
        else:
            # For 'min', 'max', 'mean' phases, access directly
            if f"left_{angle_name}" in angle_stats:
                left_val = angle_stats[f"left_{angle_name}"][phase]
                right_val = angle_stats[f"right_{angle_name}"][phase]
                value = (left_val + right_val) / 2
            else:
                value = angle_stats[angle_name][phase]
        
        # Score the value
        if ideal_min <= value <= ideal_max:
            score = 1.0
            quality = 'good'
        elif accept_min <= value <= accept_max:
            # Linear interpolation between acceptable and ideal
            if value < ideal_min:
                score = 0.7 + 0.3 * (value - accept_min) / (ideal_min - accept_min)
            else:
                score = 0.7 + 0.3 * (accept_max - value) / (accept_max - ideal_max)
            quality = 'acceptable'
        else:
            # Poor form
            if value < accept_min:
                score = max(0.0, 0.3 * value / accept_min)
            else:
                score = max(0.0, 0.3 * (180 - value) / (180 - accept_max))
            quality = 'poor'
        
        return {
            'name': check['name'],
            'description': check['description'],
            'value': float(value),
            'score': float(score),
            'quality': quality,
            'feedback': check['feedback'][quality]
        }
    
    def analyze_video(self, all_keypoints, rep_timestamps=None):
        """
        Analyze form quality for entire video.
        
        Args:
            all_keypoints: array of shape (num_frames, 17, 3)
            rep_timestamps: list of frame indices where reps complete
        
        Returns:
            dict with overall score, feedback, and per-rep analysis
        """
        if rep_timestamps is None or len(rep_timestamps) == 0:
            rep_timestamps = [len(all_keypoints) - 1]
        
        # Segment video into reps
        rep_results = []
        prev_idx = 0
        
        for rep_end_idx in rep_timestamps:
            rep_keypoints = all_keypoints[prev_idx:rep_end_idx + 1]
            
            if len(rep_keypoints) > 5:  # Need minimum frames
                result = self.analyze_rep(rep_keypoints)
                rep_results.append(result)
            
            prev_idx = rep_end_idx + 1
        
        if len(rep_results) == 0:
            return {
                'form_score': 0,
                'feedback': ['Video too short or no reps detected'],
                'quality': 'poor',
                'rep_scores': [],
                'rep_details': []
            }
        
        # Calculate overall score
        rep_scores = [r['rep_score'] for r in rep_results]
        overall_score = np.mean(rep_scores)
        
        # Collect feedback
        feedback = self._generate_feedback(rep_results)
        
        # Determine quality level
        if overall_score >= 0.9:
            quality = 'excellent'
        elif overall_score >= 0.75:
            quality = 'good'
        elif overall_score >= 0.6:
            quality = 'acceptable'
        else:
            quality = 'poor'
        
        return {
            'form_score': int(overall_score * 100),
            'feedback': feedback,
            'quality': quality,
            'rep_scores': rep_scores,
            'total_reps': len(rep_results),
            'rep_details': rep_results
        }
    
    def _generate_feedback(self, rep_results):
        """Generate overall feedback by aggregating violations."""
        feedback = []
        violation_counts = {}
        
        for rep in rep_results:
            for check in rep['checks']:
                if check['quality'] != 'good':
                    name = check['name']
                    if name not in violation_counts:
                        violation_counts[name] = {
                            'count': 0,
                            'feedback': check['feedback']
                        }
                    violation_counts[name]['count'] += 1
        
        total_reps = len(rep_results)
        
        # Generate feedback for violations in > 30% of reps
        for name, data in violation_counts.items():
            if data['count'] / total_reps > 0.3:
                feedback.append(
                    f"{data['feedback']} ({data['count']}/{total_reps} reps)"
                )
        
        if len(feedback) == 0:
            feedback.append("Excellent form! Keep it up!")
        
        return feedback
