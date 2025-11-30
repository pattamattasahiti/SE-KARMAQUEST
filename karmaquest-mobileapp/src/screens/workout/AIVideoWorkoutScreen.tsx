/**
 * AI Video Workout Screen
 * 
 * NEW screen for video recording/upload workflow with backend AI processing
 * Different from LiveCameraWorkoutScreen which does real-time analysis
 * 
 * Flow: Choose Mode → Record/Upload → Preview → Upload to Backend → Processing → Playback → Summary
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

import { WorkoutStackParamList } from '../../types';
import { COLORS, SPACING, FONT_SIZES } from '../../constants';
import { getExerciseBackendId } from '../../constants/exerciseMapping';
import { formatDuration, calculateCaloriesBurned, calculateSetsFromReps } from '../../utils/calculations';
import { API_CONFIG } from '../../constants';
import apiService from '../../services/api';

type NavigationProp = StackNavigationProp<WorkoutStackParamList, 'AIVideoWorkout'>;
type RouteParamsProp = RouteProp<WorkoutStackParamList, 'AIVideoWorkout'>;

type ScreenMode = 'chooseMode' | 'record' | 'preview' | 'processing' | 'playback';

interface VideoAnalysisResult {
  download_url: string;  // Backend returns download_url, not video_url
  total_reps: number;
  duration: number;
  form_score: number;
  form_feedback: string;
  rep_scores: number[];
}

export default function AIVideoWorkoutScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteParamsProp>();

  const { sessionId, exerciseName } = route.params;
  const exerciseBackendId = getExerciseBackendId(exerciseName);

  // Camera refs and state
  const cameraRef = useRef<any>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [isRecording, setIsRecording] = useState(false);

  // Video state
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [processedVideoUrl, setProcessedVideoUrl] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<VideoAnalysisResult | null>(null);

  // UI state
  const [screenMode, setScreenMode] = useState<ScreenMode>('chooseMode');
  const [uploadProgress, setUploadProgress] = useState(0);

  // Video players - must be created unconditionally at the top level
  const previewPlayer = useVideoPlayer(videoUri || '', (player) => {
    player.loop = false;
    if (videoUri) {
      player.play();
    }
  });

  const playbackPlayer = useVideoPlayer(processedVideoUrl || '', (player) => {
    player.loop = false;
    if (processedVideoUrl) {
      player.play();
    }
  });

  useEffect(() => {
    // Request permissions on mount
    (async () => {
      if (permission && !permission.granted) {
        await requestPermission();
      }
      if (micPermission && !micPermission.granted) {
        await requestMicPermission();
      }
    })();
  }, []);

  // Mode selection handlers
  const handleRecordVideo = async () => {
    if (!permission?.granted) {
      Alert.alert('Permission Required', 'Camera permission is needed to record video');
      await requestPermission();
      return;
    }
    if (!micPermission?.granted) {
      Alert.alert('Permission Required', 'Microphone permission is needed to record video with audio');
      await requestMicPermission();
      return;
    }
    setScreenMode('record');
  };

  const handleUploadVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setVideoUri(result.assets[0].uri);
        setScreenMode('preview');
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Error', 'Failed to pick video from library');
    }
  };

  // Recording handlers
  const startRecording = async () => {
    if (!cameraRef.current || isRecording) return;

    try {
      setIsRecording(true);
      const video = await cameraRef.current.recordAsync({
        maxDuration: 60, // 60 seconds max
        quality: '720p',
        mirror: facing === 'front',
      });

      setVideoUri(video.uri);
      setScreenMode('preview');
      setIsRecording(false);
    } catch (error) {
      console.error('Error recording video:', error);
      Alert.alert('Error', 'Failed to record video');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
    }
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  // Video preview handlers
  const handleRetake = () => {
    setVideoUri(null);
    setScreenMode('record');
  };

  const handleUseVideo = () => {
    if (videoUri) {
      uploadVideoForAnalysis(videoUri);
    }
  };

  // Upload and process video
  const uploadVideoForAnalysis = async (uri: string) => {
    if (!exerciseBackendId) {
      Alert.alert('Error', 'Exercise not supported for AI analysis');
      return;
    }

    setScreenMode('processing');
    setUploadProgress(0);

    try {
      // Create a File object from URI to check existence
      // Note: File constructor in expo-file-system expects a path, not a full URI
      // For video URIs from camera/picker, we can directly use them
      // The new API doesn't require explicit existence checks before upload

      // Create FormData for upload
      const formData = new FormData();

      // Extract filename from URI
      const filename = uri.split('/').pop() || 'video.mp4';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `video/${match[1]}` : 'video/mp4';

      // Append video file
      formData.append('video', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        name: filename,
        type: type,
      } as any);

      formData.append('exercise_type', exerciseBackendId);
      formData.append('session_id', sessionId.toString());

      // Upload to backend
      const response = await axios.post(
        `${API_CONFIG.BASE_URL}/pose/process-video`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 120000, // 2 minutes timeout
        }
      );

      // Simulate processing progress with random increments in specified ranges
      // Stage 1: 20-30%
      const stage1 = Math.floor(Math.random() * 11) + 20; // 20-30
      setUploadProgress(stage1);
      await new Promise(resolve => setTimeout(resolve, 800));

      // Stage 2: 30-40%
      const stage2 = Math.floor(Math.random() * 11) + 30; // 30-40
      setUploadProgress(stage2);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Stage 3: 60-80%
      const stage3 = Math.floor(Math.random() * 21) + 60; // 60-80
      setUploadProgress(stage3);
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Stage 4: Near 100% (95-99%)
      const stage4 = Math.floor(Math.random() * 5) + 95; // 95-99
      setUploadProgress(stage4);
      await new Promise(resolve => setTimeout(resolve, 500));

      const result: VideoAnalysisResult = response.data;

      setUploadProgress(100);

      // Convert backend response to format we need
      // Backend returns: /api/pose/download/filename.mp4
      // BASE_URL already has /api, so remove it from download_url
      const videoPath = result.download_url.replace('/api', '');
      const fullVideoUrl = `${API_CONFIG.BASE_URL}${videoPath}`;

      console.log('Backend response:', result);
      console.log('Video path:', videoPath);
      console.log('Full video URL:', fullVideoUrl);

      setAnalysisResult(result);
      setProcessedVideoUrl(fullVideoUrl);
      setScreenMode('playback');

    } catch (error: any) {
      console.error('Error uploading video:', error);

      let errorMessage = 'Failed to process video';
      if (error.response) {
        errorMessage = error.response.data?.error || errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Error', errorMessage);
      setScreenMode('preview');
    }
  };

  // Complete workout and navigate to summary
  const handleCompleteWorkout = async () => {
    if (!analysisResult || !exerciseBackendId || !processedVideoUrl) return;

    try {
      // Calculate additional metrics
      const totalSets = calculateSetsFromReps(analysisResult.total_reps);
      const caloriesBurned = calculateCaloriesBurned(
        exerciseBackendId,
        analysisResult.total_reps,
        analysisResult.duration
      );

      // Parse form_feedback into issues and suggestions
      const formFeedback = analysisResult.form_feedback || '';
      const formIssues: string[] = [];
      const formSuggestions: string[] = [];

      // Simple parsing - split feedback into sentences (only if it's a string)
      if (formFeedback && typeof formFeedback === 'string') {
        const sentences = formFeedback.split('.').filter(s => s.trim());
        sentences.forEach(sentence => {
          const trimmed = sentence.trim();
          if (trimmed.toLowerCase().includes('issue') ||
            trimmed.toLowerCase().includes('problem') ||
            trimmed.toLowerCase().includes('incorrect')) {
            formIssues.push(trimmed);
          } else if (trimmed) {
            formSuggestions.push(trimmed);
          }
        });
      }

      // If no parsed feedback, add default message
      if (formIssues.length === 0 && formSuggestions.length === 0 && formFeedback) {
        formSuggestions.push(formFeedback);
      }

      // Save workout session with video URL and AI data
      console.log('[AIWorkout] Saving workout session with video URL...');
      console.log('[AIWorkout] Exercise type being sent:', exerciseBackendId);
      await apiService.completeWorkoutSession(sessionId, {
        duration_seconds: Math.round(analysisResult.duration),
        total_calories: caloriesBurned,
        total_reps: analysisResult.total_reps,
        total_exercises: 1,
        avg_posture_score: analysisResult.form_score,
        video_url: processedVideoUrl,
        workout_type: 'AI-Video',
        exercise_type: exerciseBackendId, // ADD THIS: Send the actual exercise type!
        session_notes: `AI-analyzed ${exerciseName} workout: ${analysisResult.total_reps} reps, ${analysisResult.form_score}/100 form score`
      });

      // Save exercise log with sets
      await apiService.logExercise(sessionId, {
        exercise_type: exerciseBackendId,
        sets: totalSets,
        total_reps: analysisResult.total_reps,
        correct_reps: analysisResult.total_reps,
        incorrect_reps: 0,
        avg_form_score: analysisResult.form_score,
        duration_seconds: Math.round(analysisResult.duration),
        calories_burned: caloriesBurned,
        posture_issues: formIssues
      });

      console.log('[AIWorkout] ✅ Workout saved successfully');

      navigation.navigate('WorkoutSummary', {
        sessionId,
        exerciseName,
        videoUrl: processedVideoUrl,  // Use the constructed full URL
        totalReps: analysisResult.total_reps,
        duration: analysisResult.duration,
        formScore: analysisResult.form_score,
        formIssues,
        formSuggestions,
        totalSets,
        caloriesBurned,
      });
    } catch (error) {
      console.error('[AIWorkout] Error saving workout:', error);
      Alert.alert('Error', 'Failed to save workout. Please try again.');
    }
  };

  // Render different screens based on mode
  const renderChooseModeScreen = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Camera Mode</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.infoCard}>
          <Ionicons name="camera" size={48} color={COLORS.primary} />
          <Text style={styles.exerciseTitle}>{exerciseName}</Text>
          <Text style={styles.infoText}>
            Choose how you want to capture your workout:
          </Text>
        </View>

        <TouchableOpacity style={styles.optionButton} onPress={handleRecordVideo}>
          <Ionicons name="videocam" size={32} color={COLORS.white} />
          <Text style={styles.optionButtonText}>Record Video</Text>
          <Text style={styles.optionButtonSubtext}>
            Record your workout in real-time
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionButton, styles.secondaryButton]}
          onPress={handleUploadVideo}
        >
          <Ionicons name="cloud-upload" size={32} color={COLORS.primary} />
          <Text style={[styles.optionButtonText, styles.secondaryButtonText]}>
            Upload Video
          </Text>
          <Text style={[styles.optionButtonSubtext, styles.secondaryButtonSubtext]}>
            Choose from your gallery
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRecordScreen = () => {
    if (!permission?.granted) {
      return (
        <View style={styles.container}>
          <View style={styles.permissionContainer}>
            <Ionicons name="videocam-off" size={64} color={COLORS.textSecondary} />
            <Text style={styles.permissionText}>Camera permission required</Text>
            <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          mode="video"
          videoQuality="720p"
        />
        {/* Overlay positioned absolutely on top of camera */}
        <View style={styles.cameraOverlay}>
          <View style={styles.cameraHeader}>
            <TouchableOpacity
              onPress={() => setScreenMode('chooseMode')}
              style={styles.cameraHeaderButton}
            >
              <Ionicons name="close" size={28} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.cameraTitle}>{exerciseName}</Text>
            <TouchableOpacity
              onPress={toggleCameraFacing}
              style={styles.cameraHeaderButton}
            >
              <Ionicons name="camera-reverse" size={28} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          {isRecording && (
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>Recording...</Text>
            </View>
          )}

          <View style={styles.cameraControls}>
            {!isRecording ? (
              <TouchableOpacity style={styles.recordButton} onPress={startRecording}>
                <View style={styles.recordButtonInner} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.stopButton} onPress={stopRecording}>
                <View style={styles.stopButtonInner} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderPreviewScreen = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setScreenMode('chooseMode')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Preview Video</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.previewContainer}>
        {videoUri && (
          <VideoView
            style={styles.previewVideo}
            player={previewPlayer}
            nativeControls={true}
            contentFit="contain"
          />
        )}
      </View>

      <View style={styles.previewActions}>
        <TouchableOpacity style={styles.retakeButton} onPress={handleRetake}>
          <Ionicons name="refresh" size={24} color={COLORS.primary} />
          <Text style={styles.retakeButtonText}>Retake</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.useVideoButton} onPress={handleUseVideo}>
          <Text style={styles.useVideoButtonText}>Analyze Video</Text>
          <Ionicons name="arrow-forward" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderProcessingScreen = () => (
    <View style={styles.container}>
      <View style={styles.processingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.processingTitle}>Processing Video...</Text>
        <Text style={styles.processingSubtext}>
          AI is analyzing your form and counting reps
        </Text>

        {uploadProgress > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
            </View>
            <Text style={styles.progressText}>{uploadProgress}%</Text>
          </View>
        )}

        <Text style={styles.processingNote}>This may take 30-60 seconds...</Text>
      </View>
    </View>
  );

  const renderPlaybackScreen = () => (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setScreenMode('chooseMode')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analysis Complete</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.playbackContainer}>
        {/* Video Player - First, at the top */}
        {processedVideoUrl && (
          <View style={styles.videoSection}>
            <Text style={styles.videoSectionTitle}>AI Analyzed Video</Text>
            <VideoView
              style={styles.playbackVideo}
              player={playbackPlayer}
              nativeControls={true}
              contentFit="contain"
            />
          </View>
        )}

        {/* AI Analysis Results - Second, below video */}
        <View style={styles.resultsCard}>
          <Text style={styles.resultsTitle}>AI Analysis Results</Text>

          <View style={styles.resultRow}>
            <Ionicons name="fitness" size={24} color={COLORS.primary} />
            <Text style={styles.resultLabel}>Total Reps:</Text>
            <Text style={styles.resultValue}>{analysisResult?.total_reps || 0}</Text>
          </View>

          <View style={styles.resultRow}>
            <Ionicons name="time" size={24} color={COLORS.primary} />
            <Text style={styles.resultLabel}>Duration:</Text>
            <Text style={styles.resultValue}>
              {formatDuration(analysisResult?.duration || 0)}
            </Text>
          </View>

          <View style={styles.resultRow}>
            <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
            <Text style={styles.resultLabel}>Form Score:</Text>
            <Text style={styles.resultValue}>{analysisResult?.form_score || 0}/100</Text>
          </View>

          {analysisResult?.form_feedback && (
            <View style={styles.feedbackContainer}>
              <Text style={styles.feedbackTitle}>💡 Form Feedback</Text>
              <Text style={styles.feedbackText}>{analysisResult.form_feedback}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.completeButton} onPress={handleCompleteWorkout}>
          <Text style={styles.completeButtonText}>Complete Workout</Text>
          <Ionicons name="checkmark-circle" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // Main render
  switch (screenMode) {
    case 'chooseMode':
      return renderChooseModeScreen();
    case 'record':
      return renderRecordScreen();
    case 'preview':
      return renderPreviewScreen();
    case 'processing':
      return renderProcessingScreen();
    case 'playback':
      return renderPlaybackScreen();
    default:
      return renderChooseModeScreen();
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: SPACING.sm,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: 'center',
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  exerciseTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  infoText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  optionButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  secondaryButton: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  optionButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.white,
    marginTop: SPACING.sm,
  },
  secondaryButtonText: {
    color: COLORS.primary,
  },
  optionButtonSubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    opacity: 0.8,
    marginTop: SPACING.xs,
  },
  secondaryButtonSubtext: {
    color: COLORS.textSecondary,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    paddingTop: SPACING.xl + 20,
  },
  cameraHeaderButton: {
    padding: SPACING.sm,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
  },
  cameraTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.white,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    alignSelf: 'center',
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.white,
    marginRight: SPACING.sm,
  },
  recordingText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  cameraControls: {
    alignItems: 'center',
    paddingBottom: SPACING.xl + 20,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.error,
  },
  recordButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.error,
  },
  stopButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.error,
  },
  stopButtonInner: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.error,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  permissionText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: COLORS.text,
  },
  previewVideo: {
    flex: 1,
  },
  previewActions: {
    flexDirection: 'row',
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  retakeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.primary,
    marginRight: SPACING.sm,
  },
  retakeButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: SPACING.sm,
  },
  useVideoButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    marginLeft: SPACING.sm,
  },
  useVideoButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
    marginRight: SPACING.sm,
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  processingTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.lg,
  },
  processingSubtext: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    marginTop: SPACING.xl,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  progressText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  processingNote: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    marginTop: SPACING.xl,
    textAlign: 'center',
  },
  playbackContainer: {
    flex: 1,
  },
  videoSection: {
    margin: SPACING.lg,
    marginBottom: SPACING.md,
  },
  videoSectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  playbackVideo: {
    width: '100%',
    height: 300,
    backgroundColor: COLORS.text,
    borderRadius: 12,
    overflow: 'hidden',
  },
  resultsCard: {
    backgroundColor: COLORS.white,
    margin: SPACING.lg,
    borderRadius: 12,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  resultsTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  resultLabel: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  resultValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  feedbackContainer: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  feedbackTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  feedbackText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    lineHeight: 20,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.success,
    margin: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  completeButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.white,
    marginRight: SPACING.sm,
  },
});
