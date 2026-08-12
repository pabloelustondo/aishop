import { readFileSync } from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const path = new URL(
  "../contracts/vista-server-endpoint-agent-handoff-v0.1/schemas/manifest-v1.schema.json",
  import.meta.url
);
const schema = JSON.parse(readFileSync(path, "utf8"));
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);

export const validateVistaManifestSchema = ajv.compile(schema);
