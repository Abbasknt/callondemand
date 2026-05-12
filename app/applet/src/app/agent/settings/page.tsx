"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState("English");
  const [privacy, setPrivacy] = useState("Public");
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      alert("Settings saved successfully!");
    }, 800);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center mb-6">
        <a href="/agent" className="text-blue-600 hover:underline mr-4">
          &larr; Back to Profile
        </a>
        <h1 className="text-2xl font-bold">User Settings</h1>
      </div>

      <div className="bg-white shadow rounded-lg p-6 space-y-6">
        
        {/* Notifications */}
        <div>
          <h2 className="text-lg font-semibold border-b pb-2 mb-4">Notifications</h2>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input 
              type="checkbox" 
              checked={notifications} 
              onChange={(e) => setNotifications(e.target.checked)} 
              className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="text-gray-700">Receive email notifications</span>
          </label>
        </div>

        {/* Language */}
        <div>
          <h2 className="text-lg font-semibold border-b pb-2 mb-4">Language</h2>
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full max-w-xs p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="English">English</option>
            <option value="Spanish">Spanish</option>
            <option value="French">French</option>
            <option value="German">German</option>
          </select>
        </div>

        {/* Privacy */}
        <div>
          <h2 className="text-lg font-semibold border-b pb-2 mb-4">Privacy</h2>
          <div className="space-y-2">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input 
                type="radio" 
                name="privacy" 
                value="Public" 
                checked={privacy === "Public"} 
                onChange={(e) => setPrivacy(e.target.value)} 
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700">Public (Visible to everyone)</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input 
                type="radio" 
                name="privacy" 
                value="Private" 
                checked={privacy === "Private"} 
                onChange={(e) => setPrivacy(e.target.value)} 
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700">Private (Only visible to me)</span>
            </label>
          </div>
        </div>

        <div className="pt-6 border-t">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>

      </div>
    </div>
  );
}
