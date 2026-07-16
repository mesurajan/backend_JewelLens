import test from "node:test";
import assert from "node:assert/strict";
import {
  buildEsewaPaymentRequest,
  createEsewaSignature,
  createEsewaSignatureSource,
  createEsewaTransactionUuid,
  decodeAndVerifyEsewaResponse,
  formatEsewaAmount,
  getEsewaConfig,
  validateEsewaPaymentFields,
} from "../src/services/esewa.service.js";

process.env.NODE_ENV = "test";
process.env.ESEWA_ENVIRONMENT = "sandbox";
process.env.ESEWA_PRODUCT_CODE = "EPAYTEST";
process.env.ESEWA_SECRET_KEY = "unit-test-secret";
process.env.ESEWA_FORM_URL = "https://rc-epay.esewa.com.np/api/epay/main/v2/form";
process.env.ESEWA_STATUS_URL = "https://rc.esewa.com.np/api/epay/transaction/status/";
process.env.FRONTEND_URL = "http://localhost:8080/";

test("creates the deterministic HMAC using the declared eSewa field order", () => {
  const source = createEsewaSignatureSource({
    totalAmount: "100",
    transactionUuid: "JL-TEST-001",
    productCode: "EPAYTEST",
  });
  assert.equal(source, "total_amount=100,transaction_uuid=JL-TEST-001,product_code=EPAYTEST");
  assert.equal(
    createEsewaSignature(source, "unit-test-secret"),
    "d+y7ti3vKznsMAZh2cNxtsHJ0cxE2K3eEpcwZEptjq4="
  );
  assert.notEqual(
    createEsewaSignature(source, "unit-test-secret"),
    createEsewaSignature(source.replace("JL-TEST-001", "JL-TEST-002"), "unit-test-secret")
  );
});

test("matches eSewa's published EPAYTEST form signature vector", () => {
  const source = createEsewaSignatureSource({
    totalAmount: "110",
    transactionUuid: "241028",
    productCode: "EPAYTEST",
  });
  assert.equal(
    createEsewaSignature(source, "8gBm/:&EnhH.1/q"),
    "i94zsd3oXF6ZsSr/kGqT4sSzYQzjj1W/waxjWyRwaME="
  );
});

test("normalizes numeric amounts consistently and rejects invalid values", () => {
  assert.equal(formatEsewaAmount(100), "100");
  assert.equal(formatEsewaAmount("100.5"), "100.5");
  assert.throws(() => formatEsewaAmount(-1), /Invalid eSewa payment amount/);
  assert.throws(() => formatEsewaAmount("not-a-number"), /Invalid eSewa payment amount/);
});

test("rejects missing backend eSewa configuration without exposing a secret", () => {
  const secret = process.env.ESEWA_SECRET_KEY;
  delete process.env.ESEWA_SECRET_KEY;
  assert.throws(() => getEsewaConfig(), /Missing required environment variable: ESEWA_SECRET_KEY/);
  process.env.ESEWA_SECRET_KEY = secret;
});

test("builds an exact validated ePay V2 form payload from server order totals", () => {
  const order = {
    pricing: { subtotal: 100, tax: 10, shippingFee: 5, total: 115 },
    paymentDetails: {
      transactionUuid: "JL-TEST-003",
      expectedAmount: "115",
      productCode: "EPAYTEST",
    },
  };
  const payment = buildEsewaPaymentRequest(order);
  assert.equal(payment.formUrl, "https://rc-epay.esewa.com.np/api/epay/main/v2/form");
  assert.deepEqual(Object.keys(payment.fields), [
    "amount", "tax_amount", "total_amount", "transaction_uuid", "product_code",
    "product_service_charge", "product_delivery_charge", "success_url", "failure_url",
    "signed_field_names", "signature",
  ]);
  assert.equal(payment.fields.total_amount, "115");
  assert.equal(payment.fields.signed_field_names, "total_amount,transaction_uuid,product_code");
  assert.equal(payment.fields.success_url, "http://localhost:8080/payment/esewa/success");
  assert.equal(payment.fields.failure_url, "http://localhost:8080/payment/esewa/failure/JL-TEST-003");
  assert.doesNotThrow(() => validateEsewaPaymentFields(payment.fields));
});

test("rejects a form payload whose breakdown does not equal total_amount", () => {
  assert.throws(() => validateEsewaPaymentFields({
    amount: "100.00",
    tax_amount: "10.00",
    total_amount: "999.00",
    transaction_uuid: "JL-TEST-004",
    product_code: "EPAYTEST",
    product_service_charge: "0.00",
    product_delivery_charge: "0.00",
    success_url: "http://localhost:8080/payment/esewa/success",
    failure_url: "http://localhost:8080/payment/esewa/failure/JL-TEST-004",
    signed_field_names: "total_amount,transaction_uuid,product_code",
    signature: "test-signature",
  }), /eSewa payment total mismatch/);
});

test("generates a new safe transaction UUID for each payment attempt", () => {
  const first = createEsewaTransactionUuid();
  const second = createEsewaTransactionUuid();
  assert.match(first, /^[A-Za-z0-9-]+$/);
  assert.match(second, /^[A-Za-z0-9-]+$/);
  assert.notEqual(first, second);
});

test("accepts a correctly signed callback and rejects tampered callback data", () => {
  const payload = {
    transaction_code: "TEST-CODE",
    status: "COMPLETE",
    total_amount: "115.00",
    transaction_uuid: "JL-TEST-003",
    product_code: "EPAYTEST",
    signed_field_names: "transaction_code,status,total_amount,transaction_uuid,product_code,signed_field_names",
  };
  const source = payload.signed_field_names.split(",").map((field) => `${field}=${payload[field]}`).join(",");
  payload.signature = createEsewaSignature(source, "unit-test-secret");
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64");
  assert.equal(decodeAndVerifyEsewaResponse(encoded).transaction_uuid, "JL-TEST-003");

  payload.total_amount = "999.00";
  const tampered = Buffer.from(JSON.stringify(payload)).toString("base64");
  assert.throws(() => decodeAndVerifyEsewaResponse(tampered), /signature verification failed/);
  assert.throws(() => decodeAndVerifyEsewaResponse("not-valid-base64"), /Unable to decode/);
});
