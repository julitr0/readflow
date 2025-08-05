import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/db/drizzle';
import { conversion } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import fs from 'fs/promises';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const result = await auth.api.getSession({
      headers: await headers(),
    });

    if (!result?.session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get('file');

    if (!fileUrl) {
      return NextResponse.json({ error: 'File parameter required' }, { status: 400 });
    }

    const userId = result.session.userId;

    // Verify the file belongs to the user
    const [conversionData] = await db
      .select()
      .from(conversion)
      .where(
        and(
          eq(conversion.userId, userId),
          eq(conversion.fileUrl, fileUrl),
          eq(conversion.status, 'completed')
        )
      )
      .limit(1);

    if (!conversionData) {
      return NextResponse.json({ error: 'File not found or access denied' }, { status: 404 });
    }

    // Check if file exists and is within retention period (7 days)
    const retentionDays = 7;
    const fileAge = Date.now() - (conversionData.completedAt?.getTime() || 0);
    const maxAge = retentionDays * 24 * 60 * 60 * 1000;

    if (fileAge > maxAge) {
      return NextResponse.json({ 
        error: 'File has expired. Files are automatically deleted after 7 days.' 
      }, { status: 410 });
    }

    try {
      // Read the file
      const fileBuffer = await fs.readFile(fileUrl);
      const fileName = `${conversionData.title.replace(/[^a-zA-Z0-9\s\-_]/g, '').replace(/\s+/g, '_')}.epub`;

      // Return the file
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'application/epub+zip',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Content-Length': fileBuffer.length.toString(),
        },
      });

    } catch (fileError) {
      console.error('File read error:', fileError);
      return NextResponse.json({ 
        error: 'File not found on server' 
      }, { status: 404 });
    }

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}