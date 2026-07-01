import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { applicationId, hrEmail, editedLetter, subject } = await request.json()

  if (!hrEmail || !applicationId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Fetch profile for Gmail credentials
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, gmail_address, gmail_app_password, linkedin_url, portfolio_url, signature_image_url, phone')
    .eq('id', user.id)
    .single()

  if (!profile?.gmail_address || !(profile as any)?.gmail_app_password) {
    return NextResponse.json(
      { error: 'Gmail not configured. Please add your Gmail address and App Password in Profile settings.' },
      { status: 400 }
    )
  }

  // Fetch application
  const { data: application } = await supabase
    .from('applications')
    .select('*')
    .eq('id', applicationId)
    .eq('user_id', user.id)
    .single()

  if (!application) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  }

  const letterToSend = editedLetter || application.generated_letter

  // Build HTML email — looks like a real human-written email
  const signatureHtml = buildSignature(profile)
  const emailHtml = `
<div style="font-family: Georgia, serif; font-size: 15px; line-height: 1.7; color: #1a1a1a; max-width: 680px;">
  ${letterToSend
    .split('\n')
    .filter((line: string) => line.trim())
    .map((line: string) => `<p style="margin: 0 0 14px 0;">${line}</p>`)
    .join('')}
  ${signatureHtml}
</div>`

  try {
    // Use Gmail App Password (user sets this up once in Google account)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: profile.gmail_address,
        pass: (profile as any).gmail_app_password,
      },
    })

    await transporter.sendMail({
      from: `${profile.display_name} <${profile.gmail_address}>`,
      to: hrEmail,
      subject,
      html: emailHtml,
      text: letterToSend, // Plain text fallback
    })

    // Update application status
    await supabase
      .from('applications')
      .update({
        status: 'sent',
        hr_email: hrEmail,
        generated_letter: letterToSend,
        sent_at: new Date().toISOString(),
      })
      .eq('id', applicationId)

    // Update job match status
    await supabase
      .from('job_matches')
      .update({ status: 'applied' })
      .eq('user_id', user.id)
      .eq('job_id', application.job_id)

    // Drop a confirmation message in inbox
    await supabase.from('messages').insert({
      user_id: user.id,
      type: 'application_sent',
      title: `Application sent to ${application.company}`,
      body: `Your application for ${application.job_title} at ${application.company} was sent to ${hrEmail}.`,
      metadata: { applicationId, company: application.company, jobTitle: application.job_title },
    })

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('Email send failed:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Failed to send email: ${message}` }, { status: 500 })
  }
}

function buildSignature(profile: {
  display_name: string
  phone?: string | null
  gmail_address: string
  linkedin_url?: string | null
  portfolio_url?: string | null
  signature_image_url?: string | null
}) {
  const links = []
  if (profile.linkedin_url) links.push(`<a href="${profile.linkedin_url}" style="color:#1a1a1a;">LinkedIn</a>`)
  if (profile.portfolio_url) links.push(`<a href="${profile.portfolio_url}" style="color:#1a1a1a;">Portfolio</a>`)

  return `
<div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e0e0e0; font-size: 13px; color: #444;">
  ${profile.signature_image_url
    ? `<img src="${profile.signature_image_url}" alt="Signature" style="height:48px; margin-bottom:8px; display:block;" />`
    : ''}
  <strong style="font-size:14px; color:#1a1a1a;">${profile.display_name}</strong><br/>
  ${profile.phone ? `${profile.phone} · ` : ''}${profile.gmail_address}
  ${links.length ? `<br/>${links.join(' · ')}` : ''}
</div>`
}
