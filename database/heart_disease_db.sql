-- ============================================================================
-- HeartCare AI - Clinical Database Schema & Stored Procedures
-- Database: heart_disease_db
-- Engine: InnoDB | Charset: utf8mb4
-- ============================================================================

CREATE DATABASE IF NOT EXISTS heart_disease_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE heart_disease_db;

-- ----------------------------------------------------------------------------
-- Table: users (Clinicians, Cardiologists, and Authorized Medical Staff)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    password_salt VARCHAR(64) NOT NULL,
    role VARCHAR(60) NOT NULL DEFAULT 'Cardiologist',
    institution VARCHAR(150) NOT NULL DEFAULT 'Central Cardiovascular Institute',
    phone VARCHAR(30) NULL,
    license_number VARCHAR(60) NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at DATETIME NULL,
    INDEX idx_user_email (email),
    INDEX idx_user_id (user_id),
    INDEX idx_user_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: patient_reports (Cardiovascular Diagnostic Evaluations & Screenings)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS patient_reports (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    report_id VARCHAR(50) NOT NULL UNIQUE,
    patient_name VARCHAR(120) NOT NULL,
    sex VARCHAR(10) NOT NULL,
    age INT NOT NULL,
    blood_group VARCHAR(10) NULL,
    dob VARCHAR(20) NULL,
    phone VARCHAR(30) NULL,
    bmi DOUBLE NOT NULL,
    cholesterol VARCHAR(30) NOT NULL DEFAULT 'Normal',
    sleep_hours DOUBLE NOT NULL DEFAULT 7.0,
    smoking VARCHAR(10) NOT NULL DEFAULT 'No',
    alcohol_drinking VARCHAR(10) NOT NULL DEFAULT 'No',
    stroke VARCHAR(10) NOT NULL DEFAULT 'No',
    diabetic VARCHAR(20) NOT NULL DEFAULT 'No',
    gen_health VARCHAR(20) NOT NULL DEFAULT 'Good',
    asthma VARCHAR(10) NOT NULL DEFAULT 'No',
    risk_score DOUBLE NOT NULL,
    risk_level VARCHAR(30) NOT NULL,
    clinician_id VARCHAR(50) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_report_patient (patient_name),
    INDEX idx_report_risk (risk_level),
    INDEX idx_report_clinician (clinician_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: user_audit_logs (Security & Clinical Access Audit Trail)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NULL,
    email VARCHAR(150) NULL,
    action VARCHAR(60) NOT NULL,
    ip_address VARCHAR(45) NULL DEFAULT '127.0.0.1',
    status VARCHAR(30) NOT NULL,
    details VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- STORED PROCEDURES
-- ============================================================================

DROP PROCEDURE IF EXISTS sp_register_user;
DROP PROCEDURE IF EXISTS sp_authenticate_user;
DROP PROCEDURE IF EXISTS sp_update_last_login;
DROP PROCEDURE IF EXISTS sp_get_user_by_id;
DROP PROCEDURE IF EXISTS sp_change_user_password;
DROP PROCEDURE IF EXISTS sp_get_dashboard_analytics;
DROP PROCEDURE IF EXISTS sp_save_patient_report;

DELIMITER //

-- ----------------------------------------------------------------------------
-- Procedure 1: sp_register_user
-- Registers a new clinician or medical staff member with audit logging.
-- ----------------------------------------------------------------------------
CREATE PROCEDURE sp_register_user(
    IN p_user_id VARCHAR(36),
    IN p_full_name VARCHAR(120),
    IN p_email VARCHAR(150),
    IN p_password_hash VARCHAR(255),
    IN p_password_salt VARCHAR(64),
    IN p_role VARCHAR(60),
    IN p_institution VARCHAR(150),
    IN p_phone VARCHAR(30),
    IN p_license_number VARCHAR(60),
    OUT p_status_code INT,
    OUT p_message VARCHAR(255)
)
BEGIN
    DECLARE user_count INT DEFAULT 0;

    -- Validate email uniqueness
    SELECT COUNT(*) INTO user_count FROM users WHERE LOWER(email) = LOWER(p_email);

    IF user_count > 0 THEN
        SET p_status_code = 409;
        SET p_message = 'An account with this email address already exists.';
        INSERT INTO user_audit_logs (user_id, email, action, status, details)
        VALUES (NULL, p_email, 'USER_REGISTRATION', 'FAILED_DUPLICATE_EMAIL', 'Registration rejected due to duplicate email.');
    ELSE
        INSERT INTO users (
            user_id, full_name, email, password_hash, password_salt,
            role, institution, phone, license_number, is_active, created_at
        ) VALUES (
            p_user_id, p_full_name, p_email, p_password_hash, p_password_salt,
            p_role, p_institution, p_phone, p_license_number, 1, NOW()
        );

        SET p_status_code = 201;
        SET p_message = 'Clinician registered successfully.';
        INSERT INTO user_audit_logs (user_id, email, action, status, details)
        VALUES (p_user_id, p_email, 'USER_REGISTRATION', 'SUCCESS', CONCAT('Role: ', p_role, ' | Institution: ', p_institution));
    END IF;
END //

-- ----------------------------------------------------------------------------
-- Procedure 2: sp_authenticate_user
-- Fetches authentication credentials and salt for email verification.
-- ----------------------------------------------------------------------------
CREATE PROCEDURE sp_authenticate_user(
    IN p_email VARCHAR(150)
)
BEGIN
    SELECT 
        id, 
        user_id, 
        full_name, 
        email, 
        password_hash, 
        password_salt, 
        role, 
        institution, 
        phone, 
        license_number, 
        is_active, 
        last_login_at
    FROM users
    WHERE LOWER(email) = LOWER(p_email);
END //

-- ----------------------------------------------------------------------------
-- Procedure 3: sp_update_last_login
-- Updates user timestamp upon successful password validation and logs audit.
-- ----------------------------------------------------------------------------
CREATE PROCEDURE sp_update_last_login(
    IN p_user_id VARCHAR(36)
)
BEGIN
    UPDATE users 
    SET last_login_at = NOW() 
    WHERE user_id = p_user_id;

    INSERT INTO user_audit_logs (user_id, email, action, status, details)
    SELECT user_id, email, 'USER_LOGIN', 'SUCCESS', 'Authenticated via HeartCare AI Portal'
    FROM users 
    WHERE user_id = p_user_id;
END //

-- ----------------------------------------------------------------------------
-- Procedure 4: sp_get_user_by_id
-- Retrieves user profile information by unique identifier.
-- ----------------------------------------------------------------------------
CREATE PROCEDURE sp_get_user_by_id(
    IN p_user_id VARCHAR(36)
)
BEGIN
    SELECT 
        id, 
        user_id, 
        full_name, 
        email, 
        role, 
        institution, 
        phone, 
        license_number, 
        is_active, 
        created_at, 
        last_login_at
    FROM users
    WHERE user_id = p_user_id;
END //

-- ----------------------------------------------------------------------------
-- Procedure 5: sp_change_user_password
-- Securely changes password hash and salt for a registered clinician.
-- ----------------------------------------------------------------------------
CREATE PROCEDURE sp_change_user_password(
    IN p_user_id VARCHAR(36),
    IN p_new_password_hash VARCHAR(255),
    IN p_new_password_salt VARCHAR(64),
    OUT p_status_code INT,
    OUT p_message VARCHAR(255)
)
BEGIN
    DECLARE user_found INT DEFAULT 0;
    SELECT COUNT(*) INTO user_found FROM users WHERE user_id = p_user_id;

    IF user_found = 0 THEN
        SET p_status_code = 404;
        SET p_message = 'User record not found.';
    ELSE
        UPDATE users
        SET password_hash = p_new_password_hash,
            password_salt = p_new_password_salt,
            updated_at = NOW()
        WHERE user_id = p_user_id;

        SET p_status_code = 200;
        SET p_message = 'Password updated successfully.';

        INSERT INTO user_audit_logs (user_id, email, action, status, details)
        SELECT user_id, email, 'PASSWORD_CHANGE', 'SUCCESS', 'Password updated by clinician'
        FROM users WHERE user_id = p_user_id;
    END IF;
END //

-- ----------------------------------------------------------------------------
-- Procedure 6: sp_get_dashboard_analytics
-- Generates aggregate clinical statistics for the clinician workstation.
-- ----------------------------------------------------------------------------
CREATE PROCEDURE sp_get_dashboard_analytics(
    IN p_clinician_id VARCHAR(50)
)
BEGIN
    SELECT 
        COUNT(*) AS total_screenings,
        SUM(CASE WHEN risk_level = 'High Risk' THEN 1 ELSE 0 END) AS high_risk_count,
        SUM(CASE WHEN risk_level = 'Moderate Risk' THEN 1 ELSE 0 END) AS moderate_risk_count,
        SUM(CASE WHEN risk_level = 'Low Risk' THEN 1 ELSE 0 END) AS low_risk_count,
        COALESCE(ROUND(AVG(risk_score), 1), 0.0) AS avg_risk_score
    FROM patient_reports
    WHERE (p_clinician_id IS NULL OR clinician_id = p_clinician_id OR p_clinician_id = '');
END //

-- ----------------------------------------------------------------------------
-- Procedure 7: sp_save_patient_report
-- Stores a patient's cardiovascular evaluation record.
-- ----------------------------------------------------------------------------
CREATE PROCEDURE sp_save_patient_report(
    IN p_report_id VARCHAR(50),
    IN p_patient_name VARCHAR(120),
    IN p_sex VARCHAR(10),
    IN p_age INT,
    IN p_blood_group VARCHAR(10),
    IN p_dob VARCHAR(20),
    IN p_phone VARCHAR(30),
    IN p_bmi DOUBLE,
    IN p_cholesterol VARCHAR(30),
    IN p_sleep_hours DOUBLE,
    IN p_smoking VARCHAR(10),
    IN p_alcohol_drinking VARCHAR(10),
    IN p_stroke VARCHAR(10),
    IN p_diabetic VARCHAR(20),
    IN p_gen_health VARCHAR(20),
    IN p_asthma VARCHAR(10),
    IN p_risk_score DOUBLE,
    IN p_risk_level VARCHAR(30),
    IN p_clinician_id VARCHAR(50)
)
BEGIN
    INSERT INTO patient_reports (
        report_id, patient_name, sex, age, blood_group, dob, phone,
        bmi, cholesterol, sleep_hours, smoking, alcohol_drinking,
        stroke, diabetic, gen_health, asthma, risk_score, risk_level,
        clinician_id, created_at
    ) VALUES (
        p_report_id, p_patient_name, p_sex, p_age, p_blood_group, p_dob, p_phone,
        p_bmi, p_cholesterol, p_sleep_hours, p_smoking, p_alcohol_drinking,
        p_stroke, p_diabetic, p_gen_health, p_asthma, p_risk_score, p_risk_level,
        p_clinician_id, NOW()
    );
END //

DELIMITER ;

-- ============================================================================
-- SEED DEFAULT AUTHORIZED CLINICIAN ACCOUNTS
-- Password: password123 (Salt: 7b3e1c9840f1a52d | Hash: 8733806f8a608d3a091d75f26172deb0e698d417dbe5e48b91f43a1c5bef0e1f)
-- ============================================================================
INSERT INTO users (
    user_id, full_name, email, password_hash, password_salt, 
    role, institution, phone, license_number, is_active, created_at
)
SELECT 
    'USR-DEMO-01', 
    'Dr. Alistair Reed, MD', 
    'doctor@cardioguard.com', 
    '8733806f8a608d3a091d75f26172deb0e698d417dbe5e48b91f43a1c5bef0e1f', 
    '7b3e1c9840f1a52d', 
    'Cardiologist', 
    'Central Cardiovascular Institute', 
    '+91 98765 43210', 
    'MD-849201', 
    1, 
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'doctor@cardioguard.com');

INSERT INTO users (
    user_id, full_name, email, password_hash, password_salt, 
    role, institution, phone, license_number, is_active, created_at
)
SELECT 
    'USR-DEMO-02', 
    'Dr. Sarah Chen, MD', 
    'schen@heartcare.ai', 
    '8733806f8a608d3a091d75f26172deb0e698d417dbe5e48b91f43a1c5bef0e1f', 
    '7b3e1c9840f1a52d', 
    'Preventive Cardiologist', 
    'Institute of Cardiovascular Sciences', 
    '+91 98765 43211', 
    'MD-912847', 
    1, 
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'schen@heartcare.ai');

