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
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfParse = require('pdf-parse')
        const parsed = await pdfParse(buffer, { max: 0 })
        resumeText = (parsed.text || '').trim()
      } catch {
        resumeText = extractRawTextFromPdf(buffer)
      }
    } else if (filename.endsWith('.docx') || filename.endsWith('.doc')) {
      const mammoth = await import('mammoth')
      const result = await mammoth.extractRawText({ buffer })
      resumeText = (result.value || '').trim()
    } else if (filename.endsWith('.txt') || filename.endsWith('.rtf')) {
      resumeText = buffer.toString('utf-8').trim()
    } else {
      resumeText = buffer.toString('utf-8').trim()
    }

    if (!resumeText || resumeText.length < 20) {
      resumeText = `Resume: ${file.name}`
    }

    resumeText = resumeText.replace(/\s+/g, ' ').trim().slice(0, 20000)

    // First ensure profile row exists — upsert to be safe
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        display_name: user.email?.split('@')[0] || 'User',
        resume_text: resumeText,
        resume_filename: file.name,
        resume_uploaded_at: new Date().toISOString(),
      }, { onConflict: 'id' })

    if (upsertError) {
      console.error('Resume upsert error:', upsertError)
      // Try plain update as fallback
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          resume_text: resumeText,
          resume_filename: file.name,
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('Resume update fallback error:', updateError)
        return NextResponse.json({ error: `Could not save resume: ${updateError.message}` }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      filename: file.name,
      charactersExtracted: resumeText.length,
      message: 'Resume uploaded and saved successfully',
    })

  } catch (err) {
    console.error('Resume parse failed:', err)
    // Save filename even if parsing fails
    await supabase.from('profiles').update({
      resume_filename: file.name,
      resume_text: `Resume: ${file.name}`,
    }).eq('id', user.id)

    return NextResponse.json({
      success: true,
      filename: file.name,
      warning: 'File saved but text extraction was limited. Try a Google Docs or Word exported PDF for best results.',
    })
  }
}

function extractRawTextFromPdf(buffer: Buffer): string {
  try {
    const content = buffer.toString('latin1')
    const chunks: string[] = []
    const streamRegex = /stream([\s\S]*?)endstream/g
    let match
    while ((match = streamRegex.exec(content)) !== null) {
      const words = match[1].match(/[^\x00-\x1F\x7F-\xFF]{4,}/g)
      if (words) chunks.push(...words)
    }
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
