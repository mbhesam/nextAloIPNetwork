import { API_BASE_URL } from "../api";

export interface AuthLoginPayload {
  phoneNumber: string;
  password: string;
}

export interface AuthOtpPayload {
  phoneNumber: string;
  otp: string;
}

export const loginUser = async (payload: AuthLoginPayload) => {
  const response = await fetch(`${API_BASE_URL}/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  return {
    ok: response.ok,
    status: response.status,
    response,
    data,
  };
};

export const requestOtpCode = async (phoneNumber: string) => {
  const response = await fetch(`${API_BASE_URL}/v1/auth/request-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phoneNumber }),
  });

  const data = await response.json();

  return {
    ok: response.ok,
    status: response.status,
    response,
    data,
  };
};

export const verifyOtpCode = async (payload: AuthOtpPayload) => {
  const response = await fetch(`${API_BASE_URL}/v1/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  return {
    ok: response.ok,
    status: response.status,
    response,
    data,
  };
};
