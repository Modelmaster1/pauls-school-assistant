"use server";
import { FullSchedule, Notice, SubjectInfo } from "~/app/models";
import { Collection, listDocuments } from "./appwriteFunctions";
import { Query } from "appwrite";

export async function getSchedule(affectedClass: string) {
  const result = await listDocuments(
    [Query.equal("affectedClass", affectedClass)],
    Collection.fullSchedule,
  );

  console.log(result);

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

  const notices: Notice[] = result.documents;

  return notices.filter((notice: any) =>
    isWithinFiveDaysOfFriday(new Date(notice.$createdAt), friday),
  );
}
