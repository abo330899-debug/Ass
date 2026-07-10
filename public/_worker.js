const documents = {
  "DOC-1001": {
    doc_id: "DOC-1001",
    company_name: "شركة عبد الستار التجريبية",
    owner_name: "Abdulstar Zeki",
    driver_name: "جلال مهدي",
    vehicle_number: "42040 دهوك",
    governorate: "دهوك",
    material: "مواد تجريبية",
    quantity: "100",
    unit: "كرتون",
    destination: "أربيل",
    status: "VALID",
    numberOfVersion: 1,
    created_at: "2026-07-10",
    note: "نموذج تجريبي من سيرفرك - غير حكومي"
  },
  "DOC-1002": {
    doc_id: "DOC-1002",
    company_name: "مختبر QR Public",
    owner_name: "Security Test",
    driver_name: "اياس سلمان",
    vehicle_number: "56680 دهوك",
    governorate: "دهوك",
    material: "اختبار كاميرا",
    quantity: "250",
    unit: "طن",
    destination: "بغداد",
    status: "VALID",
    numberOfVersion: 2,
    created_at: "2026-07-10",
    note: "هذا QR خاص بسيرفر تجريبي"
  }
};

function cleanCode(value) {
  return String(value || "").trim();
}

function findDocument(code) {
  return documents[cleanCode(code)] || null;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type"
    }
  });
}

function html(content, status = 200) {
  return new Response(content, {
    status,
    headers: { "content-type": "text/html; charset=utf-8" }
  });
}

function baseUrl(request) {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

function verifyPage() {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>QR Public Verify</title>
  <style>
    *{box-sizing:border-box}body{margin:0;background:#f3f4f6;font-family:Arial,sans-serif;color:#111827}.card{max-width:820px;margin:30px auto;background:#fff;border-radius:18px;padding:24px;box-shadow:0 10px 35px rgba(0,0,0,.08)}.badge{display:inline-block;background:#fee2e2;color:#991b1b;padding:8px 14px;border-radius:999px;font-weight:700;margin-bottom:15px;font-size:14px}h1{margin:0 0 18px;color:#166534;font-size:28px}.sub{margin-bottom:18px;color:#6b7280;font-size:14px}.row{display:grid;grid-template-columns:190px 1fr;gap:12px;border-bottom:1px solid #e5e7eb;padding:12px 0}.label{font-weight:bold;color:#374151}.value{color:#111827;word-break:break-word}.error{background:#fee2e2;color:#991b1b;padding:14px;border-radius:12px;font-weight:bold}.status{display:inline-block;padding:6px 12px;border-radius:999px;background:#dcfce7;color:#166534;font-weight:800}@media(max-width:600px){.card{margin:12px;padding:18px}.row{grid-template-columns:1fr}h1{font-size:24px}}
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">نموذج تجريبي من سيرفرك - غير حكومي</div>
    <h1 id="title">Loading...</h1>
    <div class="sub" id="subtitle">جاري التحقق من السيرفر...</div>
    <div id="content"></div>
  </div>
  <script>
    const title=document.getElementById('title');
    const subtitle=document.getElementById('subtitle');
    const content=document.getElementById('content');
    function getCode(){const url=new URL(location.href);const q=url.searchParams.get('code');if(q)return q.trim();const parts=location.pathname.split('/').filter(Boolean);const i=parts.indexOf('qrpubliclink');if(i!==-1&&parts[i+1])return decodeURIComponent(parts[i+1]).trim();return null;}
    function row(label,value){return '<div class="row"><div class="label">'+label+'</div><div class="value">'+(value||'-')+'</div></div>';}
    async function verify(){const code=getCode();if(!code){title.textContent='Scan QR';subtitle.textContent='لا يوجد كود داخل الرابط.';content.innerHTML='<div class="error">استخدم رابط مثل /qrpubliclink/DOC-1001 أو /qrpubliclink?code=DOC-1001</div>';return;}try{const res=await fetch('/api/verify/'+encodeURIComponent(code));const data=await res.json();if(!data.success){title.textContent='QR مرفوض';subtitle.textContent='السيرفر لم يجد هذه الوثيقة.';content.innerHTML='<div class="error">'+(data.message||data.error)+'</div>';return;}const d=data.document;title.textContent='Valid';subtitle.textContent='تم التحقق من الوثيقة من سيرفرك بنجاح.';content.innerHTML=row('ID',d.doc_id)+row('Company',d.company_name)+row('Owner',d.owner_name)+row('Driver',d.driver_name)+row('Vehicle',d.vehicle_number)+row('Governorate',d.governorate)+row('Material',d.material)+row('Quantity',d.quantity+' '+d.unit)+row('Destination',d.destination)+row('Status','<span class="status">'+d.status+'</span>')+row('Version',d.numberOfVersion)+row('Created At',d.created_at)+row('Note',d.note);}catch(e){title.textContent='Error';subtitle.textContent='تعذر الاتصال بالسيرفر.';content.innerHTML='<div class="error">فشل الاتصال بالسيرفر</div>';}}
    verify();
  </script>
</body>
</html>`;
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (request.method === "OPTIONS") return json({ ok: true });
    if (pathname === "/") return Response.redirect(`${baseUrl(request)}/qrpubliclink`, 302);
    if (pathname === "/qrpubliclink") return html(verifyPage());
    if (pathname.startsWith("/qrpubliclink/")) return html(verifyPage());

    if (pathname.startsWith("/api/verify/")) {
      const code = decodeURIComponent(pathname.replace("/api/verify/", ""));
      const doc = findDocument(code);
      if (!doc) return json({ success: false, error: "DOCUMENT_NOT_FOUND", message: "لم يتم العثور على الوثيقة" }, 404);
      return json({ success: true, document: doc });
    }

    if (pathname === "/api/read-qr" && request.method === "POST") {
      let body = {};
      try { body = await request.json(); } catch {}
      const code = cleanCode(body.QRcode || body.code);
      const doc = findDocument(code);
      if (!doc) return json({ success: false, error: "DOCUMENT_NOT_FOUND", message: "لم يتم العثور على الوثيقة" }, 404);
      return json({ success: true, data: { info: { fullName: doc.owner_name, orgName: doc.company_name, orgPathInfo: `${doc.company_name} / ${doc.governorate}` }, numberOfVersion: doc.numberOfVersion, showIn: true, document: doc } });
    }

    if (pathname.startsWith("/api/make-qr-url/")) {
      const code = decodeURIComponent(pathname.replace("/api/make-qr-url/", ""));
      const doc = findDocument(code);
      if (!doc) return json({ success: false, error: "DOCUMENT_NOT_FOUND" }, 404);
      const qrLink = `${baseUrl(request)}/qrpubliclink/${encodeURIComponent(code)}`;
      return json({ success: true, code, qrLink });
    }

    if (pathname.startsWith("/api/make-qr/")) {
      const code = decodeURIComponent(pathname.replace("/api/make-qr/", ""));
      const doc = findDocument(code);
      if (!doc) return json({ success: false, error: "DOCUMENT_NOT_FOUND" }, 404);
      const qrLink = `${baseUrl(request)}/qrpubliclink/${encodeURIComponent(code)}`;
      const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=420x420&data=${encodeURIComponent(qrLink)}`;
      return Response.redirect(qrImageUrl, 302);
    }

    return html("<h1>404</h1><p>Not found</p>", 404);
  }
};
