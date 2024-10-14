/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
        'hebbkx1anhila5yf.public.blob.vercel-storage.com',
        'storage.googleapis.com',
        'other-allowed-domains.com',
        'localhost:3000',
        'vercel-storage.googleapis.com',
        'fonts.googleapis.com',
        'uqmhcw5knmkdj4wh.public.blob.vercel-storage.com'
        
    ],
  },
};

export default nextConfig;