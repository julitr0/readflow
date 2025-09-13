import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test basic auth configuration
    const config = {
      baseURL: process.env.BETTER_AUTH_URL,
      secret: process.env.BETTER_AUTH_SECRET,
      googleClientId: process.env.GOOGLE_CLIENT_ID,
      databaseUrl: process.env.DATABASE_URL,
    };

    return NextResponse.json({
      success: true,
      config: {
        ...config,
        secret: config.secret ? 'SET' : 'MISSING',
        databaseUrl: config.databaseUrl ? 'SET' : 'MISSING',
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}