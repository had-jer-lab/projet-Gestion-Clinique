import sqlite3
import os
 
DB_FOLDER = "instance"
DB_PATH = os.path.join(DB_FOLDER, "base.db")
 

if not os.path.exists(DB_FOLDER):
    os.mkdir(DB_FOLDER)
 

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()
 

c.execute("""
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT,
    prenom TEXT,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT
)
""")

c.execute("""
INSERT OR IGNORE INTO users (nom, prenom, email, password, role)
VALUES ('Imad', 'Moh', 'moh@gmail.com', 'dirc1', 'Directeur')
""")
 

c.execute("""
INSERT OR IGNORE INTO users (nom, prenom, email, password, role)
VALUES ('Hoda', 'Arhman', 'hoda@gmail.com', 'sec1', 'Secrétaire')
""")
 
# جدول medecins
c.execute("""
CREATE TABLE IF NOT EXISTS medecins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT,
    prenom TEXT,
    telephone TEXT,
    email TEXT UNIQUE,
    specialite TEXT,
    password TEXT
)
""")
 
conn.commit()
conn.close()
print("Base de données créée avec succès !")