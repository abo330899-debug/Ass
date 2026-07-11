const TOKEN_PREFIX = "gAAAAAB";
const TOKEN_SUFFIX = "==|local_company";
const FALLBACK_SECRET = "local-company-demo-secret-change-this-in-cloudflare";

const demoDocuments = {
  "DOC-1001": {
    doc_id: "DOC-1001",
    created_at: "2026-07-10",
    subject: "وثيقة بيانات حمولة تجريبية من قبل الشركة",
    checkpoint_name_control: "سيطرة تجريبية",
    driver_name: "جلال مهدي",
    vehicle_number: "42040 دهوك",
    registration_governorate: "دهوك",
    cargo_typedetails: "مواد تجريبية",
    weight_quantity: "100 كرتون",
    destination_governorate: "أربيل",
    governorate_name: "دهوك",
    company_name_project: "شركة عبد الستار التجريبية",
    granting_license_approval: "إدارة الشركة",
    license_approval_number: "TEST-1001",
    license_approval_date: "2026-07-10",
    license_text_specialization: "موافقة داخلية تجريبية",
    brand: "علامة تجريبية",
    item_name: "مواد تجريبية",
    item_quantity: "100 كرتون",
    numberOfVersion: 1,
    note: "نموذج تجريبي داخلي غير حكومي"
  }
};

const esc = v => String(v ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const html = (content, status = 200) => new Response(content, { status, headers: { "content-type": "text/html; charset=utf-8" } });
const json = (data, status = 200) => new Response(JSON.stringify(data, null, 2), { status, headers: { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*", "access-control-allow-methods": "GET,POST,OPTIONS", "access-control-allow-headers": "content-type" } });
const baseUrl = request => { const u = new URL(request.url); return `${u.protocol}//${u.host}`; };

function bytesToB64u(bytes) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}
function b64uToBytes(text) {
  const pad = "=".repeat((4 - (text.length % 4)) % 4);
  const bin = atob(text.replaceAll("-", "+").replaceAll("_", "/") + pad);
  return Uint8Array.from(bin, ch => ch.charCodeAt(0));
}
async function getKey(env) {
  const secret = String(env?.LOCAL_COMPANY_SECRET || FALLBACK_SECRET);
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", hash, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}
async function encryptDocId(docId, env) {
  const key = await getKey(env);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const smallPayload = JSON.stringify({ id: String(docId), type: "local_company" }).padEnd(96, " ");
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(smallPayload)));
  const packed = new Uint8Array(1 + iv.length + cipher.length);
  packed[0] = 1;
  packed.set(iv, 1);
  packed.set(cipher, 13);
  return TOKEN_PREFIX + bytesToB64u(packed) + TOKEN_SUFFIX;
}
async function decryptDocId(token, env) {
  let raw = String(token || "").trim();
  if (raw.includes("|local_company")) raw = raw.split("|local_company")[0];
  if (raw.startsWith(TOKEN_PREFIX)) raw = raw.slice(TOKEN_PREFIX.length);
  raw = raw.replace(/=+$/g, "");
  const packed = b64uToBytes(raw);
  if (packed[0] !== 1) throw new Error("BAD_TOKEN");
  const key = await getKey(env);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: packed.slice(1, 13) }, key, packed.slice(13));
  const payload = JSON.parse(new TextDecoder().decode(plain).trim());
  if (!payload.id) throw new Error("NO_DOC_ID");
  return payload.id;
}

