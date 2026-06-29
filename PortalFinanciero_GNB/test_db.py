import psycopg2
conn = psycopg2.connect("postgresql://postgres:vieriveliz@localhost:5432/BancoGNB")
cur = conn.cursor()
try:
    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'dusuarios_admin'")
    print([row[0] for row in cur.fetchall()])
    
    cur.execute("SELECT * FROM dusuarios_admin")
    for r in cur.fetchall(): print(r)
except Exception as e:
    print(e)
