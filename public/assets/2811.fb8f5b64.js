"use strict";
// Internal safe QR reader based on the uploaded DMS reader idea.
// Reads only this project's local QR/document codes. No external government endpoints are used.
(function () {
  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    Object.assign(node, attrs || {});
    if (Array.isArray(children)) children.forEach(c => node.appendChild(typeof c === "string" ? document.createTextNode(c) : c));
    else if (children) node.textContent = children;
    return node;
  }

  function styles() {
    const s = document.createElement("style");
    s.textContent = `
      body{margin:0;background:#f3f4f6;font-family:Arial,sans-serif;color:#111827}
      .qr-reader{max-width:860px;margin:30px auto;padding:16px;direction:rtl}
      .qr-card{background:#fff;border-radius:18px;box-shadow:0 10px 35px rgba(0,0,0,.08);padding:22px}
      .qr-banner{display:flex;align-items:center;gap:10px;color:#04408B;font-size:22px;font-weight:900;margin-bottom:20px}
      .qr-row{display:flex;gap:10px;align-items:center}
      .qr-input{flex:1;padding:14px;border:1px solid #d1d5db;border-radius:12px;font-size:16px;direction:ltr;text-align:left}
      .qr-btn{border:0;background:#a40000;color:#fff;border-radius:12px;padding:13px 24px;font-weight:900;cursor:pointer}
      .qr-result{margin-top:18px;padding:14px;background:#f9fafb;border-radius:12px;line-height:1.9}
      .valid{color:green;font-weight:900}.err{color:#b91c1c;font-weight:900}
      @media(max-width:600px){.qr-row{flex-direction:column}.qr-input,.qr-btn{width:100%}}
    `;
    document.head.appendChild(s);
  }

  async function readQR(code) {
    const res = await fetch("/api/read-qr", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ QRcode: code })
    });
    return res.json();
  }

  function boot() {
    styles();
    const root = document.getElementById("app") || document.body.appendChild(document.createElement("div"));
    root.className = "qr-reader";
    root.innerHTML = "";

    const input = el("input", { className: "qr-input", placeholder: "gAAAAAB...==|local_company أو DOC-1001" });
    const btn = el("button", { className: "qr-btn" }, "قراءة");
    const out = el("div", { className: "qr-result", style: "display:none" });

    btn.onclick = async function () {
      const code = input.value.trim();
      out.style.display = "block";
      if (!code || code.length < 3) {
        out.innerHTML = "<div class='err'>يجب إدخال رمز QR</div>";
        return;
      }
      out.textContent = "جاري القراءة...";
      try {
        const data = await readQR(code);
        if (!data.success) {
          out.innerHTML = "<div class='err'>لم يتم العثور على الوثيقة</div>";
          return;
        }
        const d = data.data || {};
        out.innerHTML = `
          <div class="valid">Valid</div>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="color:#04408B">اسم الموظف:</td><td>${d.info && d.info.fullName || "-"}</td></tr>
            <tr><td style="color:#04408B">اسم التشكيل:</td><td>${d.info && d.info.orgName || "-"}</td></tr>
            <tr><td style="color:#04408B">عدد تعديلات الوثيقة:</td><td>${d.numberOfVersion || 1}</td></tr>
          </table>
          <p><a href="${d.documentUrl || "#"}" target="_blank">عرض الوثيقة بنافذة جديدة</a></p>
          <p style="color:#991b1b;font-weight:700">نظام داخلي تجريبي غير حكومي</p>
        `;
      } catch (e) {
        out.innerHTML = "<div class='err'>خطأ في القراءة</div>";
      }
    };

    const card = el("div", { className: "qr-card" }, [
      el("div", { className: "qr-banner" }, "قراءة رمز الاستجابة السريعة"),
      el("div", { className: "qr-row" }, [input, btn]),
      out
    ]);
    root.appendChild(card);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
