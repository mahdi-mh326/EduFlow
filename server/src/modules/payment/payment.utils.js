import crypto from "crypto";
import axios from "axios";
import logger from "../../shared/logger.js";

const generateTransactionId = () => {
  const transactionId = `EDU${Date.now()}${crypto.randomBytes(4).toString("hex")}`;

  if (transactionId.length > 30) {
    throw new Error("SSLCommerz transaction ID exceeds 30 characters");
  }

  return transactionId;
};

const getSslCommerzConfig = () => {
  const storeId = (process.env.SSL_STORE_ID || "").trim();
  const storePassword = (process.env.SSL_STORE_PASSWORD || "").trim();
  const isLive = String(process.env.SSL_IS_LIVE || "false").toLowerCase() === "true";

  const baseUrl = isLive
    ? "https://securepay.sslcommerz.com"
    : "https://sandbox.sslcommerz.com";

  const initUrl = `${baseUrl}/gwprocess/v4/api.php`;

  if (!storeId || !storePassword) {
    throw new Error(
      `SSLCommerz credentials are not configured. ` +
      `SSL_STORE_ID is ${storeId ? "set" : "missing"}, ` +
      `SSL_STORE_PASSWORD length is ${storePassword.length}.`
    );
  }

  return {
    storeId,
    storePassword,
    isLive,
    baseUrl,
    initUrl,
  };
};

const initiateSslCommerzPayment = async (payload) => {
  const { storeId, storePassword, isLive, initUrl } = getSslCommerzConfig();

  const formData = new URLSearchParams();
  formData.append("store_id", storeId);
  formData.append("store_passwd", storePassword);
  formData.append("total_amount", String(parseFloat(payload.amount).toFixed(2)));
  formData.append("currency", payload.currency);
  formData.append("tran_id", payload.transactionId);
  formData.append("success_url", payload.successUrl);
  formData.append("fail_url", payload.failUrl);
  formData.append("cancel_url", payload.cancelUrl);
  formData.append("ipn_url", payload.ipnUrl || "");
  formData.append("shipping_method", "NO");
  formData.append("num_of_item", "1");
  formData.append("product_name", payload.productName);
  formData.append("product_category", payload.productCategory);
  formData.append("product_profile", payload.productProfile);
  formData.append("cus_name", payload.customerName);
  formData.append("cus_email", payload.customerEmail);
  formData.append("cus_phone", payload.customerPhone);
  formData.append("cus_add1", payload.customerAddress || "N/A");
  formData.append("cus_add2", "");
  formData.append("cus_city", "Dhaka");
  formData.append("cus_state", "Dhaka");
  formData.append("cus_postcode", "1000");
  formData.append("cus_country", "Bangladesh");
  formData.append("ship_name", payload.customerName);
  formData.append("ship_add1", payload.customerAddress || "N/A");
  formData.append("ship_add2", "");
  formData.append("ship_city", "Dhaka");
  formData.append("ship_state", "Dhaka");
  formData.append("ship_postcode", "1000");
  formData.append("ship_country", "Bangladesh");

  const maskedPassword = `${storePassword.slice(0, 2)}****${storePassword.slice(-2)}`;

  logger.info(`[SSLCommerz] store_id: ${storeId}`);
  logger.info(`[SSLCommerz] endpoint: ${initUrl}`);
  logger.info(`[SSLCommerz] transaction_id: ${payload.transactionId}`);
  logger.info(`[SSLCommerz] transaction_id length: ${payload.transactionId.length}`);

  let response;
  try {
    response = await axios.post(initUrl, formData, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const maskedResponse = { ...response.data };
    if (maskedResponse.store_passwd) maskedResponse.store_passwd = "***";

    logger.info(`[SSLCommerz] HTTP Status: ${response.status}`);
    logger.info(`[SSLCommerz] gateway response (masked): ${JSON.stringify(maskedResponse)}`);

    if (response.data && response.data.status === "FAILED") {
      logger.error(
        `[SSLCommerz] Gateway returned FAILED for transaction ${payload.transactionId}`
      );
    }
  } catch (error) {
    const status = error.response?.status;
    const data = error.response?.data;
    const maskedData = { ...data };
    if (maskedData.store_passwd) maskedData.store_passwd = "***";
    logger.error(
      `[SSLCommerz] Gateway error for transaction ${payload.transactionId}: ` +
      `HTTP ${status || "N/A"} - ${JSON.stringify(maskedData || error.message)}`
    );
    throw error;
  }

  return response.data;
};

const validateSslCommerzTransaction = async (valId) => {
  if (!valId) {
    throw new Error("Missing val_id for SSLCommerz transaction validation");
  }

  const { storeId, storePassword, isLive, baseUrl } = getSslCommerzConfig();
  const validationUrl = `${baseUrl}/validator/api/validationserverAPI.php`;

  const response = await axios.get(validationUrl, {
    params: {
      val_id: valId,
      store_id: storeId,
      store_passwd: storePassword,
      format: "json",
    },
  });

  return response.data;
};

export const PaymentUtils = {
  generateTransactionId,
  initiateSslCommerzPayment,
  getSslCommerzConfig,
  validateSslCommerzTransaction,
};
