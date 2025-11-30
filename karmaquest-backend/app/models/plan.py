from app import db
from datetime import datetime
import uuid

class WeeklyWorkoutPlan(db.Model):
    __tablename__ = 'weekly_workout_plans'
    
    plan_id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    plan_data = db.Column(db.JSON, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'plan_id': self.plan_id,
            'user_id': self.user_id,
            'start_date': self.start_date.isoformat(),
            'end_date': self.end_date.isoformat(),
            'plan_data': self.plan_data,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat()
        }

class WeeklyMealPlan(db.Model):
    __tablename__ = 'weekly_meal_plans'
    
    meal_plan_id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    plan_data = db.Column(db.JSON, nullable=False)
    total_calories_per_day = db.Column(db.Integer)
    dietary_preferences = db.Column(db.JSON)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'meal_plan_id': self.meal_plan_id,
            'user_id': self.user_id,
            'start_date': self.start_date.isoformat(),
            'end_date': self.end_date.isoformat(),
            'plan_data': self.plan_data,
            'total_calories_per_day': self.total_calories_per_day,
            'dietary_preferences': self.dietary_preferences,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat()
        }
