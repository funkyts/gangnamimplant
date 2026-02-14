import os
import requests
import json

API_KEY = os.getenv("ANTHROPIC_API_KEY")

if not API_KEY:
    try:
        with open('.env.local', 'r') as f:
            for line in f:
                if line.startswith('ANTHROPIC_API_KEY='):
                    API_KEY = line.split('=')[1].strip().strip('"').strip("'")
                    break
    except:
        pass

if not API_KEY:
    print("Error: API Key not found")
    exit(1)

print(f"Checking models with API Key ending in ...{API_KEY[-4:]}")

url = "https://api.anthropic.com/v1/models"
headers = {
    "x-api-key": API_KEY,
    "anthropic-version": "2023-06-01",
    "content-type": "application/json"
}

try:
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        models = response.json()
        print("Available Models:")
        for model in models['data']:
            print(f"- {model['id']}")
    else:
        print(f"Error {response.status_code}: {response.text}")
except Exception as e:
    print(f"Exception: {e}")
