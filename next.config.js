import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    qualities: [30, 75],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "filharmonia.szczecin.pl",
      },
    ],
  },
};

export default withNextIntl(nextConfig);

