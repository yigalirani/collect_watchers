import { z } from "zod";
import { promises as fs } from "fs";
import * as path from "path";
import { is_object,get_error } from "@yigal/base_types";
import { UnknownKeysParam } from "zod/v3";
export const WatchersSchema = z.record(
  z.string(),
  z.object({
    cmd: z.string(),
    watch: z.array(z.string()),
    env:z.record(z.string(),z.string()).optional(),
    filter:z.string().optional()
  }).strict()
);

export type Watchers = z.infer<typeof WatchersSchema>;
interface Runner {
  name:string 
  cmd:string
  full_filename: string; //where the packahe.json is 
  env:Record<string,string>
  filter?:string
}
function getCommonPrefix(paths: string[]): string {
  if (paths.length === 0) return "";
  if (paths.length === 1) return paths[0];

  // Split each path into parts (e.g., by "/" or "\\")
  const splitPaths = paths.map(p => p.split(/[\\/]+/));

  const commonParts: string[] = [];
  const first = splitPaths[0];

  for (let i = 0; i < first.length; i++) {
    const part = first[i];
    if (splitPaths.every(p => p[i] === part)) {
      commonParts.push(part);
    } else {
      break;
    }
  }

  // Join back with "/" (or use path.join for platform-specific behavior)
  return commonParts.join("/");
}
async function mkdir_write_file(filePath:string,data:string){
  const directory=path.dirname(filePath);
  try{
    await fs.mkdir(directory,{recursive:true});
    await fs.writeFile(filePath,data);
    console.log(`File '${filePath}' has been written successfully.`);
  } catch (err){
    console.error('Error writing file',err)
  }
}
async function read_json_object(filename:string,object_type:string){
  try{
    const data=await fs.readFile(filename, "utf-8");
    const ans=JSON.parse(data) as unknown
    if (!is_object(ans))
      throw `not a valid ${object_type}`
    return ans
  }catch(ex:unknown){
    console.warn(`${filename}:get_error(ex).message`)
    return undefined
  }
}
export async function read_package_json(
  dirs: string[]
): Promise<Record<string, object>> {
  const ans: Record<string, object> = {};
  async function f(dirs: string[]){
    for (const dir of dirs) {
      const pkgPath = path.resolve(dir, "package.json");
      if (ans[pkgPath]!=null){
        console.warn(`${pkgPath}: skippin, already done`)
        continue
      }
      
      const pkgJson = await read_json_object(pkgPath,'package.json')
      if (pkgJson==null)
        continue
      ans[dir]=pkgJson.watchers||{}
      const {workspaces} = pkgJson
      if (!Array.isArray(workspaces))
        continue
      for (const workspace of workspaces)
        if (typeof workspace==='string')
          await f([path.join(dir,workspace)])

    }
  }
  await f(dirs)
  await mkdir_write_file('packages.json',JSON.stringify(ans,null,2))
  return ans
}
