import { $ } from "bun";

const files = (await $`find ./output/admin/bundeled -type f`.quiet()).stdout
  .toString()
  .split("\n")
  .filter((file) => file);

console.log(`Let's lint ${files.length} files.`);
if (files.length > 10) {
  console.log("That's a lot of files! Are you sure you want to continue?");
  const prompt = 'Type "yes": ';
  process.stdout.write(prompt);
  for await (const line of console) {
    if (line.toLowerCase() !== "yes") {
      console.log('You must type "yes" to continue ;-)');
      process.stdout.write(prompt);
      continue;
    }
    if (line.toLowerCase() === "yes") {
      console.log("Finally you did it! Great job.");
      break;
    }
  }
}

for (const file of files) {
  console.log(`Linting ${file}...`);
  await $`redocly lint --skip-rule operation-4xx-response --skip-rule no-server-example.com ${file}`.quiet();
}
