import jwt
import requests
token = jwt.encode({'user_id': '69cf68fbb745ea0114848dbb'},
                   'f9b4c7d0e8a21f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a',
                   algorithm='HS256')
res = requests.get('http://127.0.0.1:8000/api/worker/profile', headers={'Authorization': f'Bearer {token}'})
print(res.status_code, res.text)
