import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized', files: [] }, { status: 401 });
    }
    const res = await fetch('https://www.googleapis.com/drive/v3/files', {
      headers: { Authorization: token },
    });
    
    const text = await res.text();
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      // Plain text or HTML error response (e.g., "Rate exceeded.")
      return NextResponse.json(
        { error: text || 'Failed to parse Drive response', files: [] }, 
        { status: res.ok ? 200 : res.status || 500 }
      );
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error?.message || data?.message || 'Drive API error', files: [] }, 
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch Drive files', files: [] },
      { status: 500 }
    );
  }
}
