"use client"
import { useEffect } from 'react';

const TelegramLoginButton = () => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://telegram.org/js/telegram-widget.js";
    script.setAttribute('data-telegram-login', 'PaulsAISchoolbot'); // Replace with your bot's username
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-auth-url', '/api/auth/telegram');
    script.setAttribute('data-request-access', 'write'); // Optional
    script.async = true;
    document.getElementById('telegram-login')?.appendChild(script);
  }, []);

  return <div id="telegram-login"></div>;
};

export default TelegramLoginButton;
