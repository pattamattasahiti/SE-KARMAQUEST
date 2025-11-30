/**
 * Real AI Model Services - TensorFlow Lite Integration
 * 
 * This module integrates real TensorFlow Lite models with the mobile app
 * Based on the working Python implementation from workingcode.py
 * 
 * Models:
 * 1. MoveNet (TFLite) - Pose keypoints detection
 * 2. SquatFormAnalyzer - Real-time form feedback
 * 3. SquatRepCounter - Stateful rep counting
 * 4. ExerciseClassifier - Rule-based exercise detection
 */

import { Platform } from 'react-native';

// Conditional import - only load TFLite if available
let loadTensorflowModel: any = null;
let TensorflowModel: any = null;

try {
  const tflite = require('react-native-fast-tflite');
  loadTensorflowModel = tflite.loadTensorflowModel;
  TensorflowModel = tflite.TensorflowModel;
} catch (error) {
  console.warn('TFLite module not available - using simulated AI models');
}

// =========================================================
// Types
// =========================================================

export interface PoseKeypoints {
  nose: { x: number; y: number; confidence: number };
  leftEye: { x: number; y: number; confidence: number };
  rightEye: { x: number; y: number; confidence: number };
  leftEar: { x: number; y: number; confidence: number };
  rightEar: { x: number; y: number; confidence: number };
  leftShoulder: { x: number; y: number; confidence: number };
  rightShoulder: { x: number; y: number; confidence: number };
  leftElbow: { x: number; y: number; confidence: number };
  rightElbow: { x: number; y: number; confidence: number };
  leftWrist: { x: number; y: number; confidence: number };
  rightWrist: { x: number; y: number; confidence: number };
  leftHip: { x: number; y: number; confidence: number };
  rightHip: { x: number; y: number; confidence: number };
  leftKnee: { x: number; y: number; confidence: number };
  rightKnee: { x: number; y: number; confidence: number };
  leftAnkle: { x: number; y: number; confidence: number };
  rightAnkle: { x: number; y: number; confidence: number };
}

export interface FormAnalysisResult {
  score: number; // 0-100
  isCorrect: boolean;
  issues: string[];
  suggestions: string[];
  kneeAngle: number | null;
  backAngle: number | null;
  depthOk: boolean | null;
}

export interface RepCountResult {
  count: number;
  phase: 'up' | 'down' | 'neutral';
  confidence: number;
}

export interface ExerciseClassification {
  exercise: string;
  confidence: number;
  reason: string;
}

// Raw keypoint array from MoveNet (17 keypoints x 3 values)
type RawKeypoints = Float32Array;

// =========================================================
// Model Manager
// =========================================================

class AIModelManager {
  private moveNetModel: any = null;
  private isInitialized = false;
  private useMockData = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('[AI] Models already initialized');
      return;
    }

    try {
      // Check if TFLite is available
      if (!loadTensorflowModel) {
        console.warn('[AI] ⚠️ TFLite not available - using simulated AI models');
        this.useMockData = true;
        this.isInitialized = true;
        return;
      }

      console.log('[AI] Loading MoveNet model...');
      
      // Load MoveNet model with GPU acceleration if available
      this.moveNetModel = await loadTensorflowModel(
        require('../../assets/models/movenet_singlepose_lightning.tflite'),
        // Use GPU delegate if available (faster inference)
        Platform.OS === 'android' ? 'android-gpu' : Platform.OS === 'ios' ? 'core-ml' : undefined
      );

      this.isInitialized = true;
      console.log('[AI] ✅ MoveNet model loaded successfully');
    } catch (error) {
      console.error('[AI] ❌ Failed to load models, falling back to mock data:', error);
      this.useMockData = true;
      this.isInitialized = true;
    }
  }

  getMoveNetModel(): any {
    return this.moveNetModel;
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  isMockMode(): boolean {
    return this.useMockData;
  }
}

const modelManager = new AIModelManager();

// =========================================================
// Helper Functions (Ported from Python)
// =========================================================

/**
 * Calculate angle between three points
 * Ported from Python workingcode.py
 */
