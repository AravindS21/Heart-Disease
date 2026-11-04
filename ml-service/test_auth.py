import json
from app import app, init_db

init_db()

with app.test_client() as client:
    # 1. Test Login with seeded demo account
    res = client.post('/api/auth/login', data=json.dumps({
        'email': 'doctor@cardioguard.com',
        'password': 'password123'
    }), content_type='application/json')
    print("Demo Login Status:", res.status_code)
    print("Demo User:", res.get_json().get('user', {}).get('name'))

    # 2. Test Registration of new user
    res_reg = client.post('/api/auth/register', data=json.dumps({
        'name': 'Dr. Elena Rostova',
        'email': 'elena.rostova@hospital.org',
        'password': 'securepassword',
        'role': 'Cardiology Specialist',
        'institution': 'Metropolitan Heart Clinic',
        'phone': '+1 (555) 777-1234'
    }), content_type='application/json')
    print("Registration Status:", res_reg.status_code)
    print("Registered User:", res_reg.get_json().get('user', {}).get('name'))

    # 3. Test Login with newly registered user
    res_login = client.post('/api/auth/login', data=json.dumps({
        'email': 'elena.rostova@hospital.org',
        'password': 'securepassword'
    }), content_type='application/json')
    print("New User Login Status:", res_login.status_code)
    print("Login Message:", res_login.get_json().get('message'))

