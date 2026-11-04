# HeartCare AI — Intelligent Cardiovascular Risk Prediction & CDSS

<p align="center">
  <strong>Predict • Prevent • Live Healthy</strong><br>
  A Full-Stack, AI-Powered Clinical Decision Support System (CDSS) for Early Heart Disease Risk Assessment, Patient Stratification, and Official Diagnostic Reporting.
</p>

---

## 📋 Table of Contents
1. [Overview](#-overview)
2. [Architecture & Technology Stack](#-architecture--technology-stack)
3. [User Views & Key Features](#-user-views--key-features)
4. [Database Schema & Stored Procedures](#-database-schema--stored-procedures)
5. [Quick Start & Launch Guide](#-quick-start--launch-guide)
6. [API Specifications](#-api-specifications)
7. [Default Clinician Credentials](#-default-clinician-credentials)

---

## 🌟 Overview

**HeartCare AI** is an end-to-end cardiovascular healthcare application designed to evaluate patient biometric and lifestyle indicators and predict coronary heart disease probability with high accuracy. Powered by a calibrated **Random Forest Machine Learning model** trained on large-scale epidemiological data (CDC BRFSS dataset with over 319,000 patient records), the system equips clinicians, cardiologists, and healthcare staff with instant risk stratification, pathophysiological driver identification, and official printable diagnostic medical reports.

---

## 🏗️ Architecture & Technology Stack

The platform is engineered as a decoupled, microservices-based full-stack solution:

```
[ React Modern Frontend (Port 5173) ]
                 │
                 │ HTTP / REST (/api/*)
                 ▼
[ Java Spring Boot CDSS Backend (Port 8080) ]
        │                                  │
        │ JDBC / JPA / Stored Procedures   │ REST (POST /api/predict)
        ▼                                  ▼
[ MySQL Database (Port 3306) ]    [ Python ML Microservice (Port 5000) ]
  • heart_disease_db                • Random Forest Pipeline (Joblib)
  • 3 Tables (users, reports, logs) • CDC BRFSS Trained (319,795 Cohorts)
  • 7 Stored Procedures             • Calibrated Probability Inference
```

### Technology Highlights:
- **Frontend**: React 19, Vite 8, pure CSS responsive flexbox/grid, CSS custom properties for dual **Light / Dark mode** themes.
- **Microservice / ML**: Python 3.12, Flask, Scikit-Learn (CalibratedClassifierCV + RandomForestClassifier), Joblib, SQLite3 failover.
- **Backend**: Java 25, Spring Boot 3/4, Spring Data JPA, Hibernate, MySQL Connector/J.
- **Database**: MySQL 8.0 / MariaDB with InnoDB engine, utf8mb4 encoding, foreign keys, stored procedures, and audit logging.
- **Security**: Salted SHA-256 password hashing with constant-time cryptographic validation.

---

## 🖥️ User Views & Key Features

### 1. Home Landing Page
- **Hero Banner**: Live SVG ECG cardiac wave animation, high-impact headline (*"Heart Disease Prediction using AI"*), explanatory subtitle, and direct CTAs (*"Start Prediction"* & *"Learn More"*).
- **Four Core Feature Cards**:
  1. **Early Detection**: Identify heart disease risk early and take preventive action.
  2. **Smart Prediction**: Powered by Random Forest Machine Learning.
  3. **Better Health**: Your heart health is our priority.
  4. **Trusted Technology**: Accurate, reliable, and validated clinical predictions.
- **Awareness Ticker**: Scrolling cardiac health message (*"A healthier tomorrow starts with awareness. Check your heart risk today!"*).

### 2. About Page
- **Project Hero**: *"HeartCare AI — Smart AI-Powered Heart Disease Prediction for a Healthier Tomorrow"*.
- **Three Pillar Cards**:
  - **Our Mission**: Leverage Artificial Intelligence for early detection of heart disease, promoting preventive healthcare and saving lives.
  - **Our Vision**: A healthier world where heart disease is detected early and prevented through advanced technology.
  - **Why Choose Us?**: AI-Powered Prediction, User-Friendly Interface, Secure & Reliable, Data-Driven Insights.
- **Technology Stack Showcase**: Interactive badges displaying the complete engineering stack: **React.js**, **Spring Boot**, **Python**, **MySQL**, and **Flask**.

### 3. Contact Us Page
- **Support Hero**: High-resolution medical backdrop with ECG cardiac lines.
- **Get in Touch Card**:
  - **Phone**: `+91 98765 43210` (Mon–Fri, 9 AM – 6 PM)
  - **Email**: `support@heartcareai.com`
  - **Location**: `Dindigul, Tamil Nadu` (PSNA College of Engineering and Technology)
- **Follow Us**: Direct social media links to LinkedIn, GitHub, YouTube, and X.
- **Send a Message Form**: Full contact form with live validation and interactive submission feedback banner.
- **Security Trust Strip**: Medical data confidentiality statement and staff access badge.

### 4. Authentication System
- **Clinician Sign In & Registration**:
  - Sign in with verified clinician email and password.
  - Registration fields: Full Name, Email, Password, Clinical Role (Cardiologist, General Physician, Doctor, Student, Public User), Hospital/Institution, Phone, and Medical License / Staff ID.
  - **One-Click Demo Fill**: Instantly populates and authenticates demo credentials for quick evaluation.
  - Salted SHA-256 verification and automatic user session persistence in localStorage.

### 5. Clinician Workstation & Risk Assessment
- **Dashboard Overview**: Aggregated KPI metrics (Total Screenings, High Risk Cases, Normal Cases, Average Risk Score).
- **Interactive BMI Calculator Modal**: Calculate exact BMI in realtime from height (cm) and weight (kg).
- **Clinical Intake Form**:
  - Demographics: Name, Date of Birth (with auto-computed age category), Phone, Blood Group, Biological Sex.
  - Vitals & Labs: BMI, Serum Cholesterol (Normal `< 200 mg/dL`, Borderline High `200-239 mg/dL`, High `≥ 240 mg/dL`), Sleep Duration.
  - Comorbidities & Lifestyle: Smoking status, Alcohol consumption, Stroke history, Diabetes, General health perception, Asthma.
- **Prediction Result & Official Report**:
  - Framingham 10-Year Cardiovascular Risk Score (0.0% – 100.0%).
  - 3-Tier Risk Classification: **Low Risk**, **Moderate Risk**, **High Risk**.
  - Identified Contributing Clinical Risk Factors breakdown.
  - Evidence-based personalized lifestyle & clinical recommendations.
  - **Print / Save PDF**: Formatted clinical layout with hospital header, demographics, vitals, and physician sign-off line.

---

## 🗄️ Database Schema & Stored Procedures

The database script [`database/heart_disease_db.sql`](file:///d:/Projects/Heart%20Disease/database/heart_disease_db.sql) provisions the `heart_disease_db` database with 3 tables and 7 stored procedures:

### Database Tables:
1. **`users`**: Clinician accounts, salted password hashes, roles, institutions, license numbers, and login timestamps.
2. **`patient_reports`**: Diagnostic assessments, patient demographics, vitals, lab values, and calibrated risk scores.
3. **`user_audit_logs`**: Comprehensive security audit trail recording logins, registrations, and administrative events.

### Stored Procedures:
| Stored Procedure | Type | Purpose |
|---|---|---|
| `sp_register_user` | `IN/OUT` | Validates email uniqueness, securely inserts clinician record, writes audit log, and returns HTTP status code (201 / 409). |
| `sp_authenticate_user` | `IN` | Fetches credential record, user salt, and activation status for password verification. |
| `sp_update_last_login` | `IN` | Updates timestamp upon successful login and logs authentication audit event. |
| `sp_get_user_by_id` | `IN` | Retrieves full clinician profile by unique identifier (`user_id`). |
| `sp_change_user_password` | `IN/OUT` | Updates password hash and salt with audit tracking. |
| `sp_get_dashboard_analytics`| `IN` | Aggregates real-time clinical statistics (total evaluations, risk tiers, average risk score). |
| `sp_save_patient_report` | `IN` | Inserts evaluated patient record, risk percentage, and clinical parameters into the reports archive. |

---

## 🚀 Quick Start & Launch Guide

### 1. Database Setup (MySQL)
Make sure your MySQL server is running (e.g. MySQL 8.0, XAMPP, or MariaDB). Then import the schema and stored procedures:
- **Option A (Automatic)**: Double-click [`import_database.bat`](file:///d:/Projects/Heart%20Disease/import_database.bat)
- **Option B (Command Line)**:
  ```bash
  mysql -u root -p < database/heart_disease_db.sql
  ```
- **Option C (Workbench / phpMyAdmin)**: Open and execute [`database/heart_disease_db.sql`](file:///d:/Projects/Heart%20Disease/database/heart_disease_db.sql).

### 2. Launching with Scripts (Recommended for Windows)
- **Launch Full Integrated Suite**:
  Double-click [`run_app.bat`](file:///d:/Projects/Heart%20Disease/run_app.bat)
  - Starts Python ML Microservice on `http://localhost:5000`
  - Starts Java Spring Boot Gateway on `http://localhost:8080`
  - Starts React Modern Medical Portal on `http://localhost:5173`

### 3. Manual Startup

#### Step A: Python ML Microservice
```powershell
python ml-service\app.py
```
> Server runs on `http://localhost:5000` (Healthcheck: `http://localhost:5000/api/health`)

#### Step B: Spring Boot CDSS Gateway (Optional)
```powershell
$env:JAVA_HOME="C:\Program Files\Java\jdk-25"
cd backend
mvn spring-boot:run
```
> Server runs on `http://localhost:8080`

#### Step C: React Frontend
```powershell
cd frontend
npm run dev
```
> Open your browser at `http://localhost:5173`

---

## 📡 API Specifications

| Method | Endpoint | Service | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Backend (8080) / ML (5000) | Authenticate clinician credentials with salted SHA-256 |
| `POST` | `/api/auth/register`| Backend (8080) / ML (5000) | Register new clinician via `sp_register_user` |
| `POST` | `/api/predict` | ML Service (5000) | Run Random Forest prediction and generate clinical report |
| `GET` | `/api/reports` | Backend (8080) / ML (5000) | Fetch recent patient evaluations with optional search |
| `GET` | `/api/stats` | ML Service (5000) | Retrieve aggregated clinician dashboard statistics |
| `GET` | `/api/health` | ML Service (5000) | Microservice status and loaded model confirmation |

---

## 🔑 Default Clinician Credentials

For immediate demonstration and testing:
- **Email**: `doctor@cardioguard.com`
- **Password**: `password123`
- **Name**: Dr. Alistair Reed, MD (Cardiologist)
- **One-Click Demo Button**: Available directly inside the login modal on the website.
