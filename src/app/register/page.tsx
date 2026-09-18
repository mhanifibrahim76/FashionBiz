'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { Lottie } from 'lottie-react'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    businessName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [animationData, setAnimationData] = useState<any>(null)

  const router = useRouter()

  useEffect(() => {
    fetch('/Revenue.json')
      .then((response) => {
        if (!response.ok) throw new Error('Gagal memuat animasi')
        return response.json()
      })
      .then((data) => setAnimationData(data))
      .catch((error) => console.error('Gagal memuat Lottie:', error))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Password tidak cocok')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          businessName: formData.businessName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        }),
      })

      if (res.ok) {
        router.push('/login?registered=true')
      } else {
        const data = await res.json()
        setError(data.message || 'Terjadi kesalahan')
      }
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FBFCFD]">
      <div className="mx-auto grid min-h-screen grid-cols-1 md:grid-cols-2">
        {/* LEFT - Lottie Illustration */}
        <div className="hidden flex-col items-center justify-center gap-0 p-8 md:flex">
          {animationData ? (
            <Lottie src={animationData} loop={true} className="w-full max-w-sm" />
          ) : (
            <div className="flex h-64 w-full max-w-sm items-center justify-center text-gray-300">
              <span className="text-sm">Memuat animasi…</span>
            </div>
          )}
          <h2 className="-mt-24 text-center text-2xl font-bold text-[#071C2C] max-sm:text-xl">
            Bangun Bisnis Lebih Cerdas
          </h2>
          <p className="max-w-xs text-center text-sm text-[#5B6D7D] leading-relaxed">
            Daftar gratis dan mulai kelola stok, penjualan, serta keuntungan
            bisnis fashion kamu dengan lebih jelas bersama Untungin.
          </p>
        </div>

        {/* RIGHT - Register Form */}
        <div className="flex items-center justify-center px-6 py-12 sm:px-8">
          <div className="w-full max-w-md">
            {/* Logo & Header */}
            <div className="text-center">
              <Link href="/" className="mb-6 inline-flex items-center justify-center">
                <img
                  src="/logo-untungin.png"
                  alt="Untungin"
                  className="h-10 w-auto object-contain"
                />
              </Link>

              <h1 className="text-2xl font-bold text-[#071C2C]">Buat Akun Baru</h1>
              <p className="mt-1.5 text-sm text-[#5B6D7D]">Mulai kelola bisnis fashion Anda</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                {error}
              </div>
            )}

            {/* Register Form */}
            <form onSubmit={handleSubmit} className="mt-5 space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-[#466078] mb-1.5">
                  Nama Pemilik
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-[#D9E0E6] px-3.5 py-2.5 text-sm text-[#071C2C] placeholder-[#A3B5C4] focus:border-[#D4D900] focus:outline-none focus:ring-1 focus:ring-[#D4D900]"
                  placeholder="Nama lengkap"
                  required
                />
              </div>

              <div>
                <label htmlFor="businessName" className="block text-sm font-medium text-[#466078] mb-1.5">
                  Nama Usaha
                </label>
                <input
                  id="businessName"
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full rounded-lg border border-[#D9E0E6] px-3.5 py-2.5 text-sm text-[#071C2C] placeholder-[#A3B5C4] focus:border-[#D4D900] focus:outline-none focus:ring-1 focus:ring-[#D4D900]"
                  placeholder="contoh: Toko Kaos Maria"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#466078] mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-lg border border-[#D9E0E6] px-3.5 py-2.5 text-sm text-[#071C2C] placeholder-[#A3B5C4] focus:border-[#D4D900] focus:outline-none focus:ring-1 focus:ring-[#D4D900]"
                  placeholder="nama@email.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-[#466078] mb-1.5">
                  Nomor Telepon
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full rounded-lg border border-[#D9E0E6] px-3.5 py-2.5 text-sm text-[#071C2C] placeholder-[#A3B5C4] focus:border-[#D4D900] focus:outline-none focus:ring-1 focus:ring-[#D4D900]"
                  placeholder="08xxxxxxxxxx"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#466078] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full rounded-lg border border-[#D9E0E6] px-3.5 py-2.5 pr-10 text-sm text-[#071C2C] placeholder-[#A3B5C4] focus:border-[#D4D900] focus:outline-none focus:ring-1 focus:ring-[#D4D900]"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A3B5C4] hover:text-[#466078]"
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#466078] mb-1.5">
                  Konfirmasi Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full rounded-lg border border-[#D9E0E6] px-3.5 py-2.5 pr-10 text-sm text-[#071C2C] placeholder-[#A3B5C4] focus:border-[#D4D900] focus:outline-none focus:ring-1 focus:ring-[#D4D900]"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A3B5C4] hover:text-[#466078]"
                    aria-label={showConfirm ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#D4D900] py-2.5 text-sm font-semibold text-[#071C2C] hover:bg-[#E0E500] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Memuat...' : 'Daftar Sekarang'}
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center text-sm">
              <p className="text-[#5B6D7D]">
                Sudah punya akun?{' '}
                <Link href="/login" className="font-semibold text-[#071C2C] hover:underline">
                  Masuk di sini
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
