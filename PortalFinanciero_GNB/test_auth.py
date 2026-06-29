import requests
res = requests.post("http://localhost:8002/auth/login", json={"username": "maker01", "password": "demo1234"})
print("login:")
print(res.json())

res2 = requests.post("http://localhost:8002/auth/login-token", json={"username": "maker01", "token": "token1234"})
print("login-token:")
print(res2.json())
