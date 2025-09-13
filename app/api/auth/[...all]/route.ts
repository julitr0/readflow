import { auth } from "@/lib/auth"; // path to your auth file
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";

try {
  const handlers = toNextJsHandler(auth);
  
  export const GET = async (req: NextRequest) => {
    try {
      return await handlers.GET(req);
    } catch (error) {
      console.error('Auth GET error:', error);
      return NextResponse.json(
        { error: 'Auth initialization failed', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  };

  export const POST = async (req: NextRequest) => {
    try {
      return await handlers.POST(req);
    } catch (error) {
      console.error('Auth POST error:', error);
      return NextResponse.json(
        { error: 'Auth initialization failed', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  };
} catch (error) {
  console.error('Auth handler creation failed:', error);
  
  export const GET = () => NextResponse.json(
    { error: 'Auth configuration failed', details: error instanceof Error ? error.message : 'Unknown error' },
    { status: 500 }
  );
  
  export const POST = () => NextResponse.json(
    { error: 'Auth configuration failed', details: error instanceof Error ? error.message : 'Unknown error' },
    { status: 500 }
  );
}
