import type { NextConfig } from "next";

const allowedDevOrigins = (
  process.env.NEXT_PUBLIC_ALLOWED_DEV_ORIGINS ||
  "172.23.95.0,localhost,127.0.0.1"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  allowedDevOrigins,
};

export default nextConfig;
