"use strict";
// Internal safe verifier based on the uploaded DMS verifier idea.
// This file verifies only documents served by this project.
(function () {
  function getCode() {
    try {
      const url = new URL(location.href);
      return url.searchParams.get("code") || url.searchParams.get("d") || decodeURIComponent(location.pathname.split("/").filter(Boolean).pop() || "");
    } catch (_) {
      return "";
    }
  }

  async function verify(code) {
    const res = await fetch("/api/verify/" + encodeURIComponent(code));
    return res.json();
  }

  async function boot() {
    const root = document.getElementById("app") || document.body.appendChild(document.createElement("div"));
    root.style.maxWidth = "800px";
    root.style.margin = "30px auto";
    root.style.direction = "rtl";
    root.style.fontFamily = "Arial, sans-serif";

    const code = getCode();
    if (!code) {
      root.innerHTML = "<h3 style='text-align:center;margin-top:80px'>Scan QR</h3>";
      return;
    }

    root.innerHTML = "<h3 style='text-align:center;margin-top:80px'>Loading...</h3>";
    try {
      const data = await verify(code);
      if (!data.success || !data.document) {
        root.innerHTML = "<p style='text-align:center;margin-top:80px;color:red'>QR error</p>";
        return;
      }
      const d = data.document;
      root.innerHTML = `
        <h2 style="color:green">Valid</h2>
        <p>ID: ${d.doc_id || ""}</p>
        <p>Company: ${d.company_name || d.company_name_project || ""}</p>
        <p style="color:#991b1b;font-weight:700">نموذج داخلي تجريبي غير حكومي</p>
      `;
    } catch (e) {
      root.innerHTML = "<p style='text-align:center;margin-top:80px;color:red'>error</p>";
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
