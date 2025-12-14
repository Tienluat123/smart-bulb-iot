import sys
import pickle
import json
import os
import numpy as np

# Load Model
current_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(current_dir, 'model_env.pkl')

try:
    with open(model_path, 'rb') as f:
        model = pickle.load(f)

    # Nhận 3 tham số: Temp, Hum, Lux
    # Node.js gọi: python predict.py [temp] [hum] [lux]
    if len(sys.argv) < 4:
        raise Exception("Thiếu tham số đầu vào (Cần: Temp, Hum, Lux)")

    temp = float(sys.argv[1])
    hum = float(sys.argv[2])
    lux = float(sys.argv[3]) # <--- Sửa chỗ này thành Lux

    # Dự đoán
    prediction = model.predict([[temp, hum, lux]])

    # Trả về JSON
    result = {
        "status": "success",
        "input": {"temp": temp, "hum": hum, "lux": lux},
        "env_evaluation": prediction[0]
    }
    print(json.dumps(result))

except Exception as e:
    print(json.dumps({"status": "error", "message": str(e)}))
