import dlib
import numpy as np
import cv2

# Yüz tanıyıcı ve özellik çıkarıcıyı yükleyin
detector = dlib.get_frontal_face_detector()
sp = dlib.shape_predictor("shape_predictor_68_face_landmarks.dat")
facerec = dlib.face_recognition_model_v1("dlib_face_recognition_resnet_model_v1.dat")

# Yüz özelliklerini çıkartan fonksiyon
def get_face_descriptor(image_path):
    img = cv2.imread(image_path)
    faces = detector(img)

    if len(faces) == 0:
        return None

    # Yüzün özelliklerini çıkar
    face = faces[0]
    shape = sp(img, face)
    face_descriptor = facerec.compute_face_descriptor(img, shape)
    
    return np.array(face_descriptor)

# Kayıtlı yüzlerin özelliklerini çıkarın ve kaydedin
face_1 = get_face_descriptor("kaan.jpg")  # İlk kişi fotoğrafı
face_2 = get_face_descriptor("zeynep.jpg")  # İkinci kişi fotoğrafı
face_3 = get_face_descriptor("kevser.jpg")  # Üçüncü kişi fotoğrafı

# Özellik vektörlerini kaydedin
np.save("face_1.npy", face_1)
np.save("face_2.npy", face_2)
np.save("face_3.npy", face_3)
