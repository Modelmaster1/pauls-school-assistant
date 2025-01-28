export enum FormType {
  start = 0,
  Year = 1,
  Language = 2,
  Ignore = 3,
  Additional = 4,
  check = 5,

  loginCode,
}

// Add validation functions
export function validateYear(year: string): boolean {
  // Allow format: number + optional letter (e.g., "10c", "11", "Q1")
  const yearPattern = /^(Q[1-2]|[5-9]|1[0-3])[a-zA-Z]?$/;
  return yearPattern.test(year);
}

export function validateLanguage(lang: "en" | "de"): boolean {
  return ["en", "de"].includes(lang);
}

export function createTelegramScript() {
  const script = document.createElement("script");
  script.src = "https://telegram.org/js/telegram-widget.js?22";
  script.async = true;
  script.setAttribute("data-telegram-login", "PaulsAISchoolbot");
  script.setAttribute("data-size", "large");
  script.setAttribute("data-onauth", "onTelegramAuth(user)");
  script.setAttribute("data-request-access", "write");
  script.setAttribute("data-auth-url", window.location.href);

  const container = document.getElementById("telegram-login-widget");
  if (container) {
    container.innerHTML = ""; // Clear any existing content
    container.appendChild(script);
  }
}

// Clear localStorage when form is completed
export const clearFormStorage = () => {
  localStorage.removeItem("formYear");
  localStorage.removeItem("formLang");
  localStorage.removeItem("formIgnore");
  localStorage.removeItem("formAdditional");
};
