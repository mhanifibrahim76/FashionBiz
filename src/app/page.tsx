"use client"

import Link from "next/link"
import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import {
  ArrowRight,
  BarChart3,
  Brain,
  Package,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  ShoppingBag,
  Database,
} from "lucide-react"

gsap.registerPlugin(ScrollTrigger)

export default function LandingPage() {
  const pageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // The one orchestrated moment: hero copy, then the dashboard settles in.
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } })

      tl.from(".hero-item", {
        opacity: 0,
        y: 28,
        duration: 0.8,
        stagger: 0.12,
      }).from(
        ".dashboard-preview",
        {
          opacity: 0,
          y: 60,
          scale: 0.97,
          duration: 1,
        },
        "-=0.5"
      )

      gsap.to(".floating-card-1", {
        y: -10,
        duration: 2.2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      })

      gsap.to(".floating-card-2", {
        y: 10,
        duration: 2.6,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      })

      // Everything past the fold gets a quiet, single fade-in — no per-card stagger tricks.
      gsap.utils.toArray<HTMLElement>(".reveal-group").forEach((group) => {
        gsap.from(group, {
          opacity: 0,
          y: 24,
          duration: 0.7,
          ease: "power2.out",
          scrollTrigger: {
            trigger: group,
            start: "top 85%",
            once: true,
          },
        })
      })

      gsap.utils.toArray<HTMLElement>(".chart-bar").forEach((bar) => {
        const height = bar.dataset.height || "50%"
        gsap.fromTo(
          bar,
          { height: "0%" },
          {
            height,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: bar,
              start: "top 90%",
              once: true,
            },
          }
        )
      })

      gsap.fromTo(
        ".progress-line",
        { width: "0%" },
        {
          width: "78%",
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".progress-line",
            start: "top 90%",
            once: true,
          },
        }
      )
    }, pageRef)

    return () => ctx.revert()
  }, [])

  return (
    <div
      ref={pageRef}
      className="min-h-screen overflow-hidden bg-white text-[#071C2C] selection:bg-[#D4D900] selection:text-[#071C2C]"
    >
      {/* NAVBAR */}
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-white/75 shadow-sm backdrop-blur-2xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center">
            <img
              src="/logo-untungin.png"
              alt="Untungin"
              className="h-10 w-auto object-contain transition-transform duration-300 hover:scale-[1.03]"
            />
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden rounded-full px-4 py-2 text-sm font-semibold text-[#466078] transition hover:bg-[#F5F7EE] hover:text-[#071C2C] sm:block"
            >
              Masuk
            </Link>

            <Link
              href="/register"
              className="rounded-full bg-[#D4D900] px-5 py-2.5 text-sm font-bold text-[#071C2C] shadow-[0_10px_30px_rgba(212,217,0,0.22)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(212,217,0,0.32)] hover:bg-[#E0E500]"
            >
              Mulai Gratis
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* HERO */}
        <section className="relative overflow-hidden px-4 pb-24 pt-32 sm:pt-40 lg:pb-32">
          <div className="absolute left-1/2 top-10 -z-10 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-[#D4D900]/20 blur-[110px]" />

          <div className="absolute inset-x-0 top-0 -z-20 h-[680px] bg-[radial-gradient(circle_at_50%_20%,rgba(212,217,0,0.13),transparent_42%)]" />
          <div className="absolute right-[-8rem] top-[-8rem] h-80 w-80 rounded-full bg-[#D4D900]/10 blur-3xl" />
          <div className="absolute bottom-[-10rem] left-[-8rem] h-96 w-96 rounded-full bg-white/[0.04] blur-3xl" />
          <div className="relative mx-auto max-w-7xl">
            <div className="mx-auto max-w-4xl text-center">
              <h1 className="hero-item text-4xl font-black leading-[1.02] tracking-[-0.04em] text-[#071C2C] sm:text-6xl lg:text-7xl">
                Ramai belum tentu untung.
                <span className="block bg-gradient-to-r from-[#526A16] via-[#718C12] to-[#A0B600] bg-clip-text text-transparent">Untungin kasih tahu selisihnya.</span>
              </h1>

              <p className="hero-item mx-auto mt-6 max-w-2xl text-base leading-8 text-[#5B6D7D] sm:text-lg">
                Satu tempat untuk lihat penjualan, stok, produk paling laku, dan
                keuntungan bisnis fashion kamu — biar langkah berikutnya nggak
                lagi berdasarkan tebakan.
              </p>

              <div className="hero-item mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#D4D900] px-7 py-4 font-bold text-[#071C2C] shadow-[0_18px_40px_rgba(212,217,0,0.24)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_48px_rgba(212,217,0,0.34)] hover:bg-[#E0E500]"
                >
                  Mulai Kelola Bisnis
                  <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
                </Link>

                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-full border border-[#DCE2E7] bg-white px-7 py-4 font-bold text-[#18324A] shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#C8D0D7] hover:bg-[#F8FAFB]"
                >
                  Lihat Cara Kerjanya
                </Link>
              </div>
            </div>

            {/* DASHBOARD PREVIEW */}
            <div className="dashboard-preview relative mx-auto mt-16 max-w-6xl">
              <div className="floating-card-1 absolute -left-5 top-20 hidden rounded-2xl border border-[#E2DED2] bg-white p-4 shadow-xl sm:block">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-[#F0F4D8] p-2">
                    <TrendingUp className="h-5 w-5 text-[#5D7A19]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#64788A]">Pertumbuhan</p>
                    <p className="font-bold text-[#5D7A19]">+24.8%</p>
                  </div>
                </div>
              </div>

              <div className="floating-card-2 absolute -right-5 bottom-20 hidden rounded-2xl border border-[#E2DED2] bg-white p-4 shadow-xl sm:block">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-[#F2F3DE] p-2">
                    <Brain className="h-5 w-5 text-[#071C2C]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#64788A]">Saran Bisnis</p>
                    <p className="font-bold text-[#071C2C]">3 peluang baru</p>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-[28px] border border-[#DCE2E7] bg-white shadow-[0_35px_90px_rgba(7,28,44,0.16)] ring-1 ring-black/[0.02]">
                <div className="flex h-11 items-center gap-2 border-b border-[#E8ECEF] bg-[#F8FAFB] px-5">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                </div>

                <div className="grid min-h-[400px] grid-cols-12">
                  <div className="hidden border-r border-[#19364B] bg-[#071C2C] p-5 text-white sm:col-span-3 sm:block">
                    <div className="mb-8 flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-[#D4D900]" />
                      <span className="font-bold text-white">Untungin</span>
                    </div>

                    <div className="space-y-2">
                      <div className="rounded-lg bg-[#D4D900] px-3 py-2 text-sm font-semibold text-[#071C2C]">
                        Dashboard
                      </div>
                      <div className="px-3 py-2 text-sm text-slate-300">Produk</div>
                      <div className="px-3 py-2 text-sm text-slate-300">Penjualan</div>
                      <div className="px-3 py-2 text-sm text-slate-300">Saran Bisnis</div>
                    </div>
                  </div>

                  <div className="col-span-12 bg-[#FBFCFC] p-5 sm:col-span-9 sm:p-8">
                    <div className="mb-6">
                      <p className="text-xs text-[#64788A]">Senin, 7 September 2026</p>
                      <h3 className="mt-1 text-xl font-bold">Selamat datang kembali 👋</h3>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <DashboardStat title="Total Penjualan" value="Rp 24,8 Jt" change="+18,4%" />
                      <DashboardStat title="Keuntungan" value="Rp 8,2 Jt" change="+12,7%" />
                      <DashboardStat title="Produk Terjual" value="1.248" change="+24,8%" />
                    </div>

                    <div className="mt-5 grid gap-5 lg:grid-cols-5">
                      <div className="rounded-2xl border border-[#E6EBEE] bg-white p-5 shadow-sm lg:col-span-3">
                        <div className="mb-5 flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">Tren Penjualan</h4>
                            <p className="text-xs text-[#8A98A5]">7 hari terakhir</p>
                          </div>
                          <BarChart3 className="h-5 w-5 text-[#071C2C]" />
                        </div>

                        <div className="flex h-40 items-end justify-between gap-2">
                          <div className="chart-bar w-full rounded-t bg-[#DDE1A0]" data-height="42%" />
                          <div className="chart-bar w-full rounded-t bg-[#DDE1A0]" data-height="58%" />
                          <div className="chart-bar w-full rounded-t bg-[#DDE1A0]" data-height="48%" />
                          <div className="chart-bar w-full rounded-t bg-[#D4D900]" data-height="72%" />
                          <div className="chart-bar w-full rounded-t bg-[#DDE1A0]" data-height="64%" />
                          <div className="chart-bar w-full rounded-t bg-[#D4D900]" data-height="85%" />
                          <div className="chart-bar w-full rounded-t bg-[#071C2C]" data-height="100%" />
                        </div>
                      </div>

                      <div className="rounded-2xl border border-[#E6EBEE] bg-white p-5 shadow-sm lg:col-span-2">
                        <div className="flex items-center gap-2">
                          <div className="rounded-lg bg-[#EEF0C7] p-2">
                            <Brain className="h-4 w-4 text-[#071C2C]" />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold">Saran Bisnis</h4>
                            <p className="text-xs text-[#8A98A5]">Insight terbaru</p>
                          </div>
                        </div>

                        <div className="mt-5 rounded-xl bg-[#F2F3DE] p-4">
                          <p className="text-sm leading-6 text-[#18324A]">
                            Produk <strong>Oversized Hoodie</strong> mengalami peningkatan
                            penjualan sebesar 32%.
                          </p>
                          <p className="mt-2 text-xs font-medium text-[#071C2C]">
                            💡 Pertimbangkan menambah stok 15–20%.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="border-y border-[#E9EDF0] bg-[#FBFCFC] py-14">
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-4 text-center md:grid-cols-4">
            <Stat value="24K+" label="Data Transaksi" />
            <Stat value="1.2K+" label="Produk Dianalisis" />
            <Stat value="98%" label="Akurasi Data" />
            <Stat value="24/7" label="Pantauan Bisnis" />
          </div>
        </section>

        {/* PROBLEM — split layout instead of three identical cards */}
        <section className="reveal-group px-4 py-28 sm:py-32">
          <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <div>
              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
                Bisnis berkembang, tapi datanya berantakan.
              </h2>
              <p className="mt-5 max-w-md leading-7 text-[#466078]">
                Penjualan terus jalan, tapi cukup sulit melihat produk mana yang
                paling laku dan apakah hasil akhirnya benar-benar
                menguntungkan.
              </p>
            </div>

            <div className="divide-y divide-[#E2DED2] rounded-2xl border border-[#E2DED2] bg-white">
              <ProblemRow
                icon={<Database />}
                title="Data tersebar"
                description="Data penjualan, stok, dan produk sering masih tersimpan di tempat yang berbeda."
              />
              <ProblemRow
                icon={<BarChart3 />}
                title="Sulit membaca data"
                description="Angka penjualan akan lebih berguna kalau kamu bisa melihat trennya."
              />
              <ProblemRow
                icon={<Brain />}
                title="Sering menebak kondisi bisnis"
                description="Kadang keputusan stok dan penjualan masih berdasarkan perkiraan."
              />
            </div>
          </div>
        </section>

        {/* FEATURES — asymmetric bento instead of four identical cards */}
        <section className="reveal-group relative overflow-hidden bg-[#071C2C] px-4 py-28 text-white sm:py-32">
          <div className="absolute inset-x-0 top-0 -z-20 h-[680px] bg-[radial-gradient(circle_at_50%_20%,rgba(212,217,0,0.13),transparent_42%)]" />
          <div className="absolute right-[-8rem] top-[-8rem] h-80 w-80 rounded-full bg-[#D4D900]/10 blur-3xl" />
          <div className="absolute bottom-[-10rem] left-[-8rem] h-96 w-96 rounded-full bg-white/[0.04] blur-3xl" />
          <div className="relative mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-black sm:text-4xl">
                Semua yang kamu butuhkan untuk mengelola bisnis, di satu tempat.
              </h2>
            </div>

            <div className="mt-14 grid gap-5 md:grid-cols-3">
              <FeatureCard
                icon={<BarChart3 />}
                title="Dashboard Analitik"
                description="Lihat omzet, keuntungan, dan perkembangan penjualan tanpa harus bongkar banyak catatan."
                large
              />
              <FeatureCard
                icon={<Brain />}
                title="Saran Bisnis"
                description="Dapatkan saran berdasarkan kondisi penjualan dan stok tokomu."
              />
              <FeatureCard
                icon={<Package />}
                title="Manajemen Produk"
                description="Catat produk, harga, dan stok supaya semuanya lebih mudah dipantau."
              />
              <FeatureCard
                icon={<TrendingUp />}
                title="Analisis Penjualan"
                description="Cari tahu produk yang paling laku dan lihat perubahan penjualan dari waktu ke waktu."
                className="md:col-span-2"
              />
            </div>
          </div>
        </section>

        {/* INSIGHT SECTION */}
        <section className="reveal-group px-4 py-28 sm:py-32">
          <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
                Angkanya sudah ada. Sekarang tinggal lihat arahnya.
              </h2>

              <p className="mt-5 leading-7 text-[#466078]">
                Untungin merangkum data penjualan dan kondisi stok supaya kamu lebih
                mudah melihat apa yang sedang terjadi di tokomu dan menentukan
                langkah berikutnya.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  "Tahu produk mana yang paling laku",
                  "Lihat perubahan penjualan dari waktu ke waktu",
                  "Tahu kapan stok perlu ditambah",
                  "Dapatkan saran sesuai kondisi bisnis",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-[#6D8A1B]" />
                    <span className="text-sm text-[#18324A]">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-[#E2DED2] bg-white p-6 shadow-xl">
              <div className="rounded-2xl bg-[#F2F3DE] p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-[#071C2C] p-3">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Rekomendasi Bisnis</p>
                    <p className="text-xs text-[#64788A]">Berdasarkan data penjualan</p>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
                  <p className="text-sm leading-7 text-[#18324A]">
                    Penjualan <strong>Oversized Hoodie</strong> meningkat konsisten
                    selama 3 minggu terakhir.
                  </p>

                  <div className="mt-5">
                    <div className="mb-2 flex justify-between text-xs">
                      <span className="text-[#64788A]">Potensi pertumbuhan</span>
                      <span className="font-bold text-[#071C2C]">78%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="progress-line h-full rounded-full bg-[#D4D900]" />
                    </div>
                  </div>

                  <div className="mt-5 rounded-xl bg-[#F0F4D8] p-4">
                    <p className="text-xs font-medium leading-5 text-[#526A16]">
                      💡 Rekomendasi: tambah stok produk sebesar 15–20% untuk
                      mengantisipasi peningkatan permintaan.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS — kept numbered, since it genuinely is a sequence */}
        <section className="reveal-group bg-white px-4 py-24">
          <div className="absolute inset-x-0 top-0 -z-20 h-[680px] bg-[radial-gradient(circle_at_50%_20%,rgba(212,217,0,0.13),transparent_42%)]" />
          <div className="absolute right-[-8rem] top-[-8rem] h-80 w-80 rounded-full bg-[#D4D900]/10 blur-3xl" />
          <div className="absolute bottom-[-10rem] left-[-8rem] h-96 w-96 rounded-full bg-white/[0.04] blur-3xl" />
          <div className="relative mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-black sm:text-4xl">
                Lihat kondisi bisnis, tentukan langkahnya
              </h2>
            </div>

            <div className="mt-14 grid gap-8 md:grid-cols-3">
              <StepCard
                number="01"
                icon={<ShoppingBag />}
                title="Masukkan data"
                description="Tambahkan produk, transaksi, harga, dan stok yang kamu punya."
              />
              <StepCard
                number="02"
                icon={<BarChart3 />}
                title="Analisis data"
                description="Untungin mengolah data dan menampilkan performa bisnis dalam dashboard."
              />
              <StepCard
                number="03"
                icon={<Brain />}
                title="Ambil keputusan"
                description="Lihat apa yang sedang terjadi di tokomu, lalu tentukan langkah berikutnya."
              />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden bg-[#071C2C] px-4 py-28 text-white sm:py-32">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

          <div className="reveal-group relative mx-auto max-w-3xl text-center">
            <Sparkles className="mx-auto mb-5 h-8 w-8 text-[#D4D900]" />

            <h2 className="text-3xl font-black sm:text-5xl">
              Nggak perlu lagi nebak-nebak kondisi bisnis.
            </h2>

            <p className="mx-auto mt-5 max-w-2xl leading-7 text-[#F0F2D0]">
              Catat penjualan, pantau stok, dan lihat perkembangan tokomu tanpa
              harus membuka banyak catatan.
            </p>

            <Link
              href="/register"
              className="group mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 font-bold text-[#071C2C] shadow-xl transition hover:-translate-y-1"
            >
              Coba Untungin Gratis
              <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
            </Link>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-[#E9EDF0] bg-[#FBFCFC] py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-sm text-[#64788A] sm:flex-row">
          <p>© 2026 Untungin. Kelola bisnis fashion dengan lebih mudah.</p>
          <p>Dibuat untuk membantu bisnis fashion berkembang.</p>
        </div>
      </footer>
    </div>
  )
}

function DashboardStat({
  title,
  value,
  change,
}: {
  title: string
  value: string
  change: string
}) {
  return (
    <div className="rounded-2xl border border-[#E6EBEE] bg-white p-4 shadow-[0_8px_25px_rgba(7,28,44,0.04)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(7,28,44,0.07)]">
      <p className="text-xs text-[#64788A]">{title}</p>
      <div className="mt-2 flex items-end justify-between gap-2">
        <p className="text-lg font-bold">{value}</p>
        <span className="text-xs font-semibold text-[#5D7A19]">{change}</span>
      </div>
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-2xl font-black text-[#071C2C] sm:text-3xl">{value}</p>
      <p className="mt-1 text-sm text-[#64788A]">{label}</p>
    </div>
  )
}

function ProblemRow({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="group flex gap-4 p-6 transition duration-300 hover:bg-[#FAFBF8]">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EEF0C7] text-[#071C2C] transition duration-300 group-hover:scale-105 group-hover:bg-[#D4D900]">
        {icon}
      </div>
      <div>
        <h3 className="font-bold">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-[#64788A]">{description}</p>
      </div>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
  large,
  className = "",
}: {
  icon: React.ReactNode
  title: string
  description: string
  large?: boolean
  className?: string
}) {
  return (
    <div
      className={`rounded-2xl border border-[#19364B] bg-[#0B2235] p-6 transition hover:border-[#D4D900] hover:bg-[#102B40] ${large ? "md:row-span-2 md:p-8" : ""
        } ${className}`}
    >
      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-[#D4D900]/10 text-[#D4D900]">
        {icon}
      </div>
      <h3 className={`font-bold ${large ? "text-xl" : ""}`}>{title}</h3>
      <p className="mt-3 text-sm leading-6 text-[#8A98A5]">{description}</p>
    </div>
  )
}

function StepCard({
  number,
  icon,
  title,
  description,
}: {
  number: string
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="relative overflow-hidden rounded-[24px] border border-[#E3E8EB] bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(7,28,44,0.08)]">
      <div className="flex items-center justify-between">
        <span className="text-sm font-black text-[#071C2C]">{number}</span>
        <div className="rounded-2xl bg-[#F5F7EE] p-3 text-[#071C2C] shadow-sm">{icon}</div>
      </div>
      <h3 className="mt-8 text-xl font-bold">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-[#64788A]">{description}</p>
    </div>
  )
}