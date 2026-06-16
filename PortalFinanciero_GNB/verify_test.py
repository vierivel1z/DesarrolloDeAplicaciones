import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlalchemy import text
from app.core.cfg_database import engine

def main():
    sql_path = 'Sql/08_DML_crear_castor_perez.sql'
    with open(sql_path, 'r', encoding='utf-8') as f:
        sql = f.read()
    
    with engine.begin() as conn:
        try:
            conn.execute(text(sql))
            print("SQL executed successfully.")
        except Exception as e:
            print("Error executing SQL:", e)
            
if __name__ == '__main__':
    main()
