/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow the Base44 preview origin (host changes when the env is recreated).
  allowedDevOrigins: process.env.BASE44_PUBLIC_HOST_SUFFIX
    ? ['https://3000-' + process.env.BASE44_PUBLIC_HOST_SUFFIX, 'http://3000-' + process.env.BASE44_PUBLIC_HOST_SUFFIX]
    : [],
};

module.exports = nextConfig;
