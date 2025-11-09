import { BrowserRouter, Routes, Route, Link, useLocation, useSearchParams } from 'react-router-dom'
import Home from './pages/Home'
import SubjectPage from './pages/SubjectPage'
import ExamPage from './pages/ExamPage'

function Navigation() {
  const location = useLocation()
  const [searchParams] = useSearchParams()

  // subject 페이지에서 category 파라미터 확인
  const currentCategory = location.pathname === '/subject' ? searchParams.get('category') : null

  const getLinkClassName = (category: string) => {
    const isActive = currentCategory === category
    return `inline-flex items-center px-1 pt-1 ${
      isActive
        ? 'text-blue-600 border-b-2 border-blue-600 font-semibold'
        : 'text-gray-900 hover:text-blue-600'
    }`
  }

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex space-x-8">
            <Link
              to="/"
              className="inline-flex items-center px-1 pt-1 text-gray-900 hover:text-blue-600"
            >
              Home
            </Link>
            <Link
              to="/subject?category=사회"
              className={getLinkClassName('사회')}
            >
              사회
            </Link>
            <Link
              to="/subject?category=과학"
              className={getLinkClassName('과학')}
            >
              과학
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navigation />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/subject" element={<SubjectPage />} />
            <Route path="/exam/:id" element={<ExamPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
