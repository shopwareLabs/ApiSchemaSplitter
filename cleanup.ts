import { $ } from "bun";
import { exit } from "node:process";
import { parseArgs } from "node:util";

const { values: cliArgs } = parseArgs({
  args: Bun.argv,
  options: {
    everyThing: {
      type: "boolean",
    },
  },
  strict: true,
  allowPositionals: true,
});

const cleanEveryThing = cliArgs.everyThing ?? false;
if (cleanEveryThing) {
    console.log("Removing ./input folder...");
    await $`rm -rf ./input`;
    console.log("Removing ./output folder...");
    await $`rm -rf ./output`;
    exit(0);
}

console.log("Removing /output/admin/split/tmp folder...");
await $`rm -rf ./output/admin/split/tmp`;
console.log("Removing /output/admin/bundeled folder...");
await $`rm -rf ./output/admin/bundeled`;
exit(0);

