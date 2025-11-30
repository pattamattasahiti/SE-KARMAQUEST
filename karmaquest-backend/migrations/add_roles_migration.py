"""
Migration script to add role-based authentication fields
Run this script to add role, created_by, trainer_specialization, and assigned_users to the users table
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app, db
from app.models.user import User, UserProfile
from sqlalchemy import text

def run_migration():
    app = create_app()
    
    with app.app_context():
        print("[Migration] Starting role-based authentication migration...")
        
        try:
            # Add new columns to users table
            print("[Migration] Adding new columns...")
            
            with db.engine.connect() as conn:
                # Add role column (default 'user')
                try:
                    conn.execute(text("""
                        ALTER TABLE users 
                        ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user' NOT NULL
                    """))
                    conn.commit()
                    print("  ✅ Added 'role' column")
                except Exception as e:
                    print(f"  ⚠️  Role column may already exist: {e}")
                
                # Add created_by column
                try:
                    conn.execute(text("""
                        ALTER TABLE users 
                        ADD COLUMN IF NOT EXISTS created_by VARCHAR(36) NULL
                    """))
                    conn.commit()
                    print("  ✅ Added 'created_by' column")
                except Exception as e:
                    print(f"  ⚠️  created_by column may already exist: {e}")
                
                # Add trainer_specialization column
                try:
                    conn.execute(text("""
                        ALTER TABLE users 
                        ADD COLUMN IF NOT EXISTS trainer_specialization TEXT NULL
                    """))
                    conn.commit()
                    print("  ✅ Added 'trainer_specialization' column")
                except Exception as e:
                    print(f"  ⚠️  trainer_specialization column may already exist: {e}")
                
                # Add assigned_users column (JSON)
                try:
                    conn.execute(text("""
                        ALTER TABLE users 
                        ADD COLUMN IF NOT EXISTS assigned_users JSON NULL
                    """))
                    conn.commit()
                    print("  ✅ Added 'assigned_users' column")
                except Exception as e:
                    print(f"  ⚠️  assigned_users column may already exist: {e}")
                
                # Create index for role column for better performance
                try:
                    conn.execute(text("""
                        CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)
                    """))
                    conn.commit()
                    print("  ✅ Created index on 'role' column")
                except Exception as e:
                    print(f"  ⚠️  Index may already exist: {e}")
            
            # Create admin user
            print("\n[Migration] Creating admin user...")
            admin_email = os.getenv('ADMIN_EMAIL', 'admin@karmaquest.com')
            admin_password = os.getenv('ADMIN_PASSWORD', 'Admin@KarmaQuest2025!')
            
            admin = User.query.filter_by(email=admin_email).first()
            
            if not admin:
                admin = User(
                    email=admin_email,
                    first_name='Admin',
                    last_name='User',
                    role='admin'
                )
                admin.set_password(admin_password)
                db.session.add(admin)
                db.session.flush()
                
                # Create admin profile
                admin_profile = UserProfile(user_id=admin.user_id)
                db.session.add(admin_profile)
                
                db.session.commit()
                print(f"  ✅ Admin user created: {admin_email}")
            else:
                # Ensure existing admin has the admin role
                if admin.role != 'admin':
                    admin.role = 'admin'
                    db.session.commit()
                    print(f"  ✅ Admin role assigned to existing user: {admin_email}")
                else:
                    print(f"  ℹ️  Admin user already exists: {admin_email}")
            
            # Update existing users to have 'user' role if NULL
            print("\n[Migration] Updating existing users...")
            users_updated = db.session.execute(text("""
                UPDATE users 
                SET role = 'user' 
                WHERE role IS NULL OR role = ''
            """))
            db.session.commit()
            print(f"  ✅ Updated {users_updated.rowcount} users to have 'user' role")
            
            print("\n[Migration] ✅ Migration completed successfully!")
            print(f"\n🔑 Admin Login Credentials:")
            print(f"   Email: {admin_email}")
            print(f"   Password: {admin_password}")
            print(f"\n📝 Next steps:")
            print(f"   1. Restart the backend server")
            print(f"   2. Test admin login at /api/auth/login")
            print(f"   3. Create a trainer account at /api/admin/trainers")
            
        except Exception as e:
            db.session.rollback()
            print(f"\n[Migration] ❌ Error during migration: {str(e)}")
            import traceback
            print(traceback.format_exc())
            return False
        
        return True

if __name__ == '__main__':
    success = run_migration()
    sys.exit(0 if success else 1)
