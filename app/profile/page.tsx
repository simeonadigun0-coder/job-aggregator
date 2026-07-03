'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type ProfileForm = {
  display_name: string
  phone: string
  location: string
  linkedin_url: string
  portfolio_url: string
  gmail_address: string
  gmail_app_password: string
  cover_letter_template: string
  auto_apply_enabled: boolean
  signature_image_url: string
  resume_filename: string
}

const EMPTY: ProfileForm = {
  display_name: '', phone: '', location: '', linkedin_url: '',
  portfolio_url: '', gmail_address: '', gmail_app_password: '',
  cover_letter_template: '', auto_apply_enabled: false,
  signature_image_url: '', resume_filename: '',
}

export default function ProfilePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [uploadingSig, setUploadingSig] = useState(false)
  const [activeTab, setActiveTab] = useState<'personal' | 'letter' | 'email'>('personal')
  const [form, setForm] = useState<ProfileForm>(EMPTY)
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        // Only update fields that have actual values — never overwrite with null
        setForm(prev => ({
          ...prev,
          display_name: data.display_name || prev.display_name,
          phone: data.phone || prev.phone,
          location: data.location || prev.location,
          linkedin_url: data.linkedin_url || prev.linkedin_url,
          portfolio_url: data.portfolio_url || prev.portfolio_url,
          gmail_address: data.gmail_address || prev.gmail_address,
          gmail_app_password: data.gmail_app_password || prev.gmail_app_password,
          cover_letter_template: data.cover_letter_template || prev.cover_letter_template,
          auto_apply_enabled: data.auto_apply_enabled ?? prev.auto_apply_enabled,
          signature_image_url: data.signature_image_url || prev.signature_image_url,
          resume_filename: data.resume_filename || prev.resume_filename,
        }))
      }
    } catch (err) {
      console.error('Failed to load profile:', err)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { loadProfile() }, [loadProfile])

  function update(key: keyof ProfileForm, value: string | boolean) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    setSaveError(null)

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok) {
        setSaveError(data.error || 'Failed to save')
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch {
      setSaveError('Network error — please try again')
    } finally {
      setSaving(false)
    }
  }

  async function handleSignatureUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingSig(true)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const ext = file.name.split('.').pop()
      const path = `${user.id}/signature.${ext}`
      const { error } = await supabase.storage.from('signatures').upload(path, file, { upsert: true })

      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('signatures').getPublicUrl(path)
        update('signature_image_url', publicUrl)
        await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ signature_image_url: publicUrl }),
        })
      }
    } finally {
      setUploadingSig(false)
    }
  }

  const tabs = [
    { id: 'personal' as const, label: 'Personal Info' },
    { id: 'letter' as const, label: 'Cover Letter' },
    { id: 'email' as const, label: 'Email & Sending' },
  ]

  const inp: React.CSSProperties = {
    background: '#0a0e1a', border: '1px solid #1e2d4a',
    color: '#e8dcc8', borderRadius: '8px',
    padding: '12px 14px', fontSize: '15px', width: '100%', outline: 'none',
  }
  const lbl: React.CSSProperties = {
    display: 'block', fontSize: '11px', fontWeight: '600',
    letterSpacing: '0.12em', textTransform: 'uppercase',
    color: '#c9a84c', marginBottom: '6px',
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: '#060912' }}>
        <div className="text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 animate-spin mx-auto"
            style={{ borderColor: '#c9a84c', borderTopColor: 'transparent' }} />
          <p className="text-xs" style={{ color: '#6b7a99' }}>Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #060912 0%, #0a0e1a 100%)' }}>
      <header style={{ background: '#0d1526', borderBottom: '1px solid #1e2d4a', position: 'sticky', top: 0, zIndex: 40 }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/dashboard')}
              style={{ color: '#6b7a99', fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer' }}>
              ← Dashboard
            </button>
            <span style={{ color: '#1e2d4a' }}>·</span>
            <span style={{ color: '#c9a84c', fontSize: '11px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              Profile
            </span>
          </div>
          <div className="flex items-center gap-2">
            {saveError && (
              <span className="text-xs px-3 py-1.5 rounded-lg" style={{ color: '#f87171', background: '#1a0a0a', border: '1px solid #5a1a1a' }}>
                {saveError}
              </span>
            )}
            <button onClick={handleSave} disabled={saving}
              className="text-xs font-semibold px-4 py-2 rounded-lg tracking-wider uppercase transition-all"
              style={{ background: saved ? '#0a1a0a' : 'linear-gradient(135deg,#c9a84c,#8a6f2e)', color: saved ? '#4ade80' : '#000' }}>
              {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Changes'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#111827', border: '1px solid #1e2d4a' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex-1 py-2.5 text-xs font-semibold rounded-lg tracking-wider uppercase transition-all"
              style={activeTab === tab.id
                ? { background: 'linear-gradient(135deg,#c9a84c,#8a6f2e)', color: '#000', border: 'none', cursor: 'pointer' }
                : { color: '#6b7a99', background: 'none', border: 'none', cursor: 'pointer' }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* PERSONAL */}
        {activeTab === 'personal' && (
          <div className="rounded-xl p-6 space-y-5" style={{ background: '#111827', border: '1px solid #1e2d4a' }}>
            <div>
              <h2 className="text-sm font-semibold mb-1" style={{ color: '#e8dcc8' }}>Personal Information</h2>
              <p className="text-xs" style={{ color: '#6b7a99' }}>This appears in your application emails and on your dashboard.</p>
            </div>

            {form.resume_filename && (
              <div className="px-4 py-3 rounded-lg flex items-center gap-2"
                style={{ background: '#0a1a0a', border: '1px solid #1a3a1a' }}>
                <span style={{ color: '#4ade80' }}>✓</span>
                <span className="text-xs" style={{ color: '#4ade80' }}>Resume uploaded: {form.resume_filename}</span>
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label style={lbl}>Full Name *</label>
                <input style={inp} value={form.display_name} onChange={e => update('display_name', e.target.value)}
                  placeholder="Your full name" />
              </div>
              <div>
                <label style={lbl}>Phone Number</label>
                <input style={inp} value={form.phone} onChange={e => update('phone', e.target.value)}
                  placeholder="+234 800 000 0000" />
              </div>
              <div>
                <label style={lbl}>Location</label>
                <input style={inp} value={form.location} onChange={e => update('location', e.target.value)}
                  placeholder="Lagos, Nigeria" />
              </div>
              <div>
                <label style={lbl}>LinkedIn URL</label>
                <input style={inp} value={form.linkedin_url} onChange={e => update('linkedin_url', e.target.value)}
                  placeholder="https://linkedin.com/in/yourname" />
              </div>
              <div className="sm:col-span-2">
                <label style={lbl}>Portfolio / Website (optional)</label>
                <input style={inp} value={form.portfolio_url} onChange={e => update('portfolio_url', e.target.value)}
                  placeholder="https://yourwebsite.com" />
              </div>
            </div>

            <div>
              <label style={lbl}>Signature Image (optional)</label>
              <p className="text-xs mb-3" style={{ color: '#6b7a99' }}>
                Upload a photo of your handwritten signature — it appears at the bottom of email applications.
              </p>
              <div className="flex items-center gap-4 flex-wrap">
                {form.signature_image_url && (
                  <div className="p-3 rounded-lg" style={{ background: '#fff' }}>
                    <img src={form.signature_image_url} alt="Signature" style={{ height: '40px', objectFit: 'contain' }} />
                  </div>
                )}
                <label className="text-xs font-semibold px-4 py-2.5 rounded-lg cursor-pointer tracking-wider uppercase"
                  style={{ background: '#1a2235', color: '#c9a84c', border: '1px solid #c9a84c44' }}>
                  {uploadingSig ? 'Uploading...' : form.signature_image_url ? 'Replace Signature' : 'Upload Signature'}
                  <input type="file" accept="image/*" onChange={handleSignatureUpload} disabled={uploadingSig} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* COVER LETTER */}
        {activeTab === 'letter' && (
          <div className="rounded-xl p-6 space-y-5" style={{ background: '#111827', border: '1px solid #1e2d4a' }}>
            <div>
              <h2 className="text-sm font-semibold mb-1" style={{ color: '#e8dcc8' }}>Cover Letter Template</h2>
              <p className="text-xs" style={{ color: '#6b7a99' }}>
                Write your base cover letter here. Use <strong style={{ color: '#c9a84c' }}>[Company]</strong> and{' '}
                <strong style={{ color: '#c9a84c' }}>[Role]</strong> as placeholders. We only adjust those parts and one
                personalised paragraph — the rest stays exactly as you write it.
              </p>
            </div>
            <textarea
              value={form.cover_letter_template || ''}
              onChange={e => update('cover_letter_template', e.target.value)}
              rows={18}
              placeholder="Dear Hiring Manager,&#10;&#10;I am writing to express my interest in the [Role] position at [Company]...&#10;&#10;Kind regards,&#10;Your Name"
              className="w-full rounded-lg p-4 text-sm resize-none outline-none"
              style={{ background: '#0a0e1a', border: '1px solid #1e2d4a', color: '#e8dcc8', fontFamily: 'Georgia, serif', lineHeight: '1.8' }}
            />
            <p className="text-xs" style={{ color: '#3a4a6a' }}>
              {(form.cover_letter_template || '').length > 0 ? `${form.cover_letter_template.length} characters · ` : ''}
              Aim for 250 to 400 words for best results.
            </p>
          </div>
        )}

        {/* EMAIL */}
        {activeTab === 'email' && (
          <div className="space-y-5">
            <div className="rounded-xl p-6 space-y-5" style={{ background: '#111827', border: '1px solid #1e2d4a' }}>
              <div>
                <h2 className="text-sm font-semibold mb-1" style={{ color: '#e8dcc8' }}>Gmail Configuration</h2>
                <p className="text-xs leading-relaxed" style={{ color: '#6b7a99' }}>
                  Applications are sent from your Gmail. You need a{' '}
                  <strong style={{ color: '#c9a84c' }}>Gmail App Password</strong> — not your regular password.<br /><br />
                  How to get one: <strong style={{ color: '#e8dcc8' }}>Google Account → Security → 2-Step Verification → App Passwords</strong> → create one for &quot;Mail&quot;.
                  Copy the 16-character code it gives you.
                </p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label style={lbl}>Gmail Address *</label>
                  <input style={inp} type="email" value={form.gmail_address} onChange={e => update('gmail_address', e.target.value)}
                    placeholder="you@gmail.com" />
                </div>
                <div>
                  <label style={lbl}>Gmail App Password *</label>
                  <div className="relative">
                    <input
                      style={{ ...inp, paddingRight: '44px' }}
                      type={showPass ? 'text' : 'password'}
                      value={form.gmail_app_password}
                      onChange={e => update('gmail_app_password', e.target.value)}
                      placeholder="xxxx xxxx xxxx xxxx"
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: showPass ? '#c9a84c' : '#3a4a6a' }}>
                      {showPass ? '👁' : '👁‍🗨'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl p-6" style={{ background: '#111827', border: '1px solid #c9a84c44' }}>
              <div className="flex items-start gap-4">
                <button onClick={() => update('auto_apply_enabled', !form.auto_apply_enabled)}
                  className="mt-0.5 shrink-0 relative transition-all"
                  style={{ width: '40px', height: '24px', borderRadius: '12px', background: form.auto_apply_enabled ? '#c9a84c' : '#1e2d4a', border: 'none', cursor: 'pointer' }}>
                  <div style={{
                    position: 'absolute', top: '4px', width: '16px', height: '16px',
                    borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
                    left: form.auto_apply_enabled ? '20px' : '4px',
                  }} />
                </button>
                <div>
                  <p className="text-sm font-semibold mb-1" style={{ color: '#e8dcc8' }}>Enable Auto-Apply</p>
                  <p className="text-xs leading-relaxed" style={{ color: '#6b7a99' }}>
                    I agree to let JobHunt generate and send job applications on my behalf using my cover letter, profile details, and Gmail.
                    I understand I will always review the letter before it is sent.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
