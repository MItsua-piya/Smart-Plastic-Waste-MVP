import { build } from "esbuild";
import esbuildPluginPino from "esbuild-plugin-pino";
import { createRequire } from "node:module";
import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

globalThis.require = createRequire(import.meta.url);

if (!process.env.MONGODB_TEST_URI && !process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI or MONGODB_TEST_URI is required to run the API smoke tests.");
}

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "plastic-loop-test-secret";
process.env.MONGODB_DB_NAME =
  process.env.MONGODB_TEST_DB_NAME ?? `plastic_loop_test_${process.pid}_${Date.now()}`;

const testDir = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(testDir, ".plastic-loop.e2e.test");
const outputFile = path.join(outputDir, "plastic-loop.e2e.test.mjs");

try {
  await build({
    entryPoints: [path.join(testDir, "plastic-loop.e2e.test.ts")],
    outdir: outputDir,
    bundle: true,
    format: "esm",
    platform: "node",
    external: [
      "*.node",
      "bcrypt",
      "argon2",
      "fsevents",
      "re2",
      "farmhash",
      "xxhash-addon",
      "bufferutil",
      "utf-8-validate",
      "ssh2",
      "cpu-features",
      "dtrace-provider",
      "isolated-vm",
      "lightningcss",
      "pg-native",
      "oracledb",
      "mongodb-client-encryption",
      "nodemailer",
      "handlebars",
      "knex",
      "typeorm",
      "mysql2",
      "newrelic",
      "odbc",
      "piscina",
      "realm",
      "ref-napi",
      "rocksdb",
      "sass-embedded",
      "sequelize",
      "serialport",
      "snappy",
      "tinypool",
      "usb",
      "workerd",
      "wrangler",
      "zeromq",
      "zeromq-prebuilt",
      "playwright",
      "puppeteer",
      "puppeteer-core",
      "electron",
    ],
    outExtension: { ".js": ".mjs" },
    sourcemap: "inline",
    logLevel: "silent",
    plugins: [esbuildPluginPino({ transports: ["pino-pretty"] })],
  });
  await import(pathToFileURL(outputFile).href);
} finally {
  await rm(outputDir, { recursive: true, force: true });
}