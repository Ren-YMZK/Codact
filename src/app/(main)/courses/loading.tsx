export default function CoursesLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="mt-2 h-4 w-48 bg-gray-100 rounded animate-pulse" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-3">
              <div className="h-5 w-16 bg-gray-100 rounded-full animate-pulse" />
              <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse" />
              <div className="h-16 bg-gray-100 rounded animate-pulse" />
              <div className="mt-auto h-9 bg-gray-200 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
