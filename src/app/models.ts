// Subject details for each schedule entry
export interface ScheduleEntry {
  subject: string;
  periods: number[]; // The periods (e.g. [1, 2])
  teacher: string;
  room: string;
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
