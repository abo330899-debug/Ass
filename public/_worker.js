const TOKEN_PREFIX = "gAAAAAB";
const TOKEN_SUFFIX = "==|local_company";
const FALLBACK_SECRET = "local-company-demo-secret-change-this-in-cloudflare";

const COMPANY = {
  ar: "مجموعة عبد الستار للخدمات اللوجستية",
  en: "Abdulstar Logistics Group",
  dept: "قسم إصدار وثائق النقل الداخلية",
  address: "العراق - دهوك",
  phone: "0750 000 0000",
  mark: "ALG",
  watermark: "وثيقة شركة غير حكومية"
};

const companies = [
  { id: "C-1001", name: "شركة الغدير للنقل والتجارة", owner: "قسم الشركات", phone: "07500000000", governorate: "دهوك", approval: "إدارة مجموعة عبد الستار", license: "ALG-1001", brand: "ALGHADIR" },
  { id: "C-1002", name: "شركة ستار باك التجارية", owner: "قسم التوريد", phone: "07511111111", governorate: "أربيل", approval: "إدارة مجموعة عبد الستار", license: "ALG-1002", brand: "STAR PACK" },
  { id: "C-1003", name: "شركة النعيم للخدمات", owner: "قسم العمليات", phone: "07522222222", governorate: "دهوك", approval: "إدارة مجموعة عبد الستار", license: "ALG-1003", brand: "ALNAEEM" }
];

const demoDocuments = {
  "DOC-1001": {
    doc_id: "DOC-1001",
    created_at: "2026-07-10",
    checkpoint_name_control: "بوابة الشركة الرئيسية",
    driver_name: "جلال مهدي",
    vehicle_number: "42040 دهوك",
    registration_governorate: "دهوك",
    cargo_typedetails: "مواد تجارية",
    weight_quantity: "100 كرتون",
    destination_governorate: "أربيل",
    governorate_name: "دهوك",
    company_name_project: "شركة الغدير للنقل والتجارة",
    granting_license_approval: "إدارة مجموعة عبد الستار",
    license_approval_number: "ALG-1001",
    license_approval_date: "2026-07-10",
    license_text_specialization: "موافقة نقل داخلية للشركة",
    brand: "ALGHADIR",
    item_name: "مواد تجارية",
    item_quantity: "100 كرتون",
    numberOfVersion: 1,
    generated_at: "2026-07-10T18:47:09.090Z",
    note: "وثيقة شركة داخلية غير حكومية"
  }
};

