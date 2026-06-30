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

  const filename = file.name.toLowerCase()
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  let resumeText = ''

  try {
    if (filename.endsWith('.pdf')) {
      // Try pdf-parse first
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfParse = require('pdf-parse')
        const parsed = await pdfParse(buffer, {
          // Be lenient — don't throw on minor PDF issues
          max: 0,
        })
        resumeText = (parsed.text || '').trim()
      } catch {
        // If pdf-parse fails, try extracting raw text from the PDF bytes directly
        // This works for many simple PDFs that pdf-parse chokes on
        resumeText = extractRawTextFromPdf(buffer)
      }

    } else if (filename.endsWith('.docx') || filename.endsWith('.doc')) {
      // Word documents via mammoth
      const mammoth = await import('mammoth')
      const result = await mammoth.extractRawText({ buffer })
      resumeText = (result.value || '').trim()

    } else if (filename.endsWith('.txt') || filename.endsWith('.rtf')) {
      // Plain text
      resumeText = buffer.toString('utf-8').trim()

    } else {
      // Try to read it as plain text anyway — worst case we get garbage
      resumeText = buffer.toString('utf-8').trim()
    }

    // If still empty, just store the filename so at least partial functionality works
    if (!resumeText || resumeText.length < 20) {
      // Last resort: store the filename as a hint for manual review
      resumeText = `Resume file: ${file.name}. File could not be parsed automatically. Please contact support or try a different format.`
    }

    // Clean up whitespace
    resumeText = resumeText.replace(/\s+/g, ' ').trim().slice(0, 20000)

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

    return NextResponse.json({
      success: true,
      charactersExtracted: resumeText.length,
      message: resumeText.length < 100 ? 'File saved but text extraction was limited. For best results, use a Word or Google Docs exported PDF.' : 'Resume uploaded successfully'
    })

  } catch (err) {
    console.error('Resume parse failed:', err)
    // Even on total failure, try to save something
    const fallback = `Resume: ${file.name}`
    await supabase.from('profiles').update({
      resume_text: fallback,
      resume_filename: file.name,
      resume_uploaded_at: new Date().toISOString(),
    }).eq('id', user.id)

    return NextResponse.json({
      success: true,
      warning: 'File saved but could not extract text. AI matching may be limited. Try uploading a Word doc or Google Docs PDF for better results.',
      charactersExtracted: fallback.length
    })
  }
}

// Fallback: pull readable strings directly from PDF binary
function extractRawTextFromPdf(buffer: Buffer): string {
  try {
    const content = buffer.toString('latin1')
    const chunks: string[] = []

    // Match readable text sequences between PDF markers
    const streamRegex = /stream([\s\S]*?)endstream/g
    let match
    while ((match = streamRegex.exec(content)) !== null) {
      const stream = match[1]
      // Extract printable ASCII strings of length > 3
      const words = stream.match(/[^\x00-\x1F\x7F-\xFF]{4,}/g)
      if (words) chunks.push(...words)
    }

    // Also grab text in parentheses (PDF text operators)
    const parenRegex = /\(([^)]{2,})\)/g
    while ((match = parenRegex.exec(content)) !== null) {
      const text = match[1].replace(/\\[nrt\\()]/g, ' ')
      if (/[a-zA-Z]{2,}/.test(text)) chunks.push(text)
    }

    return chunks.join(' ').replace(/\s+/g, ' ').trim()
  } catch {
    return ''
  }
}