function normalizeDoc(d) {
  const qty = `${d.quantity || ""} ${d.unit || ""}`.trim();
  return {
    doc_id: d.doc_id || `DOC-${Date.now().toString().slice(-6)}`,
    created_at: d.created_at || new Date().toISOString().slice(0, 10),
    subject: d.subject || "وثيقة بيانات حمولة تجريبية من قبل الشركة",
    checkpoint_name_control: d.checkpoint_name_control || "-",
    driver_name: d.driver_name || "-",
    vehicle_number: d.vehicle_number || "-",
    registration_governorate: d.registration_governorate || d.governorate || "-",
    cargo_typedetails: d.cargo_typedetails || d.material || "-",
    weight_quantity: d.weight_quantity || qty || "-",
    destination_governorate: d.destination_governorate || d.destination || "-",
    governorate_name: d.governorate_name || d.governorate || "-",
    company_name_project: d.company_name_project || d.company_name || "-",
    granting_license_approval: d.granting_license_approval || "-",
    license_approval_number: d.license_approval_number || "-",
    license_approval_date: d.license_approval_date || d.created_at || "-",
    license_text_specialization: d.license_text_specialization || "-",
    brand: d.brand || "-",
    item_name: d.item_name || d.material || "-",
    item_quantity: d.item_quantity || qty || "-",
    note: d.note || "نموذج تجريبي داخلي غير حكومي",
    numberOfVersion: d.numberOfVersion || 1,
    generated_at: d.generated_at || new Date().toISOString()
  };
}
async function saveDoc(doc, env) {
  if (!env?.DOCS) return false;
  await env.DOCS.put(doc.doc_id, JSON.stringify(doc));
  return true;
}
async function loadDoc(id, env) {
  if (env?.DOCS) {
    const saved = await env.DOCS.get(id);
    if (saved) return normalizeDoc(JSON.parse(saved));
  }
  if (demoDocuments[id]) return normalizeDoc(demoDocuments[id]);
  return null;
}

