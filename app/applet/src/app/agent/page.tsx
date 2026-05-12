"use client";

import { useEffect, useState } from "react";

export default function AgentPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        setError(null);
        // Simulate profile fetching
        const response = await fetch("/api/agent/profile");
        if (!response.ok) {
          throw new Error("Failed to load profile. Please try again later.");
        }
        const data = await response.json();
        setProfile(data);
      } catch (err: any) {
        console.error("Error fetching user profile:", err);
        setError(err.message || "An unexpected error occurred while loading your profile.");
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full text-center">
          <h2 className="text-red-800 text-lg font-semibold mb-2">Profile Load Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Agent Profile</h1>
        <a 
          href="/agent/settings" 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Settings
        </a>
      </div>
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-600">Welcome back, {profile?.name || "Agent"}!</p>
        {/* Profile details would go here */}
      </div>
    </div>
  );
}
