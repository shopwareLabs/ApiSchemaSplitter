import { $ } from "bun";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { exit } from "node:process";
import { parseArgs } from "node:util";

const { values: cliArgs } = parseArgs({
  args: Bun.argv,
  options: {
    filterByPath: {
      type: "string",
    },
  },
  strict: true,
  allowPositionals: true,
});

function generateFilenameFromPath(path: string): string {
  return path.replace(/\//g, "-").replace(/{|}/g, "").substring(1);
}

async function bundleGroup(group: string, outputDir: string) {
  const bundeledFilename = `${group}-bundeled.json`;
  await $`rm -rf ./output/admin/split/${bundeledFilename}`;
  await $`mkdir -p ${outputDir}`;
  console.log(`Bundling ${group}...`);
  await $`mv ./output/admin/split/tmp/${group}.json ./output/admin/split/${group}-split.json`;
  await $`redocly bundle ./output/admin/split/${group}-split.json -o ${bundeledFilename}`.text();
  await $`mv ${bundeledFilename} ${outputDir}/${group}.json`;
  await $`rm -rf ./output/admin/split/${group}-split.json`;
}

async function createSplitFilesForAdminGroupsByPath(
  splitAdminApiJson: string,
  filterByPath: string,
) {
  const splitAdminApi = JSON.parse(splitAdminApiJson);
  const paths = filterByPath
    ? { [filterByPath]: splitAdminApi.paths[filterByPath] }
    : splitAdminApi.paths;

  for (const path in paths) {
    const filename = generateFilenameFromPath(path);
    const output = { ...splitAdminApi, paths: { [path]: paths[path] } };
    output.tags = undefined; // remove tags from the output

    console.log(`Writing split file for ${filename} path...`);

    try {
      const outputDir = join(__dirname, "/output/admin/split/tmp/");
      await $`mkdir -p ${outputDir}`;
      writeFileSync(`${outputDir}${filename}.json`, JSON.stringify(output));
    } catch (error) {
      console.error(error);
    }
  }
}

async function bundleAdminGroupsByPath(splitAdminApiJson: string, filterByPath: string) {
  const splitAdminApi = JSON.parse(splitAdminApiJson);
  const paths = filterByPath
  ? { [filterByPath]: splitAdminApi.paths[filterByPath] }
  : splitAdminApi.paths;
  for (const path in paths) {
    const filename = generateFilenameFromPath(path);
    await bundleGroup(filename, "./output/admin/bundeled/paths");
  }
}

function isValidPath(splitAdminApiJson: string, filterByPath: string): boolean {
  const splitAdminApi = JSON.parse(splitAdminApiJson);
  return !!splitAdminApi.paths[filterByPath];
}

async function main() {
  const filterByPath = cliArgs.filterByPath ?? "";
  const pathInputAdminApi = join(__dirname, "/input/admin-api.json");

  // skip this step if the splitted main openapi.json files already exist
  if (!existsSync(join(__dirname, "/output/admin/split/openapi.json"))) {
    // let's use bun shell to split the admin api in smaller files
    await $`redocly split ${pathInputAdminApi} --outDir=./output/admin/split`;
  }

  const splitAdminApiJson = readFileSync(
    join(__dirname, "/output/admin/split/openapi.json"),
    "utf-8",
  );

  if (filterByPath !== "" && !isValidPath(splitAdminApiJson, filterByPath)) {
    console.error("Invalid path");
    console.info("Here some example paths you can use to filter:");
    const examplePaths = ["/product", "/category", "/cms-block", "/cms-page", "/customer", "/country", "/currency",];
    console.info(
      Object.values(examplePaths)
        .map((path) => `"${path}"`)
        .join(", "),
    );
    exit(1);
  }

  await createSplitFilesForAdminGroupsByPath(splitAdminApiJson, filterByPath);
  await bundleAdminGroupsByPath(splitAdminApiJson, filterByPath);
  await $`rm -rf ./output/admin/split/tmp`;

  console.log("Split by Paths is done! 🎉");
  exit(0);
}

main().catch(console.error);
