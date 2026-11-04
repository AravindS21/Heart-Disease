# CardioGuard AI - Heart Disease Prediction & Clinical Reporting Web Application

A full-stack, AI-powered cardiovascular risk assessment platform that collects patient demographic and lifestyle/clinical features, predicts coronary heart disease probability with a calibrated Machine Learning model (CDC BRFSS dataset indicators), and generates a comprehensive, printable medical report with personalized clinical recommendations.

---

## 🌟 Key Features

1. **Patient Demographic Intake**:
   - Patient Name, Date of Birth (with live age calculation & category auto-sync), Phone Number, and Blood Group (A+, A-, B+, B-, AB+, AB-, O+, O-).
2. **17 Clinical & Lifestyle Parameters (CDC BRFSS standard)**:
   - Body Mass Index (BMI) with interactive BMI calculator helper
   - Physical Health Days (0–30) & Mental Health Days (0–30)
   - Average Sleep Duration (hours/night)
   - Smoking status & Heavy Alcohol consumption
   - History of Cerebrovascular Accident (Stroke)
   - Difficulty Walking or climbing stairs
   - Gender, Age Category (13 age brackets), and Race
   - Diabetes status (No, Yes, Borderline, Gestational)
   - Physical Activity & Exercise adherence
   - General Health Perception (Excellent, Very good, Good, Fair, Poor)
   - Comorbidities: Asthma, Kidney Disease, Skin Cancer
3. **Machine Learning Predictive Engine**:
   - Calibrated Ensemble (Random Forest + Sigmoid calibration) trained on CDC BRFSS epidemiological parameters.
   - Outputs calibrated risk probability (0% - 100%) and 3-tier risk classification: **Low Risk**, **Moderate Risk**, **High Risk**.
4. **Comprehensive Medical Report Card**:
   - Clinical facility letterhead & unique Report ID (`REP-YYYYMMDD-XXXXXX`)
   - Verified patient demographics banner
   - Circular probability gauge and risk badge
   - Biomarkers and vitals summary grid
   - Pathophysiological risk drivers breakdown (Severity tags: High / Medium / Low)
   - Personalized clinical interventions and preventive cardiology action plan
   - Official Physician Sign-Off & Attestation area
   - **One-click "Print / Save PDF"** with optimized A4 clinical layout (hides non-essential UI)
5. **Patient History & Records Management**:
   - Stored in persistent database (SQLite / MySQL)
   - Search historical reports by patient name, phone, or Report ID
   - Reload and re-print previous patient reports with a single click
6. **One-Click Demo Profiles**:
   - `Healthy Young Adult`: Demonstrates normal parameters (~1% risk)
   - `Moderate Risk Middle-aged`: Demonstrates borderline factors (~25% risk)
   - `High Risk Senior`: Demonstrates multiple comorbidities (~65%+ risk)

---

## 🏗️ Project Architecture

```
Heart Disease/
├── frontend/               # React 19 + Vite 8 UI Dashboard
│   ├── src/
│   │   ├── App.jsx         # Clinical form, Report card & History modal
│   │   ├── App.css         # Healthcare UI styling & Print media queries
│   │   ├── index.css       # Global styles and typography
│   │   └── main.jsx
│   ├── vite.config.js      # Dev server with /api proxy to ML backend
│   └── package.json
│
├── ml-service/             # Python ML Prediction & Reporting Microservice
│   ├── app.py              # Flask REST API + SQLite persistence
│   ├── train_model.py      # ML pipeline training script
│   ├── heart_disease_model.joblib # Calibrated ML model artifact
│   └── heart_reports.db    # SQLite database for patient records
│
├── backend/                # Spring Boot 4 Enterprise Backend (Optional Java Gateway)
│   ├── src/main/java/backend/
│   │   ├── controller/     # HeartDiseaseController (/api/predict, /api/reports)
│   │   ├── service/        # HeartDiseaseService (ML delegation & fallback)
│   │   ├── entity/         # PatientReport JPA entity
│   │   ├── repository/     # Spring Data JPA Repository
│   │   └── dto/            # Request and Response DTOs
│   └── pom.xml
│
├── dataset/                # Generated CDC BRFSS Epidemiological Dataset
│   └── heart_2020_cleaned.csv
├── run_app.bat             # One-click Windows launch script
└── README.md
```

---

## 🚀 Getting Started

### Option 1: Quick Launch (Windows)
Double-click `run_app.bat` in the project root directory. It will start both the Python ML API service and the React frontend in separate terminal windows.

### Option 2: Manual Step-by-Step

#### Step 1: Start Python ML API Service
```powershell
# In terminal 1:
python ml-service\app.py
```
> Server runs on `http://localhost:5000` (Healthcheck: `http://localhost:5000/api/health`)

#### Step 2: Start React Frontend
```powershell
# In terminal 2:
cd frontend
npm run dev
```
> Open your browser at `http://localhost:5173`

---

## 📡 API Reference

### `POST /api/predict`
Accepts patient demographics and 17 clinical indicators, runs inference, saves the report, and returns:
- `reportId`: Unique alphanumeric ID
- `patient`: Demographic details
- `prediction`: `{ riskScore: float, riskLevel: string, summary: string }`
- `bmiDetails`: Calculated BMI category
- `contributingFactors`: Array of identified clinical risks
- `recommendations`: Custom lifestyle and medical action points

### `GET /api/reports`
Returns recent patient reports. Supports optional search parameter: `?search=<name_or_phone>`.

### `GET /api/reports/<report_id>`
Retrieves full saved report by its unique ID.

