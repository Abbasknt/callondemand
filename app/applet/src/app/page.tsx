import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-4">Welcome to Call on Demand</h1>
      <p className="text-lg text-gray-600 mb-8">Your agent portal awaits.</p>
      <Link 
        href="/agent" 
        className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
      >
        Go to Agent Profile
      </Link>
    </div>
  );
}
