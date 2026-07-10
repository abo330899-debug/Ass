const TOKEN_PREFIX = "gAAAAAB";
const TOKEN_SUFFIX = "==|local_company";
const FALLBACK_SECRET = "local-company-demo-secret-change-this-in-cloudflare";

const demoDocuments = {
  "DOC-1001": {
    doc_id: "DOC-1001",
    created_at: "2026-07-10",
    subject: "الوثيقة المؤقتة لبيانات الحمولة من قبل الشركة",
    checkpoint_name_control: "سيطرة تجريبية",
    driver_name: "جلال مهدي",
    vehicle_number: "42040 دهوك",
    registration_governorate: "دهوك",
    cargo_typedetails: "مواد تجريبية",
    weight_quantity: "100 كرتون",
    destination_governorate: "أربيل",
    governorate_name: "دهوك",
    company_name_project: "شركة عبد الستار التجريبية",
    granting_license_approval: "جهة تجريبية داخلية",
    license_approval_number: "TEST-1001",
    license_approval_date: "2026-07-10",
    license_text_specialization: "اختصاص تجريبي داخلي",
    brand: "علامة تجريبية",
    item_name: "مواد تجريبية",
    item_quantity: "100 كرتون",
    note: "نموذج تجريبي داخلي غير حكومي",
    numberOfVersion: 1
  }
};

const esc = v => String(v ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const baseUrl = req => { const u = new URL(req.url); return `${u.protocol}//${u.host}`; };
const html = (c, s = 200) => new Response(c, { status: s, headers: { "content-type": "text/html; charset=utf-8" } });
const json = (d, s = 200) => new Response(JSON.stringify(d, null, 2), { status: s, headers: { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*", "access-control-allow-methods": "GET,POST,OPTIONS", "access-control-allow-headers": "content-type" } });

function b64u(bytes) { let bin = ""; for (const b of bytes) bin += String.fromCharCode(b); return btoa(bin).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", ""); }
function ub64(text) { const pad = "=".repeat((4 - (text.length % 4)) % 4); const bin = atob(text.replaceAll("-", "+").replaceAll("_", "/") + pad); return Uint8Array.from(bin, c => c.charCodeAt(0)); }
async function key(env) { const secret = String(env?.LOCAL_COMPANY_SECRET || FALLBACK_SECRET); const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret)); return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]); }

async function encryptId(id, env) {
  const k = await key(env);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const payload = JSON.stringify({ id: String(id), kind: "local_company", pad: "000000000000000000000000" });
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, k, new TextEncoder().encode(payload)));
  const packed = new Uint8Array(1 + iv.length + cipher.length);
  packed[0] = 1; packed.set(iv, 1); packed.set(cipher, 13);
  return TOKEN_PREFIX + b64u(packed) + TOKEN_SUFFIX;
}

async function decryptId(token, env) {
  let t = String(token || "").trim();
  if (t.includes("|local_company")) t = t.split("|local_company")[0];
  if (t.startsWith(TOKEN_PREFIX)) t = t.slice(TOKEN_PREFIX.length);
  t = t.replace(/=+$/g, "");
  const packed = ub64(t);
  const k = await key(env);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: packed.slice(1, 13) }, k, packed.slice(13));
  const payload = JSON.parse(new TextDecoder().decode(plain));
  if (!payload.id) throw new Error("NO_ID");
  return payload.id;
}

function normalize(d) {
  return {
    doc_id: d.doc_id || "DOC-" + Date.now().toString().slice(-6),
    created_at: d.created_at || new Date().toISOString().slice(0, 10),
    subject: d.subject || "الوثيقة المؤقتة لبيانات الحمولة من قبل الشركة",
    checkpoint_name_control: d.checkpoint_name_control || "-",
    driver_name: d.driver_name || "-",
    vehicle_number: d.vehicle_number || "-",
    registration_governorate: d.registration_governorate || d.governorate || "-",
    cargo_typedetails: d.cargo_typedetails || d.material || "-",
    weight_quantity: d.weight_quantity || `${d.quantity || ""} ${d.unit || ""}`.trim() || "-",
    destination_governorate: d.destination_governorate || d.destination || "-",
    governorate_name: d.governorate_name || d.governorate || "-",
    company_name_project: d.company_name_project || d.company_name || "-",
    granting_license_approval: d.granting_license_approval || "-",
    license_approval_number: d.license_approval_number || "-",
    license_approval_date: d.license_approval_date || d.created_at || "-",
    license_text_specialization: d.license_text_specialization || "-",
    brand: d.brand || "-",
    item_name: d.item_name || d.material || "-",
    item_quantity: d.item_quantity || `${d.quantity || ""} ${d.unit || ""}`.trim() || "-",
    note: d.note || "نموذج تجريبي داخلي غير حكومي",
    numberOfVersion: d.numberOfVersion || 1,
    generated_at: d.generated_at || new Date().toISOString()
  };
}

