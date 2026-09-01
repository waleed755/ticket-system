import crypto from "crypto";

// JazzCash Hosted Checkout (page-redirection) integration.
//
// Credentials are merchant-specific and issued by JazzCash during Payment
// Gateway onboarding — they are NOT the same as a personal/business JazzCash
// mobile wallet number. Four values are required as environment variables:
//   JAZZCASH_MERCHANT_ID       — pp_MerchantID from JazzCash onboarding
//   JAZZCASH_PASSWORD          — pp_Password from JazzCash onboarding
//   JAZZCASH_INTEGRITY_SALT    — the Integrity Salt / HashKey from JazzCash
//   JAZZCASH_SANDBOX_URL       — the sandbox transaction POST/redirect URL
//                                 JazzCash gave you for this merchant account
// APP_URL is reused to build the return callback URL.
//
// The secure-hash algorithm below (sort all pp_ fields alphabetically by key,
// skip empty values, join with "&", prefix with the Integrity Salt, then
// HMAC-SHA256 hex-digest using the Integrity Salt as the key) is cross-checked
// against two independent open-source JazzCash integrations and matches
// JazzCash's documented Hosted Checkout parameter set.

export function isJazzCashConfigured(): boolean {
  return Boolean(
    process.env.JAZZCASH_MERCHANT_ID &&
      process.env.JAZZCASH_PASSWORD &&
      process.env.JAZZCASH_INTEGRITY_SALT &&
      process.env.JAZZCASH_SANDBOX_URL
  );
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `JazzCash is not configured: missing ${name}. Set JAZZCASH_MERCHANT_ID, JAZZCASH_PASSWORD, JAZZCASH_INTEGRITY_SALT, and JAZZCASH_SANDBOX_URL.`
    );
  }
  return value;
}

export function computeSecureHash(fields: Record<string, string>, integritySalt: string): string {
  const sortedKeys = Object.keys(fields)
    .filter((k) => k !== "pp_SecureHash")
    .sort();

  let joined = integritySalt;
  for (const key of sortedKeys) {
    const value = fields[key];
    if (value !== undefined && value !== null && value !== "") {
      joined += `&${value}`;
    }
  }

  return crypto.createHmac("sha256", integritySalt).update(joined).digest("hex").toUpperCase();
}

function formatTxnDateTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

export interface JazzCashPaymentRequest {
  actionUrl: string;
  fields: Record<string, string>;
}

// Builds the full pp_ field set + secure hash for a Hosted Checkout redirect.
// `amount` is in the app's integer-paisa convention (same as everywhere else
// in this codebase) — JazzCash's pp_Amount also expects the amount in the
// smallest currency unit (paisa), so no conversion is needed.
export function buildJazzCashPaymentRequest(params: {
  amountPaisa: number;
  billReference: string;
  description: string;
  txnRefNo: string;
}): JazzCashPaymentRequest {
  const merchantId = requireEnv("JAZZCASH_MERCHANT_ID");
  const password = requireEnv("JAZZCASH_PASSWORD");
  const integritySalt = requireEnv("JAZZCASH_INTEGRITY_SALT");
  const actionUrl = requireEnv("JAZZCASH_SANDBOX_URL");
  const appUrl = process.env.APP_URL || "http://localhost:3000";

  const now = new Date();
  const expiry = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24-hour window to complete payment

  const fields: Record<string, string> = {
    pp_Version: "1.1",
    pp_TxnType: "MWALLET",
    pp_Language: "EN",
    pp_MerchantID: merchantId,
    pp_SubMerchantID: "",
    pp_Password: password,
    pp_BankID: "TBANK",
    pp_ProductID: "RETL",
    pp_TxnRefNo: params.txnRefNo,
    pp_Amount: String(params.amountPaisa),
    pp_TxnCurrency: "PKR",
    pp_TxnDateTime: formatTxnDateTime(now),
    pp_TxnExpiryDateTime: formatTxnDateTime(expiry),
    pp_BillReference: params.billReference,
    pp_Description: params.description,
    pp_ReturnURL: `${appUrl}/api/payments/jazzcash/callback`,
    pp_DiscountedAmount: "",
    pp_DiscountBank: "",
    ppmpf_1: "",
    ppmpf_2: "",
    ppmpf_3: "",
    ppmpf_4: "",
    ppmpf_5: "",
  };

  fields.pp_SecureHash = computeSecureHash(fields, integritySalt);

  return { actionUrl, fields };
}

export interface JazzCashCallbackResult {
  hashValid: boolean;
  success: boolean;
  txnRefNo: string;
  responseCode: string;
  responseMessage: string;
  amountPaisa: number;
  retrievalReferenceNo?: string;
}

// Verifies and interprets JazzCash's return POST. Never trust this data
// without recomputing the hash — the customer's browser is what actually
// delivers this POST, so it must be authenticated exactly like the outgoing
// request was.
export function verifyJazzCashCallback(fields: Record<string, string>): JazzCashCallbackResult {
  const integritySalt = requireEnv("JAZZCASH_INTEGRITY_SALT");
  const receivedHash = (fields.pp_SecureHash || "").toUpperCase();
  const recomputed = computeSecureHash(fields, integritySalt);
  const hashValid = receivedHash.length > 0 && receivedHash === recomputed;

  return {
    hashValid,
    success: hashValid && fields.pp_ResponseCode === "000",
    txnRefNo: fields.pp_TxnRefNo || "",
    responseCode: fields.pp_ResponseCode || "",
    responseMessage: fields.pp_ResponseMessage || "Unknown response from JazzCash.",
    amountPaisa: Number(fields.pp_Amount || 0),
    retrievalReferenceNo: fields.pp_RetreivalReferenceNo,
  };
}
