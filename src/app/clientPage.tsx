"use client";
import Timetable from "./timetable";
import { Collection, getDocument } from "~/server/appwriteFunctions";
import { AccountData, CurrentSchedule, TelegramUser } from "./models";
import { useEffect, useRef, useState } from "react";
import { fetchAccountData } from "~/server/getUser";
import { Form } from "./_form/form";
import { createCurrentSchedule } from "~/server/getSchedule";
import { LoadingScreen } from "./loadingScreens";
import { useSearchParams } from "next/navigation";

export default function HomePage({
  loginCookie,
}: {
  loginCookie: string | null;
}) {
  const searchParams = useSearchParams()
  const isEdit = searchParams.get("edit") === "true";

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

      console.log(isEdit)

      start(user?.id ?? null);
    }
  }, []);

  useEffect(() => {
    if (!accountData) {
      return;
    }

    setLoading(true);

    (async () => {
      setCurrentSchedule(await createCurrentSchedule(accountData, isEdit));
      setLoading(false);
    })();
  }, [accountData]);

  async function start(telegramID: number | null) {
    try {
      if (telegramID) {
        const account = await fetchAccountData(telegramID);
        if (account) {
          setAccountData(account);
          setCurrentSchedule(await createCurrentSchedule(account, isEdit));
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
      setCurrentSchedule(await createCurrentSchedule(user, isEdit));
      setLoading(false);
    } catch (error) {
      console.error("Fetch error:", error);
      // Add user-friendly error handling here
    }
  }

  return loading ? (
    <LoadingScreen/>
  ) : accountData ? (
    <Timetable accountData={accountData} currentSchedule={currentSchedule} setAccountData={setAccountData} setCurrentSchedule={isEdit ? setCurrentSchedule : null} />
  ) : (
    <Form telegramUser={telegramUser} setTelegramUser={setTelegramUser} setAccountData={setAccountData} />
  );
}
