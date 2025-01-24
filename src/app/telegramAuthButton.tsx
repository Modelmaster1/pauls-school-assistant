"use client";

import { useEffect } from "react";
import { TelegramUser } from "./models";

export default function TelegramLoginButton({
  setTelegramUser,
}: {
  setTelegramUser: React.Dispatch<React.SetStateAction<TelegramUser | null>>;
}) {
  useEffect(() => {
    // Define the callback function that Telegram will call
    window.onTelegramAuth = (user: TelegramUser) => {
      setTelegramUser(user);
    };

    // Create and inject the Telegram script
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", "PaulsAISchoolbot");
    script.setAttribute("data-size", "large");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    script.setAttribute("data-request-access", "write");
    document.body.appendChild(script);

    // Cleanup function
    return () => {
      document.body.removeChild(script);
      delete window.onTelegramAuth;
    };
  }, []);

  return (
    <script
      src="https://telegram.org/js/telegram-widget.js?22"
      async
      data-telegram-login="PaulsAISchoolbot"
      data-size="large"
      data-onauth="onTelegramAuth(user)"
      data-request-access="write"
    ></script>
  );
}