function angleBetweenPoints(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number }
): number | null {
  const ba = { x: a.x - b.x, y: a.y - b.y };
  const bc = { x: c.x - b.x, y: c.y - b.y };

  const normBa = Math.sqrt(ba.x ** 2 + ba.y ** 2);
  const normBc = Math.sqrt(bc.x ** 2 + bc.y ** 2);

  if (normBa < 1e-6 || normBc < 1e-6) {
    return null;
  }

  const cosAngle = (ba.x * bc.x + ba.y * bc.y) / (normBa * normBc);
  const clampedCos = Math.max(-1, Math.min(1, cosAngle));
  
  return (Math.acos(clampedCos) * 180) / Math.PI;
}

/**
 * Check if enough keypoints are visible
 * Ported from Python workingcode.py
 */
function goodEnough(
  keypoints: PoseKeypoints,
  indices: (keyof PoseKeypoints)[],
  minScore = 0.02,
  minCount = 2
): boolean {
  let count = 0;
  for (const index of indices) {
    if (keypoints[index].confidence >= minScore) {
      count++;
    }
  }
  return count >= minCount;
}

// =========================================================
// Model-1: MoveNet Pose Detection
// =========================================================

/**
 * Run MoveNet model on image data
 * Ported from Python workingcode.py - run_movenet()
 * 
 * @param imageData - Preprocessed image as Float32Array or Uint8Array
 * @param imageWidth - Original image width
 * @param imageHeight - Original image height
 * @returns Pose keypoints in original image coordinates
 */
export async function detectPose(
  imageData: Float32Array | Uint8Array,
  imageWidth: number,
  imageHeight: number
): Promise<PoseKeypoints> {
  // If in mock mode, generate simulated pose data
  if (modelManager.isMockMode()) {
    console.log('[AI] Using simulated pose data (TFLite not available)');
    return generateSimulatedPoseData(imageWidth, imageHeight, 'down');
  }

  const model = modelManager.getMoveNetModel();
  
  if (!model) {
    throw new Error('[AI] MoveNet model not loaded. Call initializeAIModels() first.');
  }

  try {
    // Run model inference
    const outputs = model.runSync([imageData]);
    
    // MoveNet output: [1, 1, 17, 3] -> [17, 3]
    const keypoints = outputs[0] as Float32Array;

    // Parse keypoints (y, x, confidence) and convert to pixel coordinates
    const result: PoseKeypoints = {
      nose: {
        y: keypoints[0 * 3 + 0] * imageHeight,
        x: keypoints[0 * 3 + 1] * imageWidth,
        confidence: keypoints[0 * 3 + 2],
      },
      leftEye: {
        y: keypoints[1 * 3 + 0] * imageHeight,
        x: keypoints[1 * 3 + 1] * imageWidth,
        confidence: keypoints[1 * 3 + 2],
      },
      rightEye: {
        y: keypoints[2 * 3 + 0] * imageHeight,
        x: keypoints[2 * 3 + 1] * imageWidth,
        confidence: keypoints[2 * 3 + 2],
      },
      leftEar: {
        y: keypoints[3 * 3 + 0] * imageHeight,
        x: keypoints[3 * 3 + 1] * imageWidth,
        confidence: keypoints[3 * 3 + 2],
      },
      rightEar: {
        y: keypoints[4 * 3 + 0] * imageHeight,
        x: keypoints[4 * 3 + 1] * imageWidth,
        confidence: keypoints[4 * 3 + 2],
      },
      leftShoulder: {
        y: keypoints[5 * 3 + 0] * imageHeight,
        x: keypoints[5 * 3 + 1] * imageWidth,
        confidence: keypoints[5 * 3 + 2],
      },
      rightShoulder: {
        y: keypoints[6 * 3 + 0] * imageHeight,
        x: keypoints[6 * 3 + 1] * imageWidth,
        confidence: keypoints[6 * 3 + 2],
      },
      leftElbow: {
        y: keypoints[7 * 3 + 0] * imageHeight,
        x: keypoints[7 * 3 + 1] * imageWidth,
        confidence: keypoints[7 * 3 + 2],
      },
      rightElbow: {
        y: keypoints[8 * 3 + 0] * imageHeight,
        x: keypoints[8 * 3 + 1] * imageWidth,
        confidence: keypoints[8 * 3 + 2],
      },
      leftWrist: {
        y: keypoints[9 * 3 + 0] * imageHeight,
        x: keypoints[9 * 3 + 1] * imageWidth,
        confidence: keypoints[9 * 3 + 2],
      },
      rightWrist: {
        y: keypoints[10 * 3 + 0] * imageHeight,
        x: keypoints[10 * 3 + 1] * imageWidth,
        confidence: keypoints[10 * 3 + 2],
      },
      leftHip: {
        y: keypoints[11 * 3 + 0] * imageHeight,
        x: keypoints[11 * 3 + 1] * imageWidth,
        confidence: keypoints[11 * 3 + 2],
      },
      rightHip: {
        y: keypoints[12 * 3 + 0] * imageHeight,
        x: keypoints[12 * 3 + 1] * imageWidth,
        confidence: keypoints[12 * 3 + 2],
      },
      leftKnee: {
        y: keypoints[13 * 3 + 0] * imageHeight,
        x: keypoints[13 * 3 + 1] * imageWidth,
        confidence: keypoints[13 * 3 + 2],
      },
      rightKnee: {
        y: keypoints[14 * 3 + 0] * imageHeight,
        x: keypoints[14 * 3 + 1] * imageWidth,
        confidence: keypoints[14 * 3 + 2],
      },
      leftAnkle: {
        y: keypoints[15 * 3 + 0] * imageHeight,
        x: keypoints[15 * 3 + 1] * imageWidth,
        confidence: keypoints[15 * 3 + 2],
      },
      rightAnkle: {
        y: keypoints[16 * 3 + 0] * imageHeight,
        x: keypoints[16 * 3 + 1] * imageWidth,
        confidence: keypoints[16 * 3 + 2],
      },
    };

    return result;
  } catch (error) {
    console.error('[AI] Pose detection failed:', error);
    throw error;
  }
}

