import { Client, Databases, Models } from 'appwrite';

// Appwrite Client Setup
const client = new Client();
client
  .setEndpoint("https://cloud.appwrite.io/v1") // Your Appwrite endpoint
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID as string); // Your project ID

const databases = new Databases(client);

// Appwrite Constants
const DATABASE_ID = '6777e0b0003ce89526c9';
const COLLECTION_ID = '6777f40c002a2fcc56b7';

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
  documentId: string = 'unique()'
): Promise<Models.Document> => {
  try {
    return await databases.createDocument(DATABASE_ID, COLLECTION_ID, documentId, data);
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Get a document by its ID
 * @param documentId - The document ID
 * @returns The fetched document
 */
export const getDocument = async (documentId: string): Promise<Models.Document> => {
  try {
    return await databases.getDocument(DATABASE_ID, COLLECTION_ID, documentId);
  } catch (error: any) {
    throw new Error(error.message);
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
  data: DocumentData
): Promise<Models.Document> => {
  try {
    return await databases.updateDocument(DATABASE_ID, COLLECTION_ID, documentId, data);
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Delete a document
 * @param documentId - The document ID
 * @returns A success response or throws an error
 */
export const deleteDocument = async (documentId: string): Promise<void> => {
  try {
    await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, documentId);
  } catch (error: any) {
    throw new Error(error.message);
  }
};
