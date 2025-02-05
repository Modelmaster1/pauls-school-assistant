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
      Query.contains("weekType", [weekType, "both"]),
    ],
    Collection.scheduleEntry,
  );

  const scheduleItems = result.documents; // all the items in the schedule

  const schedule: WeeklySchedule = {
    mon: scheduleItems.filter((item) => item.weekDay === 1),
    tue: scheduleItems.filter((item) => item.weekDay === 2),
    wed: scheduleItems.filter((item) => item.weekDay === 3),
    thu: scheduleItems.filter((item) => item.weekDay === 4),
    fri: scheduleItems.filter((item) => item.weekDay === 5),
    sat: scheduleItems.filter((item) => item.weekDay === 6),
    sun: scheduleItems.filter((item) => item.weekDay === 0),
  }
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

const localizedNoticeType: { [key: string]: {en: string, de: string} } = {
  newRoom: {en: "different room", de: "anderer Raum"},
  cancelled: {en: "cancelled", de: "fällt aus"},
  likelyCancelled: {en: "likely cancelled", de: "fällt wahrscheinlich aus"},
  diffSubject: {en: "different subject", de: "anderes Fach"},
  unknown: {en: "special", de: "besonders"},
  newTeacher: {en: "different teacher", de: "anderer Lehrer"},
}

async function getNotices(affectedClass: string, friday: Date, ignore: string[], lang: "en" | "de") {
  const result = await listDocuments(
    [Query.equal("affectedClass", affectedClass), Query.orderDesc("$createdAt")],
    Collection.notices,
  );

  const notices: Notice[] = result.documents.map((notice) => ({
    ...notice,
    date: new Date(notice.date),
    $createdAt: new Date(notice.$createdAt),
    localizedType: localizedNoticeType[notice.type]?.[lang] ?? notice.type,
  }));

  return notices
    .filter((notice) => 
      isWithinFiveDaysOfFriday(notice.date, friday) &&
      (notice.subject ? !ignore.includes(notice.subject) : true)
  )
    .sort((a, b) => b.$createdAt.getTime() - a.$createdAt.getTime());
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
    (subject) =>
      subject.weekDay == weekday.s && !user.ignore.includes(subject.subject),
  );

  const otherNotices = notices.filter(
    (notice) => notice.type === "unknown" && notice.date.getDay() == weekday.n,
  );

  [...schedule, ...activeAdditionalSubjects].forEach((entry: ScheduleEntry) => {
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

  otherNotices.forEach((notice) => {
    result = result.map(entry => {
      const noticePeriods = notice.periods;
      const entryPeriods = entry.staticData.periods;
      
      // Filter out any periods that fall within notice period range
      const updatedPeriods = entryPeriods.filter(period => 
        period < (noticePeriods[0] ?? 0) || 
        (noticePeriods.length > 1 && period > (noticePeriods[1] ?? 0))
      );
      
      // If periods changed, return updated entry
      if (updatedPeriods.length !== entryPeriods.length) {
        return {
          ...entry,
          staticData: {
            ...entry.staticData,
            periods: updatedPeriods
          }
        };
      }
      
      return entry;
    }).filter(entry => entry.staticData.periods.length > 0);
  });  

  const mixedResult = [
    ...result,
    ...otherNotices,
  ].sort((a, b) => {
    const aFirstPeriod =
      "staticData" in a ? (a.staticData.periods[0] ?? 0) : (a.periods[0] ?? 0);
    const bFirstPeriod =
      "staticData" in b ? (b.staticData.periods[0] ?? 0) : (b.periods[0] ?? 0);

    return aFirstPeriod - bFirstPeriod;
  });

  return mixedResult;
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

  const notices = await getNotices(affectedClass, dateModel.fri, user.ignore, user.lang);

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
