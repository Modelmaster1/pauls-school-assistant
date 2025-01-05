"use client";
import { cva } from "class-variance-authority";
import { useEffect, useState } from "react";
import { getSchedule } from "~/server/getSchedule";
import { FullSchedule, ScheduleEntry } from "./models";
import { SubjectInfo, subjectInfoBase } from "./subjectData";
import getWeekDates from "./timeFunctions";
import { getDocument } from "~/server/appwriteFunctions";

function getBreakData(
  lastPeriod: number | undefined,
  day: string,
  isLast: boolean,
) {
  if (isLast || !lastPeriod) {
    return null;
  }

  switch (lastPeriod) {
    case 1:
      return null;
    case 3:
      return null;
    case 5:
      if (day === "wed") {
        return 45;
      } else {
        return null;
      }
    case 6:
      return 45;
    default:
      return 30;
  }
}

export default function Timetable({loginCookie}: {loginCookie: string | null}) {
  const [dateModel, setDateModel] = useState<{
    monday: Date;
    friday: Date;
  } | null>(null);

  const [staticSchedule, setStaticSchedule] = useState<FullSchedule | null>(
    null,
  );

  const [accountData, setAccountData] = useState<any | null>(null);

  useEffect(() => {
    start()
  }, []);

  async function start() {
    if (!loginCookie) {
      console.log("You are not logged in");
      return;
    }

    const dateModel = getWeekDates();
    setDateModel(dateModel);

    const sessionData = await getDocument(loginCookie);
    const user = sessionData.accounts;

    setAccountData(user);

    getSchedule(user.year).then((data) => {
      setStaticSchedule(data);
    });
  }

  return (
    <main className="min-h-full overflow-hidden p-5">
      <div className="mb-5 flex w-full flex-col items-center">
        <div className="text-2xl font-bold">{accountData?.year ?? "loading"} Timetable</div>
        <div className="text-sm">
          {dateModel &&
            `${dateModel.monday.getDate()}.${(dateModel.monday.getMonth() + 1 < 10 ? "0" : "") + (dateModel.monday.getMonth() + 1)}.${dateModel.monday.getFullYear()} - ${dateModel.friday.getDate()}.${(dateModel.friday.getMonth() + 1 < 10 ? "0" : "") + (dateModel.friday.getMonth() + 1)}.${dateModel.friday.getFullYear()} (A)`}
        </div>
      </div>

      <div className="flex min-h-full w-full justify-start gap-0 overflow-x-auto lg:justify-center">
        {staticSchedule &&
          Object.keys(staticSchedule.b).map((key, i) => (
            <DayColumn key={i} day={key} schedule={staticSchedule.b[key as keyof typeof staticSchedule.b]} />
          ))}
      </div>
    </main>
  );
}

function DayColumn({
  day,
  schedule,
}: {
  day: string;
  schedule: ScheduleEntry[];
}) {
  const [dayName, setDayName] = useState<string>(dayModel[day as keyof typeof dayModel]);
  return (
    <div
      className="h-full w-full"
      style={{ minWidth: "100px", maxWidth: "230px" }}
    >
      <div className="flex w-full flex-col gap-0 rounded-2xl p-2 md:px-4 md:py-2">
        <div className="mb-4 flex w-full justify-center text-xs md:text-base">
          {dayName}
        </div>

        {schedule.map((entry, i) => (
          <FullEntry
            key={i}
            data={entry}
            index={i}
            day={day}
            isLast={i === schedule.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

export function FullEntry({
  data,
  index,
  day,
  isLast,
}: {
  data: ScheduleEntry;
  index: number;
  day: string;
  isLast: boolean;
}) {
  const [calculatedDuration, setCalculatedDuration] = useState<number | null>(
    getBreakData(data.periods[data.periods.length - 1], day, isLast),
  ); // for break

  const totalLength =
    data.periods.length * 45 + (calculatedDuration ? calculatedDuration : 0);

  const durationRatio: string = "1.25 / " + ((1 / 3) * totalLength) / 30;

  return (
    <span
      className="flex flex-col gap-0"
      style={{ aspectRatio: durationRatio, width: "100%" }}
    >
      <Event totalLength={totalLength} data={data} />
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
        almostTransparent: "bg-neutral-500/10 outline-neutral-500/50",
        default:
          "bg-[#f8f8f9] dark:bg-[#282828] text-[#666a6d] dark:text-[#b0b2b4] dark:outline-[#b0b2b4]/50",
        red: "bg-red-800/20 text-red-400 outline-red-400/50",
        orange: "bg-orange-800/25 text-orange-400 dark:text-orange-300",
        blue: "bg-blue-100 dark:bg-cyan-800/30 text-blue-500 dark:text-blue-300",
        green: "bg-green-800/30 text-green-500",
        purple:
          "bg-purple-100 dark:bg-purple-800/20 text-purple-500 dark:text-purple-300",
        yellow:
          "bg-yellow-100 dark:bg-yellow-800/30 text-yellow-500 dark:text-yellow-300",
        light: "text-gray-300/80 bg-gray-500/30",
        clear:
          "bg-transparent text-neutral-400/70 outline outline-neutral-500/10",
      },
    },
    defaultVariants: {
      tint: "default",
    },
  },
);

const dayModel = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
};

function Event({
  data,
  totalLength,
}: {
  data: ScheduleEntry;
  totalLength: number;
}) {
  const [info, setInfo] = useState<SubjectInfo>(
    subjectInfoBase[data.subject] ?? { name: data.subject, tint: "default" },
  );
  const durationRatio: string = "1.25 / " + 0.5 * data.periods.length;
  return (
    <div
      className={eventColorStyles({
        tint: info.tint as keyof ("almostTransparent" | "default" | "red" | "orange" | "blue" | "green" | "purple" | "yellow" | "light" | "clear" | null | undefined),
      })}
      style={{
        height: ((data.periods.length * 45) / totalLength) * 100 + "%",
        width: "100%",
      }}
    >
      <div
        className="flex flex-col gap-1 rounded-xl p-1 sm:p-3"
        style={{ height: "100%", backgroundColor: "rgba(31, 31, 31, 0.5)" }}
      >
        <div className="sm:font-semibold">{info.name} (jdl)</div>
        <div>B2.06</div>
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
  const durationRatio: string = "1.25 / " + ((1 / 3) * duration) / 30; // -16 is to offset the gap between the events
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
