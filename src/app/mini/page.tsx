"use client"
import { useEffect, useState } from "react";
import Timetable from "../clientPage";

const TelegramMiniApp = () => {
    const [telegramData, setTelegramData] = useState<any>(null);

  useEffect(() => {
    // Ensure this runs only in the Telegram WebApp environment
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      const telegram = window.Telegram.WebApp;

      // Initialize the Telegram WebApp
      telegram.ready();

      // Fetch user data
      const user = telegram.initDataUnsafe?.user;

      // If user data is available, display an alert
      if (user) {
        setTelegramData(user)
      } else {
        alert("User information could not be retrieved.");
      }
    }
  }, []);

  return (
    <>
    {telegramData && <Timetable loginCookie={null} telegramID={telegramData.id} />}
    </>
  );
};

export default TelegramMiniApp;