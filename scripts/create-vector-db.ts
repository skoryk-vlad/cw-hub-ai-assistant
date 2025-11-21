import fs from 'fs';
import OpenAI from 'openai';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const listFilesInDirectory = (dir: string): string[] => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  dir = path.join(__dirname, dir);
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isFile())
    .map((d) => path.join(dir, d.name));
};

async function createFile(filePath: string) {
  let result: OpenAI.Files.FileObject;
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    // Download the file content from the URL
    const res = await fetch(filePath);
    const buffer = await res.arrayBuffer();
    const urlParts = filePath.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const file = new File([buffer], fileName);
    result = await openai.files.create({
      file: file,
      purpose: 'assistants',
    });
  } else {
    // Handle local file path
    const fileContent = fs.createReadStream(filePath);
    result = await openai.files.create({
      file: fileContent,
      purpose: 'assistants',
    });
  }
  return result.id;
}


const main = async () => {
  const files = listFilesInDirectory('../data/documents');
  console.log('Loaded documents:', files)

  const fileIds = await Promise.all(files.map((file) => createFile(file)));

  const vectorStore = await openai.vectorStores.create({
    name: 'clockwise_knowledge_base',
    file_ids: fileIds,
  });

  console.log('vectorStoreId: ', vectorStore.id);
};

main();
