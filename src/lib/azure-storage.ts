/**
 * Azure Blob Storage upload utility
 * 
 * Required env vars:
 *   AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
 *   AZURE_STORAGE_CONTAINER_NAME=uploads   (default: "uploads")
 *   AZURE_STORAGE_ACCOUNT_NAME=<your-account-name>  (for URL construction)
 */

import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName    = process.env.AZURE_STORAGE_CONTAINER_NAME ?? 'uploads';
const accountName      = process.env.AZURE_STORAGE_ACCOUNT_NAME;

function getContainerClient() {
  if (!connectionString) {
    throw new Error('AZURE_STORAGE_CONNECTION_STRING is not set');
  }
  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  return blobServiceClient.getContainerClient(containerName);
}

/**
 * Upload a buffer to Azure Blob Storage.
 * Returns the public CDN URL of the uploaded blob.
 */
export async function uploadToAzure(
  buffer: Buffer,
  filename: string,
  contentType: string,
): Promise<string> {
  const containerClient = getContainerClient();

  // Ensure container exists and is public (blob-level access)
  await containerClient.createIfNotExists({ access: 'blob' });

  const blobClient = containerClient.getBlockBlobClient(filename);
  await blobClient.uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: contentType },
  });

  // Return public URL
  return blobClient.url;
}

/**
 * Check if Azure Storage is configured.
 * Falls back to local filesystem if not configured (local dev).
 */
export function isAzureConfigured(): boolean {
  return !!connectionString;
}
