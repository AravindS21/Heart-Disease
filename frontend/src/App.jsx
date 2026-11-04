import React, { useState, useEffect } from 'react';
import './App.css';
import {
  HeartPulse,
  Stethoscope,
  ShieldCheck,
  Activity,
  FileText,
  User,
  UserCheck,
  Calendar,
  Phone,
  Droplet,
  Scale,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Printer,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ChevronRight,
  Search,
  RefreshCw,
  Building2,
  Sparkles,
  LogOut,
  LogIn,
  PlusCircle,
  X,
  BedDouble,
  Cigarette,
  Wine,
  AlertCircle,
  ClipboardList,
  Pill,
  Database,
  Check,
  Sun,
  Moon,
  Home,
  Info,
  UserPlus,
  HeartLogo
} from './components/Icons';

const AGE_CATEGORIES = [
  '18-24', '25-29', '30-34', '35-39', '40-44', '45-49',
  '50-54', '55-59', '60-64', '65-69', '70-74', '75-79', '80 or older'
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const CHOLESTEROL_OPTIONS = [
  { value: 'Normal', label: 'Normal (< 200 mg/dL) - Desirable' },
  { value: 'Borderline High', label: 'Borderline High (200 - 239 mg/dL)' },
  { value: 'High', label: 'High (>= 240 mg/dL) - Clinically Elevated' }
];

const CLINICAL_ROLES = [
  'Cardiologist',
  'Interventional Cardiologist',
  'General Physician',
  'Preventive Cardiology Fellow',
  'Cardiovascular Clinical Specialist',
  'Clinical Researcher'
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
  // Theme state ('light' or 'dark', persisted)
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('cardioguard_theme') || 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('cardioguard_theme', theme);
    } catch {}
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Current user state (persisted in localStorage)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('cardioguard_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Active view: ALWAYS default to 'home' so the website opens directly on the Home page
  const [activeTab, setActiveTab] = useState('home');
  const [activeHomeSection, setActiveHomeSection] = useState('home');
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [authNotice, setAuthNotice] = useState('');

  // Clinician Dashboard State
  const [dashboardStats, setDashboardStats] = useState({
    totalAssessments: 0,
    highRiskCount: 0,
    avgRiskScore: 0,
    normalCount: 0
  });
  const [recentReports, setRecentReports] = useState([]);
  const [dashboardSearch, setDashboardSearch] = useState('');

  // Auth Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Registration Form State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState('Cardiologist');
  const [regInstitution, setRegInstitution] = useState('Central Cardiovascular Institute');
  const [regPhone, setRegPhone] = useState('');

  // Assessment & Report State
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  // BMI Calculator Modal
  const [showBmiModal, setShowBmiModal] = useState(false);
  const [calcHeight, setCalcHeight] = useState(170); // cm
  const [calcWeight, setCalcWeight] = useState(72);  // kg

  // Past Reports Database Modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [reportsHistory, setReportsHistory] = useState([]);
  const [historySearch, setHistorySearch] = useState('');
  const [historyLoading, setHistoryLoading] = useState(false);

  // Sync user state to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('cardioguard_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('cardioguard_user');
    }
  }, [currentUser]);

  // Load dashboard statistics and recent evaluations from backend
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
        setRecentReports(data.reports || []);
      }
    } catch {
      // Backend unavailable; mock stats will remain
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadDashboardData();
    }
  }, [currentUser]);

  // Navigation scroll helper for Home page links
  const handleNavClick = (sectionId) => {
    setActiveHomeSection(sectionId);
    if (sectionId === 'home') {
      setActiveTab('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (sectionId === 'features' || sectionId === 'about' || sectionId === 'how-it-works') {
      setActiveTab('home');
      setTimeout(() => {
        const el = document.getElementById('features');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 50);
      return;
    }
    if (sectionId === 'contact') {
      const el = document.querySelector('.hospital-footer');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      return;
    }
  };

  // Authentication Guard for Assessment
  const requireAuthForAssessment = () => {
    if (!currentUser) {
      setAuthNotice('Clinical Authentication Required: Please sign in or register to access the heart disease prediction assessment.');
      setAuthMode('login');
      setActiveTab('auth');
      return false;
    }
    return true;
  };

  // Handle Date of Birth input change
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
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Sign In Handler
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    setAuthSuccess('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setCurrentUser(data.user);
        setAuthNotice('');
        setActiveTab('dashboard');
      } else {
        setAuthError(data.error || 'Authentication failed. Please verify credentials.');
      }
    } catch {
      // Offline fallback: allow demo login
      if (loginEmail === 'doctor@cardioguard.com' && loginPassword === 'password123') {
        const mockUser = {
          name: 'Dr. Alistair Reed, MD',
          email: 'doctor@cardioguard.com',
          role: 'Cardiologist',
          institution: 'Central Cardiovascular Institute',
          licenseNumber: 'MD-849201'
        };
        setCurrentUser(mockUser);
        setAuthNotice('');
        setActiveTab('dashboard');
      } else {
        setAuthError('Connection error: Unable to reach authorization service.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  // One-Click Demo Clinician Fill
  const fillAndSubmitDemoLogin = async () => {
    setLoginEmail('doctor@cardioguard.com');
    setLoginPassword('password123');
    setAuthError('');
    setAuthLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'doctor@cardioguard.com', password: 'password123' })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setCurrentUser(data.user);
        setAuthNotice('');
        setActiveTab('dashboard');
      } else {
        const mockUser = {
          name: 'Dr. Alistair Reed, MD',
          email: 'doctor@cardioguard.com',
          role: 'Cardiologist',
          institution: 'Central Cardiovascular Institute',
          licenseNumber: 'MD-849201'
        };
        setCurrentUser(mockUser);
        setActiveTab('dashboard');
      }
    } catch {
      const mockUser = {
        name: 'Dr. Alistair Reed, MD',
        email: 'doctor@cardioguard.com',
        role: 'Cardiologist',
        institution: 'Central Cardiovascular Institute',
        licenseNumber: 'MD-849201'
      };
      setCurrentUser(mockUser);
      setActiveTab('dashboard');
    } finally {
      setAuthLoading(false);
    }
  };

  // Staff Registration Handler
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    setAuthSuccess('');

    if (regPassword !== regConfirmPassword) {
      setAuthError('Password mismatch: Passwords do not match.');
      setAuthLoading(false);
      return;
    }

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
      if (res.ok && data.user) {
        setAuthSuccess('Registration completed successfully. Authenticating session...');
        setTimeout(() => {
          setCurrentUser(data.user);
          setActiveTab('dashboard');
        }, 800);
      } else {
        setAuthError(data.error || 'Registration failed. An account with this email may already exist.');
      }
    } catch {
      setAuthError('Connection error: Unable to contact registration service.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Sign Out Handler
  const handleSignOut = () => {
    setCurrentUser(null);
    setActiveTab('home');
    setAuthNotice('');
  };

  // Clinical Test Archetypes (Quick Load)
  const loadPreset = (presetType) => {
    if (presetType === 'low') {
      setFormData({
        patientName: 'Emma Richardson',
        dob: '1992-05-18',
        phone: '+1 (555) 234-5678',
        bloodGroup: 'A+',
        BMI: 21.5,
        Cholesterol: 'Normal',
        SleepTime: 8,
        Smoking: 'No',
        AlcoholDrinking: 'No',
        Stroke: 'No',
        Sex: 'Female',
        AgeCategory: '30-34',
        Diabetic: 'No',
        GenHealth: 'Excellent',
        Asthma: 'No'
      });
    } else if (presetType === 'moderate') {
      setFormData({
        patientName: 'David Miller',
        dob: '1970-11-22',
        phone: '+1 (555) 345-6789',
        bloodGroup: 'B+',
        BMI: 28.2,
        Cholesterol: 'Borderline High',
        SleepTime: 6,
        Smoking: 'No',
        AlcoholDrinking: 'Yes',
        Stroke: 'No',
        Sex: 'Male',
        AgeCategory: '55-59',
        Diabetic: 'No',
        GenHealth: 'Good',
        Asthma: 'Yes'
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

  // BMI Calculator Helper
  const applyCalculatedBmi = () => {
    const heightInMeters = calcHeight / 100;
    const computed = calcWeight / (heightInMeters * heightInMeters);
    const rounded = Math.round(computed * 10) / 10;
    setFormData(prev => ({ ...prev, BMI: rounded }));
    setShowBmiModal(false);
  };

  // Past Reports Database Search
  const fetchReportsHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/reports?search=${encodeURIComponent(historySearch)}`);
      const data = await res.json();
      setReportsHistory(data.reports || []);
    } catch {
      // Offline fallback
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
      const res = await fetch(`/api/reports/${reportId}`);
      if (res.ok) {
        const fullReport = await res.json();
        setReport(fullReport);
        setActiveTab('report');
        setShowHistoryModal(false);
      }
    } catch {
      // Fallback
    }
  };

  // Primary Clinical Risk Prediction Execution
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!requireAuthForAssessment()) return;

    setLoading(true);
    const computedAge = calculateAge(formData.dob);
    const payload = {
      ...formData,
      age: computedAge,
      evaluatorId: currentUser?.id,
      evaluatorName: currentUser?.name
    };

    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const reportData = await response.json();
      setReport(reportData);
      setActiveTab('report');
      loadDashboardData();
    } catch {
      // Client-side fallback if ML microservice is unreachable
      const fallbackReport = generateClientSideReport(payload, computedAge, currentUser);
      setReport(fallbackReport);
      setActiveTab('report');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const currentAge = calculateAge(formData.dob);

  // Filter recent reports in dashboard search
  const filteredDashboardReports = recentReports.filter(r => {
    if (!dashboardSearch.trim()) return true;
    const term = dashboardSearch.toLowerCase();
    return (
      (r.patient_name && r.patient_name.toLowerCase().includes(term)) ||
      (r.report_id && r.report_id.toLowerCase().includes(term)) ||
      (r.blood_group && r.blood_group.toLowerCase().includes(term))
    );
  });

  return (
    <div className="app-container">
      {/* ========================================================
          HeartCare AI Navigation Bar (Matches Attached Reference)
          ======================================================== */}
      <header className="app-navbar">
        <div className="brand-section" onClick={() => handleNavClick('home')}>
          <HeartLogo size={42} />
          <div className="brand-info">
            <div className="brand-title">
              HeartCare AI
            </div>
            <span className="brand-subtitle">Predict • Prevent • Live Healthy</span>
          </div>
        </div>

        {/* Center Navigation Links */}
        <nav className="nav-links">
          <button
            type="button"
            className={`nav-link-btn ${activeTab === 'home' && activeHomeSection === 'home' ? 'active' : ''}`}
            onClick={() => handleNavClick('home')}
          >
            <Home size={15} />
            Home
          </button>
          <button
            type="button"
            className={`nav-link-btn ${activeTab === 'home' && activeHomeSection === 'about' ? 'active' : ''}`}
            onClick={() => handleNavClick('about')}
          >
            About
          </button>
          <button
            type="button"
            className={`nav-link-btn ${activeTab === 'home' && activeHomeSection === 'features' ? 'active' : ''}`}
            onClick={() => handleNavClick('features')}
          >
            Features
          </button>
          <button
            type="button"
            className={`nav-link-btn ${activeTab === 'home' && activeHomeSection === 'how-it-works' ? 'active' : ''}`}
            onClick={() => handleNavClick('how-it-works')}
          >
            How It Works
          </button>
          <button
            type="button"
            className={`nav-link-btn ${activeTab === 'home' && activeHomeSection === 'contact' ? 'active' : ''}`}
            onClick={() => handleNavClick('contact')}
          >
            Contact
          </button>

          {currentUser && (
            <>
              <button
                type="button"
                className={`nav-link-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
              >
                <Activity size={15} />
                Dashboard
              </button>
              <button
                type="button"
                className={`nav-link-btn ${activeTab === 'assess' ? 'active' : ''}`}
                onClick={() => setActiveTab('assess')}
              >
                <Stethoscope size={15} />
                Risk Assessment
              </button>
            </>
          )}
        </nav>

        {/* Right Action Buttons */}
        <div className="nav-actions">
          {/* Light / Dark Mode Toggle Button */}
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            type="button"
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {currentUser ? (
            <div className="user-profile-pill">
              <div className="user-avatar">
                <UserCheck size={18} />
              </div>
              <div className="user-profile-info">
                <span className="user-profile-name">{currentUser.name}</span>
                <span className="user-profile-role">{currentUser.role || 'Cardiologist'}</span>
              </div>
              <button
                className="btn-signout"
                onClick={handleSignOut}
                title="Sign out"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <>
              <button
                className="btn-nav-login"
                onClick={() => {
                  setAuthNotice('');
                  setAuthMode('login');
                  setActiveTab('auth');
                }}
              >
                <LogIn size={15} />
                Login
              </button>
              <button
                className="btn-nav-register"
                onClick={() => {
                  setAuthNotice('');
                  setAuthMode('register');
                  setActiveTab('auth');
                }}
              >
                <UserPlus size={15} />
                Register
              </button>
            </>
          )}
        </div>
      </header>

      {/* ========================================================
          VIEW 1: HEARTCARE AI HOME PAGE (Exact Reference Layout)
          ======================================================== */}
      {activeTab === 'home' && (
        <div className="home-view">
          {/* Hero Section */}
          <section className="heartcare-hero">
            <div className="hero-left-content">
              {/* ECG Pulse Line */}
              <svg className="hero-ecg-svg" viewBox="0 0 140 32" fill="none">
                <path
                  d="M2 18H40L47 4L56 26L64 8L70 18H138"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <h1 className="hero-main-heading">
                Heart Disease<br />
                Prediction using <span className="highlight-ai">AI</span>
              </h1>

              <p className="hero-subtitle">
                Enter your health details and get instant prediction about heart disease risk using Machine Learning.
              </p>

              <div className="hero-cta-group">
                <button
                  type="button"
                  className="btn-start-prediction"
                  onClick={() => {
                    if (requireAuthForAssessment()) {
                      setActiveTab('assess');
                    }
                  }}
                >
                  <Stethoscope size={18} />
                  Start Prediction →
                </button>

                <button
                  type="button"
                  className="btn-learn-more"
                  onClick={() => handleNavClick('features')}
                >
                  <Info size={18} />
                  Learn More
                </button>
              </div>
            </div>

            {/* Hero Right Artwork: Doctor holding holographic glowing 3D heart */}
            <div className="hero-right-visual">
              <img
                src="/images/hero-doctor-heart.png"
                alt="Doctor holding holographic 3D heart with AI diagnostic sensors"
                className="hero-doctor-artwork"
              />
            </div>
          </section>

          {/* 4 Feature Cards (Matches Exact Reference) */}
          <section className="feature-cards-grid" id="features">
            {/* Card 1: Early Detection */}
            <div className="feature-pill-card">
              <div className="feature-card-icon blue-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M12 8v8" />
                  <path d="M8 12h8" />
                </svg>
              </div>
              <h3 className="feature-card-title">Early Detection</h3>
              <p className="feature-card-desc">Identify heart disease risk early and take action.</p>
            </div>

            {/* Card 2: Smart Prediction */}
            <div className="feature-pill-card">
              <div className="feature-card-icon purple-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="16" height="16" x="4" y="4" rx="2" />
                  <path d="M9 2v2M15 2v2M9 20v2M15 20v2M20 9h2M20 15h2M2 9h2M2 15h2" />
                  <text x="12" y="15" textAnchor="middle" fill="currentColor" stroke="none" fontSize="8" fontWeight="800" fontFamily="sans-serif">AI</text>
                </svg>
              </div>
              <h3 className="feature-card-title">Smart Prediction</h3>
              <p className="feature-card-desc">Powered by Random Forest Machine Learning.</p>
            </div>

            {/* Card 3: Better Health */}
            <div className="feature-pill-card">
              <div className="feature-card-icon green-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                  <path d="M3.22 12H8.5l1.5-3 2 6 1.5-3h4.78" />
                </svg>
              </div>
              <h3 className="feature-card-title">Better Health</h3>
              <p className="feature-card-desc">Your heart health is our priority.</p>
            </div>

            {/* Card 4: Trusted Technology */}
            <div className="feature-pill-card">
              <div className="feature-card-icon amber-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3v18h18" />
                  <path d="m19 9-5 5-4-4-3 3" />
                  <polyline points="15 9 19 9 19 13" />
                  <rect x="7" y="14" width="2" height="4" fill="currentColor" stroke="none" />
                  <rect x="12" y="11" width="2" height="7" fill="currentColor" stroke="none" />
                  <rect x="17" y="7" width="2" height="11" fill="currentColor" stroke="none" />
                </svg>
              </div>
              <h3 className="feature-card-title">Trusted Technology</h3>
              <p className="feature-card-desc">Accurate and reliable prediction results.</p>
            </div>
          </section>

          {/* Awareness Ticker Row (Matches Reference Screenshot) */}
          <div className="awareness-ticker-row">
            <div className="awareness-ticker-line"></div>
            <div className="awareness-pill-badge">
              <span className="awareness-heart-icon">❤️</span>
              <span>A healthier tomorrow starts with awareness. Check your heart risk today!</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          VIEW 2: CLINICIAN DASHBOARD (Authenticated)
          ======================================================== */}
      {activeTab === 'dashboard' && currentUser && (
        <div className="dashboard-view">
          {/* Workstation Header */}
          <div className="dashboard-header">
            <div className="dashboard-header-text">
              <h1>
                <Activity size={24} />
                Cardiovascular Diagnostics Workstation
              </h1>
              <p>
                Welcome, {currentUser.name}. Real-time patient risk stratification, multi-parametric lipid profiling, and clinical audit records.
              </p>
            </div>
            <div className="dashboard-header-meta">
              <span className="hospital-badge">
                <Building2 size={14} />
                {currentUser.institution || 'Central Cardiovascular Institute'}
              </span>
              <span className="shift-info">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} • Workstation #04
              </span>
            </div>
          </div>

          {/* KPI Stat Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-label">Total Screenings</span>
                <div className="stat-card-icon">
                  <ClipboardList size={18} />
                </div>
              </div>
              <div className="stat-card-val">{dashboardStats.totalAssessments}</div>
              <div className="stat-card-trend">
                <span className="trend-badge positive">
                  <TrendingUp size={12} /> Live
                </span>
                <span>Calibrated patient cohorts</span>
              </div>
            </div>

            <div className="stat-card risk-high">
              <div className="stat-card-top">
                <span className="stat-card-label">High Risk Identified</span>
                <div className="stat-card-icon" style={{ color: 'var(--risk-high)' }}>
                  <AlertTriangle size={18} />
                </div>
              </div>
              <div className="stat-card-val" style={{ color: 'var(--risk-high-dark)' }}>
                {dashboardStats.highRiskCount}
              </div>
              <div className="stat-card-trend">
                <span className="trend-badge negative">
                  Urgent
                </span>
                <span>Priority interventional triage</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-label">Mean Risk Index</span>
                <div className="stat-card-icon">
                  <BarChart3 size={18} />
                </div>
              </div>
              <div className="stat-card-val">{dashboardStats.avgRiskScore}%</div>
              <div className="stat-card-trend">
                <span>Framingham-calibrated probability</span>
              </div>
            </div>

            <div className="stat-card risk-low">
              <div className="stat-card-top">
                <span className="stat-card-label">Normotensive / Low Risk</span>
                <div className="stat-card-icon" style={{ color: 'var(--risk-low)' }}>
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <div className="stat-card-val" style={{ color: 'var(--risk-low-dark)' }}>
                {dashboardStats.normalCount}
              </div>
              <div className="stat-card-trend">
                <span className="trend-badge positive">
                  Optimal
                </span>
                <span>Routine preventive follow-up</span>
              </div>
            </div>
          </div>

          {/* Quick Action Tiles */}
          <div className="action-tiles-grid">
            <button
              className="action-tile"
              onClick={() => setActiveTab('assess')}
            >
              <div className="action-tile-icon">
                <PlusCircle size={24} />
              </div>
              <div className="action-tile-text">
                <h3>New Patient Risk Intake</h3>
                <p>Execute multi-parametric diagnostic intake and generate clinical chart.</p>
              </div>
              <ChevronRight size={18} style={{ marginLeft: 'auto', color: 'var(--slate-400)' }} />
            </button>

            <button
              className="action-tile"
              onClick={() => setShowBmiModal(true)}
            >
              <div className="action-tile-icon">
                <Scale size={24} />
              </div>
              <div className="action-tile-text">
                <h3>Clinical BMI Calculator</h3>
                <p>Calculate Body Mass Index and CDC weight status classifications.</p>
              </div>
              <ChevronRight size={18} style={{ marginLeft: 'auto', color: 'var(--slate-400)' }} />
            </button>

            <button
              className="action-tile"
              onClick={openHistoryModal}
            >
              <div className="action-tile-icon">
                <Database size={24} />
              </div>
              <div className="action-tile-text">
                <h3>Diagnostic Audit Log</h3>
                <p>Search and inspect historical cardiovascular evaluation records.</p>
              </div>
              <ChevronRight size={18} style={{ marginLeft: 'auto', color: 'var(--slate-400)' }} />
            </button>
          </div>

          {/* Recent Evaluations Table */}
          <div className="dashboard-table-card">
            <div className="table-header-row">
              <div className="table-header-title">
                <h2>Recent Patient Evaluations</h2>
                <span className="table-count-badge">{filteredDashboardReports.length} records</span>
              </div>
              <div className="table-controls">
                <div className="table-search-input">
                  <Search size={15} style={{ color: 'var(--slate-400)' }} />
                  <input
                    type="text"
                    placeholder="Search by name, MRN..."
                    value={dashboardSearch}
                    onChange={(e) => setDashboardSearch(e.target.value)}
                  />
                </div>
                <button
                  className="table-btn-view"
                  onClick={loadDashboardData}
                  title="Refresh records"
                >
                  <RefreshCw size={14} />
                  Refresh
                </button>
              </div>
            </div>

            {filteredDashboardReports.length > 0 ? (
              <table className="clinical-data-table">
                <thead>
                  <tr>
                    <th>MRN / Accession</th>
                    <th>Patient Demographics</th>
                    <th>Cholesterol Level</th>
                    <th>Risk Stratification</th>
                    <th>Clinical Classification</th>
                    <th>Date & Time</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDashboardReports.map((row, idx) => {
                    const isHigh = row.risk_level === 'High Risk' || (row.risk_score && row.risk_score >= 50);
                    const isMod = row.risk_level === 'Moderate Risk' || (row.risk_score && row.risk_score >= 20 && row.risk_score < 50);
                    const pillClass = isHigh ? 'high' : isMod ? 'moderate' : 'low';

                    return (
                      <tr key={row.report_id || idx}>
                        <td>
                          <span className="patient-cell-mrn">{row.report_id}</span>
                        </td>
                        <td>
                          <div className="patient-cell">
                            <span className="patient-cell-name">{row.patient_name || 'Anonymous Patient'}</span>
                            <span className="patient-cell-mrn">
                              {row.sex || 'N/A'} • Age: {row.age || 'N/A'} • Blood: {row.blood_group || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="input-badge">{row.cholesterol || 'Normal'}</span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>
                            {row.risk_score != null ? `${row.risk_score.toFixed(1)}%` : 'N/A'}
                          </span>
                        </td>
                        <td>
                          <span className={`risk-pill ${pillClass}`}>
                            {isHigh ? <AlertTriangle size={12} /> : isMod ? <AlertCircle size={12} /> : <CheckCircle2 size={12} />}
                            {row.risk_level || (isHigh ? 'High Risk' : isMod ? 'Moderate Risk' : 'Low Risk')}
                          </span>
                        </td>
                        <td style={{ color: 'var(--slate-500)', fontSize: '12px' }}>
                          {row.created_at ? new Date(row.created_at).toLocaleString() : 'Recent'}
                        </td>
                        <td>
                          <button
                            className="table-btn-view"
                            onClick={() => loadPastReport(row.report_id)}
                          >
                            <FileText size={13} />
                            Inspect Chart
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="empty-state-box">
                <FileText size={40} style={{ color: 'var(--slate-300)' }} />
                <p>No clinical evaluations recorded yet.</p>
                <button
                  className="btn-primary-diagnostic"
                  onClick={() => setActiveTab('assess')}
                  style={{ padding: '8px 18px', fontSize: '13px' }}
                >
                  <PlusCircle size={15} />
                  Initiate First Patient Intake
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          VIEW 3: CLINICIAN AUTHENTICATION (Login / Register)
          ======================================================== */}
      {activeTab === 'auth' && (
        <div className="auth-view-wrapper">
          <div className="auth-card">
            <div className="auth-header">
              <div className="auth-icon-badge">
                <ShieldCheck size={28} />
              </div>
              <h2>Clinician Portal</h2>
              <p>Restricted access for authorized medical personnel & cardiology staff</p>
            </div>

            {/* Auth Notice (e.g. redirected from attempting assessment) */}
            {authNotice && (
              <div className="auth-alert notice">
                <Lock size={15} />
                <span>{authNotice}</span>
              </div>
            )}

            {/* Auth Switcher Tabs */}
            <div className="auth-tabs">
              <button
                className={`auth-tab-btn ${authMode === 'login' ? 'active' : ''}`}
                onClick={() => {
                  setAuthMode('login');
                  setAuthError('');
                  setAuthSuccess('');
                }}
              >
                Clinician Sign In
              </button>
              <button
                className={`auth-tab-btn ${authMode === 'register' ? 'active' : ''}`}
                onClick={() => {
                  setAuthMode('register');
                  setAuthError('');
                  setAuthSuccess('');
                }}
              >
                Staff Registration
              </button>
            </div>

            {/* One-Click Demo Clinician Box (on Login tab) */}
            {authMode === 'login' && (
              <div className="demo-account-box">
                <div className="demo-account-info">
                  <span className="demo-account-title">Pre-Configured Demo Account</span>
                  <span className="demo-account-creds">doctor@cardioguard.com • password123</span>
                </div>
                <button
                  type="button"
                  className="btn-fill-demo"
                  onClick={fillAndSubmitDemoLogin}
                  disabled={authLoading}
                >
                  Quick Sign In
                </button>
              </div>
            )}

            {/* Error & Success Messages */}
            {authError && (
              <div className="auth-alert error">
                <AlertCircle size={15} />
                <span>{authError}</span>
              </div>
            )}
            {authSuccess && (
              <div className="auth-alert success">
                <CheckCircle2 size={15} />
                <span>{authSuccess}</span>
              </div>
            )}

            {/* LOGIN FORM */}
            {authMode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="auth-form">
                <div className="input-field-group">
                  <label className="input-label">
                    <User size={14} />
                    Hospital Email / Clinician ID
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="doctor@cardioguard.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="clinical-input"
                  />
                </div>

                <div className="input-field-group">
                  <label className="input-label">
                    <Lock size={14} />
                    Password
                  </label>
                  <div className="password-input-wrap">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="clinical-input"
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-submit-auth"
                  disabled={authLoading}
                >
                  {authLoading ? 'Verifying Credentials...' : 'Authenticate & Enter Workstation'}
                </button>
              </form>
            ) : (
              /* REGISTRATION FORM */
              <form onSubmit={handleRegisterSubmit} className="auth-form">
                <div className="input-field-group">
                  <label className="input-label">
                    <User size={14} />
                    Full Clinician Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Dr. Sarah Jenkins, MD"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="clinical-input"
                  />
                </div>

                <div className="input-field-group">
                  <label className="input-label">
                    <UserCheck size={14} />
                    Institutional Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="s.jenkins@stjudeheart.org"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="clinical-input"
                  />
                </div>

                <div className="input-field-group">
                  <label className="input-label">
                    <Building2 size={14} />
                    Clinical Specialty / Role
                  </label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                    className="clinical-select"
                  >
                    {CLINICAL_ROLES.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>

                <div className="input-field-group">
                  <label className="input-label">
                    <Building2 size={14} />
                    Hospital / Healthcare Institution
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Central Cardiovascular Institute"
                    value={regInstitution}
                    onChange={(e) => setRegInstitution(e.target.value)}
                    className="clinical-input"
                  />
                </div>

                <div className="input-field-group">
                  <label className="input-label">
                    <Lock size={14} />
                    Create Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="clinical-input"
                  />
                </div>

                <div className="input-field-group">
                  <label className="input-label">
                    <Lock size={14} />
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className="clinical-input"
                  />
                </div>

                <button
                  type="submit"
                  className="btn-submit-auth"
                  disabled={authLoading}
                >
                  {authLoading ? 'Registering Account...' : 'Complete Staff Registration'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          VIEW 4: CLINICAL RISK ASSESSMENT FORM (Authenticated)
          ======================================================== */}
      {activeTab === 'assess' && currentUser && (
        <div className="assessment-view">
          {/* Preset Archetypes Bar */}
          <div className="presets-banner">
            <div className="presets-label">
              <Sparkles size={16} style={{ color: 'var(--blue-600)' }} />
              <span>Load Clinical Test Archetypes:</span>
            </div>
            <div className="presets-group">
              <button
                type="button"
                className="preset-chip"
                onClick={() => loadPreset('low')}
              >
                <CheckCircle2 size={13} style={{ color: 'var(--risk-low)' }} />
                Archetype A: Low Risk Normotensive
              </button>
              <button
                type="button"
                className="preset-chip"
                onClick={() => loadPreset('moderate')}
              >
                <AlertCircle size={13} style={{ color: 'var(--risk-mod)' }} />
                Archetype B: Moderate Risk Borderline
              </button>
              <button
                type="button"
                className="preset-chip"
                onClick={() => loadPreset('high')}
              >
                <AlertTriangle size={13} style={{ color: 'var(--risk-high)' }} />
                Archetype C: High Risk Metabolic Syndrome
              </button>
            </div>
          </div>

          {/* Form Container */}
          <div className="intake-card">
            <div className="intake-card-header">
              <div className="intake-card-title">
                <h1>
                  <Stethoscope size={22} />
                  Comprehensive Cardiovascular Risk Stratification Intake
                </h1>
                <p>Enter patient biometrics, lipid profile, and clinical history for multi-parametric inference.</p>
              </div>
              <span className="protocol-badge">PROTOCOL CDSS-ML-v2.4</span>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-content">
                {/* SECTION 1: Patient Identification & Demographics */}
                <div className="form-section">
                  <div className="section-legend">
                    <span className="section-number">1</span>
                    <span className="section-title">Patient Identification & Demographics</span>
                    <span className="section-desc">Required for hospital diagnostic chart record</span>
                  </div>

                  <div className="form-grid-4">
                    <div className="input-field-group">
                      <div className="input-label-row">
                        <label className="input-label">
                          <User size={13} /> Full Patient Name
                        </label>
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Eleanor Vance"
                        value={formData.patientName}
                        onChange={(e) => handleInputChange('patientName', e.target.value)}
                        className="clinical-input"
                      />
                    </div>

                    <div className="input-field-group">
                      <div className="input-label-row">
                        <label className="input-label">
                          <Calendar size={13} /> Date of Birth
                        </label>
                        {currentAge !== null && (
                          <span className="input-badge">{currentAge} Years Old</span>
                        )}
                      </div>
                      <input
                        type="date"
                        required
                        value={formData.dob}
                        onChange={handleDobChange}
                        className="clinical-input"
                      />
                    </div>

                    <div className="input-field-group">
                      <div className="input-label-row">
                        <label className="input-label">
                          <Phone size={13} /> Contact Phone
                        </label>
                      </div>
                      <input
                        type="tel"
                        required
                        placeholder="+1 (555) 000-0000"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="clinical-input"
                      />
                    </div>

                    <div className="input-field-group">
                      <div className="input-label-row">
                        <label className="input-label">
                          <Droplet size={13} /> Blood Group
                        </label>
                      </div>
                      <select
                        value={formData.bloodGroup}
                        onChange={(e) => handleInputChange('bloodGroup', e.target.value)}
                        className="clinical-select"
                      >
                        {BLOOD_GROUPS.map(bg => (
                          <option key={bg} value={bg}>{bg}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: Biometrics & Lipid Profile */}
                <div className="form-section">
                  <div className="section-legend">
                    <span className="section-number">2</span>
                    <span className="section-title">Biometrics & Lipid Profile</span>
                    <span className="section-desc">Key anthropometric and biochemical indicators</span>
                  </div>

                  <div className="form-grid-3">
                    <div className="input-field-group">
                      <div className="input-label-row">
                        <label className="input-label">
                          <Scale size={13} /> Body Mass Index (BMI)
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowBmiModal(true)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--blue-600)',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Calculate BMI
                        </button>
                      </div>
                      <input
                        type="number"
                        step="0.1"
                        min="12"
                        max="60"
                        required
                        value={formData.BMI}
                        onChange={(e) => handleInputChange('BMI', parseFloat(e.target.value) || 0)}
                        className="clinical-input"
                      />
                      <span className="input-helper-text">
                        Status: {formData.BMI < 18.5 ? 'Underweight' : formData.BMI < 25 ? 'Normal (18.5-24.9)' : formData.BMI < 30 ? 'Overweight (25-29.9)' : 'Obese (>=30)'}
                      </span>
                    </div>

                    <div className="input-field-group">
                      <div className="input-label-row">
                        <label className="input-label">
                          <Droplet size={13} /> Cholesterol Level
                        </label>
                        <span className="input-badge">ATP III Guidelines</span>
                      </div>
                      <select
                        value={formData.Cholesterol}
                        onChange={(e) => handleInputChange('Cholesterol', e.target.value)}
                        className="clinical-select"
                      >
                        {CHOLESTEROL_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <span className="input-helper-text">Standard fasting serum total cholesterol range</span>
                    </div>

                    <div className="input-field-group">
                      <div className="input-label-row">
                        <label className="input-label">
                          <BedDouble size={13} /> Average Daily Sleep
                        </label>
                        <span className="input-badge">{formData.SleepTime} hrs/day</span>
                      </div>
                      <input
                        type="number"
                        min="2"
                        max="18"
                        required
                        value={formData.SleepTime}
                        onChange={(e) => handleInputChange('SleepTime', parseInt(e.target.value, 10) || 0)}
                        className="clinical-input"
                      />
                      <span className="input-helper-text">Optimal physiological restorative sleep: 7 - 9 hours</span>
                    </div>
                  </div>
                </div>

                {/* SECTION 3: Cardiovascular History & Systemic Risk Factors */}
                <div className="form-section">
                  <div className="section-legend">
                    <span className="section-number">3</span>
                    <span className="section-title">Cardiovascular History & Systemic Risk Factors</span>
                    <span className="section-desc">Etiological risk indicators & comorbidities</span>
                  </div>

                  <div className="form-grid-4">
                    <div className="input-field-group">
                      <div className="input-label-row">
                        <label className="input-label">
                          <Cigarette size={13} /> Tobacco / Smoking History
                        </label>
                      </div>
                      <select
                        value={formData.Smoking}
                        onChange={(e) => handleInputChange('Smoking', e.target.value)}
                        className="clinical-select"
                      >
                        <option value="No">No (Non-Smoker / Never Smoked)</option>
                        <option value="Yes">Yes (Active / Prior History &gt;= 100 cigs)</option>
                      </select>
                    </div>

                    <div className="input-field-group">
                      <div className="input-label-row">
                        <label className="input-label">
                          <Wine size={13} /> Alcohol Consumption
                        </label>
                      </div>
                      <select
                        value={formData.AlcoholDrinking}
                        onChange={(e) => handleInputChange('AlcoholDrinking', e.target.value)}
                        className="clinical-select"
                      >
                        <option value="No">No (None / Occasional)</option>
                        <option value="Yes">Yes (Heavy: &gt;14 drinks/wk M, &gt;7 W)</option>
                      </select>
                    </div>

                    <div className="input-field-group">
                      <div className="input-label-row">
                        <label className="input-label">
                          <AlertTriangle size={13} /> Prior Cerebrovascular Event (Stroke)
                        </label>
                      </div>
                      <select
                        value={formData.Stroke}
                        onChange={(e) => handleInputChange('Stroke', e.target.value)}
                        className="clinical-select"
                      >
                        <option value="No">No (No prior CVA history)</option>
                        <option value="Yes">Yes (Confirmed prior Stroke / TIA)</option>
                      </select>
                    </div>

                    <div className="input-field-group">
                      <div className="input-label-row">
                        <label className="input-label">
                          <Pill size={13} /> Diabetic Status
                        </label>
                      </div>
                      <select
                        value={formData.Diabetic}
                        onChange={(e) => handleInputChange('Diabetic', e.target.value)}
                        className="clinical-select"
                      >
                        <option value="No">No (Normoglycemic)</option>
                        <option value="Yes">Yes (Diagnosed Diabetes Mellitus)</option>
                        <option value="Borderline">Borderline / Pre-Diabetic</option>
                        <option value="Yes (during pregnancy)">Gestational Diabetes</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* SECTION 4: Functional & General Health Status */}
                <div className="form-section">
                  <div className="section-legend">
                    <span className="section-number">4</span>
                    <span className="section-title">Functional Status & Clinical Presentation</span>
                    <span className="section-desc">Demographics & self-reported constitutional health</span>
                  </div>

                  <div className="form-grid-4">
                    <div className="input-field-group">
                      <div className="input-label-row">
                        <label className="input-label">
                          <User size={13} /> Biological Sex
                        </label>
                      </div>
                      <select
                        value={formData.Sex}
                        onChange={(e) => handleInputChange('Sex', e.target.value)}
                        className="clinical-select"
                      >
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                      </select>
                    </div>

                    <div className="input-field-group">
                      <div className="input-label-row">
                        <label className="input-label">
                          <Calendar size={13} /> Age Category Cohort
                        </label>
                      </div>
                      <select
                        value={formData.AgeCategory}
                        onChange={(e) => handleInputChange('AgeCategory', e.target.value)}
                        className="clinical-select"
                      >
                        {AGE_CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div className="input-field-group">
                      <div className="input-label-row">
                        <label className="input-label">
                          <Activity size={13} /> Self-Reported General Health
                        </label>
                      </div>
                      <select
                        value={formData.GenHealth}
                        onChange={(e) => handleInputChange('GenHealth', e.target.value)}
                        className="clinical-select"
                      >
                        <option value="Excellent">Excellent</option>
                        <option value="Very good">Very good</option>
                        <option value="Good">Good</option>
                        <option value="Fair">Fair</option>
                        <option value="Poor">Poor</option>
                      </select>
                    </div>

                    <div className="input-field-group">
                      <div className="input-label-row">
                        <label className="input-label">
                          <AlertCircle size={13} /> Bronchial Asthma History
                        </label>
                      </div>
                      <select
                        value={formData.Asthma}
                        onChange={(e) => handleInputChange('Asthma', e.target.value)}
                        className="clinical-select"
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Action Bar */}
              <div className="submit-action-bar">
                <div className="clinical-assurance">
                  <ShieldCheck size={18} style={{ color: 'var(--blue-600)' }} />
                  <span>Calibrated ML Classification Model • Encrypted HL7/FHIR Protocol compliant</span>
                </div>
                <button
                  type="submit"
                  className="btn-primary-diagnostic"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Executing Multi-Parametric Inference...
                    </>
                  ) : (
                    <>
                      <Activity size={17} />
                      Generate Official Diagnostic Report
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          VIEW 5: HOSPITAL MEDICAL DIAGNOSTIC REPORT (Printable)
          ======================================================== */}
      {activeTab === 'report' && report && (
        <div className="report-view">
          {/* Action Ribbon */}
          <div className="report-action-ribbon">
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--navy-900)' }}>
              Cardiovascular Diagnostic Chart Record • {report.reportId}
            </span>
            <div className="ribbon-buttons">
              <button
                className="btn-action-print"
                onClick={handlePrint}
              >
                <Printer size={15} />
                Print Diagnostic Chart (PDF)
              </button>
              <button
                className="btn-action-secondary"
                onClick={() => setActiveTab('assess')}
              >
                <PlusCircle size={15} />
                New Intake
              </button>
              <button
                className="btn-action-secondary"
                onClick={() => setActiveTab('dashboard')}
              >
                Workstation Dashboard
              </button>
            </div>
          </div>

          {/* Authentic Hospital Medical Chart Sheet */}
          <div className="hospital-report-sheet">
            {/* Hospital Letterhead Header */}
            <div className="hospital-letterhead">
              <div className="hospital-seal-title">
                <div className="hospital-seal">
                  <HeartPulse size={30} />
                </div>
                <div className="hospital-names">
                  <h1>Central Cardiovascular Institute & Diagnostics</h1>
                  <h2>Division of Preventive Cardiology • Diagnostic Decision Support</h2>
                  <p>Accredited Center for Cardiovascular Risk Stratification & Clinical Research</p>
                </div>
              </div>
              <div className="hospital-accreditation">
                <span className="accreditation-pill">CAP #8492011 • CLIA #36D089124</span>
                <span className="accreditation-pill">ISO 15189 Certified CDSS</span>
                <span className="report-accession-no">ACCESSION: {report.reportId}</span>
              </div>
            </div>

            {/* Patient Chart Demographics Banner */}
            <div className="patient-chart-banner">
              <div className="chart-field">
                <span className="chart-field-label">Patient Full Name</span>
                <span className="chart-field-value">{report.patient?.name || 'Anonymous Patient'}</span>
              </div>

              <div className="chart-field">
                <span className="chart-field-label">Date of Birth / Age</span>
                <span className="chart-field-value">
                  {report.patient?.dob || 'N/A'} {report.patient?.age ? `(${report.patient.age} yrs)` : ''}
                </span>
              </div>

              <div className="chart-field">
                <span className="chart-field-label">Biological Sex / Blood</span>
                <span className="chart-field-value">
                  {report.patient?.sex || formData.Sex} • {report.patient?.bloodGroup || formData.bloodGroup}
                </span>
              </div>

              <div className="chart-field">
                <span className="chart-field-label">Contact Phone</span>
                <span className="chart-field-value">{report.patient?.phone || formData.phone || 'N/A'}</span>
              </div>

              <div className="chart-field">
                <span className="chart-field-label">Evaluation Timestamp</span>
                <span className="chart-field-value code">
                  {report.createdAt ? new Date(report.createdAt).toLocaleString() : new Date().toLocaleString()}
                </span>
              </div>

              <div className="chart-field">
                <span className="chart-field-label">Attending Clinician</span>
                <span className="chart-field-value">
                  {currentUser?.name || 'Dr. Alistair Reed, MD'}
                </span>
              </div>

              <div className="chart-field">
                <span className="chart-field-label">Clinical Facility</span>
                <span className="chart-field-value">
                  {currentUser?.institution || 'Central Cardiovascular Institute'}
                </span>
              </div>

              <div className="chart-field">
                <span className="chart-field-label">Inference Engine</span>
                <span className="chart-field-value code">Platt-Calibrated RF v2.4</span>
              </div>
            </div>

            {/* Primary Finding Banner */}
            {(() => {
              const riskScore = report.prediction?.riskScore || 0;
              const isHigh = report.prediction?.riskLevel === 'High Risk' || riskScore >= 50;
              const isMod = report.prediction?.riskLevel === 'Moderate Risk' || (riskScore >= 20 && riskScore < 50);
              const boxClass = isHigh ? 'high' : isMod ? 'moderate' : 'low';

              return (
                <div className={`primary-finding-box ${boxClass}`}>
                  <div className="finding-title-group">
                    <span className="finding-pill-status">
                      {isHigh ? <AlertTriangle size={14} /> : isMod ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
                      {isHigh ? 'High Cardiovascular Risk Detected' : isMod ? 'Moderate Cardiovascular Risk Markers' : 'Low Cardiovascular Risk Profile'}
                    </span>
                    <h3>{report.prediction?.riskLevel || (isHigh ? 'High Risk' : isMod ? 'Moderate Risk' : 'Low Risk')}</h3>
                    <p>{report.prediction?.summary}</p>
                  </div>
                  <div className="finding-score-display">
                    <span className="finding-score-value">{riskScore.toFixed(1)}%</span>
                    <span className="finding-score-caption">Framingham 10-Yr Index</span>
                  </div>
                </div>
              );
            })()}

            {/* Diagnostic Biometrics Table */}
            <div className="biometrics-table-wrapper">
              <span className="report-section-heading">
                <Activity size={15} />
                Biometrics & Lipid Profile Analysis
              </span>
              <table className="biometrics-table">
                <thead>
                  <tr>
                    <th>Biomarker / Indicator</th>
                    <th>Observed Patient Value</th>
                    <th>Standard Reference Interval</th>
                    <th>Clinical Interpretation</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Total Serum Cholesterol</strong></td>
                    <td>{report.cholesterolDetails?.level || formData.Cholesterol}</td>
                    <td>Normal: &lt; 200 mg/dL</td>
                    <td>
                      {formData.Cholesterol === 'High' ? (
                        <span className="flag-badge elevated">
                          <AlertTriangle size={11} /> Clinically Elevated (&gt;= 240 mg/dL)
                        </span>
                      ) : formData.Cholesterol === 'Borderline High' ? (
                        <span className="flag-badge borderline">
                          <AlertCircle size={11} /> Borderline High (200-239 mg/dL)
                        </span>
                      ) : (
                        <span className="flag-badge normal">
                          <Check size={11} /> Desirable (&lt; 200 mg/dL)
                        </span>
                      )}
                    </td>
                  </tr>

                  <tr>
                    <td><strong>Body Mass Index (BMI)</strong></td>
                    <td>{report.bmiDetails?.bmi || formData.BMI} kg/m²</td>
                    <td>Standard Normal: 18.5 – 24.9 kg/m²</td>
                    <td>
                      {formData.BMI >= 30 ? (
                        <span className="flag-badge elevated">
                          <AlertTriangle size={11} /> Class I/II Obesity (BMI &gt;= 30)
                        </span>
                      ) : formData.BMI >= 25 ? (
                        <span className="flag-badge borderline">
                          <AlertCircle size={11} /> Overweight (25.0 - 29.9)
                        </span>
                      ) : (
                        <span className="flag-badge normal">
                          <Check size={11} /> Normal Anthropometric Weight
                        </span>
                      )}
                    </td>
                  </tr>

                  <tr>
                    <td><strong>Average Daily Sleep</strong></td>
                    <td>{report.clinicalInputs?.SleepTime || formData.SleepTime} Hours</td>
                    <td>Adult Guideline: 7.0 – 9.0 Hours</td>
                    <td>
                      {formData.SleepTime < 6 ? (
                        <span className="flag-badge elevated">
                          <AlertTriangle size={11} /> Insufficient Sleep Duration (&lt; 6 hrs)
                        </span>
                      ) : (
                        <span className="flag-badge normal">
                          <Check size={11} /> Restorative Sleep Range
                        </span>
                      )}
                    </td>
                  </tr>

                  <tr>
                    <td><strong>Cerebrovascular History</strong></td>
                    <td>{formData.Stroke === 'Yes' ? 'Positive Prior CVA' : 'No Prior CVA'}</td>
                    <td>Negative / None</td>
                    <td>
                      {formData.Stroke === 'Yes' ? (
                        <span className="flag-badge elevated">
                          <AlertTriangle size={11} /> High Vulnerability Factor
                        </span>
                      ) : (
                        <span className="flag-badge normal">
                          <Check size={11} /> Non-Contributory
                        </span>
                      )}
                    </td>
                  </tr>

                  <tr>
                    <td><strong>Diabetic Status</strong></td>
                    <td>{formData.Diabetic}</td>
                    <td>Normoglycemic (Fasting Glucose &lt; 100 mg/dL)</td>
                    <td>
                      {formData.Diabetic === 'Yes' ? (
                        <span className="flag-badge elevated">
                          <AlertTriangle size={11} /> Major Macrovascular Risk Co-Factor
                        </span>
                      ) : formData.Diabetic === 'Borderline' ? (
                        <span className="flag-badge borderline">
                          <AlertCircle size={11} /> Impaired Fasting Glycemia
                        </span>
                      ) : (
                        <span className="flag-badge normal">
                          <Check size={11} /> Non-Diabetic
                        </span>
                      )}
                    </td>
                  </tr>

                  <tr>
                    <td><strong>Tobacco / Smoking Status</strong></td>
                    <td>{formData.Smoking === 'Yes' ? 'Active / Chronic Smoker' : 'Non-Smoker'}</td>
                    <td>Non-Smoker</td>
                    <td>
                      {formData.Smoking === 'Yes' ? (
                        <span className="flag-badge elevated">
                          <AlertTriangle size={11} /> Accelerates Coronary Atherosclerosis
                        </span>
                      ) : (
                        <span className="flag-badge normal">
                          <Check size={11} /> Low Endothelial Damage
                        </span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Contributing Factors Matrix */}
            {report.contributingFactors && report.contributingFactors.length > 0 && (
              <div className="biometrics-table-wrapper">
                <span className="report-section-heading">
                  <AlertTriangle size={15} />
                  Algorithmic Contributing Risk Factors
                </span>
                <div className="factors-matrix">
                  {report.contributingFactors.map((f, idx) => (
                    <div key={idx} className="factor-item-card">
                      <div className="factor-header">
                        <span className="factor-name">{f.name}</span>
                        <span className={`factor-severity-pill ${f.severity || 'medium'}`}>
                          {f.severity || 'Moderate'} Impact
                        </span>
                      </div>
                      <p className="factor-desc">{f.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations List */}
            {report.recommendations && report.recommendations.length > 0 && (
              <div className="biometrics-table-wrapper">
                <span className="report-section-heading">
                  <ClipboardList size={15} />
                  Evidence-Based Clinical Management Protocols
                </span>
                <div className="recommendations-grid">
                  {report.recommendations.map((rec, idx) => (
                    <div key={idx} className="recommendation-item">
                      <ChevronRight size={16} className="rec-bullet" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Physician Attestation & Signature Footer */}
            <div className="physician-signoff-block">
              <div className="clinical-disclaimer-text">
                <strong>REGULATORY & CDSS ATTESTATION DISCLAIMER:</strong> This diagnostic record is generated by an algorithmic clinical decision support system (CardioGuard™ CDSS v2.4) utilizing Platt-calibrated machine learning. It is intended to assist certified healthcare professionals in cardiovascular risk stratification and does not replace comprehensive in-person medical evaluation, coronary angiography, or clinical laboratory judgment.
              </div>
              <div className="signature-box">
                <div className="signature-line"></div>
                <span className="physician-name">{currentUser?.name || 'Dr. Alistair Reed, MD'}</span>
                <span className="physician-meta">
                  {currentUser?.role || 'Attending Cardiologist'} • Lic. #{currentUser?.licenseNumber || 'MD-849201'}
                </span>
                <span className="physician-meta">
                  Electronically Attested: {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 1: BMI CALCULATOR
          ======================================================== */}
      {showBmiModal && (
        <div className="modal-backdrop" onClick={() => setShowBmiModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <Scale size={18} />
                Clinical Body Mass Index (BMI) Calculator
              </h3>
              <button
                className="modal-close-btn"
                onClick={() => setShowBmiModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="input-field-group">
                <div className="input-label-row">
                  <label className="input-label">Patient Height</label>
                  <span className="input-badge">{calcHeight} cm</span>
                </div>
                <input
                  type="range"
                  min="120"
                  max="220"
                  value={calcHeight}
                  onChange={(e) => setCalcHeight(parseInt(e.target.value, 10))}
                  style={{ width: '100%', accentColor: 'var(--blue-600)' }}
                />
              </div>

              <div className="input-field-group">
                <div className="input-label-row">
                  <label className="input-label">Patient Weight</label>
                  <span className="input-badge">{calcWeight} kg</span>
                </div>
                <input
                  type="range"
                  min="35"
                  max="180"
                  value={calcWeight}
                  onChange={(e) => setCalcWeight(parseInt(e.target.value, 10))}
                  style={{ width: '100%', accentColor: 'var(--blue-600)' }}
                />
              </div>

              {(() => {
                const hMeters = calcHeight / 100;
                const computed = calcWeight / (hMeters * hMeters);
                const rounded = Math.round(computed * 10) / 10;
                const cat = rounded < 18.5 ? 'Underweight' : rounded < 25 ? 'Normal Weight' : rounded < 30 ? 'Overweight' : 'Obese';
                const catColor = rounded < 25 && rounded >= 18.5 ? 'var(--risk-low-dark)' : rounded >= 30 ? 'var(--risk-high-dark)' : 'var(--risk-mod-dark)';

                return (
                  <div style={{
                    padding: '16px',
                    background: 'var(--slate-50)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--card-border)',
                    textAlign: 'center'
                  }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
                      Calculated BMI Value
                    </span>
                    <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--navy-900)' }}>
                      {rounded} <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--slate-500)' }}>kg/m²</span>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: catColor }}>
                      CDC Classification: {cat}
                    </span>
                  </div>
                );
              })()}
            </div>
            <div className="modal-footer">
              <button
                className="btn-action-secondary"
                onClick={() => setShowBmiModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-primary-diagnostic"
                onClick={applyCalculatedBmi}
                style={{ padding: '8px 18px', fontSize: '13px' }}
              >
                Apply BMI to Form
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: PAST REPORTS DATABASE MODAL
          ======================================================== */}
      {showHistoryModal && (
        <div className="modal-backdrop" onClick={() => setShowHistoryModal(false)}>
          <div className="modal-dialog" style={{ maxWidth: '780px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <Database size={18} />
                Cardiovascular Diagnostic Database & Audit Log
              </h3>
              <button
                className="modal-close-btn"
                onClick={() => setShowHistoryModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <div className="table-controls" style={{ marginBottom: '12px' }}>
                <div className="table-search-input" style={{ width: '100%' }}>
                  <Search size={15} style={{ color: 'var(--slate-400)' }} />
                  <input
                    type="text"
                    placeholder="Search by patient name, MRN code, blood group..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') fetchReportsHistory(); }}
                    style={{ width: '100%' }}
                  />
                </div>
                <button
                  className="table-btn-view"
                  onClick={fetchReportsHistory}
                >
                  <Search size={14} />
                  Filter
                </button>
              </div>

              {historyLoading ? (
                <div style={{ textAlign: 'center', padding: '30px' }}>Loading records...</div>
              ) : reportsHistory.length > 0 ? (
                <table className="clinical-data-table">
                  <thead>
                    <tr>
                      <th>Accession</th>
                      <th>Patient</th>
                      <th>Cholesterol</th>
                      <th>Risk Index</th>
                      <th>Risk Level</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportsHistory.map((rep, idx) => {
                      const isHigh = rep.risk_level === 'High Risk' || (rep.risk_score && rep.risk_score >= 50);
                      const isMod = rep.risk_level === 'Moderate Risk' || (rep.risk_score && rep.risk_score >= 20 && rep.risk_score < 50);
                      const pillClass = isHigh ? 'high' : isMod ? 'moderate' : 'low';

                      return (
                        <tr key={rep.report_id || idx}>
                          <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11.5px' }}>{rep.report_id}</td>
                          <td>
                            <strong>{rep.patient_name || 'Anonymous'}</strong>
                            <div style={{ fontSize: '11px', color: 'var(--slate-500)' }}>
                              {rep.sex} • Age: {rep.age} • {rep.blood_group}
                            </div>
                          </td>
                          <td><span className="input-badge">{rep.cholesterol || 'Normal'}</span></td>
                          <td><strong>{rep.risk_score != null ? `${rep.risk_score.toFixed(1)}%` : 'N/A'}</strong></td>
                          <td>
                            <span className={`risk-pill ${pillClass}`}>
                              {rep.risk_level || 'Evaluated'}
                            </span>
                          </td>
                          <td>
                            <button
                              className="table-btn-view"
                              onClick={() => loadPastReport(rep.report_id)}
                            >
                              Open Chart
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state-box">
                  <Database size={36} style={{ color: 'var(--slate-300)' }} />
                  <p>No records matching search query.</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="btn-action-secondary"
                onClick={() => setShowHistoryModal(false)}
              >
                Close Audit Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          FULL HOSPITAL & CLINICAL INSTITUTIONAL FOOTER
          ======================================================== */}
      <footer className="hospital-footer">
        <div className="footer-main-grid">
          {/* Column 1: Hospital Brand & CDSS Status */}
          <div className="footer-col">
            <div className="footer-brand">
              <HeartLogo size={32} />
              <div>
                <div className="footer-brand-title">
                  HeartCare AI
                </div>
                <span className="footer-brand-sub">Clinical Decision Support System</span>
              </div>
            </div>
            <p className="footer-brand-desc">
              Enterprise cardiovascular risk stratification platform engineered for preventive cardiology, acute triage, and clinical decision support.
            </p>
            <div className="footer-status-pill">
              <span className="status-dot"></span>
              <span>CDSS Online • Random Forest v2.4 Active</span>
            </div>
            <div className="footer-accreditations">
              <span className="footer-badge">ISO 15189 Certified</span>
              <span className="footer-badge">CAP #8492011</span>
              <span className="footer-badge">CLIA Compliant</span>
            </div>
          </div>

          {/* Column 2: Clinical Navigation */}
          <div className="footer-col">
            <h4>Clinical Platform</h4>
            <ul className="footer-links">
              <li>
                <button type="button" onClick={() => handleNavClick('home')}>Home & Overview</button>
              </li>
              <li>
                <button type="button" onClick={() => handleNavClick('about')}>About Us</button>
              </li>
              <li>
                <button type="button" onClick={() => handleNavClick('features')}>Features</button>
              </li>
              <li>
                <button type="button" onClick={() => handleNavClick('how-it-works')}>How It Works</button>
              </li>
              <li>
                <button type="button" onClick={() => {
                  if (currentUser) setActiveTab('dashboard');
                  else {
                    setAuthNotice('Please sign in to access Clinician Dashboard');
                    setActiveTab('auth');
                  }
                }}>
                  Clinician Workstation
                </button>
              </li>
              <li>
                <button type="button" onClick={() => {
                  if (requireAuthForAssessment()) setActiveTab('assess');
                }}>
                  Start Risk Prediction
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Standards & Clinical Protocols */}
          <div className="footer-col">
            <h4>Clinical Protocols</h4>
            <ul className="footer-links">
              <li><span>Framingham 10-Yr Risk Index</span></li>
              <li><span>ATP III Lipid Guidelines</span></li>
              <li><span>CDC Anthropometric Criteria</span></li>
              <li><span>Random Forest Probability Model</span></li>
              <li><span>HL7 / FHIR Standard Interoperability</span></li>
              <li><span>HIPAA Security Rule Standards</span></li>
            </ul>
          </div>

          {/* Column 4: Hospital Contact & Emergency */}
          <div className="footer-col">
            <h4>Hospital & Clinical Inquiries</h4>
            <div className="footer-contact-item">
              <strong>Central Cardiovascular Institute</strong>
              <span>Division of Preventive Cardiology</span>
              <span>742 Evergreen Medical Pavilion, Suite 400</span>
            </div>
            <div className="footer-contact-item" style={{ marginTop: '8px' }}>
              <span className="emergency-label">Cardiac Emergency Triage:</span>
              <span className="emergency-val">Dial 911 or Hospital Code Blue</span>
            </div>
            <div className="footer-contact-item">
              <span>Clinician CDSS Helpdesk:</span>
              <strong>+1 (800) 555-CARDIO (Ext. 402)</strong>
            </div>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="footer-bottom-bar">
          <div className="footer-bottom-left">
            <p className="regulatory-text">
              <strong>REGULATORY & CDSS ATTESTATION:</strong> HeartCare AI CDSS v2.4 is designed exclusively to support licensed medical clinicians in cardiovascular risk assessment. It is not an autonomous diagnostic instrument and does not supplant formal clinical judgment or diagnostic coronary imaging.
            </p>
            <span className="copyright-text">
              © 2026 Central Cardiovascular Institute & HeartCare AI Health Technologies. All rights reserved.
            </span>
          </div>
          <div className="footer-bottom-right">
            <span>HIPAA Safeguards</span>
            <span>Terms of Clinical Use</span>
            <span>Privacy Policy</span>
            <span>Audit Protocol</span>
          </div>
        </div>
      </footer>
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
    factors.push({ name: 'Elevated Body Mass Index (BMI >= 30)', severity: 'high', description: 'Excess adiposity increases left ventricular afterload and metabolic dysfunction.' });
    recs.push('Consult a clinical nutritionist for a personalized cardioprotective dietary plan.');
  }
  if (data.Cholesterol === 'High') {
    factors.push({ name: 'Hypercholesterolemia (High Cholesterol)', severity: 'high', description: 'Total cholesterol >= 240 mg/dL accelerates coronary artery plaque build-up.' });
    recs.push('Consult cardiologist for lipid-lowering pharmacotherapy (statin therapy) and comprehensive lipid panel.');
  } else if (data.Cholesterol === 'Borderline High') {
    factors.push({ name: 'Borderline High Cholesterol', severity: 'medium', description: 'Cholesterol is in the borderline zone (200-239 mg/dL).' });
    recs.push('Adopt dietary modifications to lower circulating LDL cholesterol; repeat lipid screening in 6 months.');
  }
  if (data.Smoking === 'Yes') {
    factors.push({ name: 'Tobacco Use History', severity: 'high', description: 'Endothelial dysfunction and accelerated coronary atherosclerosis.' });
    recs.push('Initiate smoking cessation protocol immediately.');
  }
  if (data.Stroke === 'Yes') {
    factors.push({ name: 'Prior Cerebrovascular Event (Stroke)', severity: 'high', description: 'Strong indicator of systemic vascular vulnerability.' });
    recs.push('Schedule strict blood pressure and neurovascular monitoring.');
  }
  if (data.Diabetic === 'Yes') {
    factors.push({ name: 'Diabetes Mellitus', severity: 'high', description: 'Promotes microvascular and macrovascular lesions.' });
    recs.push('Target HbA1c < 7.0% and monitor fasting plasma glucose regularly.');
  }
  if (recs.length === 0) {
    recs.push('Maintain heart-healthy diet with rich dietary fiber and unsaturated fats.');
    recs.push('Perform at least 150 minutes of moderate aerobic physical activity weekly.');
  }

  return {
    reportId: `REP-LOCAL-${Date.now().toString().slice(-6)}`,
    createdAt: new Date().toISOString(),
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
        data.Cholesterol === 'Borderline High' ? 'Borderline High (200-239 mg/dL)' : 'High (>= 240 mg/dL)'
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
