import os
from flask import Flask, render_template, request, flash, session, redirect, url_for, jsonify
import sqlite3
import requests
import os
from config import *
from flask_cors import CORS

app = Flask(__name__)
app.secret_key = 'clinique2025'
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
}) 
DB_PATH = os.path.join("instance", "base.db")
CLINIQUE_API_URL = "http://100.95.250.126:5000/api/add_doctor"
 
def get_db():
    if not os.path.exists("instance"):
        os.mkdir("instance")
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn
 
# ===================== الصفحات الأساسية =====================
@app.route('/')
def accueil():
    return render_template('accueil.html')
 
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        form_type = request.form.get('form_type')
        email = request.form['email'].strip()
        password = request.form['password']
 
        conn = get_db()
        c = conn.cursor()
 
        if form_type == 'login':
            c.execute("SELECT * FROM users WHERE email=? AND password=?", (email, password))
            user = c.fetchone()
            if user:
                session['user'] = dict(user)
                conn.close()
                flash("Connecté avec succès !", "success")
                if user['role'] == "Directeur":
                    return redirect('/directeur/dashboard')
                else:
                    return redirect('/secretaire/dashboard')
 
            c.execute("SELECT * FROM medecins WHERE email=? AND password=?", (email, password))
            med = c.fetchone()
            conn.close()
            if med:
                session['user'] = dict(med)
                session['user']['role'] = "Docteur"
                flash(f"Bienvenue Dr. {med['prenom']} !", "success")
                return redirect('http://100.95.250.126:5000')
 
            flash("Identifiants invalides.", "error")
            return redirect(url_for('login'))
 
        elif form_type == 'signup':
            # نفس الكود بتاع إضافة طبيب لكوثر (ما غيرتهوش)
            c.execute("SELECT * FROM users WHERE email=?", (email,))
            exists1 = c.fetchone()
            c.execute("SELECT * FROM medecins WHERE email=?", (email,))
            exists2 = c.fetchone()
            if exists1 or exists2:
                conn.close()
                flash("Cet email est déjà utilisé.", "error")
                return redirect(url_for('login'))
 
            api_payload = {
                "name": request.form['nom'] + ' ' + request.form['prenom'],
                "speciality": request.form['specialite'],
                "status": "Disponible",
                "patients": 0
            }
            try:
                response = requests.post(CLINIQUE_API_URL, json=api_payload, timeout=5,
                                         proxies={'http': None, 'https': None})
                response.raise_for_status()
                c.execute("""INSERT INTO medecins (nom, prenom, telephone, email, specialite, password)
                             VALUES (?, ?, ?, ?, ?, ?)""",
                          (request.form['nom'], request.form['prenom'], request.form['telephone'],
                           request.form['email'], request.form['specialite'], request.form['password']))
                conn.commit()
                flash("Compte médecin créé avec succès...", "success")
            except requests.exceptions.RequestException as e:
                flash(f"Erreur API Clinique: {e}", "error")
            conn.close()
            return redirect(url_for('login'))
 
    return render_template('index.html')
 
@app.route('/secretaire/dashboard')
def secretaire_dashboard():
    if session.get('user', {}).get('role') != "Secrétaire":
        return redirect('/')
    return render_template('secretaire_dashboard.html', user=session['user'])
 
@app.route('/directeur/dashboard')
def directeur_dashboard():
    if session.get('user', {}).get('role') != "Directeur":
        return redirect('/')
    return render_template('directeur_dashboard.html', user=session['user'])
 
@app.route('/logout')
def logout():
    session.clear()
    flash("Déconnexion réussie.", "info")
    return redirect('/')
 
# ===================== الـ API اللي كنتِ عايزاه (شغال 100%) =====================
@app.route('/api/admins')
def api_admins():
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT id, nom, prenom, email, password, role FROM users WHERE role IN ('Directeur', 'Secrétaire')")
    rows = c.fetchall()
    conn.close()
    result = []
    for r in rows:
        name = f"{r['nom'] or ''} {r['prenom'] or ''}".strip() or "غير معروف"
        result.append({"id": r['id'], "nom": name, "email": r['email'], "password": r['password'], "role": r['role']})
    return jsonify(result)
 
@app.route('/api/admins/add', methods=['POST'])
def add_admin():
    data = request.get_json()        # ← الصحيح
    if not data: return jsonify({"error": "no data"}), 400
    conn = get_db()
    c = conn.cursor()
    try:
        c.execute("INSERT INTO users (nom, prenom, email, password, role) VALUES (?, ?, ?, ?, ?)",
                  (data['nom'], "", data['email'], data['password'], data['role']))
        conn.commit()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    finally:
        conn.close()
 
@app.route('/api/admins/update', methods=['POST'])
def update_admin():
    data = request.get_json()
    if not data or 'id' not in data: return jsonify({"error": "invalid"}), 400
    conn = get_db()
    c = conn.cursor()
    try:
        c.execute("UPDATE users SET nom=?, email=?, password=?, role=? WHERE id=?",
                  (data['nom'], data['email'], data['password'], data['role'], data['id']))
        conn.commit()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    finally:
        conn.close()
 
@app.route('/api/admins/delete/<int:user_id>', methods=['DELETE'])
def delete_admin(user_id):
    conn = get_db()
    c = conn.cursor()
    try:
        c.execute("DELETE FROM users WHERE id=?", (user_id,))
        conn.commit()
        return jsonify({"success": True})
    except:
        return jsonify({"error": "failed"}), 400
    finally:
        conn.close()
 
@app.route('/api/doctors-count')
def doctors_count():
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM medecins")
    count = c.fetchone()[0]
    conn.close()
    return jsonify({"count": count})
 
# =====================================================================


@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    if not data or 'email' not in data or 'new_password' not in data:
        return jsonify({"success": False, "error": "Données invalides"}), 400
 
    email = data['email']
    new_password = data['new_password']
 
    conn = get_db()
    c = conn.cursor()
    try:
        c.execute("UPDATE users SET password=? WHERE email=?", (new_password, email))
        if c.rowcount == 0:
            # لم يتم العثور على المستخدم في users، تحقق من medecins
            c.execute("UPDATE medecins SET password=? WHERE email=?", (new_password, email))
            if c.rowcount == 0:
                return jsonify({"success": False, "error": "Email non trouvé"}), 404
        conn.commit()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})
    finally:
        conn.close()
if __name__ == '__main__':
    host = os.getenv('FLASK_HOST', '0.0.0.0')
    port = int(os.getenv('FLASK_PORT', 5009))
    debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    app.run(host=host, port=port, debug=debug)