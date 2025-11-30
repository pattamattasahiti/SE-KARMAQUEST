import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def clear_database():
    """Clear all data from KarmaQuest database tables while keeping table structure"""
    try:
        # Get database URL from environment
        database_url = os.getenv('DATABASE_URL')
        if not database_url:
            print("❌ DATABASE_URL not found in .env file")
            return

        # Connect to database
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()

        print("🧹 Clearing KarmaQuest Database")
        print("=" * 50)

        # Define tables to clear (excluding alembic_version which tracks migrations)
        tables_to_clear = [
            'exercise_logs',
            'workout_sessions',
            'weekly_workout_plans',
            'weekly_meal_plans',
            'user_progress',
            'user_profiles',
            'users'
        ]

        print("📋 Tables to clear:")
        for table in tables_to_clear:
            print(f"  • {table}")

        print("\n⚠️  WARNING: This will delete ALL data from the above tables!")
        confirm = input("\nAre you sure you want to continue? (type 'YES' to confirm): ")

        if confirm != 'YES':
            print("❌ Operation cancelled by user")
            return

        print("\n🗑️  Deleting data...")

        total_deleted = 0

        # Clear each table
        for table in tables_to_clear:
            try:
                # Get count before deletion
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                count_before = cursor.fetchone()[0]

                # Delete all records
                cursor.execute(f"DELETE FROM {table}")

                print(f"  ✅ {table}: {count_before:,} records deleted")
                total_deleted += count_before

            except Exception as e:
                print(f"  ❌ Error clearing {table}: {str(e)}")
                conn.rollback()
                return

        # Commit all changes
        conn.commit()

        print("\n" + "=" * 50)
        print(f"✅ Database cleared successfully!")
        print(f"📊 Total records deleted: {total_deleted:,}")
        print("\n🔄 Table structures preserved - ready for fresh data!")

        cursor.close()
        conn.close()

    except Exception as e:
        print(f"❌ Error clearing database: {str(e)}")

def show_menu():
    """Show menu options"""
    print("\n" + "=" * 60)
    print("�️  KARMAQUEST DATABASE MANAGEMENT")
    print("=" * 60)
    print("1. Inspect database (show tables and data counts)")
    print("2. Clear all data (keep table structure)")
    print("3. Exit")
    print("=" * 60)

if __name__ == "__main__":
    while True:
        show_menu()
        choice = input("Enter your choice (1-3): ").strip()

        if choice == '1':
            # Import and run inspect script
            from inspect_database import inspect_database
            inspect_database()
        elif choice == '2':
            clear_database()
        elif choice == '3':
            print("👋 Goodbye!")
            break
        else:
            print("❌ Invalid choice. Please enter 1, 2, or 3.")

        input("\nPress Enter to continue...")