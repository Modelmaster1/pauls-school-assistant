"use client";
import Timetable from "./timetable";
import { Collection, getDocument } from "~/server/appwriteFunctions";
import { AccountData, CurrentSchedule } from "./models";
import { useEffect, useRef, useState } from "react";
import { fetchAccountData } from "~/server/getUser";
import { Form } from "./forms/form";
import { createCurrentSchedule } from "~/server/getSchedule";

export default function HomePage({
  loginCookie,
}: {
  loginCookie: string | null;
}) {
  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const [telegramUser, setTelegramUser] = useState<any>(null);
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
    loadingScreen()
  ) : accountData ? (
    <Timetable accountData={accountData} currentSchedule={currentSchedule} />
  ) : (
    <Form telegramUser={telegramUser} setAccountData={setAccountData} />
  );
}

function loadingScreen() {
  return (
    <main className="min-h-full animate-pulse overflow-hidden p-5">
      <div className="mb-5 flex w-full flex-col items-center gap-4">
        <div className="h-[36px] min-w-[280px] rounded-xl bg-neutral-800"></div>
        <div className="h-[12px] min-w-[280px] rounded-lg bg-neutral-800"></div>
      </div>

      <div className="flex min-h-full w-full justify-start gap-0 overflow-x-auto lg:justify-center">
        <DayLoading />
        <DayLoading />
        <DayLoading />
        <DayLoading />
        <DayLoading />
      </div>
    </main>
  );
}

function DayLoading() {
  return (
    <div
      className="h-full w-full"
      style={{ minWidth: "100px", maxWidth: "200px" }}
    >
      <div className="flex w-full flex-col gap-0 rounded-2xl p-2 md:px-4 md:py-2">
        <div className="mb-4 flex w-full justify-center text-xs md:text-base">
          <div className="h-[12px] min-w-[100px] rounded-lg bg-neutral-800"></div>
        </div>

        <div className="flex flex-col gap-16">
          {[1, 2, 3].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-1 rounded-xl bg-neutral-800"
              style={{ aspectRatio: "1 / 0.8" }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}
