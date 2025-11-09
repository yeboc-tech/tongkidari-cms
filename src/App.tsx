import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import CategoryPage from './pages/CategoryPage'
import ExamPage from './pages/ExamPage'

function Navigation() {
  const location = useLocation()

  // URL에서 categoryId 추출 (/category/사회 -> 사회)
  const pathParts = location.pathname.split('/')
  const currentCategory = pathParts[1] === 'category' && pathParts[2]
    ? decodeURIComponent(pathParts[2])
    : null

  const isActive = (category: string) => currentCategory === category

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
              to="/category/사회"
              className="inline-flex items-center px-1 pt-1"
            >
              <span className={`${
                isActive('사회')
                  ? 'text-blue-600 font-semibold border-b-2 border-blue-600 pb-1'
                  : 'text-gray-900 hover:text-blue-600'
              }`}>
                사회
              </span>
            </Link>
            <Link
              to="/category/과학"
              className="inline-flex items-center px-1 pt-1"
            >
              <span className={`${
                isActive('과학')
                  ? 'text-blue-600 font-semibold border-b-2 border-blue-600 pb-1'
                  : 'text-gray-900 hover:text-blue-600'
              }`}>
                과학
              </span>
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
            <Route path="/category/:categoryId" element={<CategoryPage />} />
            <Route path="/exam/:id" element={<ExamPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
