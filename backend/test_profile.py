import jwt
import os
import requests
jwt_secret = os.environ.get('JWT_SECRET')
if not jwt_secret:
    raise RuntimeError("JWT_SECRET environment variable is not set")
token = jwt.encode({'user_id': '69cf68fbb745ea0114848dbb'}, jwt_secret, algorithm='HS256')
res = requests.get('http://127.0.0.1:8000/api/worker/profile', headers={'Authorization': f'Bearer {token}'})
print(res.status_code, res.text)
