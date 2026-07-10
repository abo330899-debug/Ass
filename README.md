# QR Public Server

مشروع QR Public تجريبي خاص بسيرفرك فقط، وغير مربوط بأي سيرفر حكومي.

## التشغيل على Replit

1. افتح Replit.
2. اختر Import from GitHub.
3. ضع رابط الريبو:

```txt
https://github.com/abo330899-debug/Ass.git
```

4. بعد فتح المشروع افتح Shell واكتب:

```bash
npm install
npm start
```

## الروابط المهمة

قارئ الكاميرا:

```txt
/qrpubliclink
```

عرض وثيقة تجريبية:

```txt
/qrpubliclink/DOC-1001
/qrpubliclink/DOC-1002
```

توليد QR:

```txt
/api/make-qr/DOC-1001
/api/make-qr/DOC-1002
```

API تحقق:

```txt
/api/verify/DOC-1001
```

إذا كاميرا المنصة ترسل القراءة إلى API:

```txt
POST /api/read-qr
Content-Type: application/json

{
  "QRcode": "DOC-1001"
}
```

## تعديل البيانات

افتح `server.js` وعدل داخل object اسمه `documents`.

## ملاحظات

- الأفضل أن يحتوي QR على رابط كامل مثل:

```txt
https://your-replit-url/qrpubliclink/DOC-1001
```

- هذا المشروع تجريبي من سيرفرك وليس نظاماً حكومياً.
