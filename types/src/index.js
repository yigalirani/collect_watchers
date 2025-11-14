import { z, ZodError } from "zod";
import * as path from "path";
import { get_error, mkdir_write_file, read_json_object, red, reset, yellow, green } from "@yigal/base_types";
export const WatcherSchema = z.object({
    cmd: z.string(),
    watch: z.array(z.string()),
    env: z.record(z.string(), z.string()).optional(),
    filter: z.string().optional()
}).strict();
export const WatchersSchema = z.record(z.string(), z.union([WatcherSchema, z.string()]));
function padRight(str, length, padChar = ' ') {
    if (str.length >= length)
        return str;
    return str + padChar.repeat(length - str.length);
}
function format_message(path, message) {
    const fmt_message = message.replace(/expected (\w+)/, (_, expectedWord) => `expected ${yellow}${expectedWord}${reset}`)
        .replace(/received (\w+)/, (_, receivedWord) => `received ${red}${receivedWord}${reset}`);
    return `  ${padRight(path.join('/'), 50)}:   ${fmt_message}`;
}
function format_zod_error(ex) {
    const top = JSON.parse(ex);
    const log = [];
    function f(ar, acum_path) {
        const { errors, message } = ar;
        const path = ar.path;
        if (Array.isArray(path)) {
            acum_path = [...acum_path, ...path];
        }
        if (Array.isArray(errors)) {
            for (const er of errors)
                f(er, acum_path);
            return;
        }
        if (Array.isArray(ar)) {
            for (const er of ar)
                f(er, acum_path);
            return;
        }
        log.push(format_message(acum_path, message));
    }
    f(top[0], []);
    return log.join('\n');
}
function parse_watchers(filename, pkgJson) {
    console.warn(`${green}${filename}${reset}`);
    if (pkgJson == null)
        return {};
    const { watchers } = pkgJson;
    if (watchers == null)
        return {};
    try {
        return WatchersSchema.parse(watchers);
    }
    catch (ex) {
        if (ex instanceof ZodError)
            console.warn(format_zod_error(ex.message));
        else
            console.warn(get_error(ex).message);
    }
    return {};
}
export async function read_package_json(dirs) {
    const ans = {};
    async function f(dirs) {
        for (const dir of dirs) {
            const pkgPath = path.resolve(dir, "package.json");
            if (ans[pkgPath] != null) {
                console.warn(`${pkgPath}: skippin, already done`);
                continue;
            }
            const pkgJson = await read_json_object(pkgPath, 'package.json');
            if (pkgJson == null)
                continue;
            ans[dir] = parse_watchers(pkgPath, pkgJson);
            const { workspaces } = pkgJson;
            if (!Array.isArray(workspaces))
                continue;
            for (const workspace of workspaces)
                if (typeof workspace === 'string')
                    await f([path.join(dir, workspace)]);
        }
    }
    await f(dirs);
    await mkdir_write_file('generated/packages.json', JSON.stringify(ans, null, 2));
    return ans;
}
