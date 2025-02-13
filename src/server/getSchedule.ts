"use server";
import {
  AccountData,
  CurrentEntryData,
  CurrentSchedule,
  Notice,
  ScheduleEntry,
  SubjectInfo,
  WeeklySchedule,
} from "~/app/models";
import { Collection, listDocuments } from "./appwriteFunctions";
import { Query } from "appwrite";
import getWeekDates from "~/server/timeFunctions";

async function getSchedule(
  affectedClass: string,
  weekType: "a" | "b",
  editMode: boolean,
) {
  const affectedClassFilterQuery = Query.equal("affectedClass", affectedClass);
  const filterQueries = editMode
    ? [affectedClassFilterQuery]
    : [
        affectedClassFilterQuery,
        Query.contains("weekType", [weekType, "both"]),
      ];

  const result = await listDocuments<ScheduleEntry>(
    filterQueries,
    Collection.scheduleEntry,
  );

  const scheduleItems = result.documents; // all the items in the schedule

  if (result.total === 0 && !editMode) {
    return null;
  }

  const schedule: WeeklySchedule = {
    mon: scheduleItems.filter((item) => item.weekDay === 1),
    tue: scheduleItems.filter((item) => item.weekDay === 2),
    wed: scheduleItems.filter((item) => item.weekDay === 3),
    thu: scheduleItems.filter((item) => item.weekDay === 4),
    fri: scheduleItems.filter((item) => item.weekDay === 5),
  };
  return schedule;
}

export async function getSubjectInfo() {
  const result = await listDocuments<SubjectInfo>(
    undefined,
    Collection.subjectInfo,
  );

  const data: SubjectInfo[] = result.documents;
  return data;
}

async function getAdditionalSubjects(additional: string[]) {
  const result = await listDocuments<ScheduleEntry>(
    [Query.contains("subject", additional)],
    Collection.scheduleEntry,
  );

  const data: ScheduleEntry[] = result.documents;

  return data;
}

const localizedNoticeType: { [key: string]: { en: string; de: string } } = {
  newRoom: { en: "different room", de: "anderer Raum" },
  cancelled: { en: "cancelled", de: "fällt aus" },
  likelyCancelled: { en: "likely cancelled", de: "fällt wahrscheinlich aus" },
  diffSubject: { en: "different subject", de: "anderes Fach" },
  unknown: { en: "special", de: "besonders" },
  newTeacher: { en: "different teacher", de: "anderer Lehrer" },
};

async function getNotices(
  affectedClass: string,
  ignore: string[],
  lang: "en" | "de",
) {
  const friday = getWeekDates().fri;
  const mondayTime = new Date(friday);
  mondayTime.setDate(friday.getDate() - 4);

  const ignoreQueries = ignore.map((item) => Query.notEqual("subject", item)); // not ideal might change later

  const result = await listDocuments<Notice>(
    [
      Query.greaterThanEqual("date", mondayTime.toISOString()),
      Query.lessThanEqual("date", friday.toISOString()),
      Query.equal("affectedClass", affectedClass),
      Query.orderDesc("$createdAt"),
      ...ignoreQueries,
    ],
    Collection.notices,
  );

  const notices: Notice[] = result.documents.map((notice) => ({
    ...notice,
    date: new Date(notice.date),
    createdAt: new Date(notice.$createdAt),
    localizedType: localizedNoticeType[notice.type]?.[lang] ?? notice.type,
  }));

  return notices.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
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
  weekday: number,
  user: AccountData,
  additionalSubjects: ScheduleEntry[],
) {
  var result: CurrentEntryData[] = [];

  const activeAdditionalSubjects = additionalSubjects.filter(
    (subject) =>
      subject.weekDay == weekday && !user.ignore.includes(subject.subject),
  );

  const otherNotices = notices.filter(
    (notice) => notice.type === "unknown" && notice.date.getDay() == weekday,
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

  otherNotices.forEach((notice) => {
    result = result
      .map((entry) => {
        const noticePeriods = notice.periods;
        const entryPeriods = entry.staticData.periods;

        // Filter out any periods that fall within notice period range
        const updatedPeriods = entryPeriods.filter(
          (period) =>
            period < (noticePeriods[0] ?? 0) ||
            (noticePeriods.length > 1 && period > (noticePeriods[1] ?? 0)),
        );

        // If periods changed, return updated entry
        if (updatedPeriods.length !== entryPeriods.length) {
          return {
            ...entry,
            staticData: {
              ...entry.staticData,
              periods: updatedPeriods,
            },
          };
        }

        return entry;
      })
      .filter((entry) => entry.staticData.periods.length > 0);
  });

  const mixedResult = [...result, ...otherNotices].sort((a, b) => {
    const aFirstPeriod =
      "staticData" in a ? (a.staticData.periods[0] ?? 0) : (a.periods[0] ?? 0);
    const bFirstPeriod =
      "staticData" in b ? (b.staticData.periods[0] ?? 0) : (b.periods[0] ?? 0);

    return aFirstPeriod - bFirstPeriod;
  });

  return mixedResult;
}

async function getFallBackWeekType() {
  const friday = getWeekDates().fri;
  const mondayTime = new Date(friday);
  mondayTime.setDate(friday.getDate() - 4);

  const stuff = await listDocuments<Notice>(
    [
      Query.greaterThanEqual("date", mondayTime.toISOString()),
      Query.lessThanEqual("date", friday.toISOString()),
      Query.limit(1),
      Query.orderDesc("$createdAt"),
    ],
    Collection.notices,
  );

  const result = stuff.documents[0]?.weekType ?? null;

  return result;
}

export async function createCurrentSchedule(
  user: AccountData,
  editMode: boolean,
) {
  const affectedClass = user.year;
  const dateModel = getWeekDates();
  const subjectInfo = await getSubjectInfo();

  const additionalSubjects =
    user.additional.length > 0
      ? await getAdditionalSubjects(user.additional)
      : [];

  const notices: Notice[] = editMode
    ? []
    : await getNotices(affectedClass, user.ignore, user.lang);

  const fallBack = notices.length <= 0 ? await getFallBackWeekType() : null;

  const weekType = notices[0]?.weekType ?? fallBack ?? "a";

  const staticSchedule = await getSchedule(affectedClass, weekType, editMode);

  if (!staticSchedule) {
    return null;
  }

  const result: CurrentSchedule = {
    weekkType: weekType,
    dates: dateModel,

    mon: convertScheduleArray(
      staticSchedule.mon,
      notices,
      subjectInfo,
      1,
      user,
      additionalSubjects,
    ),
    tue: convertScheduleArray(
      staticSchedule.tue,
      notices,
      subjectInfo,
      2,
      user,
      additionalSubjects,
    ),
    wed: convertScheduleArray(
      staticSchedule.wed,
      notices,
      subjectInfo,
      3,
      user,
      additionalSubjects,
    ),
    thu: convertScheduleArray(
      staticSchedule.thu,
      notices,
      subjectInfo,
      4,
      user,
      additionalSubjects,
    ),
    fri: convertScheduleArray(
      staticSchedule.fri,
      notices,
      subjectInfo,
      5,
      user,
      additionalSubjects,
    ),
  };

  return result;
}
