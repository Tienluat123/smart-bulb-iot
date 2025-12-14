import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
import pickle
import os

# ==========================================
# 1. SINH DỮ LIỆU & GÁN NHÃN KÈM LỜI KHUYÊN
# ==========================================
def generate_smart_data(n_samples=5000):
    np.random.seed(42)
    
    # Sinh dữ liệu giả lập
    temperature = np.random.normal(28, 4, n_samples).clip(16, 40)
    humidity = np.random.normal(65, 12, n_samples).clip(20, 98)
    light_lux = np.random.normal(400, 200, n_samples).clip(0, 1200)
    
    df = pd.DataFrame({
        'temp': np.round(temperature, 1),
        'hum': np.round(humidity, 1),
        'lux': np.round(light_lux, 0).astype(int)
    })
    
    # --- Logic 1: Tính điểm (Health Score) ---
    def calculate_health_score(row):
        score = 100
        score -= abs(row['temp'] - 25) * 2.5
        if row['hum'] < 50: score -= (50 - row['hum']) * 0.5
        elif row['hum'] > 70: score -= (row['hum'] - 70) * 0.8 
        if row['lux'] < 300: score -= (300 - row['lux']) * 0.2 
        elif row['lux'] > 800: score -= (row['lux'] - 800) * 0.05 
        score += np.random.normal(0, 2) 
        return int(min(max(score, 0), 100))

    df['health_score'] = df.apply(calculate_health_score, axis=1)
    
    # --- Logic 2: Gán NHÃN + LỜI KHUYÊN (Gộp làm một) ---
    def determine_label_with_advice(row):
        t, h, l = row['temp'], row['hum'], row['lux']
        
        # 1. Nhóm Nguy Hiểm (Ưu tiên cao nhất)
        if t > 32: return "Nguy hiểm: Quá Nóng - Hãy bật máy lạnh ngay lập tức!"
        if t < 18: return "Nguy hiểm: Quá Lạnh - Mặc áo ấm và đóng cửa sổ!"
        if l < 200: return "Hại mắt: Quá Tối - Bật đèn học lên ngay!"
        
        # 2. Nhóm Khó Chịu (Ưu tiên nhì)
        if h > 85: return "Khó chịu: Quá Ẩm - Mở cửa hoặc bật chế độ hút ẩm."
        if h < 35: return "Khó chịu: Quá Khô - Uống nước và dùng máy phun sương."
        if l > 1000: return "Chói mắt: Ánh sáng gắt ✨ - Kéo rèm hoặc giảm đèn."
        
        # 3. Nhóm Cần Cải Thiện Nhẹ
        if t > 29: return "Hơi Nóng - Nên bật quạt nhẹ cho thoáng."
        if t < 22: return "Hơi Se Lạnh - Khoác thêm áo mỏng."
        if l < 350: return "Hơi Tối - Tăng độ sáng đèn lên một chút."
        
        # 4. Nhóm Tốt
        if df['health_score'].mean() > 80: # Logic phụ trợ
             return "Tuyệt vời: Môi trường lý tưởng - Giữ nguyên trạng thái này nhé!"
        
        return "Môi trường Ổn định - Có thể học tập tốt."
        
    df['label'] = df.apply(determine_label_with_advice, axis=1)
    return df

# ==========================================
# 2. TRAIN VÀ LƯU MODEL
# ==========================================
if __name__ == "__main__":
    print("⏳ Đang sinh dữ liệu...")
    df = generate_smart_data(n_samples=3000)
    
    # In thử vài dòng xem nhãn mới trông thế nào
    print(df[['temp', 'label']].head(5))

    X = df[['temp', 'hum', 'lux']]
    y_label = df['label']        
    y_score = df['health_score'] 

    # Train Classifier (Học thuộc các câu lời khuyên trên)
    print("🤖 Đang train Model...")
    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X, y_label)
    
    # Train Regressor (Học chấm điểm)
    reg = RandomForestRegressor(n_estimators=100, random_state=42)
    reg.fit(X, y_score)

    # Lưu file
    current_dir = os.path.dirname(os.path.abspath(__file__))
    path_clf = os.path.join(current_dir, 'model_classifier.pkl')
    path_reg = os.path.join(current_dir, 'model_regressor.pkl')

    with open(path_clf, 'wb') as f: pickle.dump(clf, f)
    with open(path_reg, 'wb') as f: pickle.dump(reg, f)

    print(f"\n✅ Xong! AI giờ biết tự đưa ra lời khuyên cụ thể rồi nha.")
