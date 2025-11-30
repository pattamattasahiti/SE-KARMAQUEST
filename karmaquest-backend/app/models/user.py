
from app import db
from datetime import datetime
import uuid
import bcrypt

class User(db.Model):
    __tablename__ = 'users'
    
    user_id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    date_of_birth = db.Column(db.Date)
    gender = db.Column(db.String(20))
    profile_picture_url = db.Column(db.Text)  # Changed to Text for base64 images
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    is_verified = db.Column(db.Boolean, default=False)
    last_login = db.Column(db.DateTime)
    
    # Role-based fields
    role = db.Column(db.String(20), default='user', nullable=False)  # 'user', 'trainer', 'admin'
    created_by = db.Column(db.String(36), db.ForeignKey('users.user_id'), nullable=True)
    trainer_specialization = db.Column(db.Text, nullable=True)
    assigned_users = db.Column(db.JSON, default=list)
    
    # Relationships
    profile = db.relationship('UserProfile', backref='user', uselist=False, cascade='all, delete-orphan')
    sessions = db.relationship('WorkoutSession', backref='user', cascade='all, delete-orphan')
    progress = db.relationship('UserProgress', backref='user', cascade='all, delete-orphan')
    workout_plans = db.relationship('WeeklyWorkoutPlan', backref='user', cascade='all, delete-orphan', foreign_keys='WeeklyWorkoutPlan.user_id')
    meal_plans = db.relationship('WeeklyMealPlan', backref='user', cascade='all, delete-orphan', foreign_keys='WeeklyMealPlan.user_id')
    
    def set_password(self, password):
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    def check_password(self, password):
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))
    
    def to_dict(self):
        return {
            'user_id': self.user_id,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'date_of_birth': self.date_of_birth.isoformat() if self.date_of_birth else None,
            'gender': self.gender,
            'profile_picture_url': self.profile_picture_url,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'is_active': self.is_active,
            'is_verified': self.is_verified,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'role': self.role,
            'trainer_specialization': self.trainer_specialization,
            'assigned_users': self.assigned_users or []
        }

class UserProfile(db.Model):
    __tablename__ = 'user_profiles'
    
    profile_id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.user_id'), nullable=False)
    current_weight = db.Column(db.Float)
    height = db.Column(db.Float)
    target_weight = db.Column(db.Float)
    fitness_goal = db.Column(db.String(50))  # weight_loss, muscle_gain, maintenance
    fitness_level = db.Column(db.String(50))  # beginner, intermediate, advanced
    medical_conditions = db.Column(db.JSON)
    preferences = db.Column(db.JSON)
    
    def to_dict(self):
        return {
            'profile_id': self.profile_id,
            'user_id': self.user_id,
            'current_weight': self.current_weight,
            'height': self.height,
            'target_weight': self.target_weight,
            'fitness_goal': self.fitness_goal,
            'fitness_level': self.fitness_level,
            'medical_conditions': self.medical_conditions,
            'preferences': self.preferences
        }
