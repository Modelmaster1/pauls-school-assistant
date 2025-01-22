"use client";
import { cva } from "class-variance-authority";
import React, { useEffect, useRef, useState } from "react";
import {
  AccountData,
  CurrentEntryData,
  CurrentSchedule,
  Notice,
} from "./models";
import {
  calculatePeriodDuration,
  getTimeDifferenceInMinutes,
} from "./timeFunctions";
import { LoadingScheduleScreen } from "./loadingScreens";
import { Button } from "~/components/ui/button";
import { MonitorSmartphone } from "lucide-react";
import { createCodeLoginSession } from "~/server/handleCodeLogin";

function calculateMinToPx(min: number) {
  return min * 0.009;
}

export default function Timetable({
  accountData,
  currentSchedule,
}: {
  accountData: AccountData;
  currentSchedule: CurrentSchedule | null;
}) {
  const [loginCode, setLoginCode] = useState<string>("");

  return (
    <main className="min-h-full overflow-hidden p-5">
      <div className="absolute right-8 top-2">
        <Button onClick={
          async() => {
            const code =await createCodeLoginSession(accountData.$id)
            setLoginCode(code)
            alert("Your login code is: " + code + " (This code will be deleted after 5 minutes)")
          }
        } variant="ghost" size="icon"><MonitorSmartphone /></Button>
      </div>
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

      {currentSchedule ? (
        <div className="flex min-h-full w-full justify-start gap-0 overflow-x-auto lg:justify-center">
          {Object.keys(dayModel).map((key, i) => (
            <DayColumn
              key={i}
              day={key}
              schedule={
                currentSchedule[key as keyof typeof currentSchedule] as (
                  | CurrentEntryData
                  | Notice
                )[]
              }
            />
          ))}
        </div>
      ) : (
        <LoadingScheduleScreen />
      )}
    </main>
  );
}

function DayColumn({
  day,
  schedule,
  lang,
}: {
  day: string;
  schedule: (CurrentEntryData | Notice)[];
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
                entriesInSameTimeFrame={
                  schedule.filter((item) => {
                    // Check if item is a CurrentEntryData (not a Notice)
                    if (!("staticData" in item) || !("staticData" in entry))
                      return false;

                    return (
                      entry.staticData.periods[0] ===
                        item.staticData.periods[0] &&
                      item.staticData.subject !== entry.staticData.subject
                    );
                  }) as CurrentEntryData[]
                }
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
  data: CurrentEntryData | Notice;
  nextEntry: CurrentEntryData | Notice | null;
  isFirst: boolean;
}) {
  const isNotice = !("staticData" in data);
  const nextEntryPeriods = nextEntry
    ? "staticData" in nextEntry
      ? nextEntry.staticData.periods
      : nextEntry.periods
    : null;

  const periods = isNotice ? data.periods : data.staticData.periods;

  const shouldBeHidden = isNotice
    ? false
    : entriesInSameTimeFrame.length >= 1 &&
      ((nextEntryPeriods && nextEntryPeriods[0]) ?? null) === periods[0];

  const [calculatedDuration, setCalculatedDuration] = useState<number | null>(
    getTimeDifferenceInMinutes(
      periods[periods.length - 1] ?? null,
      (nextEntryPeriods && nextEntryPeriods[0]) ?? null,
      false,
    ),
  ); // for break

  const [bufferTime, setBufferTime] = useState<number | null>(
    isFirst ? getTimeDifferenceInMinutes(1, periods[0] ?? null, true) : null,
  );

  return (
    <span className="flex flex-col gap-0" style={{ width: "100%" }}>
      {bufferTime && <Break duration={bufferTime} />}
      <Event
        otherEnrties={entriesInSameTimeFrame}
        data={data}
        isHidden={shouldBeHidden}
      />
      {calculatedDuration && <Break duration={calculatedDuration} />}
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
        special: "outline-dashed outline-[#666a6d]/80",
        cancelled: "cancelled",
        likelyCancelled: "likelyCancelled",
      },
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
  isHidden,
}: {
  data: CurrentEntryData | Notice;
  otherEnrties: CurrentEntryData[];
  isHidden?: boolean;
}) {
  const [width, setWidth] = useState<number>(0);
  const itemRef = useRef<HTMLDivElement>(null);

  const isNotice = !("staticData" in data);
  const itemTint = isNotice
    ? null
    : data.dynamicData
      ? "none"
      : data.generalData?.tint;
  const noticeTintType = isNotice ? "special" : data.dynamicData?.type;
  const title = isNotice
    ? data.descr
    : (data.generalData?.name ?? data.staticData.subject.toUpperCase());
  const periods = isNotice ? data.periods : data.staticData.periods;

  const calculatedPeriodDuration = calculatePeriodDuration(periods) ?? 0;
  const dynamicHeight = width * calculateMinToPx(calculatedPeriodDuration);

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
    <div
      className={eventColorStyles({
        tint: itemTint as keyof (
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

        noticeType: noticeTintType as keyof (
          | "none"
          | "cancelled"
          | "likelyCancelled"
          | "special"
          | null
          | undefined
        ),
      })}
      style={{
        height: dynamicHeight,
        width: "100%",
        display: isHidden == true ? "none" : "block",
      }}
      ref={itemRef}
    >
      <div
        className="flex flex-col gap-1 rounded-xl p-1 sm:p-3"
        style={{ height: "100%", backgroundColor: "rgba(31, 31, 31, 0.5)" }}
      >
        <div className="w-full sm:font-semibold">
          {title} ({isNotice ? data.periods.join("-") : data.staticData.teacher}
          )
        </div>
        <div className="">{isNotice ? data.room : data.staticData.room}</div>
        <div>
          {otherEnrties.length >= 1
            ? "+" +
              otherEnrties.length +
              " (" +
              otherEnrties.map((item) => item.staticData.subject).join(", ") +
              ")"
            : null}
        </div>
        <div>
          {isNotice ? "special notice" : (data.dynamicData?.type ?? null)}
        </div>
      </div>
    </div>
  );
}

function Break({ duration }: { duration: number }) {
  const [width, setWidth] = useState<number>(0);
  const itemRef = useRef<HTMLDivElement>(null);

  const dynamicHeight = width * calculateMinToPx(duration);

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
    <div
      className="flex items-center overflow-hidden rounded-xl text-xs font-light text-neutral-400/50 md:text-base"
      style={{ height: dynamicHeight + "px", width: 100 + "%" }}
      ref={itemRef}
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
