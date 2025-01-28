"use client";
import Timetable from "./timetable";
import { Collection, getDocument } from "~/server/appwriteFunctions";
import { AccountData, CurrentSchedule, TelegramUser } from "./models";
import { useEffect, useRef, useState } from "react";
import { fetchAccountData } from "~/server/getUser";
import { Form } from "./_form/form";
import { createCurrentSchedule } from "~/server/getSchedule";
import { LoadingScreen } from "./loadingScreens";

// Add type declaration for Telegram WebApp
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        initDataUnsafe?: {
          user?: TelegramUser;
        };
      };
    };
    onTelegramAuth?: (user: TelegramUser) => void;
  }
}

export default function HomePage({
  loginCookie,
}: {
  loginCookie: string | null;
}) {
  const [accountData, setAccountData] = useState<AccountData | null>(null);
  // Define proper type for telegramUser
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentSchedule, setCurrentSchedule] =
    useState<CurrentSchedule | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      const telegram = window.Telegram.WebApp;
      telegram.ready();

      const user = telegram.initDataUnsafe?.user;
      setTelegramUser(user ?? null);

      start(user?.id ?? null);
    }
  }, []);

  useEffect(() => {
    if (!accountData) {
      return;
    }

    setLoading(true);
    // Fix: Immediately invoke the async function
    (async () => {
      setCurrentSchedule(await createCurrentSchedule(accountData));
      setLoading(false);
    })();
  }, [accountData]);

  async function start(telegramID: number | null) {
    try {
      if (telegramID) {
        const account = await fetchAccountData(telegramID);
        if (account) {
          setAccountData(account);
          setCurrentSchedule(await createCurrentSchedule(account));
        }
        setLoading(false);
        return;
      }

      if (!loginCookie) {
        setLoading(false);
        return;
      }

      const sessionData = await getDocument(loginCookie, Collection.session);
      if (!sessionData) {
        setLoading(false);
        return;
      }
      const user: AccountData = sessionData.accounts;
      setAccountData(user);
      setCurrentSchedule(await createCurrentSchedule(user));
      setLoading(false);
    } catch (error) {
      console.error("Fetch error:", error);
      // Add user-friendly error handling here
    }
  }

  return loading ? (
    <LoadingScreen/>
  ) : accountData ? (
    <Timetable accountData={accountData} currentSchedule={currentSchedule} setAccountData={setAccountData} />
  ) : (
    <Form telegramUser={telegramUser} setTelegramUser={setTelegramUser} setAccountData={setAccountData} />
  );
}
