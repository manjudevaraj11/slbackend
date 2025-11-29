import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const loadTemplate = (fileName: string) => {
  const filePath = path.join(__dirname, "../../src/emailTemplates", fileName);
  return fs.readFileSync(filePath, "utf-8");
};
