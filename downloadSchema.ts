import { $ } from "bun";
import { exit } from "node:process";
import { parseArgs } from "node:util";

const { values: cliArgs } = parseArgs({
  args: Bun.argv,
  options: {
    urlToOpenApiSchemaJson: {
      type: "string",
    },
    bearerToken: {
      type: "string",
    },
  },
  strict: true,
  allowPositionals: true,
});

const urlToOpenApiSchemaJson =
  cliArgs.urlToOpenApiSchemaJson ??
  "http://localhost:8000/api/_info/openapi3.json?type=jsonapi";

if (!isValidUrl()) {
  console.error("Invalid URL");
  exit(1);
}

const headers = new Headers();
const schemaURL = new URL(urlToOpenApiSchemaJson);
if (cliArgs.bearerToken) {
  headers.append("Authorization", `Bearer ${cliArgs.bearerToken}`);
}
const response = await fetch(schemaURL.toString(), {
  headers,
});
const schemaJson = await response.text();
const schemaJsonObject = JSON.parse(schemaJson);

if (schemaJsonObject.errors) {
  console.error("Error downloading schema:");
  console.error(schemaJsonObject.errors);
  exit(1);
}

await $`echo ${schemaJson.toString()} > ./input/admin-api.json`;

console.info("Schema downloaded successfully to ./input/admin-api.json 🎉");
exit(0);

function isValidUrl() {
  try {
    new URL(urlToOpenApiSchemaJson);
    return true;
  } catch (e) {
    return false;
  }
}
