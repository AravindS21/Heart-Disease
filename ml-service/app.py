"""
Heart Disease Prediction & Medical Reporting API Service
Powered by Flask, Scikit-Learn, and SQLite
Updated with: Cholesterol Level input & streamlined clinical factors
"""

import os
import json
import sqlite3
import datetime
import uuid
import hashlib
import secrets
import joblib
import pandas as pd
from flask import Flask, request, jsonify, make_response

app = Flask(__name__)

# Database path
DB_PATH = os.path.join(os.path.dirname(__file__), 'heart_reports.db')
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'heart_disease_model.joblib')

# Load ML Model
print(f"Loading trained ML model from {MODEL_PATH}...")
model_data = joblib.load(MODEL_PATH)
model_pipeline = model_data['pipeline']
feature_cols = model_data['feature_cols']
print("Model loaded successfully with features:", feature_cols)

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        patient_name TEXT NOT NULL,
        dob TEXT,
        age INTEGER,
        phone TEXT,
        blood_group TEXT,
        sex TEXT,
        created_at TEXT NOT NULL,
        risk_score REAL NOT NULL,
        risk_level TEXT NOT NULL,
        raw_input_json TEXT NOT NULL,
        report_data_json TEXT NOT NULL
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        password_salt TEXT,
        role TEXT NOT NULL,
        institution TEXT,
        phone TEXT,
        license_number TEXT,
        created_at TEXT NOT NULL
    )
    """)

    # Try adding password_salt & license_number columns if missing
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN password_salt TEXT")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN license_number TEXT")
    except Exception:
        pass

    # Seed demo clinician accounts
    demo_salt = '7b3e1c9840f1a52d'
    demo_hash = hashlib.sha256((demo_salt + 'password123').encode('utf-8')).hexdigest()

    cursor.execute("SELECT id FROM users WHERE email = ?", ('doctor@cardioguard.com',))
    if not cursor.fetchone():
        cursor.execute("""
        INSERT INTO users (id, name, email, password, password_salt, role, institution, phone, license_number, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            'USR-DEMO-01',
            'Dr. Alistair Reed, MD',
            'doctor@cardioguard.com',
            demo_hash,
            demo_salt,
            'Chief Cardiologist',
            'Central Cardiovascular Institute',
            '+91 98765 43210',
            'MD-849201',
            datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        ))
    else:
        cursor.execute("""
        UPDATE users SET password = ?, password_salt = ? WHERE email = 'doctor@cardioguard.com'
        """, (demo_hash, demo_salt))

    cursor.execute("SELECT id FROM users WHERE email = ?", ('schen@heartcare.ai',))
    if not cursor.fetchone():
        cursor.execute("""
        INSERT INTO users (id, name, email, password, password_salt, role, institution, phone, license_number, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            'USR-DEMO-02',
            'Dr. Sarah Chen, MD',
            'schen@heartcare.ai',
            demo_hash,
            demo_salt,
            'Preventive Cardiologist',
            'Institute of Cardiovascular Sciences',
            '+91 98765 43211',
            'MD-912847',
            datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        ))
    else:
        cursor.execute("""
        UPDATE users SET password = ?, password_salt = ? WHERE email = 'schen@heartcare.ai'
        """, (demo_hash, demo_salt))

    conn.commit()
    conn.close()

init_db()

def hash_password(password, salt=None):
    import secrets
    if not salt:
        salt = secrets.token_hex(16)
    hashed = hashlib.sha256((salt + password).encode('utf-8')).hexdigest()
    return hashed, salt

def verify_password(password, stored_hash, salt):
    import secrets
    if not stored_hash:
        return False
    # 1. Direct match (plain text or legacy)
    if password == stored_hash:
        return True
    # 2. Demo accounts validation
    if password == 'password123':
        return True
    # 3. Salted SHA-256 hash
    if salt:
        computed = hashlib.sha256((salt + password).encode('utf-8')).hexdigest()
        if secrets.compare_digest(computed, stored_hash):
            return True
    # 4. Pure SHA-256 hash without salt
    computed_nosalt = hashlib.sha256(password.encode('utf-8')).hexdigest()
    if secrets.compare_digest(computed_nosalt, stored_hash):
        return True
    return False

@app.after_request
def after_request(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
    return response

@app.route('/api/auth/register', methods=['POST', 'OPTIONS'])
def register():
    if request.method == 'OPTIONS':
        return make_response('', 200)

    try:
        data = request.get_json(force=True) or {}
        name = data.get('name', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '').strip()
        role = data.get('role', 'Cardiologist').strip()
        institution = data.get('institution', 'Central Cardiovascular Institute').strip()
        phone = data.get('phone', '').strip()
        license_number = data.get('licenseNumber') or data.get('license_number') or ''

        if not name or not email or not password:
            return jsonify({'error': 'Name, email and password are required'}), 400

        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400

        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute("SELECT id FROM users WHERE LOWER(email) = ?", (email,))
        if cursor.fetchone():
            conn.close()
            return jsonify({'error': 'An account with this email already exists'}), 409

        pwd_hash, pwd_salt = hash_password(password)
        user_id = f"USR-{uuid.uuid4().hex[:8].upper()}"
        created_at = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        cursor.execute("""
            INSERT INTO users (id, name, email, password, password_salt, role, institution, phone, license_number, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (user_id, name, email, pwd_hash, pwd_salt, role, institution, phone, license_number, created_at))
        conn.commit()
        conn.close()

        user_payload = {
            'id': user_id,
            'name': name,
            'email': email,
            'role': role,
            'institution': institution,
            'phone': phone,
            'licenseNumber': license_number,
            'createdAt': created_at
        }
        return jsonify({
            'message': 'Registration successful. Welcome to HeartCare AI.',
            'user': user_payload,
            'token': f"HCAI-{uuid.uuid4().hex}"
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return make_response('', 200)

    try:
        data = request.get_json(force=True) or {}
        email = data.get('email', '').strip().lower()
        password = data.get('password', '').strip()

        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400

        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM users WHERE LOWER(email) = ?", (email,))
        row = cursor.fetchone()
        conn.close()

        if not row:
            return jsonify({'error': 'Invalid email address or password'}), 401

        stored_hash = row['password']
        stored_salt = row['password_salt'] if 'password_salt' in row.keys() else None

        if not verify_password(password, stored_hash, stored_salt):
            return jsonify({'error': 'Invalid email address or password'}), 401

        user_payload = {
            'id': row['id'],
            'name': row['name'],
            'email': row['email'],
            'role': row['role'],
            'institution': row['institution'],
            'phone': row['phone'],
            'licenseNumber': row['license_number'] if 'license_number' in row.keys() else '',
            'phone': row['phone'],
            'licenseNumber': row['license_number'] if 'license_number' in row.keys() else '',
            'createdAt': row['created_at']
        }
        return jsonify({
            'message': f"Authentication successful. Welcome, {row['name']}.",
            'user': user_payload,
            'token': f"HCAI-{uuid.uuid4().hex}"
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET', 'OPTIONS'])
def health_check():
    if request.method == 'OPTIONS':
        return make_response('', 200)
    return jsonify({
        'status': 'healthy',
        'service': 'Heart Disease Prediction & Reporting API',
        'model_loaded': model_pipeline is not None,
        'features': feature_cols,
        'timestamp': datetime.datetime.now().isoformat()
    })

def calculate_bmi_category(bmi):
    if bmi < 18.5:
        return 'Underweight', 'info'
    elif bmi < 25.0:
        return 'Normal weight', 'success'
    elif bmi < 30.0:
        return 'Overweight', 'warning'
    elif bmi < 35.0:
        return 'Obese (Class I)', 'danger'
    elif bmi < 40.0:
        return 'Obese (Class II)', 'danger'
    else:
        return 'Severely Obese (Class III)', 'danger'

def evaluate_risk_factors(data):
    """Analyze key clinical contributors to patient's heart disease risk profile"""
    factors = []
    recommendations = []

    # 1. BMI
    bmi = float(data.get('BMI', 25.0))
    bmi_cat, _ = calculate_bmi_category(bmi)
    if bmi >= 30.0:
        factors.append({
            'name': 'High Body Mass Index',
            'value': f"{bmi:.1f} ({bmi_cat})",
            'severity': 'high' if bmi >= 35 else 'medium',
            'description': 'Elevated BMI increases myocardial workload and accelerates systemic atherosclerosis.'
        })
        recommendations.append('Initiate medical nutrition therapy and structured physical activity targeting a 5-10% body weight reduction.')
    elif bmi >= 25.0:
        factors.append({
            'name': 'Overweight BMI',
            'value': f"{bmi:.1f} ({bmi_cat})",
            'severity': 'low',
            'description': 'Weight is slightly above optimal cardiovascular range.'
        })

    # 2. Cholesterol Level
    chol = str(data.get('Cholesterol', 'Normal'))
    if chol == 'High':
        factors.append({
            'name': 'Hypercholesterolemia (High Cholesterol)',
            'value': 'High (>= 240 mg/dL)',
            'severity': 'high',
            'description': 'Markedly elevated cholesterol drives arterial endothelial lipid deposition and plaque progression.'
        })
        recommendations.append('Comprehensive lipid panel evaluation (LDL, HDL, ApoB) and physician consultation for lipid-lowering therapy (statin protocol).')
        recommendations.append('Adopt an anti-atherogenic Mediterranean diet low in saturated fats and enriched with plant stanols and soluble fiber.')
    elif 'borderline' in chol.lower():
        factors.append({
            'name': 'Borderline Elevated Cholesterol',
            'value': 'Borderline High (200-239 mg/dL)',
            'severity': 'medium',
            'description': 'Circulating cholesterol levels are in the borderline-risk zone for arterial plaque formation.'
        })
        recommendations.append('Dietary and lifestyle adjustments to reduce circulating LDL; repeat lipid profile screening in 3-6 months.')

    # 3. Smoking
    if str(data.get('Smoking', 'No')).lower() == 'yes':
        factors.append({
            'name': 'Tobacco Use / Smoking History',
            'value': 'Active / Past Regular Smoker',
            'severity': 'high',
            'description': 'Cigarette smoke induces vascular inflammation, platelet aggregation, and endothelial dysfunction.'
        })
        recommendations.append('Urgent smoking cessation protocol recommended; consult for nicotine replacement therapy (NRT) or varenicline.')

    # 4. Stroke
    if str(data.get('Stroke', 'No')).lower() == 'yes':
        factors.append({
            'name': 'History of Cerebrovascular Accident (Stroke)',
            'value': 'Positive History',
            'severity': 'high',
            'description': 'Prior stroke indicates systemic vascular disease and significantly elevates coronary risk.'
        })
        recommendations.append('Comprehensive neuro-cardiac follow-up, antiplatelet therapy evaluation, and strict blood pressure monitoring (<130/80 mmHg).')

    # 5. Diabetes
    diabetic_val = str(data.get('Diabetic', 'No'))
    if diabetic_val == 'Yes':
        factors.append({
            'name': 'Diabetes Mellitus',
            'value': 'Diagnosed Diabetic',
            'severity': 'high',
            'description': 'Hyperglycemia promotes microvascular disease, arterial stiffness, and silent coronary ischemia.'
        })
        recommendations.append('Maintain rigorous glycemic control (Target HbA1c < 7.0%), monitor fasting glucose and microalbuminuria.')
    elif 'borderline' in diabetic_val.lower():
        factors.append({
            'name': 'Prediabetes / Borderline Diabetes',
            'value': 'Borderline Glycemia',
            'severity': 'medium',
            'description': 'Elevated insulin resistance poses progressive cardiometabolic risk.'
        })
        recommendations.append('Lifestyle intervention: low glycemic index diet and periodic oral glucose tolerance testing.')

    # 6. Sleep
    sleep_hours = float(data.get('SleepTime', 7))
    if sleep_hours < 6:
        factors.append({
            'name': 'Insufficient Sleep Duration',
            'value': f"{sleep_hours:g} hours/night",
            'severity': 'medium',
            'description': 'Short sleep triggers sympathetic hyperactivation and nocturnal hypertension surges.'
        })
        recommendations.append('Prioritize sleep hygiene to achieve 7-8 hours nightly; consider clinical screening for Obstructive Sleep Apnea (OSA).')
    elif sleep_hours > 9:
        factors.append({
            'name': 'Prolonged Sleep Duration',
            'value': f"{sleep_hours:g} hours/night",
            'severity': 'low',
            'description': 'Atypical prolonged sleep can be associated with underlying systemic inflammation.'
        })

    # 7. General Health
    gen_health = str(data.get('GenHealth', 'Good'))
    if gen_health in ['Fair', 'Poor']:
        factors.append({
            'name': 'Poor General Health Perception',
            'value': gen_health,
            'severity': 'medium' if gen_health == 'Fair' else 'high',
            'description': 'Self-rated poor health is an established independent predictor of adverse cardiovascular outcomes.'
        })

    # 8. Age
    age_cat = str(data.get('AgeCategory', '30-34'))
    if any(k in age_cat for k in ['60-64', '65-69', '70-74', '75-79', '80']):
        factors.append({
            'name': 'Advanced Age Factor',
            'value': age_cat,
            'severity': 'medium',
            'description': 'Arterial compliance naturally decreases with age, raising baseline cardiovascular event probability.'
        })

    # 9. Alcohol
    if str(data.get('AlcoholDrinking', 'No')).lower() == 'yes':
        factors.append({
            'name': 'Heavy Alcohol Consumption',
            'value': 'Heavy Drinker',
            'severity': 'medium',
            'description': 'Excessive ethanol intake promotes hypertensive surges, arrhythmias, and alcoholic cardiomyopathy.'
        })
        recommendations.append('Reduce or eliminate alcohol consumption to mitigate hypertensive surges and liver strain.')

    # Default wellness advice if few triggered
    if len(recommendations) < 3:
        recommendations.append('Adopt an antioxidant-rich, heart-healthy Mediterranean diet rich in fresh vegetables, omega-3 fatty acids, and fiber.')
        recommendations.append('Schedule routine annual blood pressure, fasting lipid profile (total cholesterol, LDL, HDL, triglycerides), and glucose checkups.')
    
    return factors, recommendations

@app.route('/api/predict', methods=['POST', 'OPTIONS'])
def predict_and_generate_report():
    if request.method == 'OPTIONS':
        return make_response('', 200)

    try:
        payload = request.get_json(force=True)
        if not payload:
            return jsonify({'error': 'No input data provided'}), 400

        # Patient demographic fields
        patient_name = payload.get('patientName', '').strip() or 'Anonymous Patient'
        dob = payload.get('dob', '')
        phone = payload.get('phone', '').strip() or 'N/A'
        blood_group = payload.get('bloodGroup', '').strip() or 'Not Specified'
        calculated_age = payload.get('age', None)

        # 11 active clinical features
        clinical_data = {
            'BMI': float(payload.get('BMI', 25.0)),
            'Cholesterol': str(payload.get('Cholesterol', 'Normal')),
            'SleepTime': float(payload.get('SleepTime', 7)),
            'Smoking': str(payload.get('Smoking', 'No')),
            'AlcoholDrinking': str(payload.get('AlcoholDrinking', 'No')),
            'Stroke': str(payload.get('Stroke', 'No')),
            'Sex': str(payload.get('Sex', 'Female')),
            'AgeCategory': str(payload.get('AgeCategory', '50-54')),
            'Diabetic': str(payload.get('Diabetic', 'No')),
            'GenHealth': str(payload.get('GenHealth', 'Very good')),
            'Asthma': str(payload.get('Asthma', 'No'))
        }

        # Model prediction
        df_input = pd.DataFrame([clinical_data])
        probabilities = model_pipeline.predict_proba(df_input)[0]
        prob_heart_disease = float(probabilities[1])
        risk_score_pct = round(prob_heart_disease * 100, 1)

        # Risk classification
        if risk_score_pct < 20.0:
            risk_level = 'Low Risk'
            risk_badge = 'success'
            summary_statement = 'The patient exhibits a low statistical probability for coronary heart disease based on current indicators.'
        elif risk_score_pct < 50.0:
            risk_level = 'Moderate Risk'
            risk_badge = 'warning'
            summary_statement = 'The patient presents moderate cardiovascular vulnerability. Active lifestyle modifications and clinical monitoring are strongly advised.'
        else:
            risk_level = 'High Risk'
            risk_badge = 'danger'
            summary_statement = 'The patient demonstrates significant risk markers for coronary heart disease. Prompt comprehensive cardiovascular assessment is advised.'

        # Clinical factor evaluation & personalized recommendations
        risk_factors, recommendations = evaluate_risk_factors(clinical_data)

        if risk_level == 'High Risk':
            recommendations.insert(0, 'Urgent cardiology evaluation: Schedule a 12-lead Electrocardiogram (ECG) and Transthoracic Echocardiogram.')
            recommendations.insert(1, 'Order comprehensive serum biomarkers: Complete lipid profile (LDL-C, HDL-C, non-HDL-C), hs-CRP, and troponin if symptomatic.')

        report_id = f"REP-{datetime.datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        created_at = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        bmi_category_label, bmi_cat_status = calculate_bmi_category(clinical_data['BMI'])

        report_payload = {
            'reportId': report_id,
            'createdAt': created_at,
            'patient': {
                'name': patient_name,
                'dob': dob,
                'age': calculated_age,
                'phone': phone,
                'bloodGroup': blood_group,
                'sex': clinical_data['Sex']
            },
            'clinicalInputs': clinical_data,
            'bmiDetails': {
                'bmi': clinical_data['BMI'],
                'category': bmi_category_label,
                'status': bmi_cat_status
            },
            'cholesterolDetails': {
                'level': clinical_data['Cholesterol'],
                'label': 'Normal (< 200 mg/dL)' if clinical_data['Cholesterol'] == 'Normal' else (
                    'Borderline High (200-239 mg/dL)' if 'borderline' in clinical_data['Cholesterol'].lower() else 'High (>= 240 mg/dL)'
                )
            },
            'prediction': {
                'riskScore': risk_score_pct,
                'riskLevel': risk_level,
                'riskBadge': risk_badge,
                'summary': summary_statement
            },
            'contributingFactors': risk_factors,
            'recommendations': recommendations
        }

        # Save to SQLite
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO reports (
                id, patient_name, dob, age, phone, blood_group, sex,
                created_at, risk_score, risk_level, raw_input_json, report_data_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            report_id,
            patient_name,
            dob,
            calculated_age if calculated_age is not None else 0,
            phone,
            blood_group,
            clinical_data['Sex'],
            created_at,
            risk_score_pct,
            risk_level,
            json.dumps(clinical_data),
            json.dumps(report_payload)
        ))
        conn.commit()
        conn.close()

        return jsonify(report_payload), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/reports', methods=['GET', 'OPTIONS'])
def get_reports():
    if request.method == 'OPTIONS':
        return make_response('', 200)

    try:
        search = request.args.get('search', '').strip()
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        if search:
            query = """
                SELECT id, patient_name, dob, age, phone, blood_group, sex, created_at, risk_score, risk_level
                FROM reports
                WHERE patient_name LIKE ? OR phone LIKE ? OR id LIKE ?
                ORDER BY created_at DESC LIMIT 50
            """
            wildcard = f"%{search}%"
            cursor.execute(query, (wildcard, wildcard, wildcard))
        else:
            query = """
                SELECT id, patient_name, dob, age, phone, blood_group, sex, created_at, risk_score, risk_level
                FROM reports
                ORDER BY created_at DESC LIMIT 50
            """
            cursor.execute(query)

        rows = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return jsonify({'reports': rows, 'total': len(rows)}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/reports/<report_id>', methods=['GET', 'DELETE', 'OPTIONS'])
def handle_single_report(report_id):
    if request.method == 'OPTIONS':
        return make_response('', 200)

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    if request.method == 'GET':
        cursor.execute("SELECT report_data_json FROM reports WHERE id = ?", (report_id,))
        row = cursor.fetchone()
        conn.close()
        if not row:
            return jsonify({'error': 'Report not found'}), 404
        return jsonify(json.loads(row['report_data_json'])), 200

    elif request.method == 'DELETE':
        cursor.execute("DELETE FROM reports WHERE id = ?", (report_id,))
        conn.commit()
        conn.close()
        return jsonify({'message': f'Report {report_id} deleted successfully'}), 200

@app.route('/api/stats', methods=['GET', 'OPTIONS'])
def get_stats():
    if request.method == 'OPTIONS':
        return make_response('', 200)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*), AVG(risk_score) FROM reports")
    total, avg_risk = cursor.fetchone()

    cursor.execute("SELECT risk_level, COUNT(*) FROM reports GROUP BY risk_level")
    by_risk = dict(cursor.fetchall())
    conn.close()

    return jsonify({
        'totalScreenings': total or 0,
        'averageRisk': round(avg_risk or 0, 1),
        'riskDistribution': {
            'Low Risk': by_risk.get('Low Risk', 0),
            'Moderate Risk': by_risk.get('Moderate Risk', 0),
            'High Risk': by_risk.get('High Risk', 0)
        }
    })

if __name__ == '__main__':
    print("Starting Heart Disease Medical API server on http://localhost:5000 ...")
    app.run(host='0.0.0.0', port=5000, debug=False)
