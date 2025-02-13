"use server";

import { ScheduleEntry } from "~/app/models";
import {
  Collection,
  createDocument,
  deleteDocument,
  updateDocument,
} from "./appwriteFunctions";

export async function addNewScheduleEntryDB(data: Partial<ScheduleEntry>) {
  // Clean the data before sending to database
  const cleanData = {
    subject: data.subject,
    teacher: data.teacher,
    room: data.room,
    periods: data.periods,
    weekType: data.weekType,
    weekDay: data.weekDay,
    affectedClass: data.affectedClass
  };

  const result = await createDocument<ScheduleEntry>(
    cleanData,
    undefined,
    Collection.scheduleEntry,
  );

  return result;
}

export async function updateScheduleEntryDB(data: Partial<ScheduleEntry>) {
  const id = data.$id;
  if (!id) return;

  // Clean the data before sending to database
  const cleanData = {
    subject: data.subject,
    teacher: data.teacher,
    room: data.room,
    periods: data.periods,
    weekType: data.weekType,
    weekDay: data.weekDay,
    affectedClass: data.affectedClass
  };

  const result = await updateDocument<ScheduleEntry>(id, cleanData, Collection.scheduleEntry);

  return result;
}

export async function deleteScheduleEntryDB(id: string) {
  await deleteDocument(id, Collection.scheduleEntry);

  return
}
