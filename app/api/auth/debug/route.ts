import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { user } from '@/db/schema';

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 Debug: Starting auth debug check...');
    
    // Step 1: Test database connection
    console.log('🔍 Debug: Testing database connection...');
    const dbTest = await db.select().from(user).limit(1);
    console.log('✅ Debug: Database connection successful');
    
    // Step 2: Test Better Auth imports
    console.log('🔍 Debug: Testing Better Auth imports...');
    const { betterAuth } = await import('better-auth');
    const { drizzleAdapter } = await import('better-auth/adapters/drizzle');
    console.log('✅ Debug: Better Auth imports successful');
    
    // Step 3: Test environment variables
    console.log('🔍 Debug: Checking environment variables...');
    const envCheck = {
      baseURL: process.env.BETTER_AUTH_URL || 'MISSING',
      secret: process.env.BETTER_AUTH_SECRET ? 'SET' : 'MISSING',
      googleClientId: process.env.GOOGLE_CLIENT_ID ? 'SET' : 'MISSING',
      googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'MISSING',
      databaseUrl: process.env.DATABASE_URL ? 'SET' : 'MISSING'
    };
    console.log('✅ Debug: Environment variables:', envCheck);
    
    // Step 4: Test Better Auth configuration (minimal)
    console.log('🔍 Debug: Testing minimal Better Auth config...');
    const minimalAuth = betterAuth({
      baseURL: process.env.BETTER_AUTH_URL || 'https://www.linktoreader.com',
      secret: process.env.BETTER_AUTH_SECRET || 'fallback-secret-for-test',
      socialProviders: {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
      },
    });
    console.log('✅ Debug: Minimal Better Auth config successful');
    
    return NextResponse.json({
      success: true,
      message: 'All auth components working',
      env: envCheck,
      dbTest: dbTest.length
    });
    
  } catch (error) {
    console.error('❌ Debug: Error in auth debug:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    }, { status: 500 });
  }
}