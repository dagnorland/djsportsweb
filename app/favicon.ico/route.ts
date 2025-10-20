import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const faviconPath = path.join(process.cwd(), 'public', 'favicon-32x32.png')
    const faviconBuffer = fs.readFileSync(faviconPath)
    
    return new NextResponse(faviconBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    return new NextResponse('Favicon not found', { status: 404 })
  }
}
