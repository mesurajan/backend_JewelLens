# eSewa sandbox form-service incident report

## Classification

External eSewa sandbox form-service failure. The JewelLens browser flow and an independent localhost diagnostic both received HTTP `409` with eSewa response code `0` after native `application/x-www-form-urlencoded` POSTs.

The favicon `OpaqueResponseBlocking` warning is unrelated and was excluded from this investigation.

## Browser observation

- Endpoint: `https://rc-epay.esewa.com.np/api/epay/main/v2/form`
- Method: `POST`
- Encoding: `application/x-www-form-urlencoded`
- Status: `409`
- Observed duration: approximately `14 ms`
- Response: `{"error_message":"Service is currently unavailable. Please try again later.","code":0}`

## Independent localhost diagnostic

- Timestamp (UTC): `2026-07-16T17:09:54.6268915+00:00`
- Timestamp (Nepal): `2026-07-16T22:54:54.6268915+05:45`
- Endpoint: `https://rc-epay.esewa.com.np/api/epay/main/v2/form`
- Method: `POST`
- Encoding: `application/x-www-form-urlencoded`
- HTTP status: `409`
- Response body: `{"error_message":"Service is currently unavailable. Please try again later.","code":0}`
- Provider request/correlation ID: not returned in the response headers

### Sanitized POST fields

```text
amount=100
tax_amount=10
total_amount=110
transaction_uuid=JL-1784221792442-fafe7386
product_code=EPAYTEST
product_service_charge=0
product_delivery_charge=0
success_url=http://localhost:8080/payment/esewa/success
failure_url=http://localhost:8080/payment/esewa/failure/JL-1784221792442-fafe7386
signed_field_names=total_amount,transaction_uuid,product_code
signature=[base64:44 chars]
```

### Character-for-character signature-source checks

Backend signature source:

```text
total_amount=110,transaction_uuid=JL-1784221792442-fafe7386,product_code=EPAYTEST
```

- Full reconstructed source equals backend source: `true`
- `total_amount` equals the signed source value: `true`
- `transaction_uuid` equals the signed source value: `true`
- `product_code` equals the signed source value: `true`
- Signed field order is `total_amount,transaction_uuid,product_code`: `true`

## Reproduction summary

1. Start the development-only JewelLens localhost diagnostic, which creates a fresh UUID and calls the same backend payment-request builder used by the application.
2. Submit its generated hidden fields unchanged to the sandbox form endpoint as a native URL-encoded POST.
3. Observe HTTP `409` and eSewa response code `0` before any login page is served.

No secret key or complete signature is included in this report.
