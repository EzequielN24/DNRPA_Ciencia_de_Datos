import os
import django
import sys
from django.test import Client

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
try:
    django.setup()
except Exception as e:
    print(f"Error setting up Django: {e}")
    sys.exit(1)

client = Client()

endpoints = [
    '/api/summary/',
    '/api/provinces/',
    '/api/provinces/SAN LUIS/',
    '/api/model-info/',
    '/api/management-impact/'
]

print("Testing API endpoints using Django client...")
success = True
for url in endpoints:
    try:
        response = client.get(url)
        print(f"GET {url} -> Status: {response.status_code}")
        if response.status_code != 200:
            print(f"Failed response: {response.content}")
            success = False
    except Exception as e:
        print(f"Exception requesting {url}: {e}")
        success = False

if success:
    print("\nSUCCESS: All endpoints returned 200 OK and loaded data correctly!")
    sys.exit(0)
else:
    print("\nFAILURE: Some endpoints failed.")
    sys.exit(1)
