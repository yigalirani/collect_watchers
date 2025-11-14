import { z, ZodError } from "zod";
import * as path from "path";
import { get_error, mkdir_write_file, read_json_object, red, reset, yellow } from "@yigal/base_types";
export const WatchersSchema = z.record(z.string(), z.object({
    cmd: z.string(),
    watch: z.array(z.string()),
    env: z.record(z.string(), z.string()).optional(),
    filter: z.string().optional()
}).strict());
function padRight(str, length, padChar = ' ') {
    if (str.length >= length)
        return str;
    return str + padChar.repeat(length - str.length);
}
function format_zod_error(error) {
    const block = error.issues.map(issue => {
        const path = padRight(issue.path.join('/'), 50);
        const message = issue.message.replace(/expected (\w+)/, (_, expectedWord) => `expected ${yellow}${expectedWord}${reset}`)
            .replace(/received (\w+)/, (_, receivedWord) => `received ${red}${receivedWord}${reset}`);
        return `  ${path}:   ${message}`;
    }).join('\n');
    return `\n${block}`;
}
function parse_watchers(filename, pkgJson) {
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
            console.warn(filename, format_zod_error(ex));
        else
            console.warn(`${filename}:${get_error(ex).message}`);
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
