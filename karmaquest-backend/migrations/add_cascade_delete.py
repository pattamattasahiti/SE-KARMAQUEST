"""
Migration to add CASCADE delete to foreign key constraints
This allows users to be deleted without foreign key constraint violations
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app, db
from sqlalchemy import text

def upgrade():
    """Add CASCADE delete to foreign key constraints"""
    app = create_app()
    
    with app.app_context():
        print("[Migration] Starting CASCADE delete migration...")
        
        try:
            # Drop existing foreign key constraints and recreate with CASCADE
            
            # 1. weekly_meal_plans table
            print("[Migration] Updating weekly_meal_plans foreign key...")
            db.session.execute(text("""
                ALTER TABLE weekly_meal_plans 
                DROP CONSTRAINT IF EXISTS weekly_meal_plans_user_id_fkey;
                
                ALTER TABLE weekly_meal_plans 
                ADD CONSTRAINT weekly_meal_plans_user_id_fkey 
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;
            """))
            
            # 2. weekly_workout_plans table
            print("[Migration] Updating weekly_workout_plans foreign key...")
            db.session.execute(text("""
                ALTER TABLE weekly_workout_plans 
                DROP CONSTRAINT IF EXISTS weekly_workout_plans_user_id_fkey;
                
                ALTER TABLE weekly_workout_plans 
                ADD CONSTRAINT weekly_workout_plans_user_id_fkey 
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;
            """))
            
            # 3. workout_sessions table (if not already CASCADE)
            print("[Migration] Updating workout_sessions foreign key...")
            db.session.execute(text("""
                ALTER TABLE workout_sessions 
                DROP CONSTRAINT IF EXISTS workout_sessions_user_id_fkey;
                
                ALTER TABLE workout_sessions 
                ADD CONSTRAINT workout_sessions_user_id_fkey 
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;
            """))
            
            # 4. user_progress table (if not already CASCADE)
            print("[Migration] Updating user_progress foreign key...")
            db.session.execute(text("""
                ALTER TABLE user_progress 
                DROP CONSTRAINT IF EXISTS user_progress_user_id_fkey;
                
                ALTER TABLE user_progress 
                ADD CONSTRAINT user_progress_user_id_fkey 
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;
            """))
            
            # 5. user_profiles table (if not already CASCADE)
            print("[Migration] Updating user_profiles foreign key...")
            db.session.execute(text("""
                ALTER TABLE user_profiles 
                DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey;
                
                ALTER TABLE user_profiles 
                ADD CONSTRAINT user_profiles_user_id_fkey 
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;
            """))
            
            db.session.commit()
            print("[Migration] ✅ CASCADE delete migration completed successfully!")
            
        except Exception as e:
            db.session.rollback()
            print(f"[Migration] ❌ Error during migration: {str(e)}")
            raise

if __name__ == '__main__':
    upgrade()
