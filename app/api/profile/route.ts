import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ profile: data })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  const textFields = [
    'display_name', 'phone', 'location', 'linkedin_url',
    'portfolio_url', 'gmail_address', 'gmail_app_password',
    'cover_letter_template', 'signature_image_url',
    'resume_filename', 'resume_text',
  ]
  const boolFields = ['auto_apply_enabled']

  const updates: Record<string, unknown> = {}

  for (const key of textFields) {
    if (key in body) {
      const val = body[key]
      // Only save non-empty strings — never overwrite with empty/null
      // This protects resume_filename and other fields from being wiped
      if (typeof val === 'string' && val.trim().length > 0) {
        updates[key] = val.trim()
      }
      // Explicit null = intentional clear (allowed)
      if (val === null) {
        updates[key] = null
      }
      // Empty string = skip entirely — do NOT overwrite existing DB value
    }
  }

  for (const key of boolFields) {
    if (key in body && typeof body[key] === 'boolean') {
      updates[key] = body[key]
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ success: true, message: 'Nothing to update' })
  }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)

  if (error) {
    console.error('Profile save error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
