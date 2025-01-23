"use server";

import { ID, Query } from "appwrite";
import {
  Collection,
  createDocument,
  listDocuments,
  updateDocument,
} from "./appwriteFunctions";
import { AccountData } from "~/app/models";
import { cookies } from "next/headers";

export async function createCodeLoginSession(currentUserID: string) {
  const code = generateRandomString(6);

  const data = {
    accounts: currentUserID,
    tempCode: code,
    expirationDate: new Date(Date.now() + 1000 * 60 * 5 + (1000 * 60 * 60 * 1)).toISOString(), // UTC+1, 5 mins expiry
  };

  await createDocument(data, ID.unique(), Collection.session);

  return code;
}

export async function validateCodeLoginSession(code: string) {
  const currentDate = new Date();
  const sessions = await listDocuments(
    [Query.equal("tempCode", code)],
    Collection.session,
  );

  sessions.documents.forEach((session) => {
    console.log(session.tempCode, session.tempCode === code);
    console.log(session.expirationDate);
  });

  const session = sessions.documents.filter(
    (session) => currentDate < new Date(session.expirationDate),
  )[0];

  if (!session) {
    return null;
  }

  const account: AccountData = session.accounts; // get the account

  await updateDocument(
    session.$id,
    {
      tempCode: null,
      expirationDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30 * 12), // UTC+1, 1 week expiry
    },
    Collection.session,
  );

  const cookieStore = await cookies();
  cookieStore.set("pauls-school-assistant-session", session.$id, {
    path: "/",
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 30 * 12,
  });

  return account;
}

function generateRandomString(length: number): string {
  const chars = "0123456789";
  let result = "";
  const randomArray = new Uint8Array(length);
  // Use the global crypto object with proper type checking
  const cryptoObj = globalThis.crypto;
  cryptoObj.getRandomValues(randomArray);
  for (let i = 0; i < length; i++) {
    if (randomArray[i] === undefined) {
      throw new Error("Random array value is undefined");
    }
    result += chars[randomArray[i]! % chars.length];
  }
  return result;
}
