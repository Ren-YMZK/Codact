import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white py-6 px-6">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-gray-400">&copy; {new Date().getFullYear()} Codact</p>
        <nav className="flex items-center gap-5">
          <Link href="/terms" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            利用規約
          </Link>
          <Link href="/privacy" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            プライバシーポリシー
          </Link>
          <Link href="/legal" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            特定商取引法に基づく表記
          </Link>
        </nav>
      </div>
    </footer>
  )
}
