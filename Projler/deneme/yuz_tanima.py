import cv2
import dlib

# Yüz tanıyıcıyı yükleyin
detector = dlib.get_frontal_face_detector()

# Kamerayı başlatın
cap = cv2.VideoCapture(0)

while True:
    # Kamera görüntüsünü alın
    ret, frame = cap.read()

    # Görüntüyü gri tonlamaya çevirin
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    # Yüzleri tespit edin
    faces = detector(gray)

    # Yüzlerin etrafına kutu çizin
    for face in faces:
        left, top, right, bottom = (face.left(), face.top(), face.right(), face.bottom())
        cv2.rectangle(frame, (left, top), (right, bottom), (0, 255, 0), 2)

    # Görüntüyü ekranda göster
    cv2.imshow("Yüz Tanıma", frame)

    # 'q' tuşuna basarak çıkabilirsiniz
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Kamerayı kapatın ve pencereyi kapatın
cap.release()
cv2.destroyAllWindows()