// =========================================================
// Model-2: SquatFormAnalyzer
// =========================================================

/**
 * Analyze squat form from pose keypoints
 * Ported from Python workingcode.py - SquatFormAnalyzer class
 */
export class SquatFormAnalyzer {
  private minScore: number;

  constructor(minScore = 0.02) {
    this.minScore = minScore;
  }

  analyzeFrame(keypoints: PoseKeypoints): FormAnalysisResult {
    const feedback: string[] = [];
    const suggestions: string[] = [];

    // Check keypoint confidence
    if (!goodEnough(keypoints, ['leftHip', 'leftKnee', 'leftAnkle'], this.minScore)) {
      feedback.push('Low keypoint confidence - adjust camera angle');
    }

    // Calculate knee angle
    const kneeAngle = angleBetweenPoints(
      keypoints.leftHip,
      keypoints.leftKnee,
      keypoints.leftAnkle
    );

    // Calculate back angle (optional)
    let backAngle: number | null = null;
    if (goodEnough(keypoints, ['leftShoulder', 'leftHip'], this.minScore, 1)) {
      const v = {
        x: keypoints.leftShoulder.x - keypoints.leftHip.x,
        y: keypoints.leftShoulder.y - keypoints.leftHip.y,
      };
      const vVert = { x: 0, y: -1 };
      
      const normV = Math.sqrt(v.x ** 2 + v.y ** 2);
      if (normV > 1e-6) {
        const cosAngle = (v.x * vVert.x + v.y * vVert.y) / normV;
        backAngle = (Math.acos(Math.max(-1, Math.min(1, cosAngle))) * 180) / Math.PI;
      }
    }

    // Check depth
    let depthOk: boolean | null = null;
    if (kneeAngle !== null) {
      depthOk = kneeAngle < 120;
      if (!depthOk) {
        feedback.push('Go lower to reach proper squat depth');
        suggestions.push('Try to get thighs parallel to ground');
      } else {
        suggestions.push('Good depth! Keep it up');
      }
    }

    // Back angle feedback
    if (backAngle !== null) {
      if (backAngle < 70) {
        feedback.push('Keep your back straight - too much forward lean');
        suggestions.push('Focus on sitting back, not bending forward');
      } else if (backAngle > 110) {
        feedback.push('Lean forward slightly for balance');
      } else {
        suggestions.push('Great back position!');
      }
    }

    // Knee alignment (additional checks)
    const kneeDist = Math.abs(keypoints.leftKnee.x - keypoints.rightKnee.x);
    const hipDist = Math.abs(keypoints.leftHip.x - keypoints.rightHip.x);
    
    if (kneeDist < hipDist * 0.7) {
      feedback.push('Knees caving inward - push knees out');
      suggestions.push('Drive knees outward to track over toes');
    }

    // Calculate overall form score
    let score = 100;
    if (kneeAngle === null) score -= 30;
    if (depthOk === false) score -= 20;
    if (backAngle !== null && backAngle < 70) score -= 15;
    if (feedback.length > 0) score -= feedback.length * 5;
    
    score = Math.max(0, Math.min(100, score));

    const isCorrect = score >= 80 && feedback.length === 0;

    return {
      score: Math.round(score),
      isCorrect,
      issues: feedback,
      suggestions,
      kneeAngle,
      backAngle,
      depthOk,
    };
  }
}

