function Home() {
  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold text-gray-900">
        Welcome to Yeboc Tongkidari CMS 123
      </h1>
      <p className="text-lg text-gray-600">
        A modern React application built with Vite, TypeScript, React Router, and Tailwind CSS.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">⚡ Vite</h2>
          <p className="text-gray-600">Lightning-fast development server and build tool</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">🎨 Tailwind CSS</h2>
          <p className="text-gray-600">Utility-first CSS framework for rapid UI development</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">🔷 TypeScript</h2>
          <p className="text-gray-600">Type-safe development experience</p>
        </div>
      </div>
    </div>
  )
}

export default Home
