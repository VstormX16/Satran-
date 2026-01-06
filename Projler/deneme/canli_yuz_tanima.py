import dlib
import numpy as np
import cv2
from scipy.spatial.distance import cosine
import tkinter as tk
from tkinter import messagebox

# Yüz tanıyıcı ve özellik çıkarıcıyı yükleyin
detector = dlib.get_frontal_face_detector()
sp = dlib.shape_predictor("C:/Users/kaand/Desktop/Projler/deneme/shape_predictor_68_face_landmarks.dat")  # Dosyanın yolunu buraya doğru yazın
facerec = dlib.face_recognition_model_v1("C:/Users/kaand/Desktop/Projler/deneme/dlib_face_recognition_resnet_model_v1.dat")

# Yüz özelliklerini çıkartan fonksiyon
def get_face_descriptor(image_path):
    img = cv2.imread(image_path)
    
    # Eğer resim yüklenemezse, hata mesajı ver
    if img is None:
        print(f"Error: Could not load image from {image_path}")
        return None  # Eğer dosya okunamazsa, None döndür
    
    faces = detector(img)
    
    if len(faces) == 0:
        return None

    # Yüzün özelliklerini çıkar
    face = faces[0]
    shape = sp(img, face)
    face_descriptor = facerec.compute_face_descriptor(img, shape)
    
    return np.array(face_descriptor)

# Birden fazla fotoğraf eklemek için fonksiyon
def get_average_descriptor(photo_paths):
    descriptors = []
    for photo in photo_paths:
        descriptor = get_face_descriptor(photo)
        if descriptor is not None:
            descriptors.append(descriptor)
    
    if descriptors:
        return np.mean(descriptors, axis=0)  # Fotoğrafların ortalamasını alıyoruz
    return None

# Kaan, Kevser, Zeynep ve Etem'e ait birden fazla fotoğraf ekleyelim
kaan_photos = [
    "C:/Users/kaand/Desktop/Projler/deneme/pc1.jpg",
    "C:/Users/kaand/Desktop/Projler/deneme/pc2.jpg",
    "C:/Users/kaand/Desktop/Projler/deneme/pc3.jpg",
    "C:/Users/kaand/Desktop/Projler/deneme/pc4.jpg",
    "C:/Users/kaand/Desktop/Projler/deneme/pc5.jpg",
    "C:/Users/kaand/Desktop/Projler/deneme/pc6.jpg"
]

kevser_photos = [
    "C:/Users/kaand/Desktop/Projler/deneme/kevser.jpg",
    "C:/Users/kaand/Desktop/Projler/deneme/kevser2.jpg",
    "C:/Users/kaand/Desktop/Projler/deneme/kevser3.jpg",
    "C:/Users/kaand/Desktop/Projler/deneme/kevser5.jpg",
    "C:/Users/kaand/Desktop/Projler/deneme/kevser6.jpg",
    "C:/Users/kaand/Desktop/Projler/deneme/kevser4.jpg"
]

zeynep_photos = [
    "C:/Users/kaand/Desktop/Projler/deneme/zeynep.jpg",
    "C:/Users/kaand/Desktop/Projler/deneme/zeynep2.jpg",
    "C:/Users/kaand/Desktop/Projler/deneme/zeynep3.jpg",
    "C:/Users/kaand/Desktop/Projler/deneme/zeynep4.jpg",
    "C:/Users/kaand/Desktop/Projler/deneme/zeynep5.jpg"
]

etem_photos = [
    "C:/Users/kaand/Desktop/Projler/deneme/etem.jpg",
]

face_1 = get_average_descriptor(kaan_photos)
face_2 = get_average_descriptor(kevser_photos)
face_3 = get_average_descriptor(zeynep_photos)
face_4 = get_average_descriptor(etem_photos)

# Kişilere isimler ekleyelim
names = ["Kaan", "Kevser", "Zeynep", "Etem"]  # Kişileri listeleyelim

