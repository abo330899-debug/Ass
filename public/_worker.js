const TOKEN_PREFIX = "gAAAAAB";
const TOKEN_SUFFIX = "==|local_company";

const demoDocuments = {
  "DOC-1001": {
    doc_id: "DOC-1001",
    created_at: "2026-07-10",
    company_name: "شركة عبد الستار التجريبية",
    owner_name: "Abdulstar Zeki",
    driver_name: "جلال مهدي",
    vehicle_number: "42040 دهوك",
    governorate: "دهوك",
    registration_governorate: "دهوك",
    destination: "أربيل",
    material: "مواد تجريبية",
    cargo_typedetails: "مواد تجريبية",
    quantity: "100",
    unit: "كرتون",
    weight_quantity: "100 كرتون",
    status: "VALID",
    note: "نموذج تجريبي من سيرفرك - غير حكومي",
    checkpoint_name_control: "سيطرة تجريبية",
    granting_license_approval: "جهة تجريبية داخلية",
    license_approval_number: "TEST-1001",
    license_approval_date: "2026-07-10",
    license_text_specialization: "اختصاص تجريبي داخلي",
    brand: "علامة تجريبية",
    numberOfVersion: 1
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

function toBase64Url(obj) {
  const jsonText = JSON.stringify(obj);
  const bytes = new TextEncoder().encode(jsonText);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function fromBase64Url(payload) {
  const pad = "=".repeat((4 - (payload.length % 4)) % 4);
  const b64 = payload.replaceAll("-", "+").replaceAll("_", "/") + pad;
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, ch => ch.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

function enc(obj) {
  return TOKEN_PREFIX + toBase64Url(obj) + TOKEN_SUFFIX;
}

function dec(data) {
  let token = String(data || "").trim();
  if (!token) throw new Error("EMPTY_TOKEN");
  if (token.includes("|local_company")) token = token.split("|local_company")[0];
  if (token.startsWith(TOKEN_PREFIX)) token = token.slice(TOKEN_PREFIX.length);
  token = token.replace(/=+$/g, "");
  return fromBase64Url(token);
}

function safe(v) {
  return String(v ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function dateTimeParts(doc) {
  const src = doc.generated_at || new Date().toISOString();
  const date = doc.created_at || src.slice(0, 10);
  let time = "";
  try {
    time = new Date(src).toLocaleTimeString("ar-IQ", { hour: "2-digit", minute: "2-digit" });
  } catch {
    time = "";
  }
  return { date, time };
}

function normalizeDoc(doc) {
  const quantityUnit = `${doc.quantity || ""} ${doc.unit || ""}`.trim();
  return {
    ...doc,
    subject: doc.subject || "الوثيقة المؤقتة لبيانات الحمولة من قبل الشركة",
    date_str: doc.date_str || doc.created_at || new Date().toISOString().slice(0, 10),
    time_str: doc.time_str || "",
    checkpoint_name_control: doc.checkpoint_name_control || "-",
    registration_governorate: doc.registration_governorate || doc.governorate || "-",
    cargo_typedetails: doc.cargo_typedetails || doc.material || "-",
    weight_quantity: doc.weight_quantity || quantityUnit || "-",
    destination_governorate: doc.destination_governorate || doc.destination || "-",
    governorate_name: doc.governorate_name || doc.governorate || "-",
    company_name_project: doc.company_name_project || doc.company_name || "-",
    granting_license_approval: doc.granting_license_approval || "-",
    license_approval_number: doc.license_approval_number || "-",
    license_approval_date: doc.license_approval_date || doc.created_at || "-",
    license_text_specialization: doc.license_text_specialization || "-",
    brand: doc.brand || "-",
    item_name: doc.item_name || doc.material || "-",
    item_quantity: doc.item_quantity || quantityUnit || "-"
  };
}

function createPage() {
  const today = new Date().toISOString().slice(0, 10);
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>إنشاء وثيقة من قبل الشركة</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#f3f4f6;font-family:Arial,sans-serif;color:#111827}.wrap{max-width:980px;margin:24px auto;padding:16px}.card{background:#fff;border-radius:18px;padding:22px;box-shadow:0 10px 35px rgba(0,0,0,.08)}h1{margin:0 0 8px}.hint{color:#6b7280;line-height:1.8}.note{background:#fff7ed;color:#9a3412;padding:12px;border-radius:12px;margin:12px 0 22px;font-weight:700}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}.field{display:flex;flex-direction:column;gap:7px}label{font-weight:800;color:#374151}input,textarea,select{width:100%;padding:13px;border:1px solid #d1d5db;border-radius:12px;font-size:16px;background:#fff;color:#111827}textarea{min-height:82px;resize:vertical}.full{grid-column:1/-1}.btn{margin-top:18px;border:0;background:#16a34a;color:#fff;border-radius:14px;padding:14px 20px;font-weight:900;font-size:17px;cursor:pointer}.btn2{background:#2563eb;margin-inline-start:8px}@media(max-width:720px){.grid{grid-template-columns:1fr}.wrap{padding:10px;margin:10px auto}}
</style>
</head>
<body>
<div class="wrap"><div class="card">
<h1>إنشاء وثيقة من قبل الشركة</h1>
<div class="hint">املأ المعلومات، بعدها النظام يولد وثيقة A4 فيها QR. رمز الرابط يظهر بشكل: <b>gAAAAAB...==|local_company</b></div>
<div class="note">نموذج تجريبي داخلي غير حكومي</div>
<form id="docForm"><div class="grid">
<div class="field"><label>رقم الوثيقة</label><input name="doc_id" value="DOC-${Date.now().toString().slice(-6)}" required></div>
<div class="field"><label>تاريخ إنشاء الوثيقة</label><input name="created_at" type="date" value="${today}" required></div>
<div class="field full"><label>الموضوع</label><input name="subject" value="الوثيقة المؤقتة لبيانات الحمولة من قبل الشركة"></div>
<div class="field"><label>اسم سيطرة الدخول</label><input name="checkpoint_name_control" value="سيطرة تجريبية"></div>
<div class="field"><label>اسم السائق</label><input name="driver_name" value="جلال مهدي"></div>
<div class="field"><label>رقم العجلة</label><input name="vehicle_number" value="42040 دهوك"></div>
<div class="field"><label>محافظة تسجيل العجلة</label><input name="registration_governorate" value="دهوك"></div>
<div class="field"><label>نوع / تفاصيل الحمولة</label><input name="cargo_typedetails" value="مواد تجريبية"></div>
<div class="field"><label>الوزن / الكمية</label><input name="weight_quantity" value="100 كرتون"></div>
<div class="field"><label>الوجهة النهائية / المحافظة</label><input name="destination_governorate" value="أربيل"></div>
<div class="field"><label>اسم المحافظة</label><input name="governorate_name" value="دهوك"></div>
<div class="field"><label>اسم الشركة / المشروع</label><input name="company_name_project" value="شركة تجريبية" required></div>
<div class="field"><label>الجهة المانحة للإجازة / الموافقة</label><input name="granting_license_approval" value="جهة تجريبية داخلية"></div>
<div class="field"><label>رقم الإجازة / الموافقة</label><input name="license_approval_number" value="TEST-1001"></div>
<div class="field"><label>تاريخ الإجازة / الموافقة</label><input name="license_approval_date" type="date" value="${today}"></div>
<div class="field"><label>منطوق الإجازة / الاختصاص</label><input name="license_text_specialization" value="اختصاص تجريبي داخلي"></div>
<div class="field"><label>العلامة التجارية</label><input name="brand" value="علامة تجريبية"></div>
<div class="field"><label>اسم المادة / المنتج</label><input name="item_name" value="مواد تجريبية"></div>
<div class="field"><label>كمية المنتج</label><input name="item_quantity" value="100 كرتون"></div>
<div class="field"><label>الحالة</label><select name="status"><option>VALID</option><option>PENDING</option><option>COMPLETED</option></select></div>
<div class="field full"><label>ملاحظة داخلية</label><textarea name="note">نموذج تجريبي داخلي غير حكومي</textarea></div>
</div><button class="btn" type="submit">إنشاء الوثيقة مع QR</button><button class="btn btn2" type="button" onclick="location.href='/document?d=${encodeURIComponent(enc(demoDocuments['DOC-1001']))}'">فتح مثال جاهز</button></form>
</div></div>
<script>
const TOKEN_PREFIX='gAAAAAB';
const TOKEN_SUFFIX='==|local_company';
function encClient(obj){const json=JSON.stringify(obj);const bytes=new TextEncoder().encode(json);let bin='';for(const b of bytes)bin+=String.fromCharCode(b);const payload=btoa(bin).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');return TOKEN_PREFIX+payload+TOKEN_SUFFIX;}
document.getElementById('docForm').addEventListener('submit',e=>{e.preventDefault();const fd=new FormData(e.target);const doc=Object.fromEntries(fd.entries());doc.numberOfVersion=1;doc.generated_at=new Date().toISOString();const d=encClient(doc);location.href='/document?d='+encodeURIComponent(d);});
</script>
</body></html>`;
}

function documentPage(data, request) {
  let raw;
  try { raw = data ? dec(data) : null; } catch { raw = null; }
  if (!raw) return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>خطأ</title><style>body{font-family:Arial;background:#f3f4f6;padding:22px}.card{background:#fff;padding:20px;border-radius:16px;max-width:720px;margin:auto}</style></head><body><div class="card"><h2>رابط الوثيقة غير صالح</h2><p>ارجع إلى صفحة الإنشاء وأنشئ وثيقة جديدة.</p><a href="/create">إنشاء وثيقة</a></div></body></html>`;

  const doc = normalizeDoc(raw);
  const dt = dateTimeParts(doc);
  doc.date_str = doc.date_str || dt.date;
  doc.time_str = doc.time_str || dt.time;
  const cleanToken = enc(raw);
  const docUrl = `${baseUrl(request)}/document?d=${encodeURIComponent(cleanToken)}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(docUrl)}`;

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>وثيقة ${safe(doc.doc_id)}</title>
<style>
@page{size:A4;margin:0}*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}html,body{margin:0;padding:0;background:#e9ecef;font-family:Arial,sans-serif;color:#111}.a4-page{width:210mm;min-height:297mm;margin:0 auto;background:#fff;padding:10mm 12mm 8mm;position:relative;box-shadow:0 4px 24px rgba(0,0,0,.18);overflow:hidden}.demo-watermark{position:absolute;top:6mm;left:8mm;background:#fee2e2;color:#991b1b;border:1px solid #fecaca;border-radius:999px;padding:5px 10px;font-weight:900;font-size:10px;z-index:5}.header-clean{display:grid;grid-template-columns:1fr 95px 1fr;align-items:start;gap:12px;min-height:30mm}.header-right{font-size:10.5pt;line-height:1.65;font-weight:500;text-align:right;padding-top:2mm}.header-center{text-align:center}.logo-ring{width:24mm;height:24mm;border:1.6px solid #444;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:auto;font-size:9pt;font-weight:800;color:#333;background:#fff}.center-logo{max-width:20mm;max-height:20mm}.header-left{font-size:9pt;line-height:1.55;padding-top:2mm}.meta-line{display:grid;grid-template-columns:30mm 1fr;gap:4mm;margin-bottom:2mm}.meta-label{font-weight:700;color:#333}.meta-value{border-bottom:1px dotted #777;min-height:5mm;text-align:center}.divider{border:0;border-top:1.5px solid #cfcfcf;margin:1mm 0 4mm}.doc-title{text-align:center;font-size:19pt;font-weight:500;margin:0 0 5mm}.subject-row{display:flex;align-items:center;gap:6mm;margin:0 0 5mm;font-size:11pt}.subject-row strong{white-space:nowrap}.subject-box{border:1px solid #d6d6d6;border-radius:9px;padding:3mm 6mm;flex:1;min-height:10mm;background:#fff;text-align:center;font-weight:600}.info-table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:9.4pt}.info-table .col-right{width:35%}.info-table .col-left{width:65%}.info-table th{background:#a40000;color:#fff;border:1px solid #8a0000;padding:2.5mm;font-size:10pt;font-weight:800;text-align:center}.info-table td{border:1px solid #e3e3e3;padding:2.2mm 3mm;min-height:8mm;vertical-align:middle}.info-table td:first-child{font-weight:600;background:#fafafa}.qr-wrap{display:flex;justify-content:center;align-items:center;margin:6mm auto 3mm;width:42mm;height:42mm;border:1px solid #dadada;background:#fff}.barcode-box{width:38mm;height:38mm;display:flex;align-items:center;justify-content:center}.barcode-box img{width:38mm;height:38mm;display:block}.notes{text-align:center;font-size:8.8pt;line-height:1.55;color:#333;margin-top:1mm}.notes p{margin:1mm 0}.light-note{color:#777}.notes a{color:#1d66d1;text-decoration:none}.doc-footer{position:absolute;left:12mm;right:12mm;bottom:6mm;border-top:1.5px solid #d8d8d8;padding-top:3mm;display:grid;grid-template-columns:28mm 1fr 48mm;align-items:center;gap:8mm;font-size:7.8pt;color:#333}.bottom-right-logo{width:18mm;max-height:20mm;object-fit:contain}.footer-center{text-align:center;line-height:1.6}.footer-right{text-align:left;direction:ltr;line-height:1.55}.doc-url{direction:ltr;word-break:break-all;font-size:6.6pt;color:#999;margin-top:1mm}.content{padding-bottom:29mm}@media(max-width:800px){body{background:#fff}.a4-page{width:100%;min-height:auto;box-shadow:none;padding:8mm}.header-clean{grid-template-columns:1fr}.header-left{text-align:right}.meta-line{grid-template-columns:1fr 1fr}.doc-footer{position:static;margin-top:8mm;grid-template-columns:1fr;text-align:center}.footer-right{text-align:center}.content{padding-bottom:0}}@media print{body{background:#fff}.a4-page{box-shadow:none;margin:0;width:210mm;min-height:297mm}}
</style>
</head>
<body>
<div class="a4-page" id="documentPage">
  <div class="demo-watermark">نموذج تجريبي غير حكومي</div>
  <header class="header-clean">
    <div class="header-right"><div>جمهورية العراق</div><div>وزارة المالية</div><div>الهيـئة العـامـة للكمـــارك</div></div>
    <div class="header-center"><div class="logo-ring">شعار</div></div>
    <div class="header-left">
      <div class="meta-line"><span class="meta-label">رقم الوثيقة</span><span class="meta-value">${safe(doc.doc_id)}</span></div>
      <div class="meta-line"><span class="meta-label">تاريخ إنشاء الوثيقة</span><span class="meta-value">${safe(doc.date_str)}</span></div>
      <div class="meta-line"><span class="meta-label">التوقيت</span><span class="meta-value">${safe(doc.time_str)}</span></div>
    </div>
  </header>
  <hr class="divider">
  <div class="content">
    <h2 class="doc-title">منصة المنتج المحلي</h2>
    <div class="subject-row"><strong>الموضوع /</strong><span class="subject-box">${safe(doc.subject)}</span></div>
    <table class="info-table">
      <colgroup><col class="col-right"><col class="col-left"></colgroup>
      <tbody>
        <tr><th colspan="2">المعلومات الشخصية</th></tr>
        <tr><td>اسم سيطرة الدخول</td><td>${safe(doc.checkpoint_name_control)}</td></tr>
        <tr><td>اسم السائق</td><td>${safe(doc.driver_name)}</td></tr>
        <tr><td>رقم العجلة</td><td>${safe(doc.vehicle_number)}</td></tr>
        <tr><td>محافظة تسجيل العجلة</td><td>${safe(doc.registration_governorate)}</td></tr>
        <tr><td>نوع / تفاصيل الحمولة</td><td>${safe(doc.cargo_typedetails)}</td></tr>
        <tr><td>الوزن / الكمية</td><td>${safe(doc.weight_quantity)}</td></tr>
        <tr><td>الوجهة النهائية / المحافظة</td><td>${safe(doc.destination_governorate)}</td></tr>
        <tr><td>اسم المحافظة</td><td>${safe(doc.governorate_name)}</td></tr>
        <tr><td>اسم الشركة / المشروع</td><td>${safe(doc.company_name_project)}</td></tr>
        <tr><td>الجهة المانحة للإجازة / الموافقة</td><td>${safe(doc.granting_license_approval)}</td></tr>
        <tr><td>رقم الإجازة / الموافقة</td><td>${safe(doc.license_approval_number)}</td></tr>
        <tr><td>تاريخ الإجازة / الموافقة</td><td>${safe(doc.license_approval_date)}</td></tr>
        <tr><td>منطوق الإجازة / الاختصاص</td><td>${safe(doc.license_text_specialization)}</td></tr>
        <tr><td>العلامة التجارية</td><td>${safe(doc.brand)}</td></tr>
        <tr><th colspan="2">المواد / المنتجات المرخّصة</th></tr>
      </tbody>
      <tbody id="itemsBody"><tr><td>${safe(doc.item_name)}</td><td>${safe(doc.item_quantity)}</td></tr></tbody>
    </table>
    <div class="qr-wrap" id="qrArea"><div class="barcode-box"><img src="${qrUrl}" alt="QR"></div></div>
    <div class="notes">
      <p>إن احتفاظك بهذه الوثيقة يمكّنك من استخدامها لدى الجهات المرتبطة بالنظام.</p>
      <p>يمكنك حفظ صورة الوثيقة في الهاتف لاستخدامها عند الحاجة.</p>
      <p class="light-note">لمزيد من المعلومات عن الخدمات الحكومية الإلكترونية يمكن زيارة:</p>
      <a href="https://ur.gov.iq" target="_blank" rel="noopener noreferrer"><b>https://ur.gov.iq</b></a>
      <div class="doc-url">${safe(cleanToken)}</div>
    </div>
  </div>
  <footer class="doc-footer">
    <div class="bottom-right-logo logo-ring">شعار</div><div></div>
    <div class="footer-center"><div>مكتب رئيس الوزراء / المركز الوطني للتحول الرقمي</div><div>بغداد – كرادة مريم</div><div>المركز الوطني للتحول الرقمي @2025</div></div>
    <div class="footer-right"><div>Prime Minister's Office</div><div>National Center for Digital Transformation</div><div>Tel: 5599</div></div>
  </footer>
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
      return json({ success: true, data: { info: { fullName: doc.owner_name || doc.driver_name, orgName: doc.company_name_project || doc.company_name, orgPathInfo: doc.governorate_name || doc.governorate }, numberOfVersion: doc.numberOfVersion, showIn: true, document: doc } });
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
