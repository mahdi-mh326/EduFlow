import crypto from "crypto";
import SSLCommerz from "sslcommerz-lts";

const generateTransactionId = () => {
  const timestamp = Date.now();
  const randomPart = crypto.randomBytes(6).toString("hex");
  return `EDUFLOW-${timestamp}-${randomPart}`;
};

const getSslCommerzClient = () => {
  const storeId = process.env.SSL_STORE_ID;
  const storePassword = process.env.SSL_STORE_PASSWORD;
  const isLive = process.env.SSL_IS_LIVE === "true";

  if (!storeId || !storePassword) {
    throw new Error("SSLCommerz credentials are not configured.");
  }

  const sslc = new SSLCommerz({
    store_id: storeId,
    store_passwd: storePassword,
  });

  if (!isLive) {
    sslc.sandbox(true);
  }

  return sslc;
};

const initiateSslCommerzPayment = async (payload) => {
  const sslc = getSslCommerzClient();

  const response = await sslc.init({
    total_amount: payload.amount,
    currency: payload.currency,
    tran_id: payload.transactionId,
    success_url: payload.successUrl,
    fail_url: payload.failUrl,
    cancel_url: payload.cancelUrl,
    ipn_url: payload.ipnUrl,
    shipping_method: "NO",
    product_name: payload.productName,
    product_category: payload.productCategory,
    product_profile: payload.productProfile,
    cus_name: payload.customerName,
    cus_email: payload.customerEmail,
    cus_phone: payload.customerPhone,
    cus_add1: payload.customerAddress || "N/A",
    cus_city: "Dhaka",
    cus_state: "Dhaka",
    cus_postcode: "1000",
    cus_country: "Bangladesh",
    ship_name: payload.customerName,
    ship_add1: payload.customerAddress || "N/A",
    ship_city: "Dhaka",
    ship_state: "Dhaka",
    ship_postcode: "1000",
    ship_country: "Bangladesh",
  });

  return response;
};

export const PaymentUtils = {
  generateTransactionId,
  initiateSslCommerzPayment,
  getSslCommerzClient,
};
