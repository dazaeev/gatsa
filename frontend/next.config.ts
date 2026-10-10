import type { NextConfig } from "next";
import os from "os";

function getDevOrigins(): string[] {
  const origins = [
    'localhost',
    'localhost:3000',
    '127.0.0.1',
    '127.0.0.1:3000',
    '192.168.100.8',
    '192.168.100.8:3000',
    '192.168.100.19',
    '192.168.100.19:3000',
  ];

  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] || []) {
        if (iface.family === 'IPv4' && !iface.internal) {
          origins.push(iface.address);
          origins.push(`${iface.address}:3000`);
        }
      }
    }
  } catch (e) {
    // fallback
  }

  return Array.from(new Set(origins));
}

const nextConfig: NextConfig = {
  allowedDevOrigins: getDevOrigins(),
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://127.0.0.1:8080/api/v1/:path*',
      },
    ];
  },
};

export default nextConfig;
