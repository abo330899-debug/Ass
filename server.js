import express from "express";
import QRCode from "qrcode";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || "";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

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

function getBaseUrl(req) {
  if (BASE_URL) return BASE_URL.replace(/\/$/, "");
  const proto = req.headers["x-forwarded-proto"] || req.protocol || "http";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${proto}://${host}`;
}

app.get("/qrpubliclink/:qrcode", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "qrpubliclink.html"));
});

app.get("/qrpubliclink", (req, res) => {
  if (req.query.code) {
    return res.sendFile(path.join(__dirname, "public", "qrpubliclink.html"));
  }

  return res.sendFile(path.join(__dirname, "public", "scanner.html"));
});

app.get("/api/verify/:code", (req, res) => {
  const code = cleanCode(req.params.code);
  const doc = findDocument(code);

  if (!doc) {
    return res.status(404).json({
      success: false,
      error: "DOCUMENT_NOT_FOUND",
      message: "لم يتم العثور على الوثيقة"
    });
  }

  return res.json({
    success: true,
    document: doc
  });
});

app.post("/api/read-qr", (req, res) => {
  const code = cleanCode(req.body.QRcode || req.body.code);
  const doc = findDocument(code);

  if (!doc) {
    return res.status(404).json({
      success: false,
      error: "DOCUMENT_NOT_FOUND",
      message: "لم يتم العثور على الوثيقة"
    });
  }

  return res.json({
    success: true,
    data: {
      info: {
        fullName: doc.owner_name,
        orgName: doc.company_name,
        orgPathInfo: `${doc.company_name} / ${doc.governorate}`
      },
      numberOfVersion: doc.numberOfVersion,
      showIn: true,
      document: doc
    }
  });
});

app.get("/api/make-qr/:code", async (req, res) => {
  const code = cleanCode(req.params.code);
  const doc = findDocument(code);

  if (!doc) {
    return res.status(404).json({
      success: false,
      error: "DOCUMENT_NOT_FOUND"
    });
  }

  const qrLink = `${getBaseUrl(req)}/qrpubliclink/${encodeURIComponent(code)}`;

  const png = await QRCode.toBuffer(qrLink, {
    width: 420,
    margin: 2,
    errorCorrectionLevel: "M"
  });

  res.setHeader("Content-Type", "image/png");
  res.send(png);
});

app.get("/api/make-qr-url/:code", (req, res) => {
  const code = cleanCode(req.params.code);
  const doc = findDocument(code);

  if (!doc) {
    return res.status(404).json({
      success: false,
      error: "DOCUMENT_NOT_FOUND"
    });
  }

  const qrLink = `${getBaseUrl(req)}/qrpubliclink/${encodeURIComponent(code)}`;

  res.json({
    success: true,
    code,
    qrLink
  });
});

app.get("/", (req, res) => {
  res.redirect("/qrpubliclink");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  console.log("Open /qrpubliclink");
});
