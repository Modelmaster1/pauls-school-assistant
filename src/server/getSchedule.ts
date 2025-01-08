"use server";
import {
  AccountData,
  CurrentEntryData,
  CurrentSchedule,
  FullSchedule,
  Notice,
  ScheduleEntry,
  SubjectInfo,
} from "~/app/models";
import { Collection, listDocuments } from "./appwriteFunctions";
import { Query } from "appwrite";
import getWeekDates from "~/app/timeFunctions";

export async function getSchedule(affectedClass: string) {
  const result = await listDocuments(
    [Query.equal("affectedClass", affectedClass)],
    Collection.fullSchedule,
  );

  const schedule: FullSchedule = result.documents[0];
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

  // Calculate the difference in days between the given date and the Friday
  const timeDifference = Math.abs(date.getTime() - friday.getTime());
  const daysDifference = timeDifference / (1000 * 60 * 60 * 24);

  // Check if the difference is within 5 days
  return daysDifference <= 5;
}

export async function getNotices(affectedClass: string, friday: Date) {
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
  );
}

function convertEntryToCurrentEntry(
  entry: ScheduleEntry,
  subjectInfo: SubjectInfo | null,
  notice: Notice | null,
  lang: "en" | "de",
): CurrentEntryData {
  if (notice) {
    console.log("This one has a notice");
  }

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
  weekday: number,
  user: AccountData,
) {
  var result: CurrentEntryData[] = [];

  const sortedSchedule = schedule.sort(
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
            notice.date.getDay() == weekday,
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

const weekDayModel = {
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
};

export async function createCurrentSchedule(user: AccountData) {
  const affectedClass = user.year;
  const language = user.lang;
  const dateModel = getWeekDates();
  const staticSchedule = await getSchedule(affectedClass);
  const subjectInfo = await getSubjectInfo();

  const notices = await getNotices(affectedClass, dateModel.fri);

  const weekType = notices[0]?.weekType ?? "b";

  const result: CurrentSchedule = {
    weekkType: weekType,
    dates: dateModel,

    mon: convertScheduleArray(
      staticSchedule[weekType].mon,
      notices,
      subjectInfo,
      weekDayModel.mon,
      user,
    ),
    tue: convertScheduleArray(
      staticSchedule[weekType].tue,
      notices,
      subjectInfo,
      weekDayModel.tue,
      user,
    ),
    wed: convertScheduleArray(
      staticSchedule[weekType].wed,
      notices,
      subjectInfo,
      weekDayModel.wed,
      user,
    ),
    thu: convertScheduleArray(
      staticSchedule[weekType].thu,
      notices,
      subjectInfo,
      weekDayModel.thu,
      user,
    ),
    fri: convertScheduleArray(
      staticSchedule[weekType].fri,
      notices,
      subjectInfo,
      weekDayModel.fri,
      user,
    ),
  };

  return result;
}
