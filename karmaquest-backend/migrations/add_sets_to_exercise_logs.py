"""
Migration: Add sets column to exercise_logs table
Date: 2025-01-XX
Description: Adds a 'sets' column to track the number of sets for each exercise.
             Rule: 10 reps = 1 set (calculated dynamically)
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from sqlalchemy import text

def run_migration():
    app = create_app()
    
    with app.app_context():
        try:
            # Add sets column to exercise_logs table
            print("Adding 'sets' column to exercise_logs table...")
            
            with db.engine.connect() as conn:
                conn.execute(text("""
                    ALTER TABLE exercise_logs 
                    ADD COLUMN IF NOT EXISTS sets INTEGER DEFAULT 1;
                """))
                conn.commit()
            
            print("✓ Successfully added 'sets' column")
            
            # Update existing records to calculate sets based on total_reps
            print("Updating existing records with calculated sets...")
            
            with db.engine.connect() as conn:
                # Calculate sets as CEILING(total_reps / 10)
                # PostgreSQL: CEILING function
                conn.execute(text("""
                    UPDATE exercise_logs 
                    SET sets = CEILING(total_reps::numeric / 10)
                    WHERE total_reps > 0;
                """))
                conn.commit()
            
            print("✓ Successfully updated existing records")
            print("Migration completed successfully!")
            
        except Exception as e:
            print(f"Error during migration: {str(e)}")
            db.session.rollback()
            raise

if __name__ == '__main__':
    run_migration()
