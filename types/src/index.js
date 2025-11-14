import { z } from "zod";
import * as path from "path";
import { mkdir_write_file, read_json_object } from "@yigal/base_types";
export const WatchersSchema = z.record(z.string(), z.object({
    cmd: z.string(),
    watch: z.array(z.string()),
    env: z.record(z.string(), z.string()).optional(),
    filter: z.string().optional()
}).strict());
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
            ans[dir] = pkgJson.watchers || {};
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