# Yüz özelliklerini karşılaştıran fonksiyon
def compare_faces(face_descriptor, known_face_descriptor):
    distance = cosine(face_descriptor, known_face_descriptor)
    return distance  # Daha küçük bir mesafe, daha yakın bir eşleşme anlamına gelir

# Tkinter penceresini oluşturun
root = tk.Tk()
root.title("Yoklama Sistemi")

# İşaretleme kutuları için bir dictionary
checkboxes = {}

# Her kişi için bir checkbox ve etiket oluşturun
for i, name in enumerate(names):
    var = tk.BooleanVar()
    cb = tk.Checkbutton(root, text=name, variable=var)
    cb.grid(row=i, column=0, sticky="w")
    checkboxes[name] = var

# Onay butonunu ekleyelim
def submit():
    for name, var in checkboxes.items():
        if var.get():
            print(f"{name} için yoklama alındı.")
        else:
            print(f"{name} yoklamaya katılmadı.")
    messagebox.showinfo("Yoklama Sistemi", "Yoklama tamamlandı!")

submit_button = tk.Button(root, text="Yoklamayı Tamamla", command=submit)
submit_button.grid(row=len(names), column=0, pady=10)

# Tkinter penceresini aç
root.geometry("250x200")  # Pencere boyutunu ayarla

# Daha yüksek eşleşme oranı eşiği belirleyelim
MATCH_THRESHOLD = 0.95  # Yüz eşleşmesi için %95 oranı

# Kameradan canlı görüntü almak
cap = cv2.VideoCapture(0)  # 0, yerel kamera demektir

# FPS ayarını yapalım (maksimum FPS)
cap.set(cv2.CAP_PROP_FPS, 30)  # FPS değerini 30'a ayarlıyoruz
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)   # Genişlik
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)  # Yükseklik

# Kamera akışını işlemek için her 5. karede yüz tanımayı yapalım
frame_count = 0

while True:
    ret, frame = cap.read()

    # Görüntüyü gri tonlamaya çevirin
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    # Yüzleri tespit edin
    faces = detector(gray)

    for face in faces:
        # Yüzün özelliklerini çıkar
        shape = sp(frame, face)
        face_descriptor = facerec.compute_face_descriptor(frame, shape)
        face_descriptor = np.array(face_descriptor)

        # Kayıtlı yüzlerle karşılaştırma yap
        distances = [
            compare_faces(face_descriptor, face_1),
            compare_faces(face_descriptor, face_2),
            compare_faces(face_descriptor, face_3),
            compare_faces(face_descriptor, face_4)  # 4. yüzü karşılaştırıyoruz
        ]

        # En düşük mesafeye sahip olan yüzü bul
        min_distance = min(distances)
        min_index = distances.index(min_distance)

        # Eşleşme oranını hesapla
        match_percentage = (1 - min_distance) * 100

        # Eğer eşleşme oranı yüksekse
        if match_percentage > MATCH_THRESHOLD * 100:
            color = (0, 255, 0)  # Yeşil (eşleşme)
            label = f"{names[min_index]} - {match_percentage:.2f}%"
            # İlgili kişinin checkbox'ını işaretle
            checkboxes[names[min_index]].set(True)
        else:
            color = (0, 0, 255)  # Kırmızı (eşleşmiyor)
            label = f"Unrecognized - {match_percentage:.2f}%"

        # Yüzün etrafına kutu çizin
        left, top, right, bottom = (face.left(), face.top(), face.right(), face.bottom())
        cv2.rectangle(frame, (left, top), (right, bottom), color, 2)

        # Etiket ekleyin
        cv2.putText(frame, label, (left, top - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, color, 2)

    # Görüntüyü ekranda göster
    cv2.imshow("Yüz Tanıma", frame)

    # 'q' tuşuna basarak çıkabilirsiniz
    if cv2.waitKey(1) & 0xFF == ord('q'):  # Çıkmak için 'q' tuşuna basın
        break

    # Tkinter GUI'yi güncelleyin
    root.update()

# Kamerayı kapatın ve pencereyi kapatın
cap.release()
cv2.destroyAllWindows()
