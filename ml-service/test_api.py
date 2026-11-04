import json
from app import app

payload = {
    "patientName": "Robert Vance",
    "dob": "1956-02-14",
    "age": 70,
    "phone": "+1 (555) 876-5432",
    "bloodGroup": "O+",
    "BMI": 34.2,
    "Cholesterol": "High",
    "SleepTime": 5,
    "Smoking": "Yes",
    "AlcoholDrinking": "Yes",
    "Stroke": "Yes",
    "Sex": "Male",
    "AgeCategory": "65-69",
    "Diabetic": "Yes",
    "GenHealth": "Poor",
    "Asthma": "Yes"
}

with app.test_client() as client:
    res = client.post('/api/predict', data=json.dumps(payload), content_type='application/json')
    print("Status:", res.status_code)
    data = res.get_json()
    print("Report ID:", data.get('reportId'))
    print("Risk Score:", data.get('prediction', {}).get('riskScore'), "%")
    print("Risk Level:", data.get('prediction', {}).get('riskLevel'))
    print("Contributing Factors:", [f['name'] for f in data.get('contributingFactors', [])])
    print("Cholesterol Details:", data.get('cholesterolDetails'))
