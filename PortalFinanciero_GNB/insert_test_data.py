import os
import psycopg2
from dotenv import load_dotenv

load_dotenv('backend/.env')
conn = psycopg2.connect(os.environ['DATABASE_URL'])
cur = conn.cursor()

# Get an existing solicitud to clone
cur.execute('SELECT * FROM dsolicitud LIMIT 1;')
row = cur.fetchone()
cols = [desc[0] for desc in cur.description]

def clone_solicitud(new_cod, new_state, new_score=None, new_dti=None, new_otp=None, new_tea=None):
    data = dict(zip(cols, row))
    
    # modify
    data['codsolicitud'] = new_cod
    data['pksolicitudestado'] = new_state
    
    if new_score: data['score_pd'] = new_score
    if new_dti: data['dti_ratio'] = new_dti
    if new_otp: data['otp_codigo'] = new_otp
    if new_tea: data['tasainterescompensatoria'] = new_tea
    
    # generate insert
    columns = []
    values = []
    for k, v in data.items():
        if k == 'pksolicitud': continue
        columns.append(k)
        values.append(v)
        
    query = f'INSERT INTO dsolicitud ({",".join(columns)}) VALUES %s'
    cur.execute(query, (tuple(values),))

try:
    clone_solicitud('SOL_TEST_MK', 1)
    clone_solicitud('SOL_TEST_CK1', 7, 85.5, 30.2)
    clone_solicitud('SOL_TEST_CK2', 9, 90.0, 25.0, '123456', 15.5)

    # 4. Mora (dcuentacredito with diasatrasocredito > 30)
    cur.execute('''
        UPDATE fagcuentacredito SET diasatrasocredito = 45, montosaldocapital = 5000,
        flagcastigado = 'N', flagjudicial = 'N'
        WHERE pkcuentacredito = (
            SELECT pkcuentacredito FROM fagcuentacredito ORDER BY pkcuentacredito ASC LIMIT 1
        );
    ''')

    cur.execute('''
        UPDATE fagcuentacredito SET diasatrasocredito = 95, montosaldocapital = 12000,
        flagcastigado = 'S'
        WHERE pkcuentacredito = (
            SELECT pkcuentacredito FROM fagcuentacredito ORDER BY pkcuentacredito ASC OFFSET 1 LIMIT 1
        );
    ''')

    conn.commit()
    print('Test data inserted successfully!')
except Exception as e:
    conn.rollback()
    print('Error:', e)
