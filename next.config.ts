import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vinext inspects multipart POSTs before routing them to the upload API.
  // Allow the API's 20 MB file limit plus multipart field overhead.
  experimental: { serverActions: { bodySizeLimit: "21mb" } },
};

export default nextConfig;
