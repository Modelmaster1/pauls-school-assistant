'use client';

import { useEffect, useState } from 'react';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

declare global {
  interface Window {
    onTelegramAuth?: (user: TelegramUser) => void;
  }
}

export default function TelegramLoginPage() {
  const [userData, setUserData] = useState<TelegramUser | null>(null);

  useEffect(() => {
    // Define the callback function that Telegram will call
    window.onTelegramAuth = (user: TelegramUser) => {
      setUserData(user);
    };

    // Create and inject the Telegram script
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', 'PaulsAISchoolbot');
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    document.body.appendChild(script);

    // Cleanup function
    return () => {
      document.body.removeChild(script);
      delete window.onTelegramAuth;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold">Telegram Login</h1>
        
        {/* Container for the Telegram login widget */}
        <div id="telegram-login-widget" className="my-4"></div>

        {/* Display user data after successful login */}
        {userData && (
          <div className="bg-card rounded-lg p-6 shadow-lg space-y-4">
            <h2 className="text-2xl font-semibold">User Information</h2>
            <div className="space-y-2">
              <p><strong>ID:</strong> {userData.id}</p>
              <p><strong>First Name:</strong> {userData.first_name}</p>
              {userData.last_name && (
                <p><strong>Last Name:</strong> {userData.last_name}</p>
              )}
              {userData.username && (
                <p><strong>Username:</strong> @{userData.username}</p>
              )}
              {userData.photo_url && (
                <div>
                  <p><strong>Profile Photo:</strong></p>
                  <img 
                    src={userData.photo_url} 
                    alt="Profile" 
                    className="w-20 h-20 rounded-full"
                  />
                </div>
              )}
              <p><strong>Auth Date:</strong> {new Date(userData.auth_date * 1000).toLocaleString()}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}