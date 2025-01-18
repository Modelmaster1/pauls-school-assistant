import { Client, Databases, Models } from "appwrite";

// Appwrite Client Setup
const client = new Client();
client
  .setEndpoint("https://cloud.appwrite.io/v1") // Your Appwrite endpoint
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID as string); // Your project ID

export const databases = new Databases(client);

// Appwrite Constants
export const DATABASE_ID = "6777e0b0003ce89526c9";

export enum Collection {
    session = "6777f40c002a2fcc56b7",
    account = "6777e0c8000a1eebfa97",
    notices = "677d2d920006fd02621e",
    subjectInfo = "677d4e44002e66866bbf",

    scheduleEntry = "677d3b3a001cf9f0cc83",
    weeklySchedule = "677d3b21000751a9b427",
}

// Types
interface DocumentData {
  [key: string]: any; // Replace with a stricter type if your documents have a defined schema
}

/**
 * Create a document
 * @param data - The document data to create
 * @param documentId - The optional document ID (use "unique()" for a random ID)
 * @returns The created document
 */
export const createDocument = async (
  data: DocumentData,
  documentId: string = "unique()",
  collectionId: string
): Promise<Models.Document> => {
  try {
    return await databases.createDocument(DATABASE_ID, collectionId, documentId, data);
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Get a document by its ID
 * @param documentId - The document ID
 * @returns The fetched document
 */
export const getDocument = async (documentId: string, collectionId: string): Promise<Models.Document | null> => {
  try {
    return await databases.getDocument(DATABASE_ID, collectionId, documentId);
  } catch (error: any) {
    console.log(error.message);
    return null;
  }
};

/**
 * Update a document
 * @param documentId - The document ID
 * @param data - The data to update
 * @returns The updated document
 */
export const updateDocument = async (
  documentId: string,
  data: DocumentData,
  collectionId: string
): Promise<Models.Document> => {
  try {
    return await databases.updateDocument(DATABASE_ID, collectionId, documentId, data);
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Delete a document
 * @param documentId - The document ID
 * @returns A success response or throws an error
 */
export const deleteDocument = async (documentId: string, collectionId: string): Promise<void> => {
  try {
    await databases.deleteDocument(DATABASE_ID, collectionId, documentId);
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * List documents in the collection
 * @param queries - Optional queries for filtering, searching, etc.
 * @returns A list of documents
 */
export const listDocuments = async (
  queries: string[] = [],
  collectionId: string
  ): Promise<Models.DocumentList<Models.Document>> => {
  try {
    return await databases.listDocuments(DATABASE_ID, collectionId, queries);
  } catch (error: any) {
    throw new Error(error.message);
  }
};
  