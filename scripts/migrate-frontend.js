import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const require = createRequire(import.meta.url);
const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const projectRoot = path.resolve(backendRoot, "..");
const storyRoot = path.join(projectRoot, "app", "src", "stories");
const assetRoot = path.join(projectRoot, "assets");
const outputFile = path.join(backendRoot, "src", "data", "stories.json");
const moduleCache = new Map();

function resolveModule(specifier, parentDirectory) {
  const candidate = path.resolve(parentDirectory, specifier);
  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  for (const extension of [".ts", ".tsx", ".js", ".json"]) {
    if (fs.existsSync(`${candidate}${extension}`)) return `${candidate}${extension}`;
  }
  throw new Error(`Cannot resolve ${specifier} from ${parentDirectory}`);
}

function mediaUrl(filePath) {
  const relative = path.relative(assetRoot, filePath).split(path.sep).join("/");
  if (relative.startsWith("..")) {
    throw new Error(`Media file is outside the assets folder: ${filePath}`);
  }
  return `/media/${relative}`;
}

function loadTypeScriptModule(filePath) {
  if (moduleCache.has(filePath)) return moduleCache.get(filePath).exports;

  const module = { exports: {} };
  moduleCache.set(filePath, module);
  const source = fs.readFileSync(filePath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: filePath,
  }).outputText;

  const localRequire = (specifier) => {
    if (!specifier.startsWith(".")) return require(specifier);
    const resolved = resolveModule(specifier, path.dirname(filePath));
    if (/\.(ts|tsx)$/i.test(resolved)) return loadTypeScriptModule(resolved);
    if (/\.json$/i.test(resolved)) return JSON.parse(fs.readFileSync(resolved, "utf8"));
    return mediaUrl(resolved);
  };

  const execute = new Function(
    "exports",
    "require",
    "module",
    "__filename",
    "__dirname",
    output,
  );
  execute(module.exports, localRequire, module, filePath, path.dirname(filePath));
  return module.exports;
}

const stories = [];
for (let index = 1; index <= 6; index += 1) {
  const storyFile = path.join(storyRoot, `story${index}.ts`);
  const loaded = loadTypeScriptModule(storyFile);
  const story = loaded.default ?? loaded;
  stories.push(story);
}

fs.writeFileSync(outputFile, `${JSON.stringify(stories, null, 2)}\n`, "utf8");
console.log(`Exported ${stories.length} complete stories to ${outputFile}`);
