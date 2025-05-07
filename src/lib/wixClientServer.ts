// src/lib/wixClientServer.ts
import { OAuthStrategy, createClient } from "@wix/sdk";
import { collections, products } from "@wix/stores";
import { orders } from "@wix/ecom";
import { members } from '@wix/members';

// Server-side only version
export const wixClientServer = async (refreshToken?: string) => {
  const wixClient = createClient({
    modules: {
      products,
      collections,
      orders,
      members,
    },
    auth: OAuthStrategy({
      clientId: process.env.NEXT_PUBLIC_WIX_CLIENT_ID!,
      tokens: {
        refreshToken: refreshToken ? JSON.parse(refreshToken) : undefined,
        accessToken: { value: "", expiresAt: 0 },
      },
    }),
  });

  return wixClient;
};

// Client-side compatible version (no cookie access)
export const createWixClient = () => {
  return createClient({
    modules: {
      products,
      collections,
      orders,
      members,
    },
    auth: OAuthStrategy({
      clientId: process.env.NEXT_PUBLIC_WIX_CLIENT_ID!,
      // Tokens will need to be managed client-side
    }),
  });
};