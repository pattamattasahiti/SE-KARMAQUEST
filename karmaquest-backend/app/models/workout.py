
from app import db
from datetime import datetime
import uuid

class WorkoutSession(db.Model):
    __tablename__ = 'workout_sessions'
    
    session_id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.user_id'), nullable=False)
    session_date = db.Column(db.DateTime, default=datetime.utcnow)
    duration_seconds = db.Column(db.Integer, default=0)
    total_exercises = db.Column(db.Integer, default=0)
    total_reps = db.Column(db.Integer, default=0)
    total_calories = db.Column(db.Float, default=0)
    avg_posture_score = db.Column(db.Float, default=0)
    session_notes = db.Column(db.Text)
    workout_type = db.Column(db.String(50), default='General')  # General, AI-Video, Manual, etc.
    video_url = db.Column(db.String(500))  # Store AI analyzed video URL
    
    # Relationships
    exercises = db.relationship('ExerciseLog', backref='session', cascade='all, delete-orphan')
    
    def to_dict(self):
        # Get first exercise for AI workouts to show exercise type
        first_exercise = None
        if self.exercises and len(self.exercises) > 0:
            first_exercise = self.exercises[0]
        
        return {
            'session_id': self.session_id,
            'user_id': self.user_id,
            'session_date': self.session_date.isoformat(),
            'duration_seconds': self.duration_seconds,
            'total_exercises': self.total_exercises,
            'total_reps': self.total_reps,
            'total_calories': self.total_calories,
            'avg_posture_score': self.avg_posture_score,
            'session_notes': self.session_notes,
            'workout_type': self.workout_type,
            'video_url': self.video_url,
            'primary_exercise': first_exercise.exercise_type if first_exercise else None,
            'exercises': [ex.to_dict() for ex in self.exercises]
        }

class ExerciseLog(db.Model):
    __tablename__ = 'exercise_logs'
    
    log_id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = db.Column(db.String(36), db.ForeignKey('workout_sessions.session_id'), nullable=False)
    exercise_type = db.Column(db.String(50), nullable=False)  # squat, pushup, lunge, plank, deadlift
    sets = db.Column(db.Integer, default=1)  # Number of sets (calculated from reps, 10 reps = 1 set)
    correct_reps = db.Column(db.Integer, default=0)
    incorrect_reps = db.Column(db.Integer, default=0)
    total_reps = db.Column(db.Integer, default=0)
    avg_form_score = db.Column(db.Float, default=0)
    duration_seconds = db.Column(db.Integer, default=0)
    calories_burned = db.Column(db.Float, default=0)
    posture_issues = db.Column(db.JSON)
    
    def to_dict(self):
        return {
            'log_id': self.log_id,
            'session_id': self.session_id,
            'exercise_type': self.exercise_type,
            'sets': self.sets,
            'correct_reps': self.correct_reps,
            'incorrect_reps': self.incorrect_reps,
            'total_reps': self.total_reps,
            'avg_form_score': self.avg_form_score,
            'duration_seconds': self.duration_seconds,
            'calories_burned': self.calories_burned,
            'posture_issues': self.posture_issues
        }
