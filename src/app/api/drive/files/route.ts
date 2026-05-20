import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const token = req.headers.get('Authorization');
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const res = await fetch('https://www.googleapis.com/drive/v3/files', {
    headers: { Authorization: token },
  });
  return NextResponse.json(await res.json());
}
