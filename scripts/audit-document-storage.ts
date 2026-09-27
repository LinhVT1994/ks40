/** Read-only inventory. Does not print credentials, storage URLs or document names. */
import 'dotenv/config';
import { db } from '../src/lib/db';
import { BlobServiceClient } from '@azure/storage-blob';

async function main() {
  const [resources, sharedFiles] = await Promise.all([
    db.resource.findMany({ select: { url: true } }),
    db.sharedFile.findMany({ select: { url: true } }),
  ]);
  const counts = { privateLocal: 0, privateAzure: 0, legacyLocal: 0, legacyRemote: 0, unsupported: 0 };
  for (const { url } of [...resources, ...sharedFiles]) {
    if (url.startsWith('private:')) counts.privateLocal++;
    else if (url.startsWith('azure-private:')) counts.privateAzure++;
    else if (/^\/uploads\/(files|shared)\//.test(url)) counts.legacyLocal++;
    else if (url.startsWith('https://')) counts.legacyRemote++;
    else counts.unsupported++;
  }
  console.log(JSON.stringify({ resources: resources.length, sharedFiles: sharedFiles.length, counts }, null, 2));
  const connection = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (connection) {
    const container = BlobServiceClient.fromConnectionString(connection).getContainerClient(process.env.AZURE_PRIVATE_CONTAINER_NAME ?? 'private-documents');
    if (await container.exists()) console.log('Private container ACL:', (await container.getProperties()).blobPublicAccess ?? 'private');
    else console.log('Private container: not created yet (created on first upload).');
  }
  if (counts.legacyRemote || counts.unsupported) {
    console.log('ACTION REQUIRED: migrate legacy remote documents and revoke the old public copies before claiming production access control.');
    process.exitCode = 2;
  }
}
main().catch(() => { console.error('Storage audit failed; check database/storage connectivity and permissions.'); process.exitCode = 1; }).finally(() => db.$disconnect());
