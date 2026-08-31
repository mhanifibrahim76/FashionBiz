import Link from 'next/link'
import { ArrowRight, BarChart3, Brain, Package, TrendingUp } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <nav className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">FB</span>
              </div>
              <span className="font-bold text-xl">FashionBiz AI</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-gray-600 hover:text-gray-900">
                Masuk
              </Link>
              <Link 
                href="/register" 
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Mulai Gratis
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Pahami Bisnis Fashion Anda
              <br />
              <span className="text-primary">Dengan Kecerdasan Buatan</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Platform Business Intelligence berbasis AI yang membantu pemilik UMKM pakaian 
              memahami kondisi bisnis, menganalisis data penjualan, dan mendapatkan rekomendasi 
              keputusan bisnis berdasarkan data.
            </p>
            <div className="flex justify-center gap-4">
              <Link 
                href="/register" 
                className="bg-primary text-white px-8 py-3 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                Mulai Kelola Bisnis
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link 
                href="/login" 
                className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Masuk ke Akun
              </Link>
            </div>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">
              Fitur Utama
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <FeatureCard
                icon={<BarChart3 className="h-8 w-8 text-primary" />}
                title="Dashboard Analitik"
                description="Monitor omzet, laba, dan performa bisnis secara real-time dengan visualisasi yang mudah dipahami."
              />
              <FeatureCard
                icon={<Brain className="h-8 w-8 text-primary" />}
                title="AI Business Advisor"
                description="Dapatkan insight dan rekomendasi bisnis berbasis data untuk pengambilan keputusan yang lebih baik."
              />
              <FeatureCard
                icon={<Package className="h-8 w-8 text-primary" />}
                title="Manajemen Produk"
                description="Kelola katalog produk, harga, dan stok dengan mudah dalam satu platform terintegrasi."
              />
              <FeatureCard
                icon={<TrendingUp className="h-8 w-8 text-primary" />}
                title="Analisis Penjualan"
                description="Analisis performa penjualan, produk terlaris, dan tren bisnis Anda."
              />
            </div>
          </div>
        </section>

        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">
              Siap Mengubah Data Menjadi Keputusan Bisnis?
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Bergabunglah dengan ribuan pemilik UMKM fashion yang sudah menggunakan 
              FashionBiz AI untuk mengembangkan bisnis mereka.
            </p>
            <Link 
              href="/register" 
              className="bg-primary text-white px-8 py-3 rounded-lg hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
            >
              Mulai Gratis Sekarang
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600">
          <p> FashionBiz AI - Business Intelligence untuk UMKM Fashion</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="text-center">
      <div className="flex justify-center mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}
