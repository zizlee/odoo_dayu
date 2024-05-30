import psycopg

dsn = "dbname='odoo17' user='odoodev' password='odoodev' host='127.0.0.1' port='5432' client_encoding='UTF8'"
try:
    conn = psycopg.connect(dsn)
except UnicodeDecodeError as e:
    print(f"UnicodeDecodeError: {e}")
    print(f"Problematic DSN: {dsn}")
