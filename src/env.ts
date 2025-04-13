// Simple environment variable access
export const env = {
  server: {
    POSTGRES_URL: process.env.POSTGRES_URL as string,
    POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL as string,
    POSTGRES_URL_NO_SSL: process.env.POSTGRES_URL_NO_SSL as string,
    POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING as string,
    POSTGRES_USER: process.env.POSTGRES_USER as string,
    POSTGRES_HOST: process.env.POSTGRES_HOST as string,
    POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD as string,
    POSTGRES_DATABASE: process.env.POSTGRES_DATABASE as string,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY as string,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN as string,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY as string,
  },
  client: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY as string,
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL as string,
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL as string,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL as string,
  }
};
