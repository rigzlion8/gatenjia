import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-md mx-auto">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 text-gray-800 leading-tight">
          Welcome to Gatenjia
        </h1>
        <p className="text-sm sm:text-base lg:text-lg text-gray-600 mb-6 sm:mb-8 px-2">
          Send and receive money anywhere in the world.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Link href="/auth/signup">
            <button className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 border-0 text-sm sm:text-base">
              Sign Up
            </button>
          </Link>
          <Link href="/auth/login">
            <button className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-transparent text-blue-600 font-semibold rounded-lg border-2 border-blue-600 hover:bg-blue-600 hover:text-white transform hover:scale-105 transition-all duration-200 text-sm sm:text-base">
              Login
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
}
