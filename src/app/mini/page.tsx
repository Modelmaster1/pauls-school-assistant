"use client"

import { useEffect } from 'react';

const Home: React.FC = () => {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Extract URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const initData = urlParams.get('initData');

      // Decode and parse initData, assuming it's Base64 encoded
      if (initData) {
        try {
          const decodedData = JSON.parse(decodeURIComponent(atob(initData)));
          if (decodedData.user && decodedData.user.id) {
            const telegramId = decodedData.user.id;
            alert(`Telegram ID: ${telegramId}`);
          } else {
            alert('User data not found');
          }
        } catch (error) {
          console.error('Failed to parse user data', error);
          alert('Error processing user data');
        }
      } else {
        alert('No initial data');
      }
    }
  }, []);

  return <div>Welcome to your Telegram Mini App</div>;
};

export default Home;
