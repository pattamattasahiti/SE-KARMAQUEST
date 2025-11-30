from app import db
from datetime import datetime
import uuid

class UserProgress(db.Model):
    __tablename__ = 'user_progress'
    
    progress_id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.user_id'), nullable=False)
    date = db.Column(db.Date, default=datetime.utcnow)
    weight = db.Column(db.Float)
    body_measurements = db.Column(db.JSON)
    progress_photo_url = db.Column(db.String(500))
    notes = db.Column(db.Text)
    
    def to_dict(self):
        return {
            'progress_id': self.progress_id,
            'user_id': self.user_id,
            'date': self.date.isoformat(),
            'weight': self.weight,
            'body_measurements': self.body_measurements,
            'progress_photo_url': self.progress_photo_url,
            'notes': self.notes
        }
