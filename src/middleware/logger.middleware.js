// src/middleware/logger.middleware.js
const SENSITIVE_KEYS = new Set([
  "password",
  "confirmPassword",
  "currentPassword",
  "newPassword",
  "token",
  "authorization",
  "accessToken",
  "jwt",
  "secret",
]);

const sanitizeValue = (value) => {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        SENSITIVE_KEYS.has(key) ? "<redacted>" : sanitizeValue(nestedValue),
      ])
    );
  }

  return value;
};

const requestLogger = (req, res, next) => {
  console.log("======================================");
  console.log(`Method : ${req.method}`);
  console.log(`URL    : ${req.originalUrl}`);
  console.log(`Body   : ${JSON.stringify(sanitizeValue(req.body))}`);
  console.log(`Query  : ${JSON.stringify(req.query)}`);
  console.log(`Params : ${JSON.stringify(req.params)}`);
  console.log("======================================\n");
  next();
};

export default requestLogger;
