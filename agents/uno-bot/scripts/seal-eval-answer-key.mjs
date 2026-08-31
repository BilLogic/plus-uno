import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { sealAnswerKey } from "./eval-answer-key.mjs";

const [, , inputPath, outputPath] = process.argv;
if (!inputPath || !outputPath || !process.env.UNO_BOT_EVAL_KEY) {
  console.error("usage: UNO_BOT_EVAL_KEY=<64 hex chars> node seal-eval-answer-key.mjs <private-input.json> <output.enc.json>");
  process.exit(2);
}

const invocationDirectory = process.env.INIT_CWD ?? process.cwd();
const resolvedInput = resolve(invocationDirectory, inputPath);
const resolvedOutput = resolve(invocationDirectory, outputPath);
const answerKey = JSON.parse(readFileSync(resolvedInput, "utf8"));
writeFileSync(resolvedOutput, sealAnswerKey(answerKey, process.env.UNO_BOT_EVAL_KEY));
console.log(`sealed ${Object.keys(answerKey).length} eval answers to ${resolvedOutput}`);
