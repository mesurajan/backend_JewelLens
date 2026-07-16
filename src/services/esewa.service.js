import crypto from "node:crypto";
import ApiError from "../utils/ApiError.js";

const ESEWA_SIGNED_FIELDS = "total_amount,transaction_uuid,product_code";
const REQUIRED_PAYMENT_FIELDS = [
  "amount",
  "tax_amount",
  "total_amount",
  "transaction_uuid",
  "product_code",
  "product_service_charge",
  "product_delivery_charge",
  "success_url",
  "failure_url",
  "signed_field_names",
  "signature",
];

const readRequiredValue = (name, fallbackName) => {
  const value = String(process.env[name] || (fallbackName ? process.env[fallbackName] : "") || "").trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

const validateHttpsUrl = (value, name, allowedHosts) => {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Invalid URL in environment variable: ${name}`);
  }
  if (url.protocol !== "https:" || !allowedHosts.includes(url.hostname)) {
    throw new Error(`Untrusted eSewa URL in environment variable: ${name}`);
  }
  return url.toString();
};

export const getEsewaConfig = () => {
  const environment = String(process.env.ESEWA_ENVIRONMENT || "sandbox").trim().toLowerCase();
  if (!['sandbox', 'production'].includes(environment)) {
    throw new Error("ESEWA_ENVIRONMENT must be sandbox or production");
  }

  const productCode = readRequiredValue("ESEWA_PRODUCT_CODE");
  const secretKey = readRequiredValue("ESEWA_SECRET_KEY");
  const formUrl = validateHttpsUrl(
    readRequiredValue("ESEWA_FORM_URL", "ESEWA_PAYMENT_URL"),
    "ESEWA_FORM_URL",
    ["rc-epay.esewa.com.np", "epay.esewa.com.np"]
  );
  const statusUrl = validateHttpsUrl(
    readRequiredValue("ESEWA_STATUS_URL"),
    "ESEWA_STATUS_URL",
    ["rc.esewa.com.np", "uat.esewa.com.np", "esewa.com.np", "epay.esewa.com.np"]
  );
  const frontendUrl = readRequiredValue("FRONTEND_URL", "CLIENT_URL").replace(/\/+$/, "");

  if (environment === "sandbox" && (productCode !== "EPAYTEST" || !formUrl.includes("rc-epay."))) {
    throw new Error("Sandbox eSewa configuration must use EPAYTEST and the rc-epay host");
  }
  if (environment === "production" && (productCode === "EPAYTEST" || formUrl.includes("rc-epay."))) {
    throw new Error("Production eSewa configuration cannot use sandbox credentials or URLs");
  }

  return { environment, productCode, secretKey, formUrl, statusUrl, frontendUrl };
};

export const validateEsewaConfig = ({ log = false } = {}) => {
  const config = getEsewaConfig();
  if (log) {
    console.info("eSewa configuration loaded", {
      environment: config.environment,
      productCode: config.productCode,
      formUrl: config.formUrl,
      statusUrl: config.statusUrl,
    });
  }
  return config;
};

export const formatEsewaAmount = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) throw new ApiError(400, "Invalid eSewa payment amount");
  return amount.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
};

export const createEsewaSignatureSource = ({ totalAmount, transactionUuid, productCode }) =>
  `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;

export const createEsewaSignature = (message, secretKey = getEsewaConfig().secretKey) =>
  crypto.createHmac("sha256", String(secretKey).trim()).update(String(message), "utf8").digest("base64");

export const createEsewaTransactionUuid = () =>
  `JL-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;

export const validateEsewaPaymentFields = (fields) => {
  for (const field of REQUIRED_PAYMENT_FIELDS) {
    if (typeof fields[field] !== "string" || !fields[field].trim()) {
      throw new ApiError(500, `Missing eSewa field: ${field}`);
    }
  }
  if (fields.signed_field_names !== ESEWA_SIGNED_FIELDS) {
    throw new ApiError(500, "Invalid eSewa signed field order");
  }
  if (!/^[A-Za-z0-9-]+$/.test(fields.transaction_uuid)) {
    throw new ApiError(500, "Invalid eSewa transaction UUID");
  }

  const calculatedTotal = Number(fields.amount) + Number(fields.tax_amount) +
    Number(fields.product_service_charge) + Number(fields.product_delivery_charge);
  if (!Number.isFinite(calculatedTotal) || Math.abs(calculatedTotal - Number(fields.total_amount)) > 0.001) {
    throw new ApiError(500, "eSewa payment total mismatch");
  }
};

export const buildEsewaPaymentRequest = (order, paymentAttempt = order.paymentDetails) => {
  const config = getEsewaConfig();
  const transactionUuid = String(paymentAttempt?.transactionUuid || "");
  if (!transactionUuid) throw new ApiError(500, "eSewa transaction ID is missing");

  const amount = formatEsewaAmount(order.pricing.subtotal);
  const taxAmount = formatEsewaAmount(order.pricing.tax);
  const serviceCharge = "0";
  const deliveryCharge = formatEsewaAmount(order.pricing.shippingFee);
  const totalAmount = formatEsewaAmount(order.pricing.total);
  const expectedAmount = formatEsewaAmount(paymentAttempt?.expectedAmount ?? order.pricing.total);
  const productCode = String(paymentAttempt?.productCode || config.productCode);

  if (expectedAmount !== totalAmount || productCode !== config.productCode || Number(totalAmount) <= 0) {
    throw new ApiError(400, "Order is not payable through eSewa");
  }

  const signatureSource = createEsewaSignatureSource({ totalAmount, transactionUuid, productCode });
  const fields = {
    amount,
    tax_amount: taxAmount,
    total_amount: totalAmount,
    transaction_uuid: transactionUuid,
    product_code: productCode,
    product_service_charge: serviceCharge,
    product_delivery_charge: deliveryCharge,
    success_url: `${config.frontendUrl}/payment/esewa/success`,
    failure_url: `${config.frontendUrl}/payment/esewa/failure/${transactionUuid}`,
    signed_field_names: ESEWA_SIGNED_FIELDS,
    signature: createEsewaSignature(signatureSource, config.secretKey),
  };
  validateEsewaPaymentFields(fields);

  if (process.env.NODE_ENV === "development") {
    const calculatedTotal = Number(fields.amount) + Number(fields.tax_amount) +
      Number(fields.product_service_charge) + Number(fields.product_delivery_charge);
    console.info("eSewa payment prepared", {
      paymentUrl: config.formUrl,
      method: "POST",
      fields: { ...fields, signature: `[base64:${fields.signature.length} chars]` },
      signatureSource,
      signedFieldNames: fields.signed_field_names,
      signatureLength: fields.signature.length,
      totalCheck: {
        calculated: calculatedTotal,
        submitted: fields.total_amount,
        matches: Math.abs(calculatedTotal - Number(fields.total_amount)) <= 0.001,
      },
    });
  }

  return { formUrl: config.formUrl, fields };
};

const safeSignatureEqual = (expected, received) => {
  try {
    const expectedBuffer = Buffer.from(expected, "base64");
    const receivedBuffer = Buffer.from(String(received || ""), "base64");
    return expectedBuffer.length === receivedBuffer.length && crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
  } catch {
    return false;
  }
};

export const decodeAndVerifyEsewaResponse = (encodedData) => {
  if (typeof encodedData !== "string" || !encodedData || encodedData.length > 20_000) {
    throw new ApiError(400, "Invalid eSewa response data");
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(encodedData, "base64").toString("utf8"));
  } catch {
    throw new ApiError(400, "Unable to decode eSewa response");
  }

  const signedFields = String(payload.signed_field_names || "").split(",").map((field) => field.trim()).filter(Boolean);
  const allowedFields = new Set(["transaction_code", "status", "total_amount", "transaction_uuid", "product_code", "signed_field_names"]);
  if (!signedFields.length || signedFields.some((field) => !allowedFields.has(field) || payload[field] === undefined)) {
    throw new ApiError(400, "Invalid eSewa signed fields");
  }

  const message = signedFields.map((field) => `${field}=${payload[field]}`).join(",");
  if (!safeSignatureEqual(createEsewaSignature(message), payload.signature)) {
    throw new ApiError(400, "eSewa response signature verification failed");
  }
  return payload;
};

const fetchEsewaStatus = async (url) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    return await fetch(url, { headers: { Accept: "application/json" }, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
};

export const checkEsewaTransactionStatus = async ({ transactionUuid, totalAmount, productCode }) => {
  const config = getEsewaConfig();
  const expectedProductCode = String(productCode || config.productCode);
  const expectedAmount = formatEsewaAmount(totalAmount);
  const url = new URL(config.statusUrl);
  url.searchParams.set("product_code", expectedProductCode);
  url.searchParams.set("total_amount", expectedAmount);
  url.searchParams.set("transaction_uuid", transactionUuid);

  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetchEsewaStatus(url);
      const payload = await response.json().catch(() => null);
      if ((response.status >= 500 || response.status === 429) && attempt === 0) continue;
      if (!response.ok || !payload || payload.error_message) {
        throw new ApiError(502, payload?.error_message || "eSewa verification service returned an error");
      }
      const responseProductCode = payload.product_code ?? payload.scd;
      const responseTransactionUuid = payload.transaction_uuid ?? payload.pid;
      const responseTotalAmount = payload.total_amount ?? payload.totalAmount;
      if (String(responseProductCode || "") !== expectedProductCode) throw new ApiError(400, "eSewa product code did not match");
      if (String(responseTransactionUuid || "") !== transactionUuid) throw new ApiError(400, "eSewa transaction ID did not match");
      if (formatEsewaAmount(responseTotalAmount) !== expectedAmount) throw new ApiError(400, "eSewa transaction amount did not match");
      return payload;
    } catch (error) {
      lastError = error;
      if (error instanceof ApiError && error.statusCode < 500) throw error;
      if (attempt === 0) continue;
    }
  }
  if (lastError instanceof ApiError) throw lastError;
  throw new ApiError(502, "Unable to reach eSewa verification service; payment remains pending");
};
