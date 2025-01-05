import { useEffect } from "react";

const TelegramMiniApp = () => {
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
        const { first_name: firstName = "User", id } = user;
        alert(`Hello, ${firstName}! Your Telegram ID is ${id}.`);
      } else {
        alert("User information could not be retrieved.");
      }
    }
  }, []);

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>Welcome to Telegram Mini App</h1>
      <p>This app fetches your Telegram ID and name.</p>
    </div>
  );
};

export default TelegramMiniApp;