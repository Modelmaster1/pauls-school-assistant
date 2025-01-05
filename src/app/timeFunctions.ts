export default function getWeekDates() {
  const friday = getNextFriday();
  const previousMonday = new Date(friday);
  // Subtract 4 days to get to the Monday before
  previousMonday.setDate(friday.getDate() - 4);

  const dmodel = {
    friday: friday,
    monday: previousMonday,
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