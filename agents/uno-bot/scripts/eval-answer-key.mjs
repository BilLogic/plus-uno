import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";

const ALGORITHM = "aes-256-gcm";
const VERSION = 1;

function decodeKey(value) {
  if (!/^[0-9a-f]{64}$/i.test(value ?? "")) {
    throw new Error("UNO_BOT_EVAL_KEY must be a 64-character hex key");
  }
  return Buffer.from(value, "hex");
}

export function sealAnswerKey(answerKey, keyValue) {
  const key = decodeKey(keyValue);
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(answerKey), "utf8"),
    cipher.final(),
  ]);
  return `${JSON.stringify({
    version: VERSION,
    algorithm: ALGORITHM,
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    ciphertext: ciphertext.toString("base64"),
  }, null, 2)}\n`;
}

export function loadAnswerKey(path, keyValue) {
  try {
    const envelope = JSON.parse(readFileSync(path, "utf8"));
    if (envelope.version !== VERSION || envelope.algorithm !== ALGORITHM) {
      throw new Error("unsupported encrypted answer-key format");
    }
    const decipher = createDecipheriv(
      ALGORITHM,
      decodeKey(keyValue),
      Buffer.from(envelope.iv, "base64"),
    );
    decipher.setAuthTag(Buffer.from(envelope.tag, "base64"));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(envelope.ciphertext, "base64")),
      decipher.final(),
    ]).toString("utf8");
    const answerKey = JSON.parse(plaintext);
    if (!answerKey || Array.isArray(answerKey) || typeof answerKey !== "object") {
      throw new Error("answer key must be an object keyed by case id");
    }
    return answerKey;
  } catch (error) {
    throw new Error(`could not decrypt eval answer key: ${error.message}`, { cause: error });
  }
}

export function attachJudgeNotes(fixture, answerKey) {
  const cases = fixture?.cases;
  if (!Array.isArray(cases)) throw new Error("eval fixture must contain a cases array");

  const publicAnswers = cases.filter((entry) => Object.hasOwn(entry, "judgeNote"));
  if (publicAnswers.length) {
    throw new Error(`public fixture contains judgeNote for ${publicAnswers.map((entry) => entry.id).join(", ")}`);
  }

  const ids = new Set(cases.map((entry) => entry.id));
  const missing = cases.filter((entry) => typeof answerKey[entry.id] !== "string").map((entry) => entry.id);
  if (missing.length) throw new Error(`answer key missing case(s): ${missing.join(", ")}`);

  const unknown = Object.keys(answerKey).filter((id) => !ids.has(id));
  if (unknown.length) throw new Error(`answer key contains unknown case(s): ${unknown.join(", ")}`);

  return {
    ...fixture,
    cases: cases.map((entry) => ({ ...entry, judgeNote: answerKey[entry.id] })),
  };
}
