"use client"
import { useEffect, useState } from 'react';

export default function SubscriptionStatus() {
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    async function fetchSubscriptionStatus() {
      const response = await fetch('/api/subscription-status');
      const data = await response.json();
      setIsSubscribed(data.isSubscribed);
    }

    fetchSubscriptionStatus();
  }, []);

  return (
    <div>
      {isSubscribed ? (
        <p>You are subscribed!</p>
      ) : (
        <p>You are not subscribed.</p>
      )}
    </div>
  );
}
