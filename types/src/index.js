import { z } from "zod";
import { promises as fs } from "fs";
import * as path from "path";
import { is_object } from "@yigal/base_types";
export const WatchersSchema = z.record(z.string(), z.object({
    cmd: z.string(),
    watch: z.array(z.string()),
    env: z.record(z.string(), z.string()).optional(),
    filter: z.string().optional()
}).strict());
function getCommonPrefix(paths) {
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
    return commonParts.join("/");
}
async function read_json_object(filename, object_type) {
    try {
        const data = await fs.readFile(filename, "utf-8");
        const ans = JSON.parse(data);
        if (!is_object(ans))
            throw `not a valid ${object_type}`;
        return ans;
    }
    catch (ex) {
        console.warn(`${filename}:get_error(ex).message`);
        return undefined;
    }
}
export async function read_package_json(dirs) {
    const ans = {};
    async function f(dirs) {
        for (const dir of dirs) {
            const pkgPath = path.resolve(dir, "package.json");
            if (ans[pkgPath] !== null) {
                console.warn(`${pkgPath}: skippin, already done`);
                continue;
            }
            const pkgJson = await read_json_object(pkgPath, 'package.json');
            if (pkgJson == null)
                continue;
            ans[dir] = pkgJson;
            const { workspaces } = pkgJson;
            if (!Array.isArray(workspaces))
                continue;
            for (const workspace of workspaces)
                if (typeof workspace === 'string')
                    await f([path.join(dir, workspace)]);
        }
    }
    await f(dirs);
    return ans;
}
