/// <reference types="vite/client" />
/// <reference types="react-router" />
/// <reference types="@shopify/oxygen-workers-types" />
/// <reference types="@shopify/hydrogen/react-router-types" />

// Enhance TypeScript's built-in typings.
import '@total-typescript/ts-reset';

declare global {
  interface Env {
    RESEND_API_KEY: string;
    FROM_EMAIL: string;
    CONTACT_EMAIL: string;
    STORE_NAME: string;
    INSTAGRAM_URL: string;
    FACEBOOK_URL: string;
    TIKTOK_URL: string;
    YOUTUBE_URL: string;
    STOREFRONT_API_VERSION: string;
    /** Custom app (client credentials) with read access to discounts + products; drives the campaign surfaces */
    SHOPIFY_ADMIN_CLIENT_ID?: string;
    SHOPIFY_ADMIN_CLIENT_SECRET?: string;
    /** legacy names of the same credentials, used by the local scripts */
    WRITE_INVENTORY_CLIENT_ID?: string;
    WRITE_INVENTORY_SECRET?: string;
  }
}
export {};
