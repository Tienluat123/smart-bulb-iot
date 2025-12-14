import pandas as pd
import numpy as np
from sklearn.tree import DecisionTreeClassifier
import pickle
import os

# ==========================================
# 1. HÀM SINH DỮ LIỆU GIẢ LẬP (Data Generation)
# ==========================================
def generate_smart_data(n_samples=5000):
    np.random.seed(42) # Giữ cố định để kết quả giống nhau
    
    # 1. Sinh dữ liệu thô (Raw Data)
    # Nhiệt độ: Trung bình 28, dao động từ 18-38
    temperature = np.random.normal(28, 4, n_samples).clip(16, 40)
    # Độ ẩm: Trung bình 65%, dao động 30-95%
    humidity = np.random.normal(65, 12, n_samples).clip(20, 98)
    # Độ sáng (Lux): Giả lập từ 0 - 1000 Lux
    # (Lưu ý: Code cũ bạn dùng %, mình đổi sang Lux cho chuẩn phần cứng)
    light_lux = np.random.normal(400, 200, n_samples).clip(0, 1200)
    
    df = pd.DataFrame({
        'temp': np.round(temperature, 1),
        'hum': np.round(humidity, 1),
        'lux': np.round(light_lux, 0).astype(int)
    })
    
    # 2. Logic tính điểm (Scoring Algorithm)
    def calculate_health_score(row):
        score = 100
        
        # --- Phạt Nhiệt độ (Lý tưởng 24-26 độ) ---
        score -= abs(row['temp'] - 25) * 2.5
        
        # --- Phạt Độ ẩm (Lý tưởng 50-70%) ---
        if row['hum'] < 50: score -= (50 - row['hum']) * 0.5
        elif row['hum'] > 70: score -= (row['hum'] - 70) * 0.8 # Ẩm cao khó chịu hơn khô
            
        # --- Phạt Ánh sáng (Quan trọng nhất) ---
        # Đọc sách cần tối thiểu 300 Lux, tốt nhất 500 Lux
        if row['lux'] < 300:
            score -= (300 - row['lux']) * 0.2 # Phạt nặng nếu quá tối
        elif row['lux'] > 800:
            score -= (row['lux'] - 800) * 0.05 # Phạt nhẹ nếu chói quá
            
        # Thêm chút nhiễu ngẫu nhiên
        score += np.random.normal(0, 2) 
        
        return int(min(max(score, 0), 100))

    df['health_score'] = df.apply(calculate_health_score, axis=1)
    
    # 3. Gán nhãn "Sang chảnh" (Labeling)
    def categorize(score):
        if score >= 85: 
            return 'Môi trường Tuyệt vời'
        elif score >= 65: 
            return 'Môi trường Ổn định'
        elif score >= 40: 
            return 'Cần cải thiện (Hơi tệ)'
        else: 
            return 'Cảnh báo: Hại sức khỏe & Mắt'
        
    df['label'] = df['health_score'].apply(categorize)
    
    return df

# ==========================================
# 2. CHẠY TRAIN MODEL
# ==========================================
if __name__ == "__main__":
    print("Đang sinh dữ liệu và train model...")
    
    # 1. Tạo Data
    df = generate_smart_data(n_samples=2000)
    print(f"Đã tạo {len(df)} dòng dữ liệu mẫu.")
    print(df.head()) # In thử 5 dòng đầu xem sao

    # 2. Chuẩn bị Train
    X = df[['temp', 'hum', 'lux']] # Input
    y = df['label']                # Output (Label mới)

    # 3. Train Model (Decision Tree)
    clf = DecisionTreeClassifier(max_depth=5) # Giới hạn độ sâu để tránh overfitting
    clf.fit(X, y)

    # 4. Lưu Model
    current_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(current_dir, 'model_env.pkl')

    with open(model_path, 'wb') as f:
        pickle.dump(clf, f)

    print(f"Đã lưu Model AI mới tại: {model_path}")
    print("Bây giờ API báo cáo tuần sẽ trả về các đánh giá xịn xò hơn!")
