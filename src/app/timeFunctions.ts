export default function getWeekDates() {
  const friday = getNextFriday();
  const previousMonday = new Date(friday);
  // Subtract 4 days to get to the Monday before
  previousMonday.setDate(friday.getDate() - 4);

  const dmodel = {
    fri: friday,
    mon: previousMonday,
  };

  return dmodel;
}

function getNextFriday(date = new Date()) {
  // Get the current day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const dayOfWeek = date.getDay();
  if (dayOfWeek == 5) {
    return date;
  }

  // Calculate the days to add to reach the next Friday
  const daysToNextFriday = (12 - dayOfWeek) % 7 || 7; // Handle current Friday

  // Add the days to the current date
  const nextFriday = new Date(date);
  nextFriday.setDate(date.getDate() + daysToNextFriday);

  return nextFriday;
}

const startTimeForPeriods = {
  1: "07:45",
  2: "08:30",
  3: "09:45",
  4: "10:30",
  5: "11:45",
  6: "12:30",
  7: "13:15",
  8: "14:00",
  9: "14:45",
  10: "15:30",
}

export function getTimeDifferenceInMinutes(lastPeriod: number | null, nextPeriod: number | null, isBufferTime: boolean): number | null {
  if (!nextPeriod || !lastPeriod) {
    return null;
  }

  if (lastPeriod > nextPeriod) {
    return null;
  }

  const time1 = startTimeForPeriods[lastPeriod as keyof typeof startTimeForPeriods];
  const time2 = startTimeForPeriods[nextPeriod as keyof typeof startTimeForPeriods];
  // Parse the time strings (format: HH:mm)
  const [hours1, minutes1] = time1.split(':').map(Number);
  const [hours2, minutes2] = time2.split(':').map(Number);

  if (!hours1 || !minutes1 || !hours2 || !minutes2) {
    return 0 // Invalid time format
  }

  // Convert times to total minutes
  const totalMinutes1 = hours1 * 60 + minutes1 + (isBufferTime ? 0 : 45); // the length of the period
  
  const totalMinutes2 = hours2 * 60 + minutes2;

  // Calculate the absolute difference
  const result = Math.abs(totalMinutes1 - totalMinutes2);

  if (!isBufferTime && result > 45) {
    console.log(lastPeriod, nextPeriod)
    console.log(totalMinutes1, totalMinutes2)
    console.log(result)
  }
  
  return result <= 0 ? null : result;
}