import sys
import pickle
import json
import os
import numpy as np

def get_condition_from_score(score):
    if score >= 85:
        return "Môi trường Tuyệt vời"
    elif score >= 70:
        return "Môi trường Ổn định"
    elif score >= 50:
        return "Cần cải thiện (Hơi tệ)"
    else:
        return "Cảnh báo: Hại sức khỏe"

def main():
    try:
        # 1. Lấy tham số
        temp = float(sys.argv[1])
        hum = float(sys.argv[2])
        lux = float(sys.argv[3])
        input_data = [[temp, hum, lux]]

        # 2. Định nghĩa đường dẫn 2 file model
        current_dir = os.path.dirname(os.path.abspath(__file__))
        path_reg = os.path.join(current_dir, 'model_regressor.pkl')  # Model chấm điểm
        path_clf = os.path.join(current_dir, 'model_classifier.pkl') # Model dán nhãn

        # 3. Load & Dự đoán
        # --- Model Điểm số (Regressor) ---
        with open(path_reg, 'rb') as f:
            reg = pickle.load(f)
        score = int(reg.predict(input_data)[0]) # Lấy điểm
        condition = get_condition_from_score(score) # Lấy đánh giá môi trường

        # --- Model Nhãn (Classifier) ---
        with open(path_clf, 'rb') as f:
            clf = pickle.load(f)
        advise = clf.predict(input_data)[0] # Lấy nhãn

        # 4. Trả về JSON gọn lẹ
        result = {
            "status": "success",
            "score": score,
            "advise": advise,
            "env_evaluation": condition, # Chữ (VD: Môi trường Tuyệt vời)
            "input": {"temp": temp, "hum": hum, "lux": lux}
        }
        print(json.dumps(result))

    except Exception as e:
        # Có lỗi thì báo vầy
        print(json.dumps({"status": "error", "message": str(e)}))

if __name__ == "__main__":
    main()
