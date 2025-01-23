import { Models, Query } from "appwrite";
import { databases, DATABASE_ID, Collection } from "./appwriteFunctions";
import { AccountData } from "~/app/models";

export const fetchAccountData = async (
  telegramID: number,
): Promise<AccountData | null> => {
  try {
    const docs = (
      await databases.listDocuments(DATABASE_ID, Collection.account, [
        Query.equal("telegramID", telegramID),
        Query.limit(1),
      ])
    ).documents;

    return docs[0];
  } catch (error: any) {
    throw new Error(error.message);
  }
};
