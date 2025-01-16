"use client";
import { cva } from "class-variance-authority";
import React, { CSSProperties, useEffect, useRef, useState } from "react";
import { createCurrentSchedule } from "~/server/getSchedule";
import {
  AccountData,
  CurrentEntryData,
  CurrentSchedule,
  FullSchedule,
  ScheduleEntry,
  SubjectInfo,
} from "./models";
import { getTimeDifferenceInMinutes } from "./timeFunctions";
import {
  Collection,
  getDocument,
  listDocuments,
} from "~/server/appwriteFunctions";
import { Query } from "appwrite";

export default function Timetable({
  loginCookie,
  telegramID = null,
}: {
  loginCookie: string | null;
  telegramID?: number | null;
}) {
  const [accountData, setAccountData] = useState<AccountData | null>(null);

  const [currentSchedule, setCurrentSchedule] =
    useState<CurrentSchedule | null>(null);

  useEffect(() => {
    start();
  }, []);

  async function start() {
    if (telegramID) {
      console.log("running");

      const stuff = await listDocuments(
        [Query.equal("telegramID", telegramID)],
        Collection.account,
      );

      if (stuff.documents.length === 0) {
        console.log("no user found");
        return;
      }

      const user = stuff.documents[0]; // pick the first user with that telegramID
      if (user) {
        setAccountData(user);
        setCurrentSchedule(await createCurrentSchedule(user));
      }
      return;
    }

    if (!loginCookie) {
      console.log("You are not logged in");
      return;
    }

    const sessionData = await getDocument(loginCookie, Collection.session);
    const user: AccountData = sessionData.accounts;

    setAccountData(user);
    setCurrentSchedule(await createCurrentSchedule(user));
  }

  return (
    <main className="min-h-full overflow-hidden p-5">
      <div className="mb-5 flex w-full flex-col items-center">
        <div className="text-2xl font-bold">
          {accountData?.year ?? "loading"}{" "}
          {accountData?.lang === "de" ? "Stundenplan" : "Timetable"}
        </div>
        <div className="text-sm">
          {currentSchedule &&
            `${currentSchedule.dates.mon.getDate()}.${(currentSchedule.dates.mon.getMonth() + 1 < 10 ? "0" : "") + (currentSchedule.dates.mon.getMonth() + 1)}.${currentSchedule.dates.mon.getFullYear()} - ${currentSchedule.dates.fri.getDate()}.${(currentSchedule.dates.fri.getMonth() + 1 < 10 ? "0" : "") + (currentSchedule.dates.fri.getMonth() + 1)}.${currentSchedule.dates.fri.getFullYear()} (${currentSchedule.weekkType.toUpperCase()})`}
        </div>
      </div>

      <div className="flex min-h-full w-full justify-start gap-0 overflow-x-auto lg:justify-center">
        {currentSchedule &&
          Object.keys(dayModel).map((key, i) => (
            <DayColumn
              key={i}
              day={key}
              schedule={
                currentSchedule[
                  key as keyof typeof currentSchedule
                ] as CurrentEntryData[]
              }
            />
          ))}
      </div>
    </main>
  );
}

function DayColumn({
  day,
  schedule,
  lang,
}: {
  day: string;
  schedule: CurrentEntryData[];
  lang?: string;
}) {
  const [dayName, setDayName] = useState<string>(
    lang === "en"
      ? dayModel[day as keyof typeof dayModel].en
      : dayModel[day as keyof typeof dayModel].de,
  );
  return (
    <div
      className="h-full w-full"
      style={{ minWidth: "100px", maxWidth: "200px" }}
    >
      <div className="flex w-full flex-col gap-0 rounded-2xl p-2 md:px-4 md:py-2">
        <div className="mb-4 flex w-full justify-center text-xs md:text-base">
          {dayName}
        </div>

        {Array.isArray(schedule) &&
          schedule.map((entry, i) => (
            <React.Fragment key={i}>
              <FullEntry
                data={entry}
                isFirst={i === 0}
                entriesInSameTimeFrame={schedule.filter(
                  (item) =>
                    entry.staticData.periods[0] ===
                      item.staticData.periods[0] &&
                    item.staticData.subject !== entry.staticData.subject,
                )}
                nextEntry={schedule[i + 1] ?? null}
              />
            </React.Fragment>
          ))}
      </div>
    </div>
  );
}

