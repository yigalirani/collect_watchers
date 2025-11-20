import * as path from "node:path";
import { is_object, mkdir_write_file, read_json_object, reset, green, is_string_array } from "@yigal/base_types";
function is_valid_watch(a) {
    if (a == null)
        return true;
    if (typeof a === 'string')
        return true;
    return is_string_array(a);
}
function is_valid_watcher(a) {
    if (typeof a === 'string' || is_string_array(a))
        return true;
    if (!is_object(a))
        return "expecting object";
    if (!is_valid_watch(a.watch)) {
        return 'watch: expecting string or array of strings';
    }
    for (const k of Object.keys(a))
        if (!['watch', 'env', 'filter'].includes(k))
            return `${k}:invalid key`;
    return true;
}
function is_watchers2(a) {
    if (!is_object(a))
        return false;
    const { $watch } = a;
    if (!is_valid_watch($watch)) {
        console.log('watch: must be string or array of string');
        return false;
    }
    for (const [k, v] of Object.entries(a)) {
        if (k === '$watch')
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
function parse_scripts(pkgJson) {
    if (pkgJson == null)
        return {};
    const { scripts } = pkgJson;
    if (scripts == null)
        return {};
    return scripts;
}
export function getCommonPrefix(paths) {
    if (paths.length === 0)
        return "";
    if (paths.length === 1)
        return paths[0];
    // Split each path into parts (e.g., by "/" or "\\")
    const splitPaths = paths.map(p => p.split(/[\\/]+/));
    const commonParts = [];
    const first = splitPaths[0];
    for (let i = 0; i < first.length; i++) {
        const part = first[i];
        if (splitPaths.every(p => p[i] === part)) {
            commonParts.push(part);
        }
        else {
            break;
        }
    }
    // Join back with "/" (or use path.join for platform-specific behavior)
    return path.join(...commonParts);
}
function f(a) {
    if (a == null)
        return 'null';
    return a;
}
function normalize_watch(a) {
    if (a == null)
        return [];
    if (typeof a === 'string')
        return [a];
    return a;
}
function watchers_to_runners(pkgPath, watchers, scripts) {
    const $watch = watchers.$watch; // is is this wierd
    const ans = [];
    for (const [name, v] of Object.entries(watchers)) {
        if (name === '$watch')
            continue;
        const watcher = function () {
            if (typeof v === 'string' || is_string_array(v)) {
                return { watch: normalize_watch(v) };
            }
            return v;
        }();
        const script = scripts[name];
        if (script == null) {
            console.warn(`missing script ${name}`);
            continue;
        }
        const runner = function () {
            return {
                ...watcher, //i like this
                name,
                script,
                cwd: path.dirname(pkgPath),
                watch: [...normalize_watch($watch), ...normalize_watch(watcher.watch)] //todo: dedup
            };
        }();
        ans.push(runner);
    }
    return ans;
}
export async function read_package_json(full_pathnames) {
    const folder_index = {}; //by full_pathname
    async function f(full_pathname, name) {
        const pkgPath = path.resolve(path.normalize(full_pathname), "package.json");
        const d = path.resolve(full_pathname);
        const exists = folder_index[d];
        if (exists != null) {
            console.warn(`${pkgPath}: skippin, already done`);
            return exists;
        }
        const pkgJson = await read_json_object(pkgPath, 'package.json');
        if (pkgJson == null)
            return null;
        console.warn(`${green}${pkgPath}${reset}`);
        const watchers = parse_watchers(pkgPath, pkgJson);
        const scripts = parse_scripts(pkgJson);
        const runners = watchers_to_runners(pkgPath, watchers, scripts);
        const { workspaces } = pkgJson;
        const folders = [];
        if (is_string_array(workspaces))
            for (const workspace of workspaces) {
                const ret = await f(path.join(full_pathname, workspace), workspace);
                if (ret != null)
                    folders.push(ret);
            }
        const ans = { runners, folders, name, full_pathname, watchers };
        return ans;
    }
    const folders = [];
    for (const full_pathname of full_pathnames) {
        const ret = await f(full_pathname, path.basename(full_pathname));
        if (ret != null)
            folders.push(ret);
    }
    const root = {
        name: 'root',
        full_pathname: '',
        folders,
        runners: [],
        watchers: {}
    };
    //const keys=Object.keys(ans)
    //const common_prefix=getCommonPrefix(keys)
    //const extra={keys,common_prefix}
    //await mkdir_write_file('generated/extra.json',JSON.stringify(extra,null,2))
    await mkdir_write_file('generated/packages.json', JSON.stringify(root, null, 2));
    return root;
}
/*export function collect_runners(dirs: string[]){
  const watchers=read_package_json(dirs)
  const common=getCommonPrefix(Object.keys(watchers))
  const ans:Runner[]=[]

  const dirs=await get_dirs(top_workspaces)
  for (const run_dir of dirs){
    for (const base of ['','bin']){
      const glob_pat=path.join(run_dir,base,'watch_*.{ts,js,mjs}')
      console.log(glob_pat)
      for await (const full_filename of glob(glob_pat)) {
        console.log(full_filename)
        const relative_filename=path.relative(common,full_filename)
        ans.push({relative_filename,full_filename,run_dir})

      }
    }
  }
  return ans
}*/ 