// =========================================================
// Model-3: SquatRepCounter
// =========================================================

/**
 * Count squat reps with state machine
 * Ported from Python workingcode.py - SquatRepCounter class
 */
export class SquatRepCounter {
  private upThresh: number;
  private downThresh: number;
  private state: 'up' | 'down';
  private reps: number;

  constructor(upThresh = 160, downThresh = 130) {
    this.upThresh = upThresh;
    this.downThresh = downThresh;
    this.state = 'up';
    this.reps = 0;
  }

  update(kneeAngle: number | null, visible = true): RepCountResult {
    if (kneeAngle === null || !visible) {
      return {
        count: 0,
        phase: this.state,
        confidence: 0.5,
      };
    }

    let repCompleted = 0;

    if (this.state === 'up' && kneeAngle < this.downThresh) {
      this.state = 'down';
    } else if (this.state === 'down' && kneeAngle > this.upThresh) {
      this.state = 'up';
      this.reps += 1;
      repCompleted = 1;
    }

    return {
      count: repCompleted,
      phase: this.state,
      confidence: 0.95,
    };
  }

  getReps(): number {
    return this.reps;
  }

  reset(): void {
    this.reps = 0;
    this.state = 'up';
  }
}

// =========================================================
// Model-4: ExerciseClassifier (Rule-Based)
// =========================================================

/**
 * Classify exercise type from pose keypoints
 * Ported from Python workingcode.py - ExerciseClassifierRuleBased class
 */
export class ExerciseClassifier {
  private minScoreCore: number;

  constructor(minScoreCore = 0.01) {
    this.minScoreCore = minScoreCore;
  }

  private boundingBoxOrientation(keypoints: PoseKeypoints): {
    width: number | null;
    height: number | null;
    aspect: number | null;
  } {
    const allKeypoints = Object.values(keypoints);
    const validKeypoints = allKeypoints.filter(kp => kp.confidence > this.minScoreCore);

    if (validKeypoints.length < 3) {
      return { width: null, height: null, aspect: null };
    }

    const xs = validKeypoints.map(kp => kp.x);
    const ys = validKeypoints.map(kp => kp.y);

    const width = Math.max(...xs) - Math.min(...xs);
    const height = Math.max(...ys) - Math.min(...ys);
    const aspect = height > 0 ? width / height : null;

    return { width, height, aspect };
  }

  private kneeAngleMin(keypoints: PoseKeypoints): number | null {
    if (keypoints.leftKnee.confidence < 0.01) return null;
    return angleBetweenPoints(keypoints.leftHip, keypoints.leftKnee, keypoints.leftAnkle);
  }

  private elbowAngleMin(keypoints: PoseKeypoints): number | null {
    if (keypoints.leftElbow.confidence < 0.01) return null;
    return angleBetweenPoints(keypoints.leftShoulder, keypoints.leftElbow, keypoints.leftWrist);
  }

