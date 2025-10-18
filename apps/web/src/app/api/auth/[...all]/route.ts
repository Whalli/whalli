/**
 * Auth API Routes - DEPRECATED
 * All authentication is now handled by the backend API.
 * Requests to /api/auth/* are proxied to http://localhost:3001/auth/*
 * 
 * Special routes:
 * - /api/auth/csrf - Generate local CSRF token (doesn't need backend)
 * 
 * This file is kept as a proxy for development convenience.
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

export async function GET(request: NextRequest, { params }: { params: { all: string[] } }) {
  // Handle CSRF endpoint locally without backend
  if (request.nextUrl.pathname === '/api/auth/csrf') {
    return handleCsrfToken(request);
  }
  
  return proxyToAPI(request, 'GET');
}

export async function POST(request: NextRequest, { params }: { params: { all: string[] } }) {
  return proxyToAPI(request, 'POST');
}

export async function PUT(request: NextRequest, { params }: { params: { all: string[] } }) {
  return proxyToAPI(request, 'PUT');
}

export async function DELETE(request: NextRequest, { params }: { params: { all: string[] } }) {
  return proxyToAPI(request, 'DELETE');
}

/**
 * Generate CSRF token locally without needing backend
 * This allows Better Auth client to work even when backend auth is unavailable
 */
function handleCsrfToken(request: NextRequest): NextResponse {
  try {
    // Generate a secure CSRF token
    const token = randomBytes(32).toString('hex');
    
    // Return CSRF token in same format as backend
    return NextResponse.json({
      csrfToken: token,
      token: token, // Some versions might expect this key
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('CSRF token generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}

async function proxyToAPI(request: NextRequest, method: string) {
  try {
    const path = request.nextUrl.pathname.replace('/api/auth', '');
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth${path}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Forward cookies if present
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      headers['cookie'] = cookieHeader;
    }

    // Forward CSRF token if present
    const csrfToken = request.headers.get('x-csrf-token');
    if (csrfToken) {
      headers['x-csrf-token'] = csrfToken;
    }

    const body = request.method !== 'GET' ? await request.text() : undefined;

    const response = await fetch(apiUrl, {
      method,
      headers,
      body,
      credentials: 'include',
    });

    // Get response body
    const responseBody = await response.text();

    // Create response with proper headers
    const res = new NextResponse(responseBody, {
      status: response.status,
      headers: new Headers(response.headers),
    });

    // Forward set-cookie headers
    response.headers.getSetCookie().forEach(cookie => {
      res.headers.append('set-cookie', cookie);
    });

    return res;
  } catch (error) {
    console.error('Auth proxy error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}