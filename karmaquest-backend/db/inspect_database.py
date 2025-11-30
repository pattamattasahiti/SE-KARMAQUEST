import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def inspect_database():
    """Inspect the database and show all tables and their data counts"""
    try:
        # Get database URL from environment
        database_url = os.getenv('DATABASE_URL')
        if not database_url:
            print("❌ DATABASE_URL not found in .env file")
            return

        # Connect to database
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()

        print("🔍 Inspecting KarmaQuest Database")
        print("=" * 50)

        # Get all tables
        cursor.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        """)

        tables = cursor.fetchall()

        if not tables:
            print("❌ No tables found in database")
            return

        print(f"📋 Found {len(tables)} tables:")
        print()

        total_records = 0

        for table in tables:
            table_name = table[0]

            # Get row count for each table
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            count = cursor.fetchone()[0]

            total_records += count
            print(f"  • {table_name}: {count:,} records")

        print()
        print(f"📊 Total records across all tables: {total_records:,}")

        # Show sample data from each table (first 3 rows)
        print("\n" + "=" * 50)
        print("📝 Sample data from each table:")
        print()

        for table in tables:
            table_name = table[0]

            try:
                cursor.execute(f"SELECT * FROM {table_name} LIMIT 3")
                columns = [desc[0] for desc in cursor.description]
                rows = cursor.fetchall()

                if rows:
                    print(f"🔸 {table_name} (columns: {', '.join(columns[:5])}{'...' if len(columns) > 5 else ''})")
                    for i, row in enumerate(rows):
                        # Show first 3 columns for brevity
                        display_row = [str(cell)[:50] + '...' if len(str(cell)) > 50 else str(cell) for cell in row[:3]]
                        print(f"    Row {i+1}: {', '.join(display_row)}{'...' if len(row) > 3 else ''}")
                    print()
                else:
                    print(f"🔸 {table_name}: No data")
                    print()

            except Exception as e:
                print(f"🔸 {table_name}: Error reading data - {str(e)}")
                print()

        cursor.close()
        conn.close()

        print("✅ Database inspection completed successfully!")

    except Exception as e:
        print(f"❌ Error inspecting database: {str(e)}")

if __name__ == "__main__":
    inspect_database()