function createPage() {
  const today = new Date().toISOString().slice(0, 10);
  return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>إنشاء وثيقة</title><style>*{box-sizing:border-box}body{margin:0;background:#f3f4f6;font-family:Arial,sans-serif;color:#111827}.wrap{max-width:980px;margin:24px auto;padding:16px}.card{background:#fff;border-radius:18px;padding:22px;box-shadow:0 10px 35px rgba(0,0,0,.08)}.note{background:#fff7ed;color:#9a3412;padding:12px;border-radius:12px;margin:12px 0 22px;font-weight:700}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}.field{display:flex;flex-direction:column;gap:7px}label{font-weight:800}input,textarea,select{padding:13px;border:1px solid #d1d5db;border-radius:12px;font-size:16px}.full{grid-column:1/-1}.btn{margin-top:18px;border:0;background:#16a34a;color:#fff;border-radius:14px;padding:14px 20px;font-weight:900;font-size:17px}.btn2{background:#2563eb;margin-inline-start:8px}@media(max-width:720px){.grid{grid-template-columns:1fr}}</style></head><body><div class="wrap"><div class="card"><h1>إنشاء وثيقة من قبل الشركة</h1><div class="note">نموذج داخلي تجريبي. السيرفر يحفظ الوثيقة في KV ويولد QR قصير مشفر مثل gAAAAAB...==|local_company</div><form id="f"><div class="grid"><div class="field"><label>رقم الوثيقة</label><input name="doc_id" value="DOC-${Date.now().toString().slice(-6)}" required></div><div class="field"><label>تاريخ إنشاء الوثيقة</label><input name="created_at" type="date" value="${today}" required></div><div class="field full"><label>الموضوع</label><input name="subject" value="وثيقة بيانات حمولة تجريبية من قبل الشركة"></div><div class="field"><label>اسم سيطرة الدخول</label><input name="checkpoint_name_control" value="سيطرة تجريبية"></div><div class="field"><label>اسم السائق</label><input name="driver_name" value="جلال مهدي"></div><div class="field"><label>رقم العجلة</label><input name="vehicle_number" value="42040 دهوك"></div><div class="field"><label>محافظة تسجيل العجلة</label><input name="registration_governorate" value="دهوك"></div><div class="field"><label>نوع / تفاصيل الحمولة</label><input name="cargo_typedetails" value="مواد تجريبية"></div><div class="field"><label>الوزن / الكمية</label><input name="weight_quantity" value="100 كرتون"></div><div class="field"><label>الوجهة النهائية / المحافظة</label><input name="destination_governorate" value="أربيل"></div><div class="field"><label>اسم المحافظة</label><input name="governorate_name" value="دهوك"></div><div class="field"><label>اسم الشركة / المشروع</label><input name="company_name_project" value="شركة تجريبية"></div><div class="field"><label>الجهة المانحة للإجازة / الموافقة</label><input name="granting_license_approval" value="إدارة الشركة"></div><div class="field"><label>رقم الإجازة / الموافقة</label><input name="license_approval_number" value="TEST-1001"></div><div class="field"><label>تاريخ الإجازة / الموافقة</label><input name="license_approval_date" type="date" value="${today}"></div><div class="field"><label>منطوق الإجازة / الاختصاص</label><input name="license_text_specialization" value="موافقة داخلية تجريبية"></div><div class="field"><label>العلامة التجارية</label><input name="brand" value="علامة تجريبية"></div><div class="field"><label>اسم المادة / المنتج</label><input name="item_name" value="مواد تجريبية"></div><div class="field"><label>كمية المنتج</label><input name="item_quantity" value="100 كرتون"></div><div class="field full"><label>ملاحظة داخلية</label><textarea name="note">نموذج تجريبي داخلي غير حكومي</textarea></div></div><button class="btn">إنشاء الوثيقة مع QR</button><button class="btn btn2" type="button" onclick="location.href='/qrpubliclink/DOC-1001'">فتح مثال جاهز</button></form></div></div><script>document.getElementById('f').addEventListener('submit',async e=>{e.preventDefault();const doc=Object.fromEntries(new FormData(e.target).entries());doc.numberOfVersion=1;doc.generated_at=new Date().toISOString();const r=await fetch('/api/create-token',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(doc)});const data=await r.json();if(!data.success){alert(data.message||'فشل إنشاء الوثيقة');return;}location.href=data.url;});</script></body></html>`;
}

function documentPage(doc, token, request) {
  const createdTime = new Date(doc.generated_at || Date.now()).toLocaleTimeString("ar-IQ", { hour: "2-digit", minute: "2-digit" });
  const docUrl = `${baseUrl(request)}/document?d=${encodeURIComponent(token)}`;
  const qrData = doc.qr_code || docUrl;
  const qrUrl = String(qrData).startsWith("data:image") ? qrData : (String(qrData).startsWith("http") && /qr|quickchart|api\.qrserver/.test(String(qrData)) ? qrData : `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}`);
  return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>وثيقة ${esc(doc.doc_id)}</title><style>@page{size:A4;margin:0}*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}body{margin:0;background:#e9ecef;font-family:Arial,sans-serif;color:#111}.qr-document-root{min-height:100vh;padding:0}.doc-viewport{width:210mm;min-height:297mm;margin:0 auto;background:#fff;padding:10mm 12mm 8mm;position:relative;box-shadow:0 4px 24px #0003}.demo-badge{position:absolute;top:6mm;left:8mm;background:#fee2e2;color:#991b1b;border:1px solid #fecaca;border-radius:999px;padding:5px 10px;font-weight:900;font-size:10px}.header-clean{display:grid;grid-template-columns:1fr 105px 1fr;gap:12px;min-height:31mm;align-items:start}.header-right{font-size:10.5pt;line-height:1.65}.header-center{text-align:center}.customs-demo-logo{width:25mm;height:25mm;border:1.6px solid #1f2937;border-radius:12px;display:flex;align-items:center;justify-content:center;text-align:center;margin:auto;font-size:8pt;font-weight:900;color:#1e3a8a}.header-left{font-size:9pt;line-height:1.55}.doc-meta{display:block}.meta-line{display:grid;grid-template-columns:30mm 1fr;gap:4mm;margin-bottom:2mm}.meta-label{font-weight:700}.meta-value{border-bottom:1px dotted #777;text-align:center;min-height:5mm}.divider{border:0;border-top:1.5px solid #cfcfcf;margin:1mm 0 4mm}.doc-title{text-align:center;font-size:19pt;font-weight:500;margin:0 0 5mm}.subject-row{display:flex;gap:6mm;margin-bottom:5mm;font-size:11pt}.subject-field{border:1px solid #d6d6d6;border-radius:9px;padding:3mm 6mm;flex:1;text-align:center;font-weight:600}.info-section{direction:rtl}.info-table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:9.4pt}.info-table .col-label{width:35%}.info-table .col-value{width:65%}.info-table th{background:#a40000;color:#fff;border:1px solid #8a0000;padding:2.5mm;text-align:center}.info-table td{border:1px solid #e3e3e3;padding:2.2mm 3mm}.info-table td:first-child{font-weight:600;background:#fafafa}.qr-wrap.large-qr{display:flex;justify-content:center;align-items:center;margin:6mm auto 3mm;width:42mm;height:42mm;border:1px solid #dadada;background:#fff}.qr-wrap img{width:38mm;height:38mm}.notes{text-align:center;font-size:8.8pt;line-height:1.55}.token-line{direction:ltr;word-break:break-all;font-size:6.6pt;color:#999}.doc-footer{position:absolute;left:12mm;right:12mm;bottom:6mm;border-top:1.5px solid #d8d8d8;padding-top:3mm;display:grid;grid-template-columns:28mm 1fr 48mm;gap:8mm;align-items:center;font-size:7.8pt;color:#333}.eagle-demo-logo{width:20mm;height:20mm;border:1px solid #666;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:8pt;font-weight:800}.footer-center{text-align:center;line-height:1.6}.footer-right{text-align:left;direction:ltr;line-height:1.55}@media(max-width:800px){body{background:#fff}.doc-viewport{width:100%;min-height:auto;box-shadow:none;padding:8mm}.header-clean{grid-template-columns:1fr}.doc-footer{position:static;margin-top:8mm;grid-template-columns:1fr;text-align:center}.footer-right{text-align:center}}@media print{body{background:#fff}.doc-viewport{box-shadow:none}}</style></head><body><div class="qr-document-root"><div class="doc-viewport"><div class="demo-badge">نموذج تجريبي غير حكومي</div><header class="header-clean"><div class="header-right"><div>نظام وثائق الشركة</div><div>نموذج داخلي تجريبي</div><div>غير صادر من جهة حكومية</div></div><div class="header-center"><div class="customs-demo-logo">شعار<br>تجريبي</div></div><div class="header-left"><div class="doc-meta"><div class="meta-line"><span class="meta-label">رقم الوثيقة</span><span class="meta-value">${esc(doc.doc_id)}</span></div><div class="meta-line"><span class="meta-label">تاريخ إنشاء الوثيقة</span><span class="meta-value">${esc(doc.created_at)}</span></div><div class="meta-line"><span class="meta-label">التوقيت</span><span class="meta-value">${esc(createdTime)}</span></div></div></div></header><hr class="divider"><main class="content"><h2 class="doc-title">منصة المنتج المحلي - نموذج تجريبي</h2><div class="subject-row"><strong>الموضوع /</strong><span class="subject-field">${esc(doc.subject)}</span></div><section class="info-section"><table class="info-table"><colgroup><col class="col-label"><col class="col-value"></colgroup><tbody><tr><th colspan="2">المعلومات الشخصية</th></tr><tr><td>اسم سيطرة الدخول</td><td>${esc(doc.checkpoint_name_control)}</td></tr><tr><td>اسم السائق</td><td>${esc(doc.driver_name)}</td></tr><tr><td>رقم العجلة</td><td>${esc(doc.vehicle_number)}</td></tr><tr><td>محافظة تسجيل العجلة</td><td>${esc(doc.registration_governorate)}</td></tr><tr><td>نوع / تفاصيل الحمولة</td><td>${esc(doc.cargo_typedetails)}</td></tr><tr><td>الوزن / الكمية</td><td>${esc(doc.weight_quantity)}</td></tr><tr><td>الوجهة النهائية / المحافظة</td><td>${esc(doc.destination_governorate)}</td></tr><tr><td>اسم المحافظة</td><td>${esc(doc.governorate_name)}</td></tr><tr><td>اسم الشركة / المشروع</td><td>${esc(doc.company_name_project)}</td></tr><tr><td>الجهة المانحة للإجازة / الموافقة</td><td>${esc(doc.granting_license_approval)}</td></tr><tr><td>رقم الإجازة / الموافقة</td><td>${esc(doc.license_approval_number)}</td></tr><tr><td>تاريخ الإجازة / الموافقة</td><td>${esc(doc.license_approval_date)}</td></tr><tr><td>منطوق الإجازة / الاختصاص</td><td>${esc(doc.license_text_specialization)}</td></tr><tr><td>العلامة التجارية</td><td>${esc(doc.brand)}</td></tr><tr><th colspan="2">المواد / المنتجات المرخّصة</th></tr></tbody><tbody><tr><td>${esc(doc.item_name)}</td><td>${esc(doc.item_quantity)}</td></tr></tbody></table></section><div class="qr-wrap large-qr"><img src="${qrUrl}" alt="QR"></div><div class="notes"><p>إن احتفاظك بهذه الوثيقة يمكّنك من استخدامها داخل نظام الشركة.</p><p>يمكن حفظ صورة الوثيقة في الهاتف لاستخدامها عند الحاجة.</p><p><b>هذه وثيقة تجريبية داخلية وليست وثيقة حكومية.</b></p><div class="token-line">${esc(token)}</div></div></main><footer class="doc-footer"><div class="eagle-demo-logo">شعار</div><div></div><div class="footer-center"><div>نظام QR داخلي</div><div>بيانات محفوظة في سيرفر الشركة</div><div>© ${new Date().getFullYear()}</div></div><div class="footer-right"><div>Internal Company Document</div><div>Demo QR Verification</div><div>Not official</div></div></footer></div></div></body></html>`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const p = url.pathname;
    if (request.method === "OPTIONS") return json({ ok: true });
    if (p === "/") return Response.redirect(`${baseUrl(request)}/create`, 302);
    if (p === "/create") return html(createPage());
    if (p === "/api/create-token" && request.method === "POST") {
      let doc = {};
      try { doc = await request.json(); } catch {}
      doc = normalizeDoc(doc);
      if (!env?.DOCS) return json({ success: false, message: "اربط Cloudflare KV باسم DOCS حتى السيرفر يحفظ الوثائق ويطلع كود قصير." }, 500);
      await saveDoc(doc, env);
      const token = await encryptDocId(doc.doc_id, env);
      return json({ success: true, doc_id: doc.doc_id, token, url: `${baseUrl(request)}/document?d=${encodeURIComponent(token)}` });
    }
    if (p === "/document") {
      const token = url.searchParams.get("d") || "";
      try {
        const id = await decryptDocId(token, env);
        const doc = await loadDoc(id, env);
        if (!doc) return html("<h2>لم يتم العثور على الوثيقة في السيرفر</h2>", 404);
        return html(documentPage(doc, token, request));
      } catch {
        return html("<h2>الرابط غير صالح أو مفتاح التشفير مختلف</h2>", 400);
      }
    }
    if (p.startsWith("/qrpubliclink/")) {
      const id = decodeURIComponent(p.replace("/qrpubliclink/", ""));
      const doc = await loadDoc(id, env);
      if (!doc) return html("<h2>لم يتم العثور على الوثيقة</h2>", 404);
      const token = await encryptDocId(id, env);
      return html(documentPage(doc, token, request));
    }
    if (p.startsWith("/api/verify/")) {
      const id = decodeURIComponent(p.replace("/api/verify/", ""));
      const doc = await loadDoc(id, env);
      if (!doc) return json({ success: false, error: "DOCUMENT_NOT_FOUND" }, 404);
      return json({ success: true, document: doc });
    }
    if (p.startsWith("/api/make-qr/")) {
      const id = decodeURIComponent(p.replace("/api/make-qr/", ""));
      const doc = await loadDoc(id, env);
      if (!doc) return json({ success: false, error: "DOCUMENT_NOT_FOUND" }, 404);
      const token = await encryptDocId(id, env);
      const link = `${baseUrl(request)}/document?d=${encodeURIComponent(token)}`;
      return Response.redirect(`https://api.qrserver.com/v1/create-qr-code/?size=420x420&data=${encodeURIComponent(link)}`, 302);
    }
    return html("<h1>404</h1>", 404);
  }
};
