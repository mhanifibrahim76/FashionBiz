'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import type { Business } from '@prisma/client'

type SettingsFormProps = {
  business: Business | null
}

export default function SettingsForm({ business }: SettingsFormProps) {
  const { data: session, update: updateSession } = useSession()

  const [name, setName] = useState(session?.user?.name || '')
  const [phone, setPhone] = useState(session?.user?.phone || '')
  const [businessName, setBusinessName] = useState(business?.name || '')
  const [businessType, setBusinessType] = useState(business?.type || '')
  const [businessLocation, setBusinessLocation] = useState(business?.location || '')
  const [businessDescription, setBusinessDescription] = useState(business?.description || '')

  const [savingProfile, setSavingProfile] = useState(false)
  const [savingBusiness, setSavingBusiness] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [emailNotifications, setEmailNotifications] = useState(true)
  const [aiRecommendations, setAiRecommendations] = useState(true)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    const savedNotifications = localStorage.getItem('emailNotifications')
    const savedAi = localStorage.getItem('aiRecommendations')
    const savedDark = localStorage.getItem('darkMode')

    if (savedNotifications !== null) setEmailNotifications(savedNotifications === 'true')
    if (savedAi !== null) setAiRecommendations(savedAi === 'true')
    if (savedDark !== null) setDarkMode(savedDark === 'true')
  }, [])

  useEffect(() => {
    if (session) {
      setName(session.user.name || '')
      setPhone(session.user.phone || '')
    }
  }, [session])

  const saveProfile = async () => {
    setSavingProfile(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone }),
      })
      if (!res.ok) throw new Error('Gagal menyimpan profil')

      setSuccess('Profil berhasil disimpan')
      await updateSession()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setSavingProfile(false)
    }
  }

  const updateBusiness = async () => {
    setSavingBusiness(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch('/api/business', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: businessName,
          type: businessType,
          location: businessLocation,
          description: businessDescription || undefined,
        }),
      })
      if (!res.ok) throw new Error('Gagal memperbarui profil usaha')

      setSuccess('Profil usaha berhasil diperbarui')
      await updateSession()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setSavingBusiness(false)
    }
  }

  const toggleDarkMode = () => {
    const next = !darkMode
    setDarkMode(next)
    localStorage.setItem('darkMode', String(next))
    document.documentElement.classList.toggle('dark', next)
  }

  const toggleNotifications = () => {
    const next = !emailNotifications
    setEmailNotifications(next)
    localStorage.setItem('emailNotifications', String(next))
  }

  const toggleAi = () => {
    const next = !aiRecommendations
    setAiRecommendations(next)
    localStorage.setItem('aiRecommendations', String(next))
  }

  return (
    <div className="flex flex-col gap-7">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Workspace</p>
          <h1 className="page-title">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your profile, business, and preferences.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        {/* ============ ACCOUNT ============ */}
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Profile</p>
              <h2 className="section-title">Account</h2>
            </div>
            <button
              onClick={saveProfile}
              disabled={savingProfile}
              className="button-primary"
            >
              {savingProfile ? 'Saving...' : 'Save changes'}
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-4">
            <div>
              <label>Name</label>
              <input
                className="field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama lengkap"
              />
            </div>

            <div>
              <label>Email</label>
              <input
                className="field"
                value={session?.user?.email || ''}
                disabled
                readOnly
              />
            </div>

            <div>
              <label>Phone</label>
              <input
                className="field"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08xxxxxxxxxx"
              />
            </div>
          </div>
        </section>

        {/* ============ BUSINESS ============ */}
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Business</p>
              <h2 className="section-title">Store profile</h2>
            </div>
            <button
              onClick={updateBusiness}
              disabled={savingBusiness}
              className="button-primary"
            >
              {savingBusiness ? 'Updating...' : 'Update business'}
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-4">
            <div>
              <label>Business name</label>
              <input
                className="field"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </div>

            <div>
              <label>Type</label>
              <input
                className="field"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
              />
            </div>

            <div>
              <label>Location</label>
              <input
                className="field"
                value={businessLocation || ''}
                onChange={(e) => setBusinessLocation(e.target.value)}
              />
            </div>

            <div>
              <label>Description</label>
              <textarea
                className="field"
                rows={3}
                value={businessDescription || ''}
                onChange={(e) => setBusinessDescription(e.target.value)}
                placeholder="Deskripsi usaha..."
              />
            </div>
          </div>
        </section>
      </div>

      {/* ============ PREFERENCES ============ */}
      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Preferences</p>
            <h2 className="section-title">Notifications &amp; AI</h2>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Email notifications</p>
              <p className="text-xs text-muted-foreground">
                Receive low stock alerts and weekly summaries
              </p>
            </div>
            <button
              onClick={toggleNotifications}
              className={
                emailNotifications
                  ? 'button-primary text-xs'
                  : 'button-secondary text-xs'
              }
            >
              {emailNotifications ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">AI recommendations</p>
              <p className="text-xs text-muted-foreground">
                Show AI-powered suggestions on dashboard
              </p>
            </div>
            <button
              onClick={toggleAi}
              className={
                aiRecommendations
                  ? 'button-primary text-xs'
                  : 'button-secondary text-xs'
              }
            >
              {aiRecommendations ? 'Active' : 'Inactive'}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Dark mode</p>
              <p className="text-xs text-muted-foreground">
                Switch to dark sidebar theme
              </p>
            </div>
            <button
              onClick={toggleDarkMode}
              className={
                darkMode ? 'button-primary text-xs' : 'button-secondary text-xs'
              }
            >
              {darkMode ? 'Dark' : 'Light'}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
