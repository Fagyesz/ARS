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
    STORE_ADDRESS: string;
    STORE_CITY: string;
    STORE_POSTAL_CODE: string;
    STORE_COUNTRY: string;
    STORE_MAP_LAT: string;
    STORE_MAP_LNG: string;
    STORE_HOURS: string;
    INSTAGRAM_URL: string;
    FACEBOOK_URL: string;
    TIKTOK_URL: string;
    YOUTUBE_URL: string;
    STOREFRONT_API_VERSION: string;
  }
}
export {};
