# QR Public Server

مشروع QR Public تجريبي خاص بسيرفرك فقط، وغير مربوط بأي سيرفر حكومي.

## التشغيل على Cloudflare Pages - الأفضل

1. افتح Cloudflare.
2. ادخل إلى:

```txt
Workers & Pages
```

3. اضغط:

```txt
Create application
```

4. اختر:

```txt
Pages
Connect to Git
```

5. اختار الريبو:

```txt
abo330899-debug/Ass
```

6. الإعدادات:

```txt
Project name:
ass

Production branch:
main

Framework preset:
None

Build command:
اتركه فارغ

Build output directory:
public
```

7. اضغط Save and Deploy.

بعد النشر راح يعطيك رابط مثل:

```txt
https://ass.pages.dev
```

## روابط Cloudflare بعد النشر

قارئ الكاميرا:

```txt
https://ass.pages.dev/qrpubliclink
```

عرض وثيقة تجريبية:

```txt
https://ass.pages.dev/qrpubliclink/DOC-1001
https://ass.pages.dev/qrpubliclink/DOC-1002
```

توليد QR:

```txt
https://ass.pages.dev/api/make-qr/DOC-1001
https://ass.pages.dev/api/make-qr/DOC-1002
```

API تحقق:

```txt
https://ass.pages.dev/api/verify/DOC-1001
```

إذا كاميرا المنصة ترسل القراءة إلى API:

```txt
POST https://ass.pages.dev/api/read-qr
Content-Type: application/json

{
  "QRcode": "DOC-1001"
}
```

## التشغيل كـ Cloudflare Worker عبر Wrangler

إذا تريد تنشره كـ Worker بدل Pages:

```bash
npm install
npx wrangler login
npm run deploy
```

هذا يستخدم الملفات:

```txt
worker.js
wrangler.toml
```

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

## تعديل البيانات

للنسخة القديمة Node/Replit عدل داخل:

```txt
server.js
```

لنسخة Cloudflare Pages عدل داخل:

```txt
public/_worker.js
```

لنسخة Cloudflare Worker عدل داخل:

```txt
worker.js
```

ابحث عن object اسمه:

```txt
documents
```

وغير البيانات كما تريد.

## ملاحظات

- الأفضل أن يحتوي QR على رابط كامل مثل:

```txt
https://ass.pages.dev/qrpubliclink/DOC-1001
```

- هذا المشروع تجريبي من سيرفرك وليس نظاماً حكومياً.
