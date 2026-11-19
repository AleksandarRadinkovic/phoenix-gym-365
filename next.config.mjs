/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // skripte za DSS računar se serviraju preko /api/tools/[name]
    outputFileTracingIncludes: {
      '/api/tools/[name]': ['./tools/dss-sync/*.py', './tools/dss-sync/requirements.txt'],
    },
  },
};

export default nextConfig;