const enc = new TextEncoder();
const dec = new TextDecoder();
const esc = v => String(v ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const html = (s, status = 200) => new Response(s, { status, headers: { "content-type": "text/html; charset=utf-8" } });
const json = (d, status = 200) => new Response(JSON.stringify(d, null, 2), { status, headers: { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*", "access-control-allow-methods": "GET,POST,OPTIONS", "access-control-allow-headers": "content-type" } });
const baseUrl = req => { const u = new URL(req.url); return `${u.protocol}//${u.host}`; };

function b64u(bytes) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}
function ub64(text) {
  const pad = "=".repeat((4 - (text.length % 4)) % 4);
  const bin = atob(text.replaceAll("-", "+").replaceAll("_", "/") + pad);
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}
function b64(text) {
  let bin = "";
  for (const b of enc.encode(text)) bin += String.fromCharCode(b);
  return btoa(bin);
}
async function key(env) {
  const secret = String(env?.LOCAL_COMPANY_SECRET || FALLBACK_SECRET);
  const hash = await crypto.subtle.digest("SHA-256", enc.encode(secret));
  return crypto.subtle.importKey("raw", hash, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}
async function encryptId(id, env) {
  const k = await key(env);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const payload = JSON.stringify({ id: String(id), type: "company_document" }).padEnd(96, " ");
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, k, enc.encode(payload)));
  const packed = new Uint8Array(1 + iv.length + cipher.length);
  packed[0] = 1;
  packed.set(iv, 1);
  packed.set(cipher, 13);
  return TOKEN_PREFIX + b64u(packed) + TOKEN_SUFFIX;
}
async function decryptId(token, env) {
  let raw = String(token || "").trim();
  if (raw.startsWith("http")) {
    const u = new URL(raw);
    raw = u.searchParams.get("d") || raw;
  }
  if (raw.includes("|local_company")) raw = raw.split("|local_company")[0];
  if (raw.startsWith(TOKEN_PREFIX)) raw = raw.slice(TOKEN_PREFIX.length);
  raw = raw.replace(/=+$/g, "");
  const packed = ub64(raw);
  if (packed[0] !== 1) throw new Error("BAD_TOKEN");
  const k = await key(env);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: packed.slice(1, 13) }, k, packed.slice(13));
  return JSON.parse(dec.decode(plain).trim()).id;
}
function normalizeDoc(d) {
  const qty = `${d.quantity || ""} ${d.unit || ""}`.trim();
  return {
    doc_id: d.doc_id || `DOC-${Date.now().toString().slice(-6)}`,
    created_at: d.created_at || new Date().toISOString().slice(0, 10),
    subject: "وثيقة نقل داخلية للشركة",
    checkpoint_name_control: d.checkpoint_name_control || "-",
    driver_name: d.driver_name || "-",
    vehicle_number: d.vehicle_number || "-",
    registration_governorate: d.registration_governorate || d.governorate || "-",
    cargo_typedetails: d.cargo_typedetails || d.material || "-",
    weight_quantity: d.weight_quantity || qty || "-",
    destination_governorate: d.destination_governorate || d.destination || "-",
    governorate_name: d.governorate_name || d.governorate || "-",
    company_name_project: d.company_name_project || d.company_name || "-",
    granting_license_approval: d.granting_license_approval || COMPANY.dept,
    license_approval_number: d.license_approval_number || "-",
    license_approval_date: d.license_approval_date || d.created_at || new Date().toISOString().slice(0, 10),
    license_text_specialization: d.license_text_specialization || "موافقة نقل داخلية للشركة",
    brand: d.brand || "-",
    item_name: d.item_name || d.material || "-",
    item_quantity: d.item_quantity || qty || "-",
    numberOfVersion: Number(d.numberOfVersion || 1),
    generated_at: d.generated_at || new Date().toISOString(),
    note: d.note || "وثيقة شركة داخلية غير حكومية"
  };
}
async function saveDoc(doc, env) {
  if (!env?.DOCS) return false;
  await env.DOCS.put(doc.doc_id, JSON.stringify(doc));
  return true;
}
async function loadDoc(id, env) {
  if (!id) return null;
  let docId = String(id);
  if (docId.startsWith("http") || docId.startsWith(TOKEN_PREFIX)) docId = await decryptId(docId, env);
  if (env?.DOCS) {
    const saved = await env.DOCS.get(docId);
    if (saved) return normalizeDoc(JSON.parse(saved));
  }
  return demoDocuments[docId] ? normalizeDoc(demoDocuments[docId]) : null;
}
async function getDocToken(code, req, env) {
  let raw = String(code || "").trim();
  if (raw.startsWith("http")) {
    const u = new URL(raw);
    raw = u.searchParams.get("d") || raw;
  }
  let id, token;
  if (raw.startsWith(TOKEN_PREFIX)) {
    token = raw;
    id = await decryptId(raw, env);
  } else {
    id = raw;
    token = await encryptId(id, env);
  }
  const doc = await loadDoc(id, env);
  const pdfUrl = `${baseUrl(req)}/pdf?d=${encodeURIComponent(token)}`;
  return { id, token, doc, url: `${baseUrl(req)}/document?d=${encodeURIComponent(token)}`, pdfUrl };
}

