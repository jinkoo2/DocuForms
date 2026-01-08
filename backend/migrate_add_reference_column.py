"""
Migration script to add is_reference column to form_submissions table
Run this script to add the is_reference column to existing databases
"""
from sqlalchemy import text
from app.models.database import engine

def migrate():
    """Add is_reference column to form_submissions table if it doesn't exist"""
    with engine.begin() as conn:
        # Check if column exists
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='form_submissions' AND column_name='is_reference'
        """))
        
        if result.fetchone():
            print("Column 'is_reference' already exists. No migration needed.")
            return
        
        # Add the column
        print("Adding 'is_reference' column to form_submissions table...")
        conn.execute(text("""
            ALTER TABLE form_submissions 
            ADD COLUMN is_reference BOOLEAN NOT NULL DEFAULT FALSE
        """))
        print("Migration completed successfully!")

if __name__ == "__main__":
    migrate()
