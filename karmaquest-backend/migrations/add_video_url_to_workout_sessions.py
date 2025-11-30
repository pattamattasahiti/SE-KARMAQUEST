"""
Migration: Add video_url and workout_type columns to workout_sessions table
Date: 2025-11-17
Purpose: Store AI-analyzed video URLs and workout type in workout sessions
"""

from app import app, db
from sqlalchemy import text

def upgrade():
    """Add video_url and workout_type columns"""
    with app.app_context():
        try:
            # Add workout_type column
            db.session.execute(text("""
                ALTER TABLE workout_sessions 
                ADD COLUMN IF NOT EXISTS workout_type VARCHAR(50) DEFAULT 'General'
            """))
            
            # Add video_url column
            db.session.execute(text("""
                ALTER TABLE workout_sessions 
                ADD COLUMN IF NOT EXISTS video_url VARCHAR(500)
            """))
            
            db.session.commit()
            print("✅ Migration successful: Added video_url and workout_type columns")
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ Migration failed: {e}")
            raise

def downgrade():
    """Remove video_url and workout_type columns"""
    with app.app_context():
        try:
            db.session.execute(text("""
                ALTER TABLE workout_sessions 
                DROP COLUMN IF EXISTS workout_type
            """))
            
            db.session.execute(text("""
                ALTER TABLE workout_sessions 
                DROP COLUMN IF EXISTS video_url
            """))
            
            db.session.commit()
            print("✅ Migration rollback successful")
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ Migration rollback failed: {e}")
            raise

if __name__ == '__main__':
    print("Running migration: add_video_url_to_workout_sessions")
    upgrade()
