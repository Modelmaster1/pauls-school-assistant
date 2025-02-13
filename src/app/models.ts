import { Models } from "appwrite";

// Subject details for each schedule entry
export interface ScheduleEntry extends Models.Document {
  subject: string;
  periods: number[]; // The periods (e.g. [1, 2])
  teacher: string;
  room: string;
  weekDay: number; // 0 sunday 1 monday 2 tuesday 3 wednesday 4 thursday 5 friday
  affectedClass: string
}

// Weekly schedule for a class (Monday to Friday)
export interface WeeklySchedule {
  mon: ScheduleEntry[];
  tue: ScheduleEntry[];
  wed: ScheduleEntry[];
  thu: ScheduleEntry[];
  fri: ScheduleEntry[];
}

export interface Notice extends Models.Document {
  createdAt: Date;
  affectedClass: string;
  date: Date;
  subject: string | null;
  periods: number[];
  type: string;
  room: string | null;
  oldRoom: string | null;
  weekType: "a" | "b";
  descr: string | null;

  teacher: string | null;
  oldTeacher: string | null;

  localizedType: string;
}

export interface SubjectInfo extends Models.Document {
  abbreviation: string;
  name: string | null;
  nameDe: string | null;
  tint: string | null;
}

export type CurrentSchedule = {
  weekkType: "a" | "b";
  dates: {
    mon: Date;
    fri: Date;
  };
  mon: (CurrentEntryData | Notice)[];
  tue: (CurrentEntryData | Notice)[];
  wed: (CurrentEntryData | Notice)[];
  thu: (CurrentEntryData | Notice)[];
  fri: (CurrentEntryData | Notice)[];
};

export type CurrentEntryData = {
  staticData: ScheduleEntry;
  generalData: { name: string | null; tint: string | null } | null;
  dynamicData: Notice | null;
};

export type AccountData = {
  $id: string;
  username: string;
  year: string;
  telegramID: number | null;
  ignore: string[];
  additional: string[];
  lang: "en" | "de";
};

export interface TelegramUser {
  id: number;
  username?: string;
  first_name?: string;
}

export const tintColors = {
  red: "text-red-300",
  orange: "text-orange-300",
  blue: "text-blue-300",
  green: "text-green-300",
  pink: "text-pink-300",
  purple: "text-purple-300",
  yellow: "text-yellow-300",
  gray: "text-gray-300",
  white: "text-neutral-300",
  clear: "text-neutral-400",
  default: "text-neutral-500",
  none: "text-neutral-500",
}

// Add type declaration for Telegram WebApp
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        initDataUnsafe?: {
          user?: TelegramUser;
        };
      };
    };
    onTelegramAuth?: (user: TelegramUser) => void;
  }
}
