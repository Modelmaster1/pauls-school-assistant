"use client";

import { useEffect, useCallback } from "react";
import { TelegramUser } from "./models";

export default function TelegramLoginButton({
  setTelegramUser,
}: {
  setTelegramUser: React.Dispatch<React.SetStateAction<TelegramUser | null>>;
}) {
  const initializeTelegramAuth = useCallback(() => {
    window.onTelegramAuth = (user: TelegramUser) => {
      setTelegramUser(user);
    };

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", "PaulsAISchoolbot");
    script.setAttribute("data-size", "large");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    script.setAttribute("data-request-access", "write");
    document.body.appendChild(script);

    return script;
  }, [setTelegramUser]);

  const handleClick = () => {
    const script = initializeTelegramAuth();
    const cleanup = () => {
      document.body.removeChild(script);
      delete window.onTelegramAuth;
      window.removeEventListener('message', cleanup);
    };
    window.addEventListener('message', cleanup);
  };

  return (
    <button 
      onClick={handleClick}
      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
    >
      Login with Telegram
    </button>
  );
}
