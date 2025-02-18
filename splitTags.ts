import { $ } from "bun";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { exit } from "node:process";
import { parseArgs } from "node:util";

const { values: cliArgs } = parseArgs({
  args: Bun.argv,
  options: {
    filterByTag: {
      type: "string",
    },
  },
  strict: true,
  allowPositionals: true,
});

interface GroupedPaths {
  [key: string]: string[];
}

interface Tag {
  name: string;
  description: string;
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

async function bundleAdminGroupsByTags(
  pathGroupsByTags: string[],
  groupedPaths: GroupedPaths,
) {
  for (const group of pathGroupsByTags) {
    if (!groupedPaths[group]) {
      continue;
    }
    await bundleGroup(group, "./output/admin/bundeled/tags");
  }
}

function createGroupsByTags(
  pathGroupsByTags: Array<string>,
  splitAdminApiJson: string,
): GroupedPaths {
  const splitPaths = JSON.parse(splitAdminApiJson).paths;
  return pathGroupsByTags.reduce((acc: GroupedPaths, group: string) => {
    acc[group] = Object.keys(splitPaths).filter((path) =>
      path.includes(`/${group}`),
    );
    if (acc[group].length === 0) {
      delete acc[group]; // skipping tags without paths
    }
    return acc;
  }, {} as GroupedPaths);
}

async function createSplitFilesForAdminGroupsByTags(
  pathGroupsByTags: Array<string>,
  groupedPaths: GroupedPaths,
  splitAdminApiJson: string,
) {
  const splitAdminApi = JSON.parse(splitAdminApiJson);

  for (const group of pathGroupsByTags) {
    if (!groupedPaths[group]) {
      continue; // skipping tags without paths
    }
    const groupPaths = groupedPaths[group];
    const groupPathsObject = Object.fromEntries(
      Object.entries(splitAdminApi.paths).filter(([path]) =>
        groupPaths.includes(path),
      ),
    );

    splitAdminApi.info.title = `${splitAdminApi.info.title} (${group})`;
    const output = { ...splitAdminApi, paths: groupPathsObject };
    output.tags = output.tags.filter(
      (tag: Tag) => tag.name.toLowerCase().replace(/ /g, "-") === group,
    );

    console.log(`Writing split file for ${group} tag ...`);

    try {
      const outputDir = join(__dirname, "/output/admin/split/tmp/");
      await $`mkdir -p ${outputDir}`;
      writeFileSync(`${outputDir}${group}.json`, JSON.stringify(output));
    } catch (error) {
      console.error(error);
    }
  }
}

function isValidTag(tag: string, tags: Tag[]): boolean {
  try {
    const tagExists = tags.find(
      (t: Tag) => t.name.toLowerCase().replace(/ /g, "-") === tag,
    );
    return !!tagExists;
  } catch (e) {
    return false;
  }
}

async function main() {
  const pathInputAdminApi = join(__dirname, "/input/admin-api.json");
  const inputAdminApiJson = readFileSync(pathInputAdminApi, "utf-8");
  const tags = JSON.parse(inputAdminApiJson).tags;
  const pathGroupsByTags = tags.map((tag: Tag) =>
    tag.name.toLowerCase().replace(/ /g, "-"),
  );

  // skip this step if the splitted main openapi.json files already exist
  if (!existsSync(join(__dirname, "/output/admin/split/openapi.json"))) {
    // let's use bun shell and redocly split to split the admin api in smaller files
    await $`redocly split ${pathInputAdminApi} --outDir=./output/admin/split`;
  }

  const createFilesByTag = cliArgs.filterByTag
    ? cliArgs.filterByTag.toLowerCase().replace(/ /g, "-")
    : "";
  if (createFilesByTag !== "" && !isValidTag(createFilesByTag, tags)) {
    console.error("Invalid tag provided");
    console.info("Available tags are:");
    // join tags names as string with comma separated surrounded with ""
    console.info(tags.map((tag: Tag) => `"${tag.name}"`).join(", "));
    return;
  }

  const finalPathGroupsByTags =
    createFilesByTag !== "" ? [createFilesByTag] : pathGroupsByTags;
  const splitAdminApiJson = readFileSync(
    join(__dirname, "/output/admin/split/openapi.json"),
    "utf-8",
  );
  const groupedPaths = createGroupsByTags(
    finalPathGroupsByTags,
    splitAdminApiJson,
  );

  await createSplitFilesForAdminGroupsByTags(
    finalPathGroupsByTags,
    groupedPaths,
    splitAdminApiJson,
  );
  await bundleAdminGroupsByTags(finalPathGroupsByTags, groupedPaths);
  await $`rm -rf ./output/admin/split/tmp`;

  console.log("Split by Tags is done! 🎉");
  exit(0);
}

main().catch(console.error);
