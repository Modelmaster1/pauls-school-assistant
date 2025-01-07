// Subject details for each schedule entry
export type ScheduleEntry = {
  subject: string;
  periods: number[]; // The periods (e.g. [1, 2])
  teacher: string;
  room: string;
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
    affectedClass: string,
    date: Date,
    subject: string,
    periods: number[],
    type: 0,
    weekType: "Week A" | "Week B",
}

export type SubjectInfo = {
    name: string,
    tint: string,
}
