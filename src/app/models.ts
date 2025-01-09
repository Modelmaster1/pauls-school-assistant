// Subject details for each schedule entry
export type ScheduleEntry = {
  subject: string;
  periods: number[]; // The periods (e.g. [1, 2])
  teacher: string;
  room: string;
  weekDay: "mon" | "tue" | "wed" | "thu" | "fri" | null;
}

enum EntryType {
    active,
}
  

// Weekly schedule for a class (Monday to Friday)
export interface WeeklySchedule {
  mon: ScheduleEntry[];
  tue: ScheduleEntry[];
  wed: ScheduleEntry[];
  thu: ScheduleEntry[];
  fri: ScheduleEntry[];
}

// Full data model (for multiple classes)
export interface FullSchedule {
  a: WeeklySchedule;
  b: WeeklySchedule;
}

export type Notice = {
  $createdAt: Date,
    affectedClass: string,
    date: Date,
    subject: string,
    periods: number[],
    type: string,
    weekType: "a" | "b",
}

export type SubjectInfo = {
    abbreviation: string,
    name: string | null,
    nameDe: string | null,
    tint: string | null,
}

export type CurrentSchedule = {
  weekkType: "a" | "b",
  dates: {
    mon: Date,
    fri: Date,
  }
  mon: CurrentEntryData[]
  tue: CurrentEntryData[];
  wed: CurrentEntryData[];
  thu: CurrentEntryData[];
  fri: CurrentEntryData[];
}

export type CurrentEntryData = {
  staticData: ScheduleEntry,
  generalData: { name: string | null, tint: string | null } | null,
  dynamicData: Notice | null
}

export type AccountData = {
  username: string,
  year: string,
  telegramID: number | null,
  ignore: string[],
  additional: string[],
  lang: "en" | "de",
}
