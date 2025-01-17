"use server";
import {
  AccountData,
  CurrentEntryData,
  CurrentSchedule,
  FullSchedule,
  Notice,
  ScheduleEntry,
  SubjectInfo,
  WeeklySchedule,
} from "~/app/models";
import { Collection, listDocuments } from "./appwriteFunctions";
import { Query } from "appwrite";
import getWeekDates from "~/app/timeFunctions";

async function getSchedule(affectedClass: string, weekType: "a" | "b") {
  const result = await listDocuments(
    [
      Query.equal("affectedClass", affectedClass),
      Query.equal("type", weekType),
    ],
    Collection.weeklySchedule,
  );

  const schedule: WeeklySchedule = result.documents[0];
  return schedule;
}

export async function getSubjectInfo() {
  const result = await listDocuments(undefined, Collection.subjectInfo);

  const data: SubjectInfo[] = result.documents;
  return data;
}

function isWithinFiveDaysOfFriday(date: Date, friday: Date): boolean {
  // Check if the date is a weekday (Monday to Friday)
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false; // Not a weekday
  }

  if (date > friday) {
    return false;
  }

  // Calculate the difference in days between the given date and the Friday
  const timeDifference = Math.abs(date.getTime() - friday.getTime());
  const daysDifference = timeDifference / (1000 * 60 * 60 * 24);

  // Check if the difference is within 5 days
  return daysDifference <= 5;
}

async function getAdditionalSubjects(additional: string[]) {
  const result = await listDocuments(
    [Query.contains("subject", additional)],
    Collection.scheduleEntry,
  );

  const data: ScheduleEntry[] = result.documents;

  return data;
}

async function getNotices(affectedClass: string, friday: Date) {
  const result = await listDocuments(
    [Query.equal("affectedClass", affectedClass)],
    Collection.notices,
  );

  const notices: Notice[] = result.documents.map((notice) => ({
    ...notice,
    date: new Date(notice.date),
    $createdAt: new Date(notice.$createdAt),
  }));

  return notices.filter((notice) =>
    isWithinFiveDaysOfFriday(notice.date, friday),
  ).sort((a, b) => b.$createdAt.getTime() - a.$createdAt.getTime());
}

function convertEntryToCurrentEntry(
  entry: ScheduleEntry,
  subjectInfo: SubjectInfo | null,
  notice: Notice | null,
  lang: "en" | "de",
): CurrentEntryData {

  const result: CurrentEntryData = {
    staticData: entry,
    generalData: subjectInfo
      ? {
          name: lang === "en" ? subjectInfo.name : subjectInfo.nameDe,
          tint: subjectInfo.tint,
        }
      : null,
    dynamicData: notice,
  };

  return result;
}

function convertScheduleArray(
  schedule: ScheduleEntry[],
  notices: Notice[],
  subjectInfoBase: SubjectInfo[],
  weekday: { s: "mon" | "tue" | "wed" | "thu" | "fri"; n: number },
  user: AccountData,
  additionalSubjects: ScheduleEntry[],
) {
  var result: CurrentEntryData[] = [];

  const activeAdditionalSubjects = additionalSubjects.filter(
    (subject) => subject.weekDay == weekday.s && !user.ignore.includes(subject.subject),
  );

  const sortedSchedule = [...schedule, ...activeAdditionalSubjects].sort(
    (a, b) => (a.periods[0] ?? 0) - (b.periods[0] ?? 0),
  );

  sortedSchedule.forEach((entry: ScheduleEntry) => {
    if (!user.ignore.includes(entry.subject)) {
      const subjectInfo =
        subjectInfoBase.find(
          (info: SubjectInfo) => info.abbreviation === entry.subject,
        ) ?? null;

      const notice =
        notices.find(
          (notice: Notice) =>
            notice.subject === entry.subject &&
            JSON.stringify(notice.periods) === JSON.stringify(entry.periods) &&
            notice.date.getDay() == weekday.n,
        ) ?? null;
      const currentEntry = convertEntryToCurrentEntry(
        entry,
        subjectInfo,
        notice,
        user.lang,
      );
      result.push(currentEntry);
    }
  });

  return result;
}

const weekDayModel: weekDayModel = {
  mon: { s: "mon", n: 1 },
  tue: { s: "tue", n: 2 },
  wed: { s: "wed", n: 3 },
  thu: { s: "thu", n: 4 },
  fri: { s: "fri", n: 5 },
};

interface weekDayModel {
  mon: weekDayInfo;
  tue: weekDayInfo;
  wed: weekDayInfo;
  thu: weekDayInfo;
  fri: weekDayInfo;
}

interface weekDayInfo {
  s: "mon" | "tue" | "wed" | "thu" | "fri";
  n: number;
}

export async function createCurrentSchedule(user: AccountData) {
  const affectedClass = user.year;
  const dateModel = getWeekDates();
  const subjectInfo = await getSubjectInfo();

  const additionalSubjects =
    user.additional.length > 0
      ? await getAdditionalSubjects(user.additional)
      : [];

  const notices = await getNotices(affectedClass, dateModel.fri);

  const weekType = notices[0]?.weekType ?? "b";

  const staticSchedule = await getSchedule(affectedClass, weekType);

  const result: CurrentSchedule = {
    weekkType: weekType,
    dates: dateModel,

    mon: convertScheduleArray(
      staticSchedule.mon,
      notices,
      subjectInfo,
      weekDayModel.mon,
      user,
      additionalSubjects,
    ),
    tue: convertScheduleArray(
      staticSchedule.tue,
      notices,
      subjectInfo,
      weekDayModel.tue,
      user,
      additionalSubjects,
    ),
    wed: convertScheduleArray(
      staticSchedule.wed,
      notices,
      subjectInfo,
      weekDayModel.wed,
      user,
      additionalSubjects,
    ),
    thu: convertScheduleArray(
      staticSchedule.thu,
      notices,
      subjectInfo,
      weekDayModel.thu,
      user,
      additionalSubjects,
    ),
    fri: convertScheduleArray(
      staticSchedule.fri,
      notices,
      subjectInfo,
      weekDayModel.fri,
      user,
      additionalSubjects,
    ),
  };

  return result;
}