  classify(keypoints: PoseKeypoints): ExerciseClassification {
    const allKeypoints = Object.values(keypoints);
    const maxScore = Math.max(...allKeypoints.map(kp => kp.confidence));
    const meanScore = allKeypoints.reduce((sum, kp) => sum + kp.confidence, 0) / allKeypoints.length;

    const { width, height, aspect } = this.boundingBoxOrientation(keypoints);

    if (aspect === null) {
      return {
        exercise: 'unknown',
        reason: 'not enough core joints visible',
        confidence: 0.2,
      };
    }

    const kneeAngle = this.kneeAngleMin(keypoints);
    const elbowAngle = this.elbowAngleMin(keypoints);

    // Determine posture
    let posture: 'vertical' | 'horizontal' | 'mixed';
    if (aspect < 0.8) {
      posture = 'vertical';
    } else if (aspect > 1.2) {
      posture = 'horizontal';
    } else {
      posture = 'mixed';
    }

    let exercise = 'unknown';
    let reason = 'no strong rule matched';
    let conf = 0.3 + 0.4 * Math.min(1.0, meanScore / 0.3);

    // Vertical posture = squat/standing
    if (posture === 'vertical') {
      if (kneeAngle !== null) {
        if (kneeAngle < 140) {
          exercise = 'squat';
          reason = `vertical posture + bent knees (${kneeAngle.toFixed(1)}°)`;
          conf += 0.2;
        } else if (kneeAngle > 165) {
          exercise = 'standing';
          reason = `vertical posture + straight legs (${kneeAngle.toFixed(1)}°)`;
          conf += 0.1;
        } else {
          exercise = 'squat_partial';
          reason = `moderate knee bend (${kneeAngle.toFixed(1)}°)`;
          conf += 0.1;
        }
      }
    }
    // Horizontal posture = plank/pushup
    else if (posture === 'horizontal') {
      if (elbowAngle !== null) {
        if (elbowAngle < 150) {
          exercise = 'pushup';
          reason = `horizontal body + bent elbows (${elbowAngle.toFixed(1)}°)`;
          conf += 0.2;
        } else {
          exercise = 'plank';
          reason = `horizontal body + straight elbows (${elbowAngle.toFixed(1)}°)`;
          conf += 0.2;
        }
      }
    }

    // Low score penalty
    if (maxScore < 0.01) {
      reason += ' (low confidence)';
      conf *= 0.5;
    }

    return {
      exercise,
      reason,
      confidence: Math.max(0, Math.min(1, conf)),
    };
  }
}

// =========================================================
// Simulated Pose Data (for demo without TFLite)
// =========================================================

function generateSimulatedPoseData(
  width: number,
  height: number,
  phase: 'up' | 'down' | 'neutral'
): PoseKeypoints {
  const centerX = width * 0.5;
  const topY = height * 0.2;
  const midY = height * 0.5;
  const bottomY = height * 0.8;

  // Adjust based on squat phase
  const kneeY = phase === 'down' ? midY + 50 : midY;
  const hipY = phase === 'down' ? midY : midY - 50;

  return {
    nose: { x: centerX, y: topY, confidence: 0.9 },
    leftEye: { x: centerX - 20, y: topY, confidence: 0.9 },
    rightEye: { x: centerX + 20, y: topY, confidence: 0.9 },
    leftEar: { x: centerX - 40, y: topY, confidence: 0.9 },
    rightEar: { x: centerX + 40, y: topY, confidence: 0.9 },
    leftShoulder: { x: centerX - 60, y: topY + 60, confidence: 0.95 },
    rightShoulder: { x: centerX + 60, y: topY + 60, confidence: 0.95 },
    leftElbow: { x: centerX - 80, y: topY + 120, confidence: 0.9 },
    rightElbow: { x: centerX + 80, y: topY + 120, confidence: 0.9 },
    leftWrist: { x: centerX - 100, y: topY + 180, confidence: 0.85 },
    rightWrist: { x: centerX + 100, y: topY + 180, confidence: 0.85 },
    leftHip: { x: centerX - 50, y: hipY, confidence: 0.95 },
    rightHip: { x: centerX + 50, y: hipY, confidence: 0.95 },
    leftKnee: { x: centerX - 50, y: kneeY, confidence: 0.95 },
    rightKnee: { x: centerX + 50, y: kneeY, confidence: 0.95 },
    leftAnkle: { x: centerX - 50, y: bottomY, confidence: 0.95 },
    rightAnkle: { x: centerX + 50, y: bottomY, confidence: 0.95 },
  };
}

// =========================================================
// Initialize AI Models
// =========================================================

export async function initializeAIModels(): Promise<void> {
  await modelManager.initialize();
}

// =========================================================
// Exports
// =========================================================

export default {
  initializeAIModels,
  detectPose,
  SquatFormAnalyzer,
  SquatRepCounter,
  ExerciseClassifier,
};
