import "dotenv/config";
import http from "node:http";
import {
  buildEsewaPaymentRequest,
  createEsewaSignatureSource,
  createEsewaTransactionUuid,
  getEsewaConfig,
} from "../src/services/esewa.service.js";

if (process.env.NODE_ENV === "production") {
  throw new Error("The eSewa sandbox diagnostic is disabled in production");
}

const config = getEsewaConfig();
if (config.environment !== "sandbox") {
  throw new Error("The eSewa diagnostic requires ESEWA_ENVIRONMENT=sandbox");
}

const transactionUuid = createEsewaTransactionUuid();
const payment = buildEsewaPaymentRequest({
  pricing: { subtotal: 100, tax: 10, shippingFee: 0, total: 110 },
  paymentDetails: {
    transactionUuid,
    expectedAmount: "110",
    productCode: config.productCode,
  },
});
const signatureSource = createEsewaSignatureSource({
  totalAmount: payment.fields.total_amount,
  transactionUuid: payment.fields.transaction_uuid,
  productCode: payment.fields.product_code,
});
const calculatedTotal = Number(payment.fields.amount) + Number(payment.fields.tax_amount) +
  Number(payment.fields.product_service_charge) + Number(payment.fields.product_delivery_charge);

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const fieldRows = Object.entries(payment.fields)
  .map(([name, value]) => `<tr><th>${escapeHtml(name)}</th><td>${escapeHtml(name === "signature" ? `[base64:${value.length} chars]` : value)}</td></tr>`)
  .join("");
const hiddenInputs = Object.entries(payment.fields)
  .map(([name, value]) => `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}">`)
  .join("");

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>JewelLens eSewa Sandbox Diagnostic</title>
<style>body{font-family:system-ui;max-width:980px;margin:40px auto;padding:0 20px;color:#1f2937}table{width:100%;border-collapse:collapse;margin:20px 0}th,td{border:1px solid #d1d5db;padding:10px;text-align:left;word-break:break-all}th{width:260px;background:#f3f4f6}code{background:#f3f4f6;padding:3px 6px}button{padding:12px 18px;background:#60bb46;color:white;border:0;border-radius:8px;font-weight:700;cursor:pointer}.warning{padding:14px;background:#fff7ed;border:1px solid #fdba74;border-radius:8px}</style>
</head><body><h1>JewelLens eSewa Sandbox Diagnostic</h1>
<p class="warning"><strong>Development only.</strong> This verifies browser POST navigation. Do not complete a real payment from this diagnostic transaction because it is not attached to a database order.</p>
<p>Method: <code>POST</code><br>URL: <code>${escapeHtml(payment.formUrl)}</code><br>Signature source: <code>${escapeHtml(signatureSource)}</code><br>Total formula: <code>${calculatedTotal} = ${escapeHtml(payment.fields.total_amount)}</code></p>
<table><tbody>${fieldRows}</tbody></table>
<form method="POST" accept-charset="UTF-8" action="${escapeHtml(payment.formUrl)}">${hiddenInputs}<button type="submit">Submit verified payload to eSewa</button></form>
</body></html>`;

const port = Number(process.env.ESEWA_DIAGNOSTIC_PORT || 5051);
http.createServer((req, res) => {
  if (req.url !== "/") {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end("Not found");
  }
  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Frame-Options": "DENY",
  });
  return res.end(html);
}).listen(port, "127.0.0.1", () => {
  console.info(`eSewa sandbox diagnostic ready at http://127.0.0.1:${port}`);
  console.info("The secret key is not included in the page or logs.");
});
