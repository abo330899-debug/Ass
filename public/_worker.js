const demoDocuments = {
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
  }
};

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

function enc(obj) {
  const jsonText = JSON.stringify(obj);
  const bytes = new TextEncoder().encode(jsonText);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function dec(data) {
  const pad = "=".repeat((4 - (data.length % 4)) % 4);
  const b64 = data.replaceAll("-", "+").replaceAll("_", "/") + pad;
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, ch => ch.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

function createPage() {
  const today = new Date().toISOString().slice(0, 10);
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>إنشاء وثيقة تجريبية</title>
  <style>
    *{box-sizing:border-box}body{margin:0;background:#f3f4f6;font-family:Arial,sans-serif;color:#111827}.wrap{max-width:980px;margin:24px auto;padding:16px}.card{background:#fff;border-radius:18px;padding:22px;box-shadow:0 10px 35px rgba(0,0,0,.08)}h1{margin:0 0 8px;color:#111827}.note{background:#fff7ed;color:#9a3412;padding:12px;border-radius:12px;margin:12px 0 22px;font-weight:700}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}.field{display:flex;flex-direction:column;gap:7px}label{font-weight:800;color:#374151}input,textarea,select{width:100%;padding:13px;border:1px solid #d1d5db;border-radius:12px;font-size:16px;background:#fff;color:#111827}textarea{min-height:82px;resize:vertical}.full{grid-column:1/-1}.btn{margin-top:18px;border:0;background:#16a34a;color:#fff;border-radius:14px;padding:14px 20px;font-weight:900;font-size:17px;cursor:pointer}.btn2{background:#2563eb;margin-inline-start:8px}.hint{color:#6b7280;line-height:1.8}@media(max-width:720px){.grid{grid-template-columns:1fr}.wrap{padding:10px;margin:10px auto}}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <h1>إنشاء وثيقة من قبل الشركة</h1>
      <div class="hint">املأ المعلومات، بعدها النظام يولد وثيقة فيها QR. عند مسح QR بالكاميرا الأصلية يفتح نفس الوثيقة، وتقدر تحفظها PDF من زر الطباعة.</div>
      <div class="note">نموذج تجريبي غير حكومي - للاستخدام الداخلي فقط</div>
      <form id="docForm">
        <div class="grid">
          <div class="field"><label>رقم الوثيقة</label><input name="doc_id" value="DOC-${Date.now().toString().slice(-6)}" required></div>
          <div class="field"><label>تاريخ الوثيقة</label><input name="created_at" type="date" value="${today}" required></div>
          <div class="field"><label>اسم الشركة</label><input name="company_name" value="شركة تجريبية" required></div>
          <div class="field"><label>صاحب العلاقة / المدير</label><input name="owner_name" value="Abdulstar Zeki" required></div>
          <div class="field"><label>اسم السائق</label><input name="driver_name" value="جلال مهدي"></div>
          <div class="field"><label>رقم العجلة</label><input name="vehicle_number" value="42040 دهوك"></div>
          <div class="field"><label>المحافظة</label><input name="governorate" value="دهوك"></div>
          <div class="field"><label>الوجهة النهائية</label><input name="destination" value="أربيل"></div>
          <div class="field"><label>المادة / الحمولة</label><input name="material" value="مواد تجريبية"></div>
          <div class="field"><label>الكمية</label><input name="quantity" value="100"></div>
          <div class="field"><label>الوحدة</label><input name="unit" value="كرتون"></div>
          <div class="field"><label>الحالة</label><select name="status"><option>VALID</option><option>PENDING</option><option>COMPLETED</option></select></div>
          <div class="field full"><label>ملاحظات</label><textarea name="note">نموذج تجريبي من سيرفرك - غير حكومي</textarea></div>
        </div>
        <button class="btn" type="submit">إنشاء الوثيقة مع QR</button>
        <button class="btn btn2" type="button" onclick="location.href='/document?d=${enc(demoDocuments['DOC-1001'])}'">فتح مثال جاهز</button>
      </form>
    </div>
  </div>
<script>
function encClient(obj){const json=JSON.stringify(obj);const bytes=new TextEncoder().encode(json);let bin='';for(const b of bytes)bin+=String.fromCharCode(b);return btoa(bin).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');}
document.getElementById('docForm').addEventListener('submit',e=>{e.preventDefault();const fd=new FormData(e.target);const doc=Object.fromEntries(fd.entries());doc.numberOfVersion=1;doc.generated_at=new Date().toISOString();const d=encClient(doc);location.href='/document?d='+encodeURIComponent(d);});
</script>
</body>
</html>`;
}

function documentPage(data, request) {
  let doc;
  try {
    doc = data ? dec(data) : null;
  } catch {
    doc = null;
  }
  if (!doc) {
    return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>خطأ</title><style>body{font-family:Arial;background:#f3f4f6;padding:22px}.card{background:#fff;padding:20px;border-radius:16px;max-width:720px;margin:auto}</style></head><body><div class="card"><h2>رابط الوثيقة غير صالح</h2><p>ارجع إلى صفحة الإنشاء وأنشئ وثيقة جديدة.</p><a href="/create">إنشاء وثيقة</a></div></body></html>`;
  }

  const docUrl = `${baseUrl(request)}/document?d=${encodeURIComponent(data)}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=230x230&data=${encodeURIComponent(docUrl)}`;

  const row = (a,b) => `<tr><td class="label">${a}</td><td>${b || "-"}</td></tr>`;

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>وثيقة ${doc.doc_id || ""}</title>
<style>
@page{size:A4;margin:10mm}*{box-sizing:border-box}body{margin:0;background:#e5e7eb;font-family:Arial,sans-serif;color:#111827}.toolbar{max-width:210mm;margin:12px auto;display:flex;gap:10px;justify-content:center}.toolbar button,.toolbar a{border:0;background:#2563eb;color:#fff;border-radius:12px;padding:12px 16px;text-decoration:none;font-weight:800;cursor:pointer}.toolbar .green{background:#16a34a}.page{width:210mm;min-height:297mm;margin:0 auto 20px;background:#fff;padding:14mm;box-shadow:0 8px 35px rgba(0,0,0,.18);position:relative}.demo{position:absolute;top:7mm;left:7mm;background:#fee2e2;color:#991b1b;border:1px solid #fecaca;border-radius:999px;padding:7px 12px;font-weight:900;font-size:12px}.head{display:grid;grid-template-columns:1fr 100px 1fr;align-items:center;border-bottom:2px solid #111827;padding-bottom:10px}.h-right{font-weight:800;line-height:1.8}.logo{width:82px;height:82px;border:2px solid #111827;border-radius:50%;display:flex;align-items:center;justify-content:center;text-align:center;font-weight:900;margin:auto}.meta{text-align:left;font-size:13px;line-height:1.9}.title{text-align:center;margin:22px 0 8px;font-size:26px;font-weight:900}.subtitle{text-align:center;color:#374151;margin-bottom:18px}.box{border:1.5px solid #d1d5db;border-radius:16px;padding:14px;margin-top:12px}.section-title{background:#991b1b;color:#fff;padding:10px;border-radius:10px 10px 0 0;font-weight:900;text-align:center}table{width:100%;border-collapse:collapse}td{border:1px solid #e5e7eb;padding:10px;font-size:14px}.label{width:33%;background:#f9fafb;font-weight:900;color:#374151}.qr-area{display:grid;grid-template-columns:1fr 180px;gap:18px;align-items:center;margin-top:20px}.qr{width:170px;height:170px;border:1px solid #e5e7eb;padding:8px;background:#fff}.notes{font-size:13px;color:#4b5563;line-height:1.8}.footer{border-top:1.5px solid #111827;margin-top:24px;padding-top:10px;text-align:center;color:#374151;font-size:12px}.link{direction:ltr;word-break:break-all;font-size:10px;color:#6b7280;margin-top:8px}@media(max-width:800px){.page{width:100%;min-height:auto;padding:16px}.head{grid-template-columns:1fr}.meta{text-align:right}.qr-area{grid-template-columns:1fr;text-align:center}.qr{margin:auto}.toolbar{flex-wrap:wrap}}@media print{body{background:#fff}.toolbar{display:none}.page{box-shadow:none;margin:0;width:100%;min-height:auto}.demo{display:block}}
</style>
</head>
<body>
<div class="toolbar"><button class="green" onclick="window.print()">حفظ / طباعة PDF</button><a href="/create">إنشاء وثيقة جديدة</a></div>
<div class="page">
  <div class="demo">نموذج تجريبي غير حكومي</div>
  <div class="head">
    <div class="h-right">شركة / ${doc.company_name || "-"}<br>وثيقة صادرة من قبل الشركة<br>نظام QR داخلي</div>
    <div class="logo">QR<br>DOC</div>
    <div class="meta">رقم الوثيقة: ${doc.doc_id || "-"}<br>التاريخ: ${doc.created_at || "-"}<br>الحالة: ${doc.status || "-"}</div>
  </div>
  <div class="title">وثيقة بيانات الحمولة</div>
  <div class="subtitle">وثيقة تجريبية داخلية من قبل الشركة</div>
  <div class="box">
    <div class="section-title">المعلومات الأساسية</div>
    <table>
      ${row("اسم الشركة", doc.company_name)}
      ${row("صاحب العلاقة", doc.owner_name)}
      ${row("اسم السائق", doc.driver_name)}
      ${row("رقم العجلة", doc.vehicle_number)}
      ${row("المحافظة", doc.governorate)}
      ${row("الوجهة النهائية", doc.destination)}
      ${row("المادة / الحمولة", doc.material)}
      ${row("الكمية", `${doc.quantity || "-"} ${doc.unit || ""}`)}
      ${row("رقم الإصدار", doc.numberOfVersion || 1)}
      ${row("الملاحظات", doc.note)}
    </table>
  </div>
  <div class="qr-area">
    <div class="notes">
      <b>طريقة التحقق:</b><br>
      عند مسح رمز QR بالكاميرا الأصلية، سيتم فتح نفس الوثيقة من سيرفرك مع نفس رمز QR.<br>
      هذه الوثيقة للاختبار الداخلي فقط وليست وثيقة حكومية أو رسمية.
      <div class="link">${docUrl}</div>
    </div>
    <img class="qr" src="${qrUrl}" alt="QR">
  </div>
  <div class="footer">© نظام QR داخلي تجريبي - ${new Date().getFullYear()}</div>
</div>
</body>
</html>`;
}

function findDocumentPage(code, request) {
  const doc = demoDocuments[code];
  if (!doc) return null;
  return documentPage(enc(doc), request);
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (request.method === "OPTIONS") return json({ ok: true });
    if (pathname === "/") return Response.redirect(`${baseUrl(request)}/create`, 302);
    if (pathname === "/create") return html(createPage());
    if (pathname === "/document") return html(documentPage(url.searchParams.get("d"), request));

    if (pathname === "/qrpubliclink") {
      const code = url.searchParams.get("code");
      if (code) {
        const page = findDocumentPage(code, request);
        if (page) return html(page);
      }
      return html(documentPage(null, request), 400);
    }

    if (pathname.startsWith("/qrpubliclink/")) {
      const code = decodeURIComponent(pathname.replace("/qrpubliclink/", ""));
      const page = findDocumentPage(code, request);
      if (page) return html(page);
      return html(documentPage(null, request), 404);
    }

    if (pathname.startsWith("/api/verify/")) {
      const code = decodeURIComponent(pathname.replace("/api/verify/", ""));
      const doc = demoDocuments[code];
      if (!doc) return json({ success: false, error: "DOCUMENT_NOT_FOUND", message: "لم يتم العثور على الوثيقة" }, 404);
      return json({ success: true, document: doc });
    }

    if (pathname === "/api/read-qr" && request.method === "POST") {
      let body = {};
      try { body = await request.json(); } catch {}
      const code = String(body.QRcode || body.code || "").trim();
      const doc = demoDocuments[code];
      if (!doc) return json({ success: false, error: "DOCUMENT_NOT_FOUND", message: "لم يتم العثور على الوثيقة" }, 404);
      return json({ success: true, data: { info: { fullName: doc.owner_name, orgName: doc.company_name, orgPathInfo: `${doc.company_name} / ${doc.governorate}` }, numberOfVersion: doc.numberOfVersion, showIn: true, document: doc } });
    }

    if (pathname.startsWith("/api/make-qr/")) {
      const code = decodeURIComponent(pathname.replace("/api/make-qr/", ""));
      const doc = demoDocuments[code];
      if (!doc) return json({ success: false, error: "DOCUMENT_NOT_FOUND" }, 404);
      const qrLink = `${baseUrl(request)}/qrpubliclink/${encodeURIComponent(code)}`;
      const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=420x420&data=${encodeURIComponent(qrLink)}`;
      return Response.redirect(qrImageUrl, 302);
    }

    return html("<h1>404</h1><p>Not found</p>", 404);
  }
};