export function FullEntry({
  data,
  entriesInSameTimeFrame,
  nextEntry,
  isFirst,
}: {
  entriesInSameTimeFrame: CurrentEntryData[];
  data: CurrentEntryData;
  nextEntry: CurrentEntryData | null;
  isFirst: boolean;
}) {
  const itemRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number>(0);

  const shouldBeHidden =
    entriesInSameTimeFrame.length >= 1 &&
    nextEntry?.staticData.periods[0] === data.staticData.periods[0];
  const [calculatedDuration, setCalculatedDuration] = useState<number | null>(
    getTimeDifferenceInMinutes(
      data.staticData.periods[data.staticData.periods.length - 1] ?? null,
      nextEntry?.staticData.periods[0] ?? null,
      false,
    ),
  ); // for break

  const [bufferTime, setBufferTime] = useState<number | null>(
    isFirst
      ? getTimeDifferenceInMinutes(1, data.staticData.periods[0] ?? null, true)
      : null,
  );

  const totalLength =
    (shouldBeHidden ? 0 : data.staticData.periods.length * 45) +
    (calculatedDuration ? calculatedDuration : 0) +
    (bufferTime ? bufferTime : 0);

  const dynamicHeight: number = width * (0.009 * totalLength);

  useEffect(() => {

    const element = itemRef.current;

    if (!element) return;

    const updateWidth = () => {
      setWidth(element.offsetWidth);
    };

    const resizeObserver = new ResizeObserver(() => {
      updateWidth();
    });

    // Observe the element
    resizeObserver.observe(element);

    // Set the initial width
    updateWidth();

    return () => {
      // Cleanup observer
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <span
      className="flex flex-col gap-0"
      style={{ height: dynamicHeight, width: "100%" }}
      ref={itemRef}
    >
      {bufferTime && <Break totalLength={totalLength} duration={bufferTime} />}
      <Event
        otherEnrties={entriesInSameTimeFrame}
        totalLength={totalLength}
        data={data}
        isHidden={shouldBeHidden}
      />
      {calculatedDuration && (
        <Break totalLength={totalLength} duration={calculatedDuration} />
      )}
    </span>
  );
}

export const eventColorStyles = cva(
  "rounded-xl text-xs md:text-base outline overflow-hidden outline-1",
  {
    variants: {
      tint: {
        none: "",
        default:
          "bg-[#f8f8f9] dark:bg-[#282828] text-[#666a6d] dark:text-[#b0b2b4] dark:outline-[#b0b2b4]/50",
        red: "bg-red-800/25 text-red-300 outline-red-300",
        orange: "bg-orange-800/25 text-orange-400 dark:text-orange-300",
        blue: "bg-blue-100 dark:bg-cyan-800/30 text-blue-500 dark:text-blue-300",
        green: "bg-green-800/30 text-green-500",
        pink: "bg-pink-900/30 text-pink-400",
        purple:
          "bg-purple-100 dark:bg-purple-800/20 text-purple-500 dark:text-purple-300",
        yellow:
          "bg-yellow-100 dark:bg-yellow-800/30 text-yellow-500 dark:text-yellow-300",
        gray: "text-gray-300/80 bg-gray-500/30",
        white: "bg-neutral-700 text-neutral-300",
        clear:
          "bg-transparent text-neutral-400/70 outline outline-neutral-500/10",
      },
      noticeType: {
        none: "",
        cancelled: "cancelled",
        likelyCancelled: "likelyCancelled",
      }
    },
    defaultVariants: {
      tint: "default",
      noticeType: "none",
    },
  },
);

const dayModel = {
  mon: {
    en: "Monday",
    de: "Montag",
  },
  tue: {
    en: "Tuesday",
    de: "Dienstag",
  },
  wed: {
    en: "Wednesday",
    de: "Mittwoch",
  },
  thu: {
    en: "Thursday",
    de: "Donnerstag",
  },
  fri: {
    en: "Friday",
    de: "Freitag",
  },
};

function Event({
  otherEnrties,
  data,
  totalLength,
  isHidden,
}: {
  data: CurrentEntryData;
  otherEnrties: CurrentEntryData[];
  totalLength: number;
  isHidden?: boolean;
}) {
  const calculatedHeight =
    ((data.staticData.periods.length * 45) / totalLength) * 100 + "%";

  return (
    <div
      className={eventColorStyles({
        tint: data.dynamicData ? "none" : data.generalData?.tint as keyof (
          | "almostTransparent"
          | "white"
          | "default"
          | "red"
          | "orange"
          | "blue"
          | "green"
          | "purple"
          | "yellow"
          | "light"
          | "clear"
          | null
          | undefined
        ),

        noticeType: data.dynamicData?.type as keyof (
          | "none"
          | "cancelled"
          | "likelyCancelled"
          | null
          | undefined
        ),
      })}
      style={{
        height: calculatedHeight,
        width: "100%",
        display: isHidden == true ? "none" : "block",
      }}
    >
      <div
        className="flex flex-col gap-1 rounded-xl p-1 sm:p-3"
        style={{ height: "100%", backgroundColor: "rgba(31, 31, 31, 0.5)" }}
      >
        <div className="sm:font-semibold">
          {data.generalData?.name ?? data.staticData.subject.toUpperCase()} (
          {data.staticData.teacher})
        </div>
        <div className="">{data.staticData.room}</div>
        <div>
          {otherEnrties.length >= 1
            ? "+" +
              otherEnrties.length +
              " (" +
              otherEnrties.map((item) => item.staticData.subject).join(", ") +
              ")"
            : null}
        </div>
        <div>{data.dynamicData?.type ?? null}</div>
      </div>
    </div>
  );
}

function Break({
  duration,
  totalLength,
}: {
  duration: number;
  totalLength: number;
}) {
  return (
    <div
      className="flex items-center overflow-hidden rounded-xl text-xs font-light text-neutral-400/50 md:text-base"
      style={{ height: (duration / totalLength) * 100 + "%", width: 100 + "%" }}
    >
      <div
        className="flex flex-col gap-1 rounded-xl p-1 sm:p-3"
        style={{
          height: "100%",
          backgroundColor: "transparent",
          justifyContent: "center",
        }}
      >
        <div className="font-light md:text-sm md:font-normal lg:text-base lg:font-semibold">
          {duration}min
        </div>
      </div>
    </div>
  );
}
