import { NextResponse } from 'next/server';
import { uploadImage } from '@/lib/github';
import { jwtVerify } from 'jose';
import type { NextRequest } from 'next/server';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret');

export async function POST(request: NextRequest) {
  // Verify auth
  const token = request.cookies.get('admin_token')?.value;
  if (!token) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await jwtVerify(token, JWT_SECRET);
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
  }

  try {
    const { filename, base64 } = await request.json();

    if (!filename || !base64) {
      return NextResponse.json({ success: false, message: 'Missing parameters' }, { status: 400 });
    }

    // Path in the repository
    const timestamp = new Date().getTime();
    const cleanFilename = filename.replace(/[^a-zA-Z0-9.]/g, '-');
    const path = `public/images/${timestamp}-${cleanFilename}`;

    await uploadImage(path, base64, `Upload image: ${cleanFilename}`);

    // Return the relative URL to be used in Markdown
    // e.g. /images/16123123-test.png
    return NextResponse.json({ 
      success: true, 
      url: `/images/${timestamp}-${cleanFilename}` 
    }, { status: 200 });

  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Upload failed' }, { status: 500 });
  }
}
