'use client'

import { useState, useEffect, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { Lottie } from 'lottie-react'

function RegistrationCheck({ onRegistered }: { onRegistered: (value: boolean) => void }) {
  const searchParams = useSearchParams()
  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      onRegistered(true)
    }
  }, [searchParams, onRegistered])
  return null
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [animationData, setAnimationData] = useState<any>(null)
  const [showRegisteredMsg, setShowRegisteredMsg] = useState(false)

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

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Email atau password salah')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FBFCFD]">
      <Suspense fallback={null}>
        <RegistrationCheck onRegistered={setShowRegisteredMsg} />
      </Suspense>
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
          <h2 className="-mt-8 text-center text-2xl font-bold text-[#071C2C] max-sm:text-xl">
            Kelola Bisnis, Raih Cuan
          </h2>
          <p className="max-w-xs text-center text-sm text-[#5B6D7D] leading-relaxed">
            Pantau penjualan, analisis keuntungan, dan kembangkan bisnis fashion
            kamu bersama Untungin.
          </p>
        </div>

        {/* RIGHT - Login Form */}
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

              <h1 className="text-2xl font-bold text-[#071C2C]">Masuk ke Akun</h1>
              <p className="mt-1.5 text-sm text-[#5B6D7D]">Selamat datang kembali di Untungin</p>
            </div>

            {/* Success Message (from registration) */}
            {showRegisteredMsg && (
              <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                Akun berhasil dibuat! Silakan masuk dengan email dan password yang sudah terdaftar.
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                {error}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="mt-5 space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#466078] mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-[#D9E0E6] px-3.5 py-2.5 text-sm text-[#071C2C] placeholder-[#A3B5C4] focus:border-[#D4D900] focus:outline-none focus:ring-1 focus:ring-[#D4D900]"
                  placeholder="nama@email.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#466078] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-[#D9E0E6] px-3.5 py-2.5 pr-10 text-sm text-[#071C2C] placeholder-[#A3B5C4] focus:border-[#D4D900] focus:outline-none focus:ring-1 focus:ring-[#D4D900]"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
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

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#D4D900] py-2.5 text-sm font-semibold text-[#071C2C] hover:bg-[#E0E500] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Memuat...' : 'Masuk'}
              </button>
            </form>

            {/* Register Link */}
            <div className="mt-6 text-center text-sm">
              <p className="text-[#5B6D7D]">
                Belum punya akun?{' '}
                <Link href="/register" className="font-semibold text-[#071C2C] hover:underline">
                  Daftar sekarang
                </Link>
              </p>
            </div>

            {/* Divider */}
            <div className="my-6 flex items-center">
              <div className="flex-1 border-t border-[#E9EDF0]"></div>
              <span className="px-3 text-xs text-[#A3B5C4]">atau</span>
              <div className="flex-1 border-t border-[#E9EDF0]"></div>
            </div>

            {/* Demo Account */}
            <div className="rounded-lg border border-[#D9E0E6] bg-white px-4 py-3.5">
              <p className="text-xs font-medium text-[#466078] mb-1">Demo Account:</p>
              <p className="text-xs text-[#5B6D7D]">
                demo@fashionbiz.ai / <span className="font-mono">demo123</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
