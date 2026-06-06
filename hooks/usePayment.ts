import { useState } from "react";
import { apiJson } from "../lib/api";

//  Define response types
type PaymentInitResponse = {
  success: boolean;
  message?: string;
  publicKey?: string;
  email?: string;
  reference: string;
};

type PaymentVerifyResponse = {
  success: boolean;
  message?: string;
};

export const usePayment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializePayment = async (
    bookingId: string,
    paymentMethod: "paystack" | "stripe",
  ): Promise<PaymentInitResponse> => {
    setLoading(true);
    setError(null);

    try {
      return await apiJson<PaymentInitResponse>("/payment/initialize", {
        method: "POST",
        body: JSON.stringify({
          bookingId,
          paymentMethod,
        }),
      });
    } catch (err: unknown) {
      const message =
        (err as { message?: string }).message ||
        "Unable to initialize payment. Please try again.";

      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (
    reference: string,
    bookingId: string,
  ): Promise<PaymentVerifyResponse> => {
    setLoading(true);
    setError(null);

    try {
      return await apiJson<PaymentVerifyResponse>("/payment/verify", {
        method: "POST",
        body: JSON.stringify({
          reference,
          bookingId,
        }),
      });
    } catch (err: unknown) {
      const message =
        (err as { message?: string }).message ||
        "Unable to verify payment. Please try again.";

      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, initializePayment, verifyPayment };
};