async function loadDoc(id, env) {
  if (env?.DOCS) {
    const txt = await env.DOCS.get(id);
    if (txt) return normalize(JSON.parse(txt));
  }
  if (demoDocuments[id]) return normalize(demoDocuments[id]);
  return null;
}

function createPage() {
  const today = new Date().toISOString().slice(0, 10);
  return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>إنشاء وثيقة</title><style>*{box-sizing:border-box}body{margin:0;background:#f3f4f6;font-family:Arial,sans-serif;color:#111827}.wrap{max-width:980px;margin:24px auto;padding:16px}.card{background:#fff;border-radius:18px;padding:22px;box-shadow:0 10px 35px rgba(0,0,0,.08)}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}.field{display:flex;flex-direction:column;gap:7px}label{font-weight:800}input,textarea,select{padding:13px;border:1px solid #d1d5db;border-radius:12px;font-size:16px}.full{grid-column:1/-1}.note{background:#fff7ed;color:#9a3412;padding:12px;border-radius:12px;margin:12px 0 22px;font-weight:700}.btn{margin-top:18px;border:0;background:#16a34a;color:#fff;border-radius:14px;padding:14px 20px;font-weight:900;font-size:17px}@media(max-width:720px){.grid{grid-template-columns:1fr}}</style></head><body><div class="wrap"><div class="card"><h1>إنشاء وثيقة من قبل الشركة</h1><div class="note">السيرفر يحفظ الوثيقة ويولد كود قصير مشفّر مثل gAAAAAB...==|local_company</div><form id="f"><div class="grid"><div class="field"><label>رقم الوثيقة</label><input name="doc_id" value="DOC-${Date.now().toString().slice(-6)}" required></div><div class="field"><label>تاريخ إنشاء الوثيقة</label><input name="created_at" type="date" value="${today}" required></div><div class="field full"><label>الموضوع</label><input name="subject" value="الوثيقة المؤقتة لبيانات الحمولة من قبل الشركة"></div><div class="field"><label>اسم سيطرة الدخول</label><input name="checkpoint_name_control" value="سيطرة تجريبية"></div><div class="field"><label>اسم السائق</label><input name="driver_name" value="جلال مهدي"></div><div class="field"><label>رقم العجلة</label><input name="vehicle_number" value="42040 دهوك"></div><div class="field"><label>محافظة تسجيل العجلة</label><input name="registration_governorate" value="دهوك"></div><div class="field"><label>نوع / تفاصيل الحمولة</label><input name="cargo_typedetails" value="مواد تجريبية"></div><div class="field"><label>الوزن / الكمية</label><input name="weight_quantity" value="100 كرتون"></div><div class="field"><label>الوجهة النهائية / المحافظة</label><input name="destination_governorate" value="أربيل"></div><div class="field"><label>اسم المحافظة</label><input name="governorate_name" value="دهوك"></div><div class="field"><label>اسم الشركة / المشروع</label><input name="company_name_project" value="شركة تجريبية"></div><div class="field"><label>الجهة المانحة للإجازة / الموافقة</label><input name="granting_license_approval" value="جهة تجريبية داخلية"></div><div class="field"><label>رقم الإجازة / الموافقة</label><input name="license_approval_number" value="TEST-1001"></div><div class="field"><label>تاريخ الإجازة / الموافقة</label><input name="license_approval_date" type="date" value="${today}"></div><div class="field"><label>منطوق الإجازة / الاختصاص</label><input name="license_text_specialization" value="اختصاص تجريبي داخلي"></div><div class="field"><label>العلامة التجارية</label><input name="brand" value="علامة تجريبية"></div><div class="field"><label>اسم المادة / المنتج</label><input name="item_name" value="مواد تجريبية"></div><div class="field"><label>كمية المنتج</label><input name="item_quantity" value="100 كرتون"></div><div class="field full"><label>ملاحظة داخلية</label><textarea name="note">نموذج تجريبي داخلي غير حكومي</textarea></div></div><button class="btn">إنشاء الوثيقة مع QR قصير</button></form></div></div><script>document.getElementById('f').addEventListener('submit',async e=>{e.preventDefault();const doc=Object.fromEntries(new FormData(e.target).entries());doc.numberOfVersion=1;doc.generated_at=new Date().toISOString();const r=await fetch('/api/create-token',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(doc)});const data=await r.json();if(!data.success){alert(data.message||'فشل الحفظ، تأكد من ربط DOCS KV في Cloudflare');return;}location.href=data.url;});</script></body></html>`;
}

function documentHtml(doc, token, request) {
  const time = new Date(doc.generated_at || Date.now()).toLocaleTimeString("ar-IQ", { hour: "2-digit", minute: "2-digit" });
  const url = `${baseUrl(request)}/document?d=${encodeURIComponent(token)}`;
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(url)}`;
  return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>وثيقة ${esc(doc.doc_id)}</title><style>@page{size:A4;margin:0}*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}body{margin:0;background:#e9ecef;font-family:Arial,sans-serif;color:#111}.a4{width:210mm;min-height:297mm;margin:0 auto;background:#fff;padding:10mm 12mm 8mm;position:relative;box-shadow:0 4px 24px #0003}.demo{position:absolute;top:6mm;left:8mm;background:#fee2e2;color:#991b1b;border:1px solid #fecaca;border-radius:999px;padding:5px 10px;font-weight:900;font-size:10px}.head{display:grid;grid-template-columns:1fr 95px 1fr;gap:12px;min-height:30mm}.hr{font-size:10.5pt;line-height:1.65}.logo{width:24mm;height:24mm;border:1.6px solid #444;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:auto;font-size:9pt;font-weight:800}.meta{font-size:9pt;line-height:1.55}.line{display:grid;grid-template-columns:30mm 1fr;gap:4mm;margin-bottom:2mm}.val{border-bottom:1px dotted #777;text-align:center}.div{border-top:1.5px solid #cfcfcf;margin:1mm 0 4mm}.title{text-align:center;font-size:19pt;font-weight:500;margin:0 0 5mm}.subj{display:flex;gap:6mm;margin-bottom:5mm;font-size:11pt}.box{border:1px solid #d6d6d6;border-radius:9px;padding:3mm 6mm;flex:1;text-align:center;font-weight:600}table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:9.4pt}.r{width:35%}.l{width:65%}th{background:#a40000;color:#fff;border:1px solid #8a0000;padding:2.5mm;text-align:center}td{border:1px solid #e3e3e3;padding:2.2mm 3mm}td:first-child{font-weight:600;background:#fafafa}.qr{display:flex;justify-content:center;align-items:center;margin:6mm auto 3mm;width:42mm;height:42mm;border:1px solid #dadada}.qr img{width:38mm;height:38mm}.notes{text-align:center;font-size:8.8pt;line-height:1.55}.u{direction:ltr;word-break:break-all;font-size:6.6pt;color:#999}.foot{position:absolute;left:12mm;right:12mm;bottom:6mm;border-top:1.5px solid #d8d8d8;padding-top:3mm;display:grid;grid-template-columns:28mm 1fr 48mm;font-size:7.8pt;color:#333}.fc{text-align:center;line-height:1.6}.fr{text-align:left;direction:ltr;line-height:1.55}@media(max-width:800px){body{background:#fff}.a4{width:100%;min-height:auto;box-shadow:none}.head{grid-template-columns:1fr}.foot{position:static;margin-top:8mm;grid-template-columns:1fr;text-align:center}.fr{text-align:center}}@media print{body{background:#fff}.a4{box-shadow:none}}</style></head><body><div class="a4"><div class="demo">نموذج تجريبي غير حكومي</div><header class="head"><div class="hr"><div>جمهورية العراق</div><div>وزارة المالية</div><div>الهيـئة العـامـة للكمـــارك</div></div><div><div class="logo">شعار</div></div><div class="meta"><div class="line"><b>رقم الوثيقة</b><span class="val">${esc(doc.doc_id)}</span></div><div class="line"><b>تاريخ إنشاء الوثيقة</b><span class="val">${esc(doc.created_at)}</span></div><div class="line"><b>التوقيت</b><span class="val">${esc(time)}</span></div></div></header><div class="div"></div><main><h2 class="title">منصة المنتج المحلي</h2><div class="subj"><b>الموضوع /</b><span class="box">${esc(doc.subject)}</span></div><table><colgroup><col class="r"><col class="l"></colgroup><tbody><tr><th colspan="2">المعلومات الشخصية</th></tr><tr><td>اسم سيطرة الدخول</td><td>${esc(doc.checkpoint_name_control)}</td></tr><tr><td>اسم السائق</td><td>${esc(doc.driver_name)}</td></tr><tr><td>رقم العجلة</td><td>${esc(doc.vehicle_number)}</td></tr><tr><td>محافظة تسجيل العجلة</td><td>${esc(doc.registration_governorate)}</td></tr><tr><td>نوع / تفاصيل الحمولة</td><td>${esc(doc.cargo_typedetails)}</td></tr><tr><td>الوزن / الكمية</td><td>${esc(doc.weight_quantity)}</td></tr><tr><td>الوجهة النهائية / المحافظة</td><td>${esc(doc.destination_governorate)}</td></tr><tr><td>اسم المحافظة</td><td>${esc(doc.governorate_name)}</td></tr><tr><td>اسم الشركة / المشروع</td><td>${esc(doc.company_name_project)}</td></tr><tr><td>الجهة المانحة للإجازة / الموافقة</td><td>${esc(doc.granting_license_approval)}</td></tr><tr><td>رقم الإجازة / الموافقة</td><td>${esc(doc.license_approval_number)}</td></tr><tr><td>تاريخ الإجازة / الموافقة</td><td>${esc(doc.license_approval_date)}</td></tr><tr><td>منطوق الإجازة / الاختصاص</td><td>${esc(doc.license_text_specialization)}</td></tr><tr><td>العلامة التجارية</td><td>${esc(doc.brand)}</td></tr><tr><th colspan="2">المواد / المنتجات المرخّصة</th></tr></tbody><tbody><tr><td>${esc(doc.item_name)}</td><td>${esc(doc.item_quantity)}</td></tr></tbody></table><div class="qr"><img src="${qr}" alt="QR"></div><div class="notes"><p>إن احتفاظك بهذه الوثيقة يمكّنك من استخدامها لدى الجهات المرتبطة بالنظام.</p><p>يمكنك حفظ صورة الوثيقة في الهاتف لاستخدامها عند الحاجة.</p><p>لمزيد من المعلومات عن الخدمات الحكومية الإلكترونية يمكن زيارة:</p><b>https://ur.gov.iq</b><div class="u">${esc(token)}</div></div></main><footer class="foot"><div class="logo">شعار</div><div></div><div class="fc"><div>مكتب رئيس الوزراء / المركز الوطني للتحول الرقمي</div><div>بغداد – كرادة مريم</div><div>المركز الوطني للتحول الرقمي @2025</div></div><div class="fr"><div>Prime Minister's Office</div><div>National Center for Digital Transformation</div><div>Tel: 5599</div></div></footer></div></body></html>`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url), p = url.pathname;
    if (request.method === "OPTIONS") return json({ ok: true });
    if (p === "/") return Response.redirect(`${baseUrl(request)}/create`, 302);
    if (p === "/create") return html(createPage());

    if (p === "/api/create-token" && request.method === "POST") {
      if (!env?.DOCS) return json({ success: false, message: "اربط Cloudflare KV باسم DOCS أولاً حتى السيرفر يحفظ الوثائق ويطلع كود قصير." }, 500);
      let doc = {}; try { doc = await request.json(); } catch {}
      doc = normalize(doc);
      await env.DOCS.put(doc.doc_id, JSON.stringify(doc));
      const token = await encryptId(doc.doc_id, env);
      return json({ success: true, doc_id: doc.doc_id, token, url: `${baseUrl(request)}/document?d=${encodeURIComponent(token)}` });
    }

    if (p === "/document") {
      try {
        const token = url.searchParams.get("d") || "";
        const id = await decryptId(token, env);
        const doc = await loadDoc(id, env);
        if (!doc) return html("<h2>لم يتم العثور على الوثيقة في السيرفر</h2>", 404);
        return html(documentHtml(doc, token, request));
      } catch { return html("<h2>الرابط غير صالح أو مفتاح التشفير مختلف</h2>", 400); }
    }

    if (p.startsWith("/qrpubliclink/")) {
      const id = decodeURIComponent(p.replace("/qrpubliclink/", ""));
      const doc = await loadDoc(id, env);
      if (!doc) return html("<h2>لم يتم العثور على الوثيقة</h2>", 404);
      const token = await encryptId(id, env);
      return html(documentHtml(doc, token, request));
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
      const token = await encryptId(id, env);
      const link = `${baseUrl(request)}/document?d=${encodeURIComponent(token)}`;
      return Response.redirect(`https://api.qrserver.com/v1/create-qr-code/?size=420x420&data=${encodeURIComponent(link)}`, 302);
    }

    return html("<h1>404</h1>", 404);
  }
};