const appCss = `
*{box-sizing:border-box}html,body{margin:0;padding:0;font-family:Arial,sans-serif;background:#f1f3f6;color:#151515}a{color:#0b4aa2}.topbar{background:#fff;border-bottom:1px solid #ddd;box-shadow:0 2px 10px #0000000d}.topbar-inner{max-width:1180px;margin:auto;min-height:68px;padding:10px 18px;display:flex;align-items:center;justify-content:space-between;gap:12px}.brand{display:flex;align-items:center;gap:12px;font-weight:900}.brand-seal{width:46px;height:46px;border-radius:50%;border:2px solid #8a0000;color:#8a0000;display:grid;place-items:center;font-weight:900}.nav{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.nav a,.tag{padding:8px 12px;border-radius:999px;text-decoration:none;font-weight:800;font-size:13px}.nav a{background:#f3f4f6;color:#333}.tag{background:#fee2e2;color:#991b1b;border:1px solid #fecaca}.main{max-width:1180px;margin:auto;padding:22px 16px}.panel{background:#fff;border:1px solid #e3e5e8;border-radius:18px;box-shadow:0 12px 34px #00000012;overflow:hidden}.panel-head{padding:22px 24px;border-bottom:1px solid #eceff3;background:linear-gradient(135deg,#fff,#f8fafc)}.panel-head h1{margin:0 0 8px;font-size:25px}.panel-head p{margin:0;color:#666;line-height:1.7}.layout{display:grid;grid-template-columns:360px 1fr;gap:18px;padding:18px}.side{background:#fafafa;border:1px solid #eceff3;border-radius:16px;padding:15px}.search,.input,textarea{width:100%;border:1px solid #d5d9df;border-radius:12px;padding:12px 13px;font-size:15px;outline:none}.search:focus,.input:focus,textarea:focus{border-color:#8a0000;box-shadow:0 0 0 3px #a4000014}.company-card{background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:12px;margin-top:10px;cursor:pointer}.company-card.active,.company-card:hover{border-color:#8a0000;box-shadow:0 0 0 3px #a4000011}.company-title{font-weight:900}.company-meta{font-size:12px;color:#666;line-height:1.6;margin-top:5px}.selected-box{background:#fff7ed;border:1px solid #fed7aa;color:#7c2d12;border-radius:14px;padding:12px;font-weight:900;margin-bottom:14px}.form-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}.field{display:flex;flex-direction:column;gap:7px}.field.full{grid-column:1/-1}label{font-weight:900;font-size:14px}.actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px}.btn{border:0;border-radius:12px;background:#8a0000;color:#fff;font-weight:900;padding:13px 18px;cursor:pointer}.btn.secondary{background:#1f2937}.btn.ghost{background:#f3f4f6;color:#111}.footer{text-align:center;background:#fff;border-top:1px solid #ddd;padding:18px;color:#777;font-size:13px}@media(max-width:900px){.layout{grid-template-columns:1fr}.form-grid{grid-template-columns:1fr}.topbar-inner{align-items:flex-start;flex-direction:column}.btn{width:100%}}
`;
function nav() {
  return `<div class="topbar"><div class="topbar-inner"><div class="brand"><div class="brand-seal">${COMPANY.mark}</div><div><div>${COMPANY.ar}</div><small style="color:#666">${COMPANY.dept}</small></div></div><div class="nav"><a href="/company-owner">أصحاب الشركات</a><a href="/ReadQrWithUR">قراءة QR</a><span class="tag">غير حكومية</span></div></div></div>`;
}
function companyOwnerPage() {
  const today = new Date().toISOString().slice(0, 10);
  const cards = companies.map((c,i)=>`<div class="company-card ${i===0?'active':''}" data-company='${JSON.stringify(c).replaceAll("'","&#39;")}'><div class="company-title">${esc(c.name)}</div><div class="company-meta">المسؤول: ${esc(c.owner)}<br>المحافظة: ${esc(c.governorate)} - رقم الاعتماد: ${esc(c.license)}</div></div>`).join("");
  const docId = `DOC-${Date.now().toString().slice(-6)}`;
  const fields = [
    ["doc_id","رقم الوثيقة",docId,"text"],["created_at","تاريخ إنشاء الوثيقة",today,"date"],["company_name_project","اسم الشركة / المشروع",companies[0].name,"text"],["governorate_name","اسم المحافظة",companies[0].governorate,"text"],["granting_license_approval","الجهة المانحة للاعتماد",companies[0].approval,"text"],["license_approval_number","رقم الاعتماد",companies[0].license,"text"],["license_approval_date","تاريخ الاعتماد",today,"date"],["brand","العلامة التجارية",companies[0].brand,"text"],["checkpoint_name_control","نقطة الدخول / التسليم","بوابة الشركة الرئيسية","text"],["driver_name","اسم السائق","جلال مهدي","text"],["vehicle_number","رقم العجلة","42040 دهوك","text"],["registration_governorate","محافظة تسجيل العجلة","دهوك","text"],["cargo_typedetails","نوع / تفاصيل الحمولة","مواد تجارية","text"],["weight_quantity","الوزن / الكمية","100 كرتون","text"],["destination_governorate","الوجهة النهائية / المحافظة","أربيل","text"],["license_text_specialization","منطوق الاعتماد / الاختصاص","موافقة نقل داخلية للشركة","text"],["item_name","اسم المادة / المنتج","مواد تجارية","text"],["item_quantity","كمية المنتج","100 كرتون","text"]
  ].map(([n,l,v,t])=>`<div class="field"><label>${l}</label><input class="input" name="${n}" type="${t}" value="${esc(v)}"></div>`).join("");
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>أصحاب الشركات</title><style>${appCss}</style></head><body>${nav()}<main class="main"><section class="panel"><div class="panel-head"><h1>بوابة أصحاب الشركات</h1><p>اختر الشركة، أدخل معلومات السائق والحمولة، ثم أنشئ وثيقة شركة رسمية الشكل مع QR وعلامة مائية واضحة.</p></div><div class="layout"><aside class="side"><input id="companySearch" class="search" placeholder="بحث عن شركة أو محافظة أو مسؤول"><div id="companyList">${cards}</div></aside><section><div id="selectedCompany" class="selected-box">الشركة المحددة: ${esc(companies[0].name)} - ${esc(companies[0].governorate)}</div><form id="docForm"><div class="form-grid">${fields}<div class="field full"><label>ملاحظة داخلية</label><textarea name="note" rows="3">وثيقة شركة داخلية غير حكومية</textarea></div></div><div class="actions"><button class="btn">إنشاء PDF</button><button class="btn secondary" type="button" onclick="location.href='/pdf?d=DOC-1001'">PDF مثال</button><button class="btn ghost" type="button" onclick="location.href='/ReadQrWithUR'">قراءة QR</button></div></form></section></div></section></main><footer class="footer">${COMPANY.en} - Internal Non-Government Document System</footer><script>const cards=[...document.querySelectorAll('.company-card')];const search=document.getElementById('companySearch');function setCompany(c,el){cards.forEach(x=>x.classList.remove('active'));if(el)el.classList.add('active');document.getElementById('selectedCompany').textContent='الشركة المحددة: '+c.name+' - '+c.governorate;const f=document.getElementById('docForm');f.company_name_project.value=c.name;f.governorate_name.value=c.governorate;f.granting_license_approval.value=c.approval;f.license_approval_number.value=c.license;f.brand.value=c.brand;}cards.forEach(card=>card.onclick=()=>setCompany(JSON.parse(card.dataset.company),card));search.oninput=()=>{const q=search.value.trim().toLowerCase();cards.forEach(card=>{const c=JSON.parse(card.dataset.company);const txt=(c.name+' '+c.owner+' '+c.governorate+' '+c.license).toLowerCase();card.style.display=txt.includes(q)?'block':'none';});};document.getElementById('docForm').addEventListener('submit',async e=>{e.preventDefault();const doc=Object.fromEntries(new FormData(e.target).entries());doc.numberOfVersion=1;doc.generated_at=new Date().toISOString();const r=await fetch('/api/create-token',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(doc)});const data=await r.json();if(!data.success){alert(data.message||'فشل إنشاء الوثيقة');return;}location.href=data.pdf_url;});</script></body></html>`;
}
function docStyles() {
  return `@page{size:A4;margin:0}*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}html,body{margin:0;padding:0;background:#e9ecef;font-family:Arial,sans-serif;color:#111}.doc-page{width:210mm;min-height:297mm;margin:0 auto;background:white;padding:10mm 12mm 8mm;position:relative;overflow:hidden;box-shadow:0 4px 24px #0003}.wm{position:absolute;top:45%;right:50%;transform:translate(50%,-50%) rotate(-28deg);font-size:34pt;font-weight:900;color:#8a0000;opacity:.095;white-space:nowrap;z-index:0}.demo-ribbon{position:absolute;top:7mm;left:7mm;border:1px solid #991b1b;color:#991b1b;background:#fff5f5;border-radius:999px;padding:3mm 5mm;font-weight:900;font-size:9pt;z-index:2}.doc-content{position:relative;z-index:1}.doc-header{display:grid;grid-template-columns:1fr 28mm 1fr;gap:12px;align-items:start;min-height:31mm}.h-right{font-size:10.5pt;line-height:1.52}.h-right strong{font-size:11.2pt}.logo{width:25mm;height:25mm;border:2px solid #8a0000;border-radius:50%;display:grid;place-items:center;margin:auto;color:#8a0000;font-weight:900;font-size:13pt}.h-left{font-size:9pt}.meta{display:grid;grid-template-columns:28mm 1fr;gap:4mm;margin-bottom:2mm}.meta span:last-child{border-bottom:1px dotted #777;text-align:center;min-height:5mm}.line{border:0;border-top:1.4px solid #cfcfcf;margin:2mm 0 5mm}.title{text-align:center;font-size:20pt;font-weight:700;margin:0 0 5mm}.subject{display:flex;gap:6mm;align-items:center;font-size:11pt;margin-bottom:5mm}.subject-box{flex:1;border:1px solid #d5d5d5;border-radius:9px;padding:3mm 6mm;text-align:center;font-weight:700}.doc-frame{border:1px solid #e1e1e1;border-radius:10px;padding:3mm;background:#fff}.info-table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:9.35pt}.info-table col:first-child{width:35%}.info-table col:nth-child(2){width:65%}.info-table th{background:#a40000;color:white;border:1px solid #850000;padding:2.35mm;font-size:10pt}.info-table td{border:1px solid #e2e2e2;padding:2.1mm 3mm;vertical-align:middle}.info-table td:first-child{background:#fafafa;font-weight:700}.qr{width:42mm;height:42mm;border:1px solid #d8d8d8;margin:6mm auto 3mm;display:grid;place-items:center}.qr img{width:38mm;height:38mm}.notes{text-align:center;font-size:8.7pt;line-height:1.6}.notes p{margin:1mm 0}.token{direction:ltr;font-size:6.2pt;color:#999;word-break:break-all}.stamp{position:absolute;right:22mm;bottom:24mm;width:34mm;height:34mm;border:2px solid #8a0000;border-radius:50%;display:grid;place-items:center;text-align:center;color:#8a0000;font-weight:900;transform:rotate(-10deg);opacity:.78}.sign{position:absolute;left:20mm;bottom:28mm;text-align:center;font-size:9pt}.sign .sigline{width:38mm;border-bottom:1px solid #111;margin:12mm auto 2mm}.footer{position:absolute;left:12mm;right:12mm;bottom:6mm;border-top:1.4px solid #d8d8d8;padding-top:3mm;display:grid;grid-template-columns:1fr 1fr 1fr;gap:8mm;align-items:center;font-size:7.8pt;color:#333}.footer div:nth-child(2){text-align:center}.footer div:nth-child(3){direction:ltr;text-align:left}@media print{html,body{background:#fff}.doc-page{box-shadow:none;margin:0;width:210mm;min-height:297mm}.print-actions{display:none!important}}.print-actions{position:fixed;top:10px;left:50%;transform:translateX(-50%);z-index:99;background:white;border:1px solid #ddd;border-radius:14px;padding:8px;box-shadow:0 8px 28px #0002;display:flex;gap:8px}.print-actions button{border:0;border-radius:10px;background:#8a0000;color:white;font-weight:900;padding:10px 14px}`;
}
function docMarkup(doc, token, req) {
  const time = new Date(doc.generated_at || Date.now()).toLocaleTimeString("ar-IQ", { hour: "2-digit", minute: "2-digit" });
  const link = `${baseUrl(req)}/document?d=${encodeURIComponent(token)}`;
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=270x270&data=${encodeURIComponent(link)}`;
  const row = (a,b)=>`<tr><td>${a}</td><td>${esc(b)}</td></tr>`;
  return `<div class="doc-page"><div class="wm">${COMPANY.watermark}</div><div class="demo-ribbon">غير حكومية - للاستخدام الداخلي</div><div class="doc-content"><header class="doc-header"><div class="h-right"><strong>${COMPANY.ar}</strong><br>${COMPANY.dept}<br>${COMPANY.address}</div><div><div class="logo">${COMPANY.mark}</div></div><div class="h-left"><div class="meta"><span>رقم الوثيقة</span><span>${esc(doc.doc_id)}</span></div><div class="meta"><span>تاريخ الإنشاء</span><span>${esc(doc.created_at)}</span></div><div class="meta"><span>التوقيت</span><span>${esc(time)}</span></div></div></header><hr class="line"><h1 class="title">وثيقة نقل داخلية للشركة</h1><div class="subject"><strong>الموضوع /</strong><div class="subject-box">${esc(doc.subject)}</div></div><section class="doc-frame"><table class="info-table"><colgroup><col><col></colgroup><tbody><tr><th colspan="2">المعلومات الشخصية والتشغيلية</th></tr>${row("نقطة الدخول / التسليم",doc.checkpoint_name_control)}${row("اسم السائق",doc.driver_name)}${row("رقم العجلة",doc.vehicle_number)}${row("محافظة تسجيل العجلة",doc.registration_governorate)}${row("نوع / تفاصيل الحمولة",doc.cargo_typedetails)}${row("الوزن / الكمية",doc.weight_quantity)}${row("الوجهة النهائية / المحافظة",doc.destination_governorate)}${row("اسم المحافظة",doc.governorate_name)}${row("اسم الشركة / المشروع",doc.company_name_project)}${row("الجهة المانحة للاعتماد",doc.granting_license_approval)}${row("رقم الاعتماد",doc.license_approval_number)}${row("تاريخ الاعتماد",doc.license_approval_date)}${row("منطوق الاعتماد / الاختصاص",doc.license_text_specialization)}${row("العلامة التجارية",doc.brand)}<tr><th colspan="2">المواد / المنتجات المعتمدة داخلياً</th></tr>${row(doc.item_name,doc.item_quantity)}</tbody></table></section><div class="qr"><img src="${qr}" alt="QR"></div><div class="notes"><p>هذه الوثيقة صادرة من نظام الشركة الداخلي وليست صادرة من أي جهة حكومية.</p><p>يتم التحقق من QR داخل نظام الشركة فقط.</p><div class="token">${esc(token)}</div></div></div><div class="stamp">ختم<br>الشركة<br>${COMPANY.mark}</div><div class="sign"><div class="sigline"></div>توقيع المخوّل</div><footer class="footer"><div>${COMPANY.phone}</div><div>${COMPANY.ar}<br>وثيقة داخلية غير حكومية</div><div>${COMPANY.en}<br>Non-Government Company Document</div></footer></div>`;
}
function docPage(doc, token, req, autoPrint=false) {
  const actions = autoPrint ? `<div class="print-actions"><button onclick="window.print()">حفظ PDF</button><button onclick="location.href='/document?d=${encodeURIComponent(token)}'">عرض الصفحة</button></div>` : ``;
  const script = autoPrint ? `<script>setTimeout(()=>window.print(),700)</script>` : ``;
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(doc.doc_id)}</title><style>${docStyles()}</style></head><body>${actions}${docMarkup(doc, token, req)}${script}</body></html>`;
}
function readerPage(){return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>قراءة QR</title><style>${appCss}.reader{max-width:820px;margin:30px auto}.row{display:flex;gap:10px}.result{margin-top:18px;background:#fff;border:1px solid #ddd;border-radius:14px;padding:14px;line-height:1.9}.ok{color:green;font-weight:900}.err{color:#b91c1c;font-weight:900}@media(max-width:650px){.row{flex-direction:column}}</style></head><body>${nav()}<main class="main reader"><section class="panel"><div class="panel-head"><h1>قراءة رمز QR</h1><p>ضع رقم الوثيقة أو كود QR الخاص بالشركة.</p></div><div style="padding:22px"><div class="row"><input id="qr" class="input" style="direction:ltr" placeholder="DOC-1001 أو gAAAAAB..."><button class="btn" onclick="readQR()">قراءة</button></div><div id="out" class="result" style="display:none"></div></div></section></main><script>async function readQR(){const q=document.getElementById('qr').value.trim();const out=document.getElementById('out');out.style.display='block';out.innerHTML='جاري القراءة...';try{const r=await fetch('/api/read-qr',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({QRcode:q})});const d=await r.json();if(!d.success){out.innerHTML='<div class="err">لم يتم العثور على الوثيقة</div>';return;}out.innerHTML='<div class="ok">Valid</div><p>السائق: '+(d.data.info.fullName||'-')+'</p><p>الشركة: '+(d.data.info.orgName||'-')+'</p><p><a href="'+d.data.pdfUrl+'" target="_blank">فتح PDF</a></p><p><a href="'+d.data.documentUrl+'" target="_blank">عرض الوثيقة</a></p>'}catch(e){out.innerHTML='<div class="err">خطأ في القراءة</div>'}}</script></body></html>`;}

export default { async fetch(request, env) {
  const url = new URL(request.url);
  const p = url.pathname;
  if (request.method === "OPTIONS") return json({ ok: true });
  if (p === "/") return Response.redirect(`${baseUrl(request)}/company-owner`, 302);
  if (p === "/company-owner" || p === "/owners" || p === "/create") return html(companyOwnerPage());
  if (p === "/ReadQrWithUR" || p === "/qr-reader") return html(readerPage());
  if (p === "/api/companies") return json({ success: true, companies });
  if (p === "/api/create-token" && request.method === "POST") {
    let body = {};
    try { body = await request.json(); } catch {}
    const doc = normalizeDoc(body);
    if (!env?.DOCS) return json({ success:false, message:"اربط Cloudflare KV باسم DOCS حتى يتم حفظ الوثائق." }, 500);
    await saveDoc(doc, env);
    const token = await encryptId(doc.doc_id, env);
    return json({ success:true, doc_id:doc.doc_id, token, url:`${baseUrl(request)}/document?d=${encodeURIComponent(token)}`, pdf_url:`${baseUrl(request)}/pdf?d=${encodeURIComponent(token)}` });
  }
  if (p === "/document" || p === "/pdf") {
    try {
      const { doc, token } = await getDocToken(url.searchParams.get("d"), request, env);
      if (!doc) return html("<h2>لم يتم العثور على الوثيقة</h2>", 404);
      return html(docPage(doc, token, request, p === "/pdf"));
    } catch { return html("<h2>الرابط غير صالح أو مفتاح التشفير مختلف</h2>", 400); }
  }
  if (p.startsWith("/qrpubliclink/")) {
    try {
      const code = decodeURIComponent(p.replace("/qrpubliclink/", ""));
      const { doc, token } = await getDocToken(code, request, env);
      if (!doc) return html("<h2>لم يتم العثور على الوثيقة</h2>", 404);
      return html(docPage(doc, token, request));
    } catch { return html("<h2>QR error</h2>", 400); }
  }
  if (p.startsWith("/api/verify/")) {
    try {
      const code = decodeURIComponent(p.replace("/api/verify/", ""));
      const { doc } = await getDocToken(code, request, env);
      if (!doc) return json({ success:false, error:"DOCUMENT_NOT_FOUND" }, 404);
      return json({ success:true, document:{ ...doc, company_name:doc.company_name_project } });
    } catch { return json({ success:false, error:"QR_ERROR" }, 400); }
  }
  if (p === "/api/read-qr" && request.method === "POST") {
    let body = {};
    try { body = await request.json(); } catch {}
    try {
      const { doc, token, url: docUrl, pdfUrl } = await getDocToken(body.QRcode || body.code || "", request, env);
      if (!doc) return json({ success:false, error:"DOCUMENT_NOT_FOUND" }, 404);
      return json({ success:true, data:{ info:{ fullName:doc.driver_name, orgName:doc.company_name_project, orgPathInfo:`${doc.company_name_project} / ${doc.governorate_name}` }, numberOfVersion:doc.numberOfVersion, showIn:true, documentUrl:docUrl, pdfUrl, documentFilePath:b64(pdfUrl), document:doc, token } });
    } catch { return json({ success:false, error:"QR_ERROR" }, 400); }
  }
  if (p.startsWith("/api/make-qr/")) {
    const code = decodeURIComponent(p.replace("/api/make-qr/", ""));
    const { doc, pdfUrl } = await getDocToken(code, request, env);
    if (!doc) return json({ success:false, error:"DOCUMENT_NOT_FOUND" }, 404);
    return Response.redirect(`https://api.qrserver.com/v1/create-qr-code/?size=420x420&data=${encodeURIComponent(pdfUrl)}`, 302);
  }
  return html("<h1>404</h1>", 404);
}};
