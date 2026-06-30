import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('resume') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 })
  }

  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // pdf-parse v1 simple API
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse')
    const parsed = await pdfParse(buffer)
    const resumeText = (parsed.text || '').trim()

    if (!resumeText || resumeText.length < 50) {
      return NextResponse.json(
        { error: 'Could not extract text from this PDF. Make sure it is a text-based PDF (not a scanned image), then try again.' },
        { status: 400 }
      )
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        resume_text: resumeText,
        resume_filename: file.name,
        resume_uploaded_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, charactersExtracted: resumeText.length })
  } catch (err) {
    console.error('Resume parse failed:', err)
    return NextResponse.json(
      { error: 'Failed to read this PDF. Try exporting your CV from Word or Google Docs as PDF and uploading again.' },
      { status: 500 }
    )
  }
}
