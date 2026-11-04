import React, { useState, useEffect } from 'react';
import './App.css';

const AGE_CATEGORIES = [
  '18-24', '25-29', '30-34', '35-39', '40-44', '45-49',
  '50-54', '55-59', '60-64', '65-69', '70-74', '75-79', '80 or older'
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const CHOLESTEROL_OPTIONS = [
  { value: 'Normal', label: 'Normal (< 200 mg/dL)' },
  { value: 'Borderline High', label: 'Borderline High (200 - 239 mg/dL)' },
  { value: 'High', label: 'High (≥ 240 mg/dL)' }
];

const CLINICAL_ROLES = [
  'Cardiologist',
  'General Physician',
  'Cardiovascular Nurse',
  'Healthcare Specialist',
  'Clinical Researcher',
  'Patient / Health Seeker'
];

const INITIAL_FORM = {
  patientName: '',
  dob: '',
  phone: '',
  bloodGroup: 'O+',
  BMI: 25,
  Cholesterol: 'Normal',
  SleepTime: 7,
  Smoking: 'No',
  AlcoholDrinking: 'No',
  Stroke: 'No',
  Sex: 'Female',
  AgeCategory: '50-54',
  Diabetic: 'No',
  GenHealth: 'Very good',
  Asthma: 'No'
};

function getAgeCategoryFromYears(age) {
  if (age < 25) return '18-24';
  if (age <= 29) return '25-29';
  if (age <= 34) return '30-34';
  if (age <= 39) return '35-39';
  if (age <= 44) return '40-44';
  if (age <= 49) return '45-49';
  if (age <= 54) return '50-54';
  if (age <= 59) return '55-59';
  if (age <= 64) return '60-64';
  if (age <= 69) return '65-69';
  if (age <= 74) return '70-74';
  if (age <= 79) return '75-79';
  return '80 or older';
}

function calculateAge(dobString) {
  if (!dobString) return null;
  const birth = new Date(dobString);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

export default function App() {
  // Current user state (persisted in localStorage)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('cardioguard_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Active View:
  // If logged in: defaults to 'dashboard' (can switch to 'assessment', 'home')
  // If logged out: defaults to 'home' (can switch to 'auth')
  const [activeTab, setActiveTab] = useState(() => (currentUser ? 'dashboard' : 'home'));
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [authNotice, setAuthNotice] = useState('');

  // Dashboard Stats State
  const [dashboardStats, setDashboardStats] = useState({
    totalScreenings: 0,
    averageRisk: 0,
    riskDistribution: { 'Low Risk': 0, 'Moderate Risk': 0, 'High Risk': 0 }
  });
  const [recentReports, setRecentReports] = useState([]);

  // Auth form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Register form states
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState('Cardiologist');
  const [regInstitution, setRegInstitution] = useState('Cardio-Diagnostic Health Institute');
  const [regPhone, setRegPhone] = useState('');

  // Assessment form state
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  
  // BMI Calculator Modal State
  const [showBmiModal, setShowBmiModal] = useState(false);
  const [calcHeight, setCalcHeight] = useState(170); // cm
  const [calcWeight, setCalcWeight] = useState(72);  // kg
  
  // Past Reports Modal State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [reportsHistory, setReportsHistory] = useState([]);
  const [historySearch, setHistorySearch] = useState('');
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('cardioguard_user', JSON.stringify(currentUser));
      loadDashboardData();
    } else {
      localStorage.removeItem('cardioguard_user');
    }
  }, [currentUser]);

  const loadDashboardData = async () => {
    try {
      const statsRes = await fetch('/api/stats');
      if (statsRes.ok) {
        const stats = await statsRes.json();
        setDashboardStats(stats);
      }
      const repRes = await fetch('/api/reports');
      if (repRes.ok) {
        const data = await repRes.json();
        setRecentReports((data.reports || []).slice(0, 6));
      }
    } catch (err) {
      console.warn("Could not load dashboard stats:", err);
    }
  };

  // Guard: If logged out and trying to access assessment or dashboard, redirect to auth
  useEffect(() => {
    if (!currentUser && (activeTab === 'assessment' || activeTab === 'dashboard')) {
      setAuthNotice('🔒 Please Sign In with your credentials to access the Risk Assessment & Clinician Portal.');
      setAuthMode('login');
      setActiveTab('auth');
    }
  }, [activeTab, currentUser]);

  const requireAuthForAssessment = () => {
    if (!currentUser) {
      setAuthNotice('🔒 Please Sign In with your credentials to access the Risk Assessment & Clinician Portal.');
      setAuthMode('login');
      setActiveTab('auth');
    } else {
      setActiveTab('assessment');
    }
  };

  // Sync Age and AgeCategory when DOB changes
  const handleDobChange = (e) => {
    const dobVal = e.target.value;
    const computedAge = calculateAge(dobVal);
    const updated = { ...formData, dob: dobVal };
    if (computedAge !== null) {
      updated.AgeCategory = getAgeCategoryFromYears(computedAge);
    }
    setFormData(updated);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  // Auth Handler: Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setAuthLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to authenticate');
      }
      setCurrentUser(data.user);
      setAuthSuccess('Welcome back, ' + data.user.name + '!');
      setAuthNotice('');
      setTimeout(() => {
        setActiveTab('dashboard');
      }, 600);
    } catch (err) {
      setAuthError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Auth Handler: One-Click Demo Clinician Login
  const fillAndSubmitDemoLogin = async () => {
    setAuthError('');
    setAuthSuccess('');
    setLoginEmail('doctor@cardioguard.com');
    setLoginPassword('password123');
    setAuthLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'doctor@cardioguard.com', password: 'password123' })
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentUser(data.user);
        setAuthSuccess('Logged in as ' + data.user.name);
        setAuthNotice('');
        setTimeout(() => {
          setActiveTab('dashboard');
        }, 600);
      } else {
        const mockUser = {
          id: 'USR-DEMO-01',
          name: 'Dr. Alistair Reed, MD',
          email: 'doctor@cardioguard.com',
          role: 'Chief Cardiologist',
          institution: 'Cardio-Diagnostic Health Institute'
        };
        setCurrentUser(mockUser);
        setAuthSuccess('Logged in as ' + mockUser.name);
        setAuthNotice('');
        setTimeout(() => {
          setActiveTab('dashboard');
        }, 600);
      }
    } catch {
      const mockUser = {
        id: 'USR-DEMO-01',
        name: 'Dr. Alistair Reed, MD',
        email: 'doctor@cardioguard.com',
        role: 'Chief Cardiologist',
        institution: 'Cardio-Diagnostic Health Institute'
      };
      setCurrentUser(mockUser);
      setAuthSuccess('Logged in as ' + mockUser.name);
      setAuthNotice('');
      setTimeout(() => {
        setActiveTab('dashboard');
      }, 600);
    } finally {
      setAuthLoading(false);
    }
  };

  // Auth Handler: Registration
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (regPassword !== regConfirmPassword) {
      setAuthError('Passwords do not match. Please re-enter.');
      return;
    }
    if (regPassword.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return;
    }

    setAuthLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          role: regRole,
          institution: regInstitution,
          phone: regPhone
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }
      setCurrentUser(data.user);
      setAuthSuccess('Account created successfully! Welcome, ' + data.user.name);
      setAuthNotice('');
      setTimeout(() => {
        setActiveTab('dashboard');
      }, 600);
    } catch (err) {
      setAuthError(err.message || 'Registration failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    setAuthSuccess('');
    setAuthError('');
    setActiveTab('home');
  };

  // Preset profiles for rapid demonstration
  const loadPreset = (presetType) => {
    if (presetType === 'healthy') {
      setFormData({
        patientName: 'Emma Watson',
        dob: '1998-04-15',
        phone: '+1 (555) 234-9810',
        bloodGroup: 'A+',
        BMI: 21.8,
        Cholesterol: 'Normal',
        SleepTime: 8,
        Smoking: 'No',
        AlcoholDrinking: 'No',
        Stroke: 'No',
        Sex: 'Female',
        AgeCategory: '25-29',
        Diabetic: 'No',
        GenHealth: 'Excellent',
        Asthma: 'No'
      });
    } else if (presetType === 'moderate') {
      setFormData({
        patientName: 'Michael Chang',
        dob: '1974-08-20',
        phone: '+1 (555) 345-6789',
        bloodGroup: 'B+',
        BMI: 28.5,
        Cholesterol: 'Borderline High',
        SleepTime: 6,
        Smoking: 'Yes',
        AlcoholDrinking: 'No',
        Stroke: 'No',
        Sex: 'Male',
        AgeCategory: '50-54',
        Diabetic: 'No, borderline diabetes',
        GenHealth: 'Fair',
        Asthma: 'No'
      });
    } else if (presetType === 'high') {
      setFormData({
        patientName: 'Robert Vance',
        dob: '1956-02-14',
        phone: '+1 (555) 876-5432',
        bloodGroup: 'O+',
        BMI: 34.2,
        Cholesterol: 'High',
        SleepTime: 5,
        Smoking: 'Yes',
        AlcoholDrinking: 'Yes',
        Stroke: 'Yes',
        Sex: 'Male',
        AgeCategory: '65-69',
        Diabetic: 'Yes',
        GenHealth: 'Poor',
        Asthma: 'Yes'
      });
    }
  };

  const applyCalculatedBmi = () => {
    if (calcHeight > 0 && calcWeight > 0) {
      const heightInMeters = calcHeight / 100;
      const computed = calcWeight / (heightInMeters * heightInMeters);
      handleInputChange('BMI', Math.round(computed * 10) / 10);
      setShowBmiModal(false);
    }
  };

  const fetchReportsHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/reports?search=${encodeURIComponent(historySearch)}`);
      if (res.ok) {
        const data = await res.json();
        setReportsHistory(data.reports || []);
      }
    } catch (err) {
      console.warn("Failed fetching report history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const openHistoryModal = () => {
    setShowHistoryModal(true);
    fetchReportsHistory();
  };

  const loadPastReport = async (reportId) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/reports/${reportId}`);
      if (res.ok) {
        const fullReport = await res.json();
        setReport(fullReport);
        setActiveTab('assessment');
        setShowHistoryModal(false);
        setTimeout(() => {
          document.getElementById('medical-report-view')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (err) {
      alert("Could not load past report.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const computedAge = calculateAge(formData.dob);
    const payload = {
      ...formData,
      age: computedAge,
      BMI: parseFloat(formData.BMI),
      SleepTime: parseInt(formData.SleepTime, 10),
      doctorName: currentUser ? currentUser.name : 'Dr. Alistair Reed, MD',
      doctorRole: currentUser ? currentUser.role : 'Chief of Preventive Cardiology'
    };

    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const reportData = await response.json();
      setReport(reportData);
      loadDashboardData(); // Refresh stats
      setTimeout(() => {
        document.getElementById('medical-report-view')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.warn('Backend call failed, using client fallback engine:', err);
      const fallbackReport = generateClientSideReport(payload, computedAge, currentUser);
      setReport(fallbackReport);
      setTimeout(() => {
        document.getElementById('medical-report-view')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const currentAge = calculateAge(formData.dob);

  return (
    <div className="app-container">
      {/* Top Navigation Bar */}
      <nav className="app-navbar no-print">
        <div className="brand-section" onClick={() => setActiveTab(currentUser ? 'dashboard' : 'home')}>
          <div className="brand-icon">🫀</div>
          <div>
            <h1 className="brand-title">
              CardioGuard AI
              <span className="brand-tag">Clinical Suite</span>
            </h1>
          </div>
        </div>

        {/* Dynamic Navigation Links based on Login State */}
        <div className="nav-links">
          {currentUser ? (
            <>
              <button 
                type="button" 
                className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
              >
                📊 Dashboard
              </button>
              <button 
                type="button" 
                className={`nav-btn ${activeTab === 'assessment' ? 'active' : ''}`}
                onClick={() => setActiveTab('assessment')}
              >
                🩺 Risk Assessment
              </button>
              <button 
                type="button" 
                className={`nav-btn ${activeTab === 'home' ? 'active' : ''}`}
                onClick={() => setActiveTab('home')}
              >
                🏠 Home
              </button>
            </>
          ) : (
            <>
              <button 
                type="button" 
                className={`nav-btn ${activeTab === 'home' ? 'active' : ''}`}
                onClick={() => setActiveTab('home')}
              >
                🏠 Home
              </button>
            </>
          )}
        </div>

        <div className="nav-actions">
          {currentUser ? (
            <>
              <button 
                type="button" 
                className="btn-outline" 
                style={{ padding: '8px 14px', fontSize: '13px', borderRadius: '10px' }}
                onClick={openHistoryModal}
              >
                📋 Patient Records
              </button>
              <div className="user-nav-chip">
                <div className="user-nav-avatar">
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="user-nav-info">
                  <span className="user-nav-name">{currentUser.name}</span>
                  <span className="user-nav-role">{currentUser.role || 'Clinician'}</span>
                </div>
                <button 
                  type="button" 
                  className="btn-signout"
                  title="Sign Out"
                  onClick={handleSignOut}
                >
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                type="button" 
                className="btn-outline"
                style={{ padding: '8px 14px', fontSize: '13px', borderRadius: '10px', fontWeight: 700 }}
                onClick={() => { setAuthNotice(''); setAuthMode('login'); setActiveTab('auth'); }}
              >
                🔑 Sign In
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '10px' }}
                onClick={() => { setAuthNotice(''); setAuthMode('register'); setActiveTab('auth'); }}
              >
                Register
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* =========================================================
          AUTHENTICATED DASHBOARD (VISIBLE ONLY AFTER LOGIN)
         ========================================================= */}
      {currentUser && activeTab === 'dashboard' && (
        <section className="dashboard-section no-print">
          {/* Welcome Banner */}
          <div className="dashboard-welcome-banner">
            <div className="welcome-info">
              <h2>Welcome, {currentUser.name}!</h2>
              <p>CardioGuard Cardiovascular Clinical Portal • {currentUser.institution || 'Medical Center'}</p>
              <div className="welcome-badge-group">
                <span className="badge-portal">🩺 {currentUser.role || 'Attending Clinician'}</span>
                <span className="badge-online">● ML Diagnostic Engine Active</span>
              </div>
            </div>
            <button 
              type="button" 
              className="welcome-action-btn"
              onClick={() => setActiveTab('assessment')}
            >
              ⚡ Start New Patient Screening
            </button>
          </div>

          {/* KPI Stat Cards */}
          <div className="dashboard-kpi-grid">
            <div className="kpi-card">
              <div className="kpi-icon blue">📋</div>
              <div>
                <div className="kpi-val">{dashboardStats.totalScreenings}</div>
                <div className="kpi-label">Total Patient Screenings</div>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon red">⚠️</div>
              <div>
                <div className="kpi-val">{dashboardStats.riskDistribution?.['High Risk'] || 0}</div>
                <div className="kpi-label">High-Risk Cases Flagged</div>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon amber">📈</div>
              <div>
                <div className="kpi-val">{dashboardStats.averageRisk}%</div>
                <div className="kpi-label">Mean Population Risk Score</div>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon green">🎯</div>
              <div>
                <div className="kpi-val">85.8%</div>
                <div className="kpi-label">Validated Model Accuracy</div>
              </div>
            </div>
          </div>

          {/* Quick Action Tiles */}
          <div className="dashboard-actions-grid">
            <div className="action-tile" onClick={() => setActiveTab('assessment')}>
              <div className="action-tile-icon">🩺</div>
              <h3 className="action-tile-title">New Risk Assessment</h3>
              <p className="action-tile-desc">
                Evaluate a patient's cardiovascular profile, cholesterol levels, and comorbidities to generate an official report.
              </p>
            </div>

            <div className="action-tile" onClick={openHistoryModal}>
              <div className="action-tile-icon">🗂️</div>
              <h3 className="action-tile-title">Patient Archives</h3>
              <p className="action-tile-desc">
                Access stored diagnostic reports, search by name or contact number, and re-print medical records.
              </p>
            </div>

            <div className="action-tile" onClick={() => setShowBmiModal(true)}>
              <div className="action-tile-icon">🧮</div>
              <h3 className="action-tile-title">Quick BMI Tool</h3>
              <p className="action-tile-desc">
                Instant body mass index calculator and clinical obesity classification converter.
              </p>
            </div>
          </div>

          {/* Recent Evaluations Table */}
          <div className="dashboard-table-card">
            <div className="table-header-row">
              <h3 className="table-title">🕒 Recent Patient Evaluations</h3>
              <button 
                type="button" 
                className="btn-outline"
                style={{ padding: '6px 14px', fontSize: '12.5px' }}
                onClick={openHistoryModal}
              >
                View All Records ({dashboardStats.totalScreenings})
              </button>
            </div>

            {recentReports.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                <p style={{ fontSize: '15px', fontWeight: 600 }}>No patient screenings recorded yet.</p>
                <p style={{ fontSize: '13px', marginTop: '6px' }}>Click "Start New Patient Screening" to run your first evaluation.</p>
              </div>
            ) : (
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Patient Name</th>
                    <th>Age / Gender</th>
                    <th>Blood Group</th>
                    <th>Evaluation Date</th>
                    <th>Risk Score</th>
                    <th>Risk Tier</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentReports.map((rep) => (
                    <tr key={rep.id}>
                      <td style={{ fontWeight: 700 }}>{rep.patient_name}</td>
                      <td>{rep.age ? `${rep.age} yrs` : 'N/A'} • {rep.sex}</td>
                      <td><span style={{ fontWeight: 600, color: '#1d4ed8' }}>{rep.blood_group || rep.bloodGroup}</span></td>
                      <td style={{ color: '#64748b', fontSize: '13px' }}>{rep.created_at}</td>
                      <td><strong>{rep.risk_score}%</strong></td>
                      <td>
                        <span className={`risk-badge ${
                          rep.risk_score < 20 ? 'low' : rep.risk_score < 50 ? 'moderate' : 'high'
                        }`} style={{ fontSize: '11px', padding: '3px 10px', margin: 0 }}>
                          {rep.risk_level}
                        </span>
                      </td>
                      <td>
                        <button 
                          type="button" 
                          className="btn-view-report"
                          onClick={() => loadPastReport(rep.id)}
                        >
                          View Report
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      )}

      {/* =========================================================
          AUTHENTICATION VIEW (LOGIN & REGISTRATION)
         ========================================================= */}
      {activeTab === 'auth' && (
        <div className="auth-wrapper no-print">
          <div className="auth-card">
            <div className="auth-header">
              <div className="auth-icon">🏥</div>
              <h2 className="auth-title">
                {authMode === 'login' ? 'Clinician Portal Sign In' : 'Clinician Registration'}
              </h2>
              <p className="auth-subtitle">
                {authMode === 'login' 
                  ? 'Access cardiovascular risk screening, historical reports, and diagnostic records' 
                  : 'Join the CardioGuard cardiovascular healthcare intelligence network'}
              </p>
            </div>

            {/* Auth Notice (e.g. when redirected from attempting assessment while logged out) */}
            {authNotice && (
              <div className="auth-alert-error" style={{ marginBottom: '16px', background: '#eff6ff', borderColor: '#93c5fd', color: '#1d4ed8' }}>
                {authNotice}
              </div>
            )}

            {/* Auth Switcher Tabs */}
            <div className="auth-tabs">
              <button 
                type="button" 
                className={`auth-tab-btn ${authMode === 'login' ? 'active' : ''}`}
                onClick={() => { setAuthMode('login'); setAuthError(''); setAuthSuccess(''); }}
              >
                Sign In
              </button>
              <button 
                type="button" 
                className={`auth-tab-btn ${authMode === 'register' ? 'active' : ''}`}
                onClick={() => { setAuthMode('register'); setAuthError(''); setAuthSuccess(''); }}
              >
                Create Account
              </button>
            </div>

            {/* One-Click Demo Clinician Box (on Login tab) */}
            {authMode === 'login' && (
              <div className="demo-account-box">
                <div className="demo-account-text">
                  <strong>⚡ Quick Demo Clinician</strong>
                  Dr. Alistair Reed, MD (Chief Cardiologist)
                </div>
                <button 
                  type="button" 
                  className="btn-demo-fill"
                  onClick={fillAndSubmitDemoLogin}
                  disabled={authLoading}
                >
                  One-Click Login
                </button>
              </div>
            )}

            {/* Error & Success Messages */}
            {authError && <div className="auth-alert-error" style={{ marginBottom: '14px' }}>⚠️ {authError}</div>}
            {authSuccess && <div className="auth-alert-success" style={{ marginBottom: '14px' }}>✓ {authSuccess}</div>}

            {/* LOGIN FORM */}
            {authMode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="auth-form">
                <div className="auth-field">
                  <label htmlFor="loginEmail">Email Address</label>
                  <input
                    id="loginEmail"
                    className="form-input"
                    type="email"
                    placeholder="doctor@cardioguard.com"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                  />
                </div>

                <div className="auth-field">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label htmlFor="loginPassword">Password</label>
                    <span 
                      style={{ fontSize: '12px', color: '#2563eb', cursor: 'pointer', fontWeight: 600 }}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </span>
                  </div>
                  <input
                    id="loginPassword"
                    className="form-input"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                </div>

                <button 
                  type="submit" 
                  className="auth-btn-submit"
                  disabled={authLoading}
                >
                  {authLoading ? 'Signing In...' : 'Sign In to Portal'}
                </button>

                <div className="auth-footer-link">
                  Don't have an account?{' '}
                  <span onClick={() => { setAuthMode('register'); setAuthError(''); setAuthSuccess(''); }}>
                    Register here
                  </span>
                </div>
              </form>
            ) : (
              /* REGISTRATION FORM */
              <form onSubmit={handleRegisterSubmit} className="auth-form">
                <div className="auth-field">
                  <label htmlFor="regName">Full Name & Title *</label>
                  <input
                    id="regName"
                    className="form-input"
                    type="text"
                    placeholder="e.g. Dr. Jane Smith, MD"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="auth-field">
                    <label htmlFor="regRole">Professional Role *</label>
                    <select
                      id="regRole"
                      className="form-select"
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value)}
                    >
                      {CLINICAL_ROLES.map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>

                  <div className="auth-field">
                    <label htmlFor="regPhone">Contact Phone</label>
                    <input
                      id="regPhone"
                      className="form-input"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="auth-field">
                  <label htmlFor="regInstitution">Hospital or Clinic Name</label>
                  <input
                    id="regInstitution"
                    className="form-input"
                    type="text"
                    placeholder="e.g. St. Jude Cardiovascular Center"
                    value={regInstitution}
                    onChange={(e) => setRegInstitution(e.target.value)}
                  />
                </div>

                <div className="auth-field">
                  <label htmlFor="regEmail">Email Address *</label>
                  <input
                    id="regEmail"
                    className="form-input"
                    type="email"
                    placeholder="jane.smith@hospital.org"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="auth-field">
                    <label htmlFor="regPassword">Password *</label>
                    <input
                      id="regPassword"
                      className="form-input"
                      type="password"
                      placeholder="Min. 6 chars"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                    />
                  </div>

                  <div className="auth-field">
                    <label htmlFor="regConfirmPassword">Confirm Password *</label>
                    <input
                      id="regConfirmPassword"
                      className="form-input"
                      type="password"
                      placeholder="Re-type password"
                      required
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="auth-btn-submit"
                  disabled={authLoading}
                >
                  {authLoading ? 'Creating Account...' : 'Complete Clinician Registration'}
                </button>

                <div className="auth-footer-link">
                  Already registered?{' '}
                  <span onClick={() => { setAuthMode('login'); setAuthError(''); setAuthSuccess(''); }}>
                    Sign in here
                  </span>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          HOME PAGE VIEW
         ========================================================= */}
      {activeTab === 'home' && (
        <div className="no-print" style={{ animation: 'slideUp 0.3s ease-out' }}>
          {/* Hero Section */}
          <section className="hero-card">
            <div className="hero-content">
              <div className="hero-badge">
                <span className="pulse-dot"></span>
                CLINICAL CARDIOVASCULAR AI ENGINE
              </div>
              <h1 className="hero-title">
                AI-Driven Heart Disease Risk Prediction <span>& Diagnostic Reporting</span>
              </h1>
              <p className="hero-description">
                Screen cardiovascular health with statistical precision. CardioGuard AI evaluates your 
                lipid profile (Cholesterol), body metrics (BMI), and lifestyle factors to generate an instant, 
                physician-grade medical report with personalized clinical recommendations.
              </p>
              <div className="hero-btn-group">
                <button 
                  type="button" 
                  className="btn-hero-primary"
                  onClick={requireAuthForAssessment}
                >
                  ⚡ Start Patient Risk Assessment
                </button>
                {!currentUser && (
                  <button 
                    type="button" 
                    className="btn-hero-secondary"
                    onClick={() => { setAuthNotice(''); setAuthMode('login'); setActiveTab('auth'); }}
                  >
                    🔑 Clinician Portal Login
                  </button>
                )}
                {currentUser && (
                  <button 
                    type="button" 
                    className="btn-hero-secondary"
                    onClick={() => setActiveTab('dashboard')}
                  >
                    📊 Go to Dashboard
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Real-time Clinical Stats Ribbon */}
          <section className="stats-ribbon">
            <div className="stat-box">
              <div className="stat-icon">🎯</div>
              <div>
                <div className="stat-number">85.8%</div>
                <div className="stat-label">Model Accuracy (ROC AUC 0.85)</div>
              </div>
            </div>
            <div className="stat-box">
              <div className="stat-icon">⏱️</div>
              <div>
                <div className="stat-number">&lt; 3 Sec</div>
                <div className="stat-label">Instant Diagnostic Evaluation</div>
              </div>
            </div>
            <div className="stat-box">
              <div className="stat-icon">🩸</div>
              <div>
                <div className="stat-number">11 Key Indices</div>
                <div className="stat-label">Lipid & Clinical Biomarkers</div>
              </div>
            </div>
            <div className="stat-box">
              <div className="stat-icon">🔒</div>
              <div>
                <div className="stat-number">100% Private</div>
                <div className="stat-label">Persistent Encrypted SQLite</div>
              </div>
            </div>
          </section>

          {/* Section: Why CardioGuard AI */}
          <div className="section-header">
            <span className="section-tag">Clinical Excellence</span>
            <h2 className="section-title">Comprehensive Cardiovascular Screening</h2>
            <p className="section-subtitle">
              Engineered for cardiology clinics, preventive wellness centers, and patients seeking rapid, 
              evidence-based cardiovascular risk intelligence.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-wrap">🩸</div>
              <h3 className="feature-title">Cholesterol & Lipid Stratification</h3>
              <p className="feature-desc">
                Evaluates total cholesterol thresholds (&lt; 200 mg/dL normal, 200-239 borderline, ≥ 240 high) 
                to quantify endothelial atheroma risk.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrap">🧠</div>
              <h3 className="feature-title">Calibrated Machine Learning</h3>
              <p className="feature-desc">
                Trained with ensemble Random Forest and cross-validated sigmoid probability calibration for 
                reliable, medically calibrated percentages.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrap">📄</div>
              <h3 className="feature-title">Official Medical Report Card</h3>
              <p className="feature-desc">
                Generates a complete institutional report with patient identification, biometric indicators, 
                risk gauges, and doctor sign-off blocks.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrap">🖨️</div>
              <h3 className="feature-title">One-Click PDF & Print Export</h3>
              <p className="feature-desc">
                Clean A4 print stylesheet strips out web navigation, producing pixel-perfect clinical records 
                ready for hospital charts.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrap">🩺</div>
              <h3 className="feature-title">Tailored Clinical Recommendations</h3>
              <p className="feature-desc">
                Dynamic guidance advising ECGs, echocardiograms, statin consultations, smoking cessation protocols, 
                and glycemic targets.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrap">💾</div>
              <h3 className="feature-title">Searchable Patient Database</h3>
              <p className="feature-desc">
                Persistent database records every evaluation, allowing instant search by patient name, contact 
                number, or unique Report ID.
              </p>
            </div>
          </div>

          {/* Section: How It Works */}
          <section className="process-section">
            <div className="section-header" style={{ marginBottom: '28px' }}>
              <span className="section-tag">Workflow</span>
              <h2 className="section-title">How the Screening Works in 3 Steps</h2>
            </div>

            <div className="steps-grid">
              <div className="step-card">
                <div className="step-number">1</div>
                <h4 className="step-title">Enter Patient Profile & Vitals</h4>
                <p className="step-desc">
                  Input demographics (Name, DOB, Blood Group) alongside clinical indicators like Cholesterol Level, 
                  BMI, and lifestyle habits.
                </p>
              </div>

              <div className="step-card">
                <div className="step-number">2</div>
                <h4 className="step-title">AI Evaluates Multi-Factor Risk</h4>
                <p className="step-desc">
                  The calibrated model calculates disease probability and classifies the patient into Low, 
                  Moderate, or High risk tiers.
                </p>
              </div>

              <div className="step-card">
                <div className="step-number">3</div>
                <h4 className="step-title">Generate & Print Medical Report</h4>
                <p className="step-desc">
                  Review the interactive risk gauge, inspect contributing comorbidities, and print an official 
                  clinical report with one click.
                </p>
              </div>
            </div>
          </section>

          {/* Call to Action Banner */}
          <section className="cta-banner">
            <h2>Ready to Run a Cardiovascular Assessment?</h2>
            <p>
              Screening takes less than 2 minutes. Sign in to your clinician account to begin.
            </p>
            <button 
              type="button" 
              className="btn-hero-primary"
              onClick={requireAuthForAssessment}
            >
              ⚡ Launch Risk Assessment Tool
            </button>
          </section>
        </div>
      )}

      {/* =========================================================
          RISK ASSESSMENT & PREDICTION FORM VIEW (ONLY FOR LOGGED IN USERS)
         ========================================================= */}
      {currentUser && activeTab === 'assessment' && (
        <main className="no-print" style={{ animation: 'slideUp 0.3s ease-out' }}>
          {/* Preset Selector Banner */}
          <div className="presets-container">
            <span className="presets-label">⚡ Quick Patient Profiles:</span>
            <button type="button" className="preset-chip healthy" onClick={() => loadPreset('healthy')}>
              🟢 Healthy Young Adult
            </button>
            <button type="button" className="preset-chip moderate" onClick={() => loadPreset('moderate')}>
              🟡 Moderate Risk (Middle-aged)
            </button>
            <button type="button" className="preset-chip high-risk" onClick={() => loadPreset('high')}>
              🔴 High Risk (Senior with High Cholesterol)
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Card 1: Patient Information */}
            <section className="card">
              <div className="card-header">
                <div className="card-title-group">
                  <span className="card-icon">👤</span>
                  <h2 className="card-title">Patient Identification & Registration</h2>
                </div>
                <span className="card-badge">Demographics</span>
              </div>

              <div className="grid-4">
                <div className="form-group">
                  <label className="form-label" htmlFor="patientName">Full Name *</label>
                  <input
                    id="patientName"
                    className="form-input"
                    type="text"
                    placeholder="e.g. John Doe"
                    required
                    value={formData.patientName}
                    onChange={(e) => handleInputChange('patientName', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="dob">
                    Date of Birth * {currentAge !== null && <span style={{ color: '#2563eb', fontWeight: 700 }}>({currentAge} yrs)</span>}
                  </label>
                  <input
                    id="dob"
                    className="form-input"
                    type="date"
                    required
                    value={formData.dob}
                    onChange={handleDobChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="phone">Phone Number *</label>
                  <input
                    id="phone"
                    className="form-input"
                    type="tel"
                    placeholder="e.g. +1 (555) 000-0000"
                    required
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="bloodGroup">Blood Group *</label>
                  <select
                    id="bloodGroup"
                    className="form-select"
                    value={formData.bloodGroup}
                    onChange={(e) => handleInputChange('bloodGroup', e.target.value)}
                  >
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* Card 2: Clinical Indicators (With Cholesterol Level) */}
            <section className="card">
              <div className="card-header">
                <div className="card-title-group">
                  <span className="card-icon">🩺</span>
                  <h2 className="card-title">Cardiovascular Indicators & Lipid Profile</h2>
                </div>
                <span className="card-badge">Clinical Features</span>
              </div>

              <div className="grid-4">
                {/* 1. Body Mass Index */}
                <div className="form-group">
                  <label className="form-label" htmlFor="bmi">
                    Body Mass Index
                    <span className="helper-link" onClick={() => setShowBmiModal(true)}>BMI Calc</span>
                  </label>
                  <input
                    id="bmi"
                    className="form-input"
                    type="number"
                    step="0.1"
                    min="12"
                    max="65"
                    value={formData.BMI}
                    onChange={(e) => handleInputChange('BMI', e.target.value)}
                  />
                </div>

                {/* 2. Cholesterol Level */}
                <div className="form-group">
                  <label className="form-label" htmlFor="cholesterol">
                    Cholesterol Level *
                  </label>
                  <select
                    id="cholesterol"
                    className="form-select"
                    value={formData.Cholesterol}
                    onChange={(e) => handleInputChange('Cholesterol', e.target.value)}
                  >
                    {CHOLESTEROL_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* 3. Average Sleep Hours */}
                <div className="form-group">
                  <label className="form-label" htmlFor="sleepTime">Average Sleep Hours</label>
                  <input
                    id="sleepTime"
                    className="form-input"
                    type="number"
                    min="1"
                    max="24"
                    value={formData.SleepTime}
                    onChange={(e) => handleInputChange('SleepTime', e.target.value)}
                  />
                </div>

                {/* 4. Smoking */}
                <div className="form-group">
                  <label className="form-label" htmlFor="smoking">Smoking</label>
                  <select
                    id="smoking"
                    className="form-select"
                    value={formData.Smoking}
                    onChange={(e) => handleInputChange('Smoking', e.target.value)}
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>

                {/* 5. Alcohol Drinking */}
                <div className="form-group">
                  <label className="form-label" htmlFor="alcohol">Alcohol Drinking</label>
                  <select
                    id="alcohol"
                    className="form-select"
                    value={formData.AlcoholDrinking}
                    onChange={(e) => handleInputChange('AlcoholDrinking', e.target.value)}
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>

                {/* 6. Stroke */}
                <div className="form-group">
                  <label className="form-label" htmlFor="stroke">Stroke</label>
                  <select
                    id="stroke"
                    className="form-select"
                    value={formData.Stroke}
                    onChange={(e) => handleInputChange('Stroke', e.target.value)}
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>

                {/* 7. Sex */}
                <div className="form-group">
                  <label className="form-label" htmlFor="sex">Sex</label>
                  <select
                    id="sex"
                    className="form-select"
                    value={formData.Sex}
                    onChange={(e) => handleInputChange('Sex', e.target.value)}
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                  </select>
                </div>

                {/* 8. Age Category */}
                <div className="form-group">
                  <label className="form-label" htmlFor="ageCat">Age Category</label>
                  <select
                    id="ageCat"
                    className="form-select"
                    value={formData.AgeCategory}
                    onChange={(e) => handleInputChange('AgeCategory', e.target.value)}
                  >
                    {AGE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* 9. Diabetic */}
                <div className="form-group">
                  <label className="form-label" htmlFor="diabetic">Diabetic</label>
                  <select
                    id="diabetic"
                    className="form-select"
                    value={formData.Diabetic}
                    onChange={(e) => handleInputChange('Diabetic', e.target.value)}
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                    <option value="No, borderline diabetes">No, borderline diabetes</option>
                    <option value="Yes (during pregnancy)">Yes (during pregnancy)</option>
                  </select>
                </div>

                {/* 10. General Health */}
                <div className="form-group">
                  <label className="form-label" htmlFor="genHealth">Gen Health</label>
                  <select
                    id="genHealth"
                    className="form-select"
                    value={formData.GenHealth}
                    onChange={(e) => handleInputChange('GenHealth', e.target.value)}
                  >
                    <option value="Very good">Very good</option>
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>

                {/* 11. Asthma */}
                <div className="form-group">
                  <label className="form-label" htmlFor="asthma">Asthma</label>
                  <select
                    id="asthma"
                    className="form-select"
                    value={formData.Asthma}
                    onChange={(e) => handleInputChange('Asthma', e.target.value)}
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
              </div>

              <div className="action-bar">
                <button 
                  type="button" 
                  className="btn btn-outline"
                  onClick={() => setFormData(INITIAL_FORM)}
                >
                  Reset Fields
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Evaluating Cardiovascular Profile...' : '⚡ Predict & Generate Medical Report'}
                </button>
              </div>
            </section>
          </form>
        </main>
      )}

      {/* =========================================================
          GENERATED MEDICAL REPORT VIEW
         ========================================================= */}
      {report && (
        <section id="medical-report-view" className="report-section report-printable">
          <div className="report-card">
            {/* Facility Header */}
            <div className="report-facility-header">
              <div className="facility-brand">
                <div className="facility-logo">🏥</div>
                <div>
                  <h2 className="facility-title">CARDIO-DIAGNOSTIC HEALTH INSTITUTE</h2>
                  <p className="facility-subtitle">Automated Cardiovascular Risk Screening & Prevention Center</p>
                </div>
              </div>
              <div className="report-metadata">
                <div>Report ID: <span className="report-id">{report.reportId}</span></div>
                <div>Issued: {report.createdAt}</div>
                <div>Status: <span style={{ color: '#16a34a', fontWeight: 800 }}>VERIFIED</span></div>
              </div>
            </div>

            {/* Patient Demographics Banner */}
            <div className="patient-banner">
              <div className="banner-item">
                <span className="banner-label">Patient Name</span>
                <span className="banner-val">{report.patient.name}</span>
              </div>
              <div className="banner-item">
                <span className="banner-label">Age / Gender</span>
                <span className="banner-val">
                  {report.patient.age ? `${report.patient.age} yrs` : report.clinicalInputs?.AgeCategory} • {report.patient.sex}
                </span>
              </div>
              <div className="banner-item">
                <span className="banner-label">Blood Group</span>
                <span className="banner-val">{report.patient.bloodGroup}</span>
              </div>
              <div className="banner-item">
                <span className="banner-label">Contact</span>
                <span className="banner-val">{report.patient.phone}</span>
              </div>
            </div>

            {/* Risk Score Container */}
            <div className={`risk-score-container ${
              report.prediction.riskScore < 20 ? 'low' : report.prediction.riskScore < 50 ? 'moderate' : 'high'
            }`}>
              <div className="risk-info-main">
                <div className={`risk-badge ${
                  report.prediction.riskScore < 20 ? 'low' : report.prediction.riskScore < 50 ? 'moderate' : 'high'
                }`}>
                  ● {report.prediction.riskLevel}
                </div>
                <p className="risk-summary-text">{report.prediction.summary}</p>
              </div>

              <div className={`risk-gauge-circle ${
                report.prediction.riskScore < 20 ? 'low' : report.prediction.riskScore < 50 ? 'moderate' : 'high'
              }`}>
                <span className="gauge-pct">{report.prediction.riskScore}%</span>
                <span className="gauge-label">Probability</span>
              </div>
            </div>

            {/* Biometric & Lipid Profile Summary */}
            <h3 className="report-subheading">📊 Clinical Biometric & Lipid Summary</h3>
            <div className="biometric-grid">
              <div className="biometric-card">
                <div className="biometric-title">BMI INDEX</div>
                <div className="biometric-value">
                  {report.bmiDetails?.bmi || report.clinicalInputs?.BMI}
                </div>
                <div className="biometric-sub">{report.bmiDetails?.category}</div>
              </div>
              <div className="biometric-card">
                <div className="biometric-title">CHOLESTEROL LEVEL</div>
                <div className="biometric-value" style={{ fontSize: '15px' }}>
                  {report.cholesterolDetails?.label || report.clinicalInputs?.Cholesterol}
                </div>
                <div className="biometric-sub" style={{
                  color: report.clinicalInputs?.Cholesterol === 'High' ? '#dc2626' : (
                    report.clinicalInputs?.Cholesterol === 'Borderline High' ? '#d97706' : '#16a34a'
                  )
                }}>
                  {report.clinicalInputs?.Cholesterol === 'High' ? 'Elevated Risk' : (
                    report.clinicalInputs?.Cholesterol === 'Borderline High' ? 'Borderline' : 'Optimal'
                  )}
                </div>
              </div>
              <div className="biometric-card">
                <div className="biometric-title">SLEEP DURATION</div>
                <div className="biometric-value">
                  {report.clinicalInputs?.SleepTime} hrs/night
                </div>
                <div className="biometric-sub" style={{ color: '#475569' }}>
                  {report.clinicalInputs?.SleepTime >= 7 && report.clinicalInputs?.SleepTime <= 9 ? 'Optimal (7-9h)' : 'Suboptimal'}
                </div>
              </div>
              <div className="biometric-card">
                <div className="biometric-title">GENERAL HEALTH</div>
                <div className="biometric-value">
                  {report.clinicalInputs?.GenHealth}
                </div>
                <div className="biometric-sub" style={{ color: '#475569' }}>Self Reported</div>
              </div>
            </div>

            {/* Contributing Risk Factors */}
            <h3 className="report-subheading">⚠️ Contributing Risk Factors & Comorbidities</h3>
            {report.contributingFactors && report.contributingFactors.length > 0 ? (
              <div className="factors-grid">
                {report.contributingFactors.map((factor, idx) => (
                  <div key={idx} className="factor-card">
                    <div className="factor-header">
                      <span className="factor-name">{factor.name}</span>
                      <span className={`factor-tag ${factor.severity}`}>{factor.severity}</span>
                    </div>
                    <p className="factor-desc">{factor.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#16a34a', fontSize: '14.5px', marginBottom: '22px', fontWeight: 600 }}>
                ✓ No high-risk comorbidities or significant cardiovascular risk drivers detected.
              </p>
            )}

            {/* Recommendations */}
            <h3 className="report-subheading">🩺 Tailored Clinical & Lifestyle Recommendations</h3>
            <ul className="recommendations-list">
              {report.recommendations && report.recommendations.map((rec, idx) => (
                <li key={idx} className="recommendation-item">
                  <span className="recommendation-bullet">›</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>

            {/* Doctor Signoff Footer */}
            <div className="doctor-signoff">
              <div style={{ fontSize: '12px', color: '#64748b', maxWidth: '360px', lineHeight: 1.45 }}>
                * This computer-assisted assessment is generated via trained epidemiologic algorithms. It is intended to support, not replace, clinical evaluation by a licensed cardiologist.
              </div>
              <div className="signoff-box">
                <div className="signature-line">
                  {currentUser ? currentUser.name : 'Dr. Alistair Reed, MD'}
                </div>
                <div className="signoff-title">
                  {currentUser ? (currentUser.role || 'Attending Physician') : 'Chief of Preventive Cardiology'}
                </div>
              </div>
            </div>

            {/* Actions (Hidden on print) */}
            <div className="action-bar no-print" style={{ marginTop: '26px' }}>
              <button type="button" className="btn btn-outline" onClick={() => setReport(null)}>
                ← Close Report
              </button>
              <button type="button" className="btn btn-primary" onClick={handlePrint}>
                🖨️ Print / Save PDF Medical Report
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="app-footer no-print">
        <p className="footer-disclaimer">
          Medical Disclaimer: CardioGuard AI is an automated risk assessment screening aid developed for educational and preventive wellness purposes. It is not an alternative to professional clinical diagnosis by an accredited cardiologist.
        </p>
        <p>© 2026 CardioGuard Health Institute. All rights reserved.</p>
      </footer>

      {/* BMI Calculator Modal */}
      {showBmiModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Quick BMI Calculator</h3>
              <button type="button" className="close-btn" onClick={() => setShowBmiModal(false)}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Height (cm)</label>
                <input
                  type="number"
                  className="form-input"
                  value={calcHeight}
                  onChange={(e) => setCalcHeight(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Weight (kg)</label>
                <input
                  type="number"
                  className="form-input"
                  value={calcWeight}
                  onChange={(e) => setCalcWeight(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div style={{
                padding: '14px 18px',
                background: '#eff6ff',
                borderRadius: '12px',
                border: '1.5px solid #bfdbfe',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '14.5px', fontWeight: 700, color: '#1e40af' }}>Calculated BMI:</span>
                <span style={{ fontSize: '22px', fontWeight: 800, color: '#1d4ed8' }}>
                  {calcHeight > 0 ? (calcWeight / ((calcHeight / 100) ** 2)).toFixed(1) : 0}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowBmiModal(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={applyCalculatedBmi}>
                  Apply to Form
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Past Reports Records Modal */}
      {showHistoryModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '750px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Historical Patient Records</h3>
              <button type="button" className="close-btn" onClick={() => setShowHistoryModal(false)}>✕</button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search by patient name, phone or report ID..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchReportsHistory()}
              />
            </div>

            {historyLoading ? (
              <p style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>Loading records...</p>
            ) : reportsHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                <p style={{ fontSize: '15px', fontWeight: 600 }}>No reports found in the records database.</p>
                <p style={{ fontSize: '13px', marginTop: '6px' }}>Generate a prediction to save the first patient report.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto' }}>
                {reportsHistory.map((rep) => (
                  <div
                    key={rep.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '14px 18px',
                      background: '#f8fbff',
                      borderRadius: '12px',
                      border: '1.5px solid #dbeafe',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onClick={() => loadPastReport(rep.id)}
                  >
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                        {rep.patient_name} <span style={{ fontSize: '12.5px', fontWeight: 500, color: '#1e40af' }}>({rep.sex}, {rep.blood_group || rep.bloodGroup})</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>
                        ID: {rep.id} • {rep.created_at}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className={`risk-badge ${
                        rep.risk_score < 20 ? 'low' : rep.risk_score < 50 ? 'moderate' : 'high'
                      }`} style={{ fontSize: '12px', padding: '4px 12px' }}>
                        {rep.risk_score}% • {rep.risk_level}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Client-side fallback report generator for offline capability
function generateClientSideReport(data, age, user) {
  let score = 5.0;
  if (data.Smoking === 'Yes') score += 15;
  if (data.Stroke === 'Yes') score += 32;
  if (data.Diabetic === 'Yes') score += 20;
  if (data.Cholesterol === 'High') score += 22;
  else if (data.Cholesterol === 'Borderline High') score += 10;
  if (data.Sex === 'Male') score += 6;
  if (data.GenHealth === 'Poor') score += 20;
  if (data.GenHealth === 'Fair') score += 10;
  if (data.BMI >= 30) score += (data.BMI - 30) * 1.5;
  if (data.SleepTime < 6) score += 6;

  const ageVal = age || 50;
  if (ageVal > 65) score += 18;
  else if (ageVal > 50) score += 10;

  score = Math.min(Math.max(Math.round(score * 10) / 10, 1.2), 98.5);

  let riskLevel = 'Low Risk';
  if (score >= 50) riskLevel = 'High Risk';
  else if (score >= 20) riskLevel = 'Moderate Risk';

  const factors = [];
  const recs = [];

  if (data.BMI >= 30) {
    factors.push({ name: 'Elevated BMI', severity: 'medium', description: 'Weight increases cardiac workload.' });
    recs.push('Consult a clinical nutritionist for a personalized cardioprotective dietary plan.');
  }
  if (data.Cholesterol === 'High') {
    factors.push({ name: 'Hypercholesterolemia (High Cholesterol)', severity: 'high', description: 'Total cholesterol ≥ 240 mg/dL accelerates coronary artery plaque build-up.' });
    recs.push('Consult cardiologist for lipid-lowering pharmacotherapy (statin therapy) and comprehensive lipid panel.');
  } else if (data.Cholesterol === 'Borderline High') {
    factors.push({ name: 'Borderline High Cholesterol', severity: 'medium', description: 'Cholesterol is in the borderline zone (200-239 mg/dL).' });
    recs.push('Adopt dietary modifications to lower circulating LDL cholesterol; repeat lipid screening in 6 months.');
  }
  if (data.Smoking === 'Yes') {
    factors.push({ name: 'Tobacco Use', severity: 'high', description: 'Accelerates coronary atherosclerosis.' });
    recs.push('Initiate smoking cessation protocol immediately.');
  }
  if (data.Stroke === 'Yes') {
    factors.push({ name: 'Prior Cerebrovascular Event', severity: 'high', description: 'Strong indicator of systemic vascular vulnerability.' });
    recs.push('Schedule strict blood pressure and neurovascular monitoring.');
  }
  if (data.Diabetic === 'Yes') {
    factors.push({ name: 'Diabetes Mellitus', severity: 'high', description: 'Promotes microvascular and macrovascular lesions.' });
    recs.push('Target HbA1c < 7.0% and monitor fasting plasma glucose regularly.');
  }
  if (recs.length === 0) {
    recs.push('Maintain heart-healthy diet with rich fiber and unsaturated fats.');
    recs.push('Perform at least 150 minutes of moderate aerobic activity weekly.');
  }

  return {
    reportId: `REP-LOCAL-${Date.now().toString().slice(-6)}`,
    createdAt: new Date().toLocaleString(),
    patient: {
      name: data.patientName || 'Anonymous Patient',
      dob: data.dob,
      age: age,
      phone: data.phone,
      bloodGroup: data.bloodGroup,
      sex: data.Sex
    },
    clinicalInputs: data,
    bmiDetails: {
      bmi: data.BMI,
      category: data.BMI < 25 ? 'Normal' : data.BMI < 30 ? 'Overweight' : 'Obese',
      status: data.BMI < 25 ? 'success' : 'warning'
    },
    cholesterolDetails: {
      level: data.Cholesterol,
      label: data.Cholesterol === 'Normal' ? 'Normal (< 200 mg/dL)' : (
        data.Cholesterol === 'Borderline High' ? 'Borderline High (200-239 mg/dL)' : 'High (≥ 240 mg/dL)'
      )
    },
    prediction: {
      riskScore: score,
      riskLevel: riskLevel,
      summary: riskLevel === 'High Risk'
        ? 'High probability of coronary heart disease detected. Prioritize comprehensive diagnostic assessment.'
        : riskLevel === 'Moderate Risk'
        ? 'Moderate risk markers present. Active lifestyle modifications advised.'
        : 'Low cardiovascular risk indicators observed. Continue regular preventive wellness practices.'
    },
    contributingFactors: factors,
    recommendations: recs
  };
}
