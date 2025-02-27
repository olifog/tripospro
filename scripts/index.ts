import "dotenv/config";
import { Command } from "commander";
import { dbCommand } from "./db";

interface GlobalOptions {
  verbose?: boolean;
}

const program = new Command()
  .name("tripospro")
  .description("CLI tool for TriposPro operations")
  .version("1.0.0");

program.option("-v, --verbose", "Enable verbose output");

program.addCommand(dbCommand);

program.parse(process.argv);

if (process.argv.length === 2) {
  program.help();
}

const options = program.opts() as GlobalOptions;
if (options.verbose) {
  console.log("Verbose mode enabled");
}
