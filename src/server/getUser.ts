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
      ])
    ).documents;

    if (docs[0]) {
      const itemData: AccountData = {
        username: docs[0].username,
        ignore: docs[0].ignore,
        additional: docs[0].additional,
        year: docs[0].year,
        telegramID: docs[0].telegramID,
        lang: docs[0].lang,
      };

      return itemData;
    }

    return null;
  } catch (error: any) {
    throw new Error(error.message);
  }
};
