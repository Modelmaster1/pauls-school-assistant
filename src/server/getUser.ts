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

export async function sendWelcomeMessage(id: number) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const method = 'sendMessage';

  const text = `Welcome to <b>Paul's School Assistant!</b> 👋. \n You're all set!`
  
  const payload: any = {
    chat_id: id,
    parse_mode: 'HTML',
    text: text,
  };

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log('Message sent successfully!');
    } else {
      const errorText = await response.text();
      console.error(`Failed to send message: ${errorText}`);
    }
  } catch (error) {
    console.error('Error sending message:', error);
  }
}
