"use client";
import Timetable from "./timetable";
import {
  Collection,
  getDocument,
} from "~/server/appwriteFunctions";
import { AccountData } from "./models";
import { useEffect, useState } from "react";
import { fetchAccountData } from "~/server/getUser";
import { Form } from "./forms/form";

export default function HomePage({
  loginCookie,
}: {
  loginCookie: string | null;
}) {
  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const [telegramUser, setTelegramUser] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      const telegram = window.Telegram.WebApp;
      telegram.ready();

      const user = telegram.initDataUnsafe?.user;
      setTelegramUser(user ?? null);

      start(user?.id ?? null);
    }
  }, []);

  async function start(telegramID: number | null) {
    try {
      if (telegramID) {
        const account = await fetchAccountData(telegramID);
        if (account) {
          setAccountData(account);
        }
        return;
      }
  
      const sessionData = await getDocument(loginCookie, Collection.session);
      const user: AccountData = sessionData.accounts;
      setAccountData(user);
    } catch (error) {
      console.error('Fetch error:', error);
      // Add user-friendly error handling here
    }
  }
  

  return accountData ? <Timetable accountData={accountData} /> : <Form telegramUser={telegramUser} setAccountData={setAccountData} />;
}
