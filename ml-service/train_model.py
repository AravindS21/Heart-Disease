"""
Heart Disease Prediction Model Training Script
Updated with:
- Cholesterol Level ('Normal', 'Borderline High', 'High')
- Removed: PhysicalHealth, MentalHealth, DiffWalking, PhysicalActivity, SkinCancer, KidneyDisease, Race
"""

import os
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, roc_auc_score, accuracy_score

def generate_dataset(n_samples=35000, random_state=42):
    rng = np.random.default_rng(random_state)

    age_cats = [
        '18-24', '25-29', '30-34', '35-39', '40-44', '45-49',
        '50-54', '55-59', '60-64', '65-69', '70-74', '75-79', '80 or older'
    ]
    age_weights = [0.07, 0.08, 0.08, 0.08, 0.08, 0.08, 0.09, 0.10, 0.10, 0.09, 0.06, 0.05, 0.04]
    age_category = rng.choice(age_cats, size=n_samples, p=age_weights)

    sex = rng.choice(['Female', 'Male'], size=n_samples, p=[0.52, 0.48])

    # BMI roughly lognormal with mean ~ 28
    bmi = np.clip(rng.normal(loc=28.2, scale=5.8, size=n_samples), 15.0, 55.0).round(1)

    # General health
    gen_health_cats = ['Excellent', 'Very good', 'Good', 'Fair', 'Poor']
    gen_health = rng.choice(gen_health_cats, size=n_samples, p=[0.20, 0.35, 0.30, 0.11, 0.04])

    # Sleep hours
    sleep_time = np.clip(rng.normal(loc=7.1, scale=1.4, size=n_samples).round(), 3, 14).astype(int)

    # Cholesterol Level: Normal (<200), Borderline High (200-239), High (>=240)
    chol_cats = ['Normal', 'Borderline High', 'High']
    cholesterol = rng.choice(chol_cats, size=n_samples, p=[0.58, 0.27, 0.15])

    # Binary comorbidities and habits
    smoking = np.where(rng.random(n_samples) < 0.38, 'Yes', 'No')
    alcohol = np.where(rng.random(n_samples) < 0.07, 'Yes', 'No')
    stroke = np.where(rng.random(n_samples) < 0.038, 'Yes', 'No')
    asthma = np.where(rng.random(n_samples) < 0.134, 'Yes', 'No')

    diabetic_opts = ['No', 'Yes', 'No, borderline diabetes', 'Yes (during pregnancy)']
    diabetic = rng.choice(diabetic_opts, size=n_samples, p=[0.83, 0.13, 0.02, 0.02])

    df = pd.DataFrame({
        'BMI': bmi,
        'Cholesterol': cholesterol,
        'SleepTime': sleep_time,
        'Smoking': smoking,
        'AlcoholDrinking': alcohol,
        'Stroke': stroke,
        'Sex': sex,
        'AgeCategory': age_category,
        'Diabetic': diabetic,
        'GenHealth': gen_health,
        'Asthma': asthma
    })

    # Log-odds clinical weights
    age_risk = {
        '18-24': -2.2, '25-29': -1.9, '30-34': -1.6, '35-39': -1.2,
        '40-44': -0.8, '45-49': -0.4, '50-54': 0.1,  '55-59': 0.5,
        '60-64': 0.9,  '65-69': 1.3,  '70-74': 1.7,  '75-79': 2.1,
        '80 or older': 2.5
    }
    gen_risk = {
        'Excellent': -0.9, 'Very good': -0.5, 'Good': 0.1, 'Fair': 0.8, 'Poor': 1.4
    }
    chol_risk = {
        'Normal': -0.2, 'Borderline High': 0.55, 'High': 1.15
    }

    log_odds = -3.1
    log_odds += df['AgeCategory'].map(age_risk)
    log_odds += df['GenHealth'].map(gen_risk)
    log_odds += df['Cholesterol'].map(chol_risk)
    log_odds += np.where(df['Sex'] == 'Male', 0.55, -0.2)
    log_odds += np.where(df['Smoking'] == 'Yes', 0.80, -0.1)
    log_odds += np.where(df['Stroke'] == 'Yes', 1.95, 0.0)
    log_odds += np.where(df['Diabetic'] == 'Yes', 1.25, np.where(df['Diabetic'] == 'No, borderline diabetes', 0.45, 0.0))
    log_odds += np.where(df['Asthma'] == 'Yes', 0.35, 0.0)
    log_odds += np.where(df['BMI'] > 30, (df['BMI'] - 30) * 0.05, 0.0)
    log_odds += np.where(df['SleepTime'] < 6, 0.30, np.where(df['SleepTime'] > 9, 0.25, -0.1))

    prob = 1.0 / (1.0 + np.exp(-log_odds))
    heart_disease = np.where(rng.random(n_samples) < prob, 'Yes', 'No')
    df['HeartDisease'] = heart_disease

    return df

def train_and_save():
    print("Generating updated clinical training dataset with Cholesterol...")
    df = generate_dataset(n_samples=35000, random_state=42)
    
    os.makedirs('dataset', exist_ok=True)
    df.to_csv('dataset/heart_disease_updated.csv', index=False)
    print(f"Dataset generated with {len(df)} records. Heart disease rate: {(df['HeartDisease'] == 'Yes').mean():.2%}")

    feature_cols = [
        'BMI', 'Cholesterol', 'SleepTime', 'Smoking', 'AlcoholDrinking',
        'Stroke', 'Sex', 'AgeCategory', 'Diabetic', 'GenHealth', 'Asthma'
    ]

    numeric_features = ['BMI', 'SleepTime']
    categorical_features = [col for col in feature_cols if col not in numeric_features]

    X = df[feature_cols]
    y = (df['HeartDisease'] == 'Yes').astype(int)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numeric_features),
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), categorical_features)
        ]
    )

    base_model = RandomForestClassifier(
        n_estimators=100,
        max_depth=12,
        min_samples_leaf=5,
        class_weight='balanced',
        random_state=42,
        n_jobs=-1
    )

    pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('classifier', base_model)
    ])

    print("Fitting calibrated classifier with 3-fold CV...")
    calibrated_pipeline = CalibratedClassifierCV(estimator=pipeline, method='sigmoid', cv=3)
    calibrated_pipeline.fit(X_train, y_train)

    y_pred = calibrated_pipeline.predict(X_test)
    y_prob = calibrated_pipeline.predict_proba(X_test)[:, 1]

    roc = roc_auc_score(y_test, y_prob)
    acc = accuracy_score(y_test, y_pred)
    print(f"Test Accuracy: {acc:.4f}, ROC AUC: {roc:.4f}")
    print("\nClassification Report:\n", classification_report(y_test, y_pred))

    os.makedirs('ml-service', exist_ok=True)
    model_path = os.path.join('ml-service', 'heart_disease_model.joblib')
    joblib.dump({
        'pipeline': calibrated_pipeline,
        'feature_cols': feature_cols,
        'numeric_features': numeric_features,
        'categorical_features': categorical_features
    }, model_path)
    print(f"Updated model saved successfully to {model_path}")

if __name__ == '__main__':
    train_and_save()
