import { createClient, OAuthStrategy } from '@wix/sdk';
import { NextRequest, NextResponse } from 'next/server';

export const middleware = async (request: NextRequest) => {
  try {
    const cookies = request.cookies;
    const response = NextResponse.next();

    // Skip token generation if refreshToken already exists
    if (cookies.get('refreshToken')) {
      return response;
    }

    // Initialize Wix client with proper error handling
    if (!process.env.NEXT_PUBLIC_WIX_CLIENT_ID) {
      throw new Error('Wix Client ID is not configured');
    }

    const wixClient = createClient({
      auth: OAuthStrategy({ 
        clientId: process.env.NEXT_PUBLIC_WIX_CLIENT_ID 
      }),
    });

    // Generate visitor tokens with error handling
    const tokens = await wixClient.auth.generateVisitorTokens();
    
    if (!tokens?.refreshToken) {
      throw new Error('Failed to generate visitor tokens');
    }

    // Set secure cookie with additional protections
    response.cookies.set('refreshToken', JSON.stringify(tokens.refreshToken), {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    
    // Return a response even if token generation fails
    const fallbackResponse = NextResponse.next();
    
    // Optionally set a flag cookie to indicate auth failure
    fallbackResponse.cookies.set('auth-failed', 'true', {
      path: '/',
      maxAge: 60, // 1 minute
    });
    
    return fallbackResponse;
  }
};

// Middleware configuration
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
};