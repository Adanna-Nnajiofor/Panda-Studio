import axios from "axios";
import logger from "../utils/logger";

const PAYSTACK_BASE_URL =
  process.env.PAYSTACK_BASE_URL ?? "https://api.paystack.co";
const PAYSTACK_BASE_URL_PARSED = new URL(PAYSTACK_BASE_URL);
const FLUTTERWAVE_BASE_URL =
  process.env.FLUTTERWAVE_BASE_URL ?? "https://api.flutterwave.com/v3";
const FLUTTERWAVE_BASE_URL_PARSED = new URL(FLUTTERWAVE_BASE_URL);

const getPaystackKey = (): string => {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key)
    throw new Error("PAYSTACK_SECRET_KEY environment variable is not set.");
  return key;
};

const paystackUrl = (path: string): string => {
  const url = new URL(path, PAYSTACK_BASE_URL);
  if (url.host !== PAYSTACK_BASE_URL_PARSED.host) {
    throw new Error(
      `[paymentService] Blocked request to unexpected host: ${url.host}`,
    );
  }
  return url.toString();
};

const paystackHeaders = () => ({
  Authorization: `Bearer ${getPaystackKey()}`,
  "Content-Type": "application/json",
});

const getFlutterwaveKey = (): string => {
  const key = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!key)
    throw new Error("FLUTTERWAVE_SECRET_KEY environment variable is not set.");
  return key;
};

const flutterwaveUrl = (path: string): string => {
  const url = new URL(path, FLUTTERWAVE_BASE_URL);
  if (url.host !== FLUTTERWAVE_BASE_URL_PARSED.host) {
    throw new Error(
      `[paymentService] Blocked request to unexpected host: ${url.host}`,
    );
  }
  return url.toString();
};

const flutterwaveHeaders = () => ({
  Authorization: `Bearer ${getFlutterwaveKey()}`,
  "Content-Type": "application/json",
});

// =================== PAYSTACK INTEGRATION ===================
export const initializePaystackPayment = async (
  email: string,
  amount: number,
  reference: string,
  metadata?: Record<string, any>,
) => {
  try {
    const response = await axios.post(
      paystackUrl("/transaction/initialize"),
      {
        email,
        amount: Math.round(amount * 100),
        reference,
        metadata,
      },
      { headers: paystackHeaders() },
    );

    return {
      success: true,
      authorizationUrl: response.data.data.authorization_url,
      accessCode: response.data.data.access_code,
      reference: response.data.data.reference,
    };
  } catch (error: any) {
    logger.error("Paystack initialization error", {
      error: error.response?.data ?? error.message,
    });
    return {
      success: false,
      error: error.response?.data?.message || "Payment initialization failed",
    };
  }
};

export const verifyPaystackPayment = async (reference: string) => {
  try {
    const response = await axios.get(
      paystackUrl(`/transaction/verify/${encodeURIComponent(reference)}`),
      { headers: paystackHeaders() },
    );

    const { data } = response.data;
    return {
      success: data.status === "success",
      status: data.status,
      amount: data.amount / 100,
      reference: data.reference,
      transactionId: data.id,
      gatewayResponse: data,
    };
  } catch (error: any) {
    logger.error("Paystack verification error", {
      error: error.response?.data ?? error.message,
    });
    return {
      success: false,
      error: error.response?.data?.message || "Payment verification failed",
    };
  }
};

export const refundPaystackPayment = async (
  transactionId: number,
  amount?: number,
) => {
  try {
    const payload: Record<string, any> = {
      transaction: transactionId,
    };

    if (amount) {
      payload.amount = Math.round(amount * 100); // Convert to kobo
    }

    const response = await axios.post(paystackUrl("/refund"), payload, {
      headers: paystackHeaders(),
    });

    return {
      success: true,
      refundStatus: response.data.data.status,
      reference: response.data.data.reference,
    };
  } catch (error: any) {
    logger.error("Paystack refund error", {
      error: error.response?.data ?? error.message,
    });
    return {
      success: false,
      error: error.response?.data?.message || "Refund failed",
    };
  }
};

// =================== STRIPE INTEGRATION ===================
export const initializeStripePayment = async (
  email: string,
  amount: number,
  bookingId: string,
  clientEmail: string,
) => {
  try {
    // This would use Stripe SDK - for now we return the setup info
    // In production, you'd initialize a Stripe checkout session
    return {
      success: true,
      message: "Use Stripe checkout session on client side",
      amount,
      email,
    };
  } catch (error: any) {
    logger.error("Stripe initialization error", { error });
    return {
      success: false,
      error: "Payment initialization failed",
    };
  }
};

export const initializeFlutterwavePayment = async (
  email: string,
  amount: number,
  reference: string,
  metadata?: Record<string, any>,
) => {
  try {
    const redirectUrl =
      process.env.FLUTTERWAVE_REDIRECT_URL ??
      `${process.env.CLIENT_ORIGIN ?? "http://localhost:3000"}/payments/verify`;

    const response = await axios.post(
      flutterwaveUrl("/payments"),
      {
        tx_ref: reference,
        amount,
        currency: "NGN",
        redirect_url: redirectUrl,
        customer: { email },
        customizations: {
          title: "Panda Studio Payment",
          description: "Booking payment",
        },
        meta: metadata ?? {},
      },
      { headers: flutterwaveHeaders() },
    );

    return {
      success: true,
      authorizationUrl: response.data?.data?.link as string,
      reference,
    };
  } catch (error: any) {
    logger.error("Flutterwave initialization error", {
      error: error.response?.data ?? error.message,
    });
    return {
      success: false,
      error: error.response?.data?.message || "Payment initialization failed",
    };
  }
};

export const verifyFlutterwavePayment = async (reference: string) => {
  try {
    const response = await axios.get(
      flutterwaveUrl(
        `/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`,
      ),
      { headers: flutterwaveHeaders() },
    );

    const data = response.data?.data;
    return {
      success: data?.status === "successful",
      status: data?.status,
      amount: Number(data?.amount ?? 0),
      reference: String(data?.tx_ref ?? reference),
      transactionId: data?.id,
      gatewayResponse: data,
    };
  } catch (error: any) {
    logger.error("Flutterwave verification error", {
      error: error.response?.data ?? error.message,
    });
    return {
      success: false,
      error: error.response?.data?.message || "Payment verification failed",
    };
  }
};

// =================== PAYMENT UTILITIES ===================
export const generatePaymentReference = () => {
  return `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
};
