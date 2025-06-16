/**
 * AGENITIX CLI (skeleton) - prints basic help & version.
 */

import { readFileSync } from "fs";
import { join } from "path";

const pkg = JSON.parse(
  readFileSync(join(__dirname, "../../package.json"), "utf8")
);

const args = process.argv.slice(2);

switch (args[0]) {
  case "new":
    console.log("🚧  CLI stub: 'new' command coming soon");
    break;
  case "test":
    console.log("🚧  CLI stub: 'test' command coming soon");
    break;
  default:
    console.log(`agenitix v${pkg.version}`);
    console.log(
      "Commands:\n  new   Create resources (node, workflow)\n  test  Run workflow tests\n"
    );
}
