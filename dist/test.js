// src/index.ts
import * as path from "path";

// ../base_types/src/index.ts
var green = "\x1B[40m\x1B[32m";
var red = "\x1B[40m\x1B[31m";
var yellow = "\x1B[40m\x1B[33m";
var reset = "\x1B[0m";
function get_error(x) {
  if (x instanceof Error)
    return x;
  const str = String(x);
  return new Error(str);
}
function is_object(value) {
  if (value == null) return false;
  if (typeof value !== "object" && typeof value !== "function") return false;
  if (Array.isArray(value)) return false;
  if (value instanceof Set) return false;
  if (value instanceof Map) return false;
  return true;
}
function is_promise(value) {
  if (!is_object(value))
    return false;
  const ans = typeof value.then === "function";
  return ans;
}
async function resolve_maybe_promise(a) {
  if (is_promise(a))
    return await a;
  return a;
}
async function run_tests(...tests) {
  let passed = 0;
  let failed = 0;
  for (const { k, v, f } of tests) {
    try {
      const ret = f();
      const effective_v = v ?? true;
      const resolved = await resolve_maybe_promise(ret);
      if (resolved === effective_v) {
        console.log(`\u2705 ${k}: ${green}${effective_v}${reset}`);
        passed++;
      } else {
        console.error(`\u274C ${k}:expected ${yellow}${effective_v}${reset}, got ${red}${resolved}${reset}`);
        failed++;
      }
    } catch (err) {
      console.error(`\u{1F4A5} ${k} threw an error:`, err);
      failed++;
    }
  }
  if (failed === 0)
    console.log(`
Summary:  all ${passed} passed`);
  else
    console.log(`
Summary:  ${failed} failed, ${passed} passed`);
}
async function get_node() {
  if (typeof window !== "undefined") {
    throw new Error("getFileContents() requires Node.js");
  }
  const path2 = await import("node:path");
  const fs = await import("node:fs/promises");
  return { fs, path: path2 };
}
async function mkdir_write_file(filePath, data) {
  const { path: path2, fs } = await get_node();
  const directory = path2.dirname(filePath);
  try {
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(filePath, data);
    console.log(`File '${filePath}' has been written successfully.`);
  } catch (err) {
    console.error("Error writing file", err);
  }
}
async function read_json_object(filename, object_type) {
  const { fs } = await get_node();
  try {
    const data = await fs.readFile(filename, "utf-8");
    const ans = JSON.parse(data);
    if (!is_object(ans))
      throw `not a valid ${object_type}`;
    return ans;
  } catch (ex) {
    console.warn(`${filename}:${get_error(ex)}.message`);
    return void 0;
  }
}

// src/index.ts
function is_valid_watch(a) {
  if (a == null)
    return true;
  if (typeof a === "string")
    return true;
  if (!Array.isArray(a))
    return false;
  for (const x of a)
    if (typeof x !== "string")
      return false;
  return true;
}
function is_valid_watcher(a) {
  if (!is_object(a))
    return "expecting object";
  if (!is_valid_watch(a.watch)) {
    return "watch: expecting string or array of strings";
  }
  if (typeof a.cmd !== "string")
    return "cmd is mandatory of string type";
  for (const k of Object.keys(a))
    if (!["watch", "cmd", "env", "filter"].includes(k))
      return `${k}:invalid key`;
  return true;
}
function is_watchers2(a) {
  if (!is_object(a))
    return false;
  const { watch } = a;
  if (!is_valid_watch(watch)) {
    console.log("watch: must be string or array of string");
    return false;
  }
  for (const [k, v] of Object.entries(a)) {
    if (k === "watch")
      continue;
    const valid_watcher = is_valid_watcher(v);
    if (valid_watcher !== true) {
      console.log(`${k}: invalid watcher:${valid_watcher}`);
      return false;
    }
  }
  return true;
}
function parse_watchers(filename, pkgJson) {
  console.warn(`${green}${filename}${reset}`);
  if (pkgJson == null)
    return {};
  const { watchers } = pkgJson;
  if (watchers == null)
    return {};
  const ans = is_watchers2(watchers);
  if (ans)
    return watchers;
  console.warn(ans);
  return {};
}
async function read_package_json(dirs) {
  const ans = {};
  async function f(dirs2) {
    for (const dir of dirs2) {
      const pkgPath = path.resolve(dir, "package.json");
      if (ans[pkgPath] != null) {
        console.warn(`${pkgPath}: skippin, already done`);
        continue;
      }
      const pkgJson = await read_json_object(pkgPath, "package.json");
      if (pkgJson == null)
        continue;
      ans[dir] = parse_watchers(pkgPath, pkgJson);
      const { workspaces } = pkgJson;
      if (!Array.isArray(workspaces))
        continue;
      for (const workspace of workspaces)
        if (typeof workspace === "string")
          await f([path.join(dir, workspace)]);
    }
  }
  await f(dirs);
  await mkdir_write_file("generated/packages.json", JSON.stringify(ans, null, 2));
  return ans;
}

// src/test.ts
async function get_package_json_length() {
  const ans = await read_package_json(["C:\\yigal\\million_try3", "."]);
  return Object.keys(ans).length;
}
if (import.meta.main) {
  void run_tests({
    k: "run on self",
    v: 5,
    f: get_package_json_length
  });
}
//# sourceMappingURL=test.js.map
