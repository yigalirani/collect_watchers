import { z,ZodError} from "zod";
import * as path from "path";
import {get_error,mkdir_write_file,read_json_object ,s2u,reset,green} from "@yigal/base_types";
import {format_zod_error} from './zod_error.js'

export const WatcherSchema = z.object({
  cmd: z.string(),
  watch: z.array(z.string()).optional(),
  env: z.record(z.string(),z.union([z.string(), z.number()])).optional(),
}).strict();

// Record<string, Watcher>
export const WatchersRecordSchema = z.record(z.string(),WatcherSchema);

// { watch: string[] }
export const WatchersSimpleSchema = z.object({
  watch: z.array(z.string()),
}).strict();

// Union of the two possibilities
export const WatchersSchema = z.union([
  WatchersRecordSchema,
  WatchersSimpleSchema,
]);
export type Watchers = z.infer<typeof WatchersSchema>;
interface Runner {
  name:string 
  cmd:string
  full_filename: string; //where the packahe.json is 
  env:Record<string,string>
  filter?:string
}

function parse_watchers(filename:string,pkgJson:s2u|undefined):Watchers{
  console.warn(`${green}${filename}${reset}`)
  if (pkgJson==null)
    return{}
  const {watchers}=pkgJson
  if (watchers==null)
    return {}
  try{
    return WatchersSchema.parse(watchers);
  }catch(ex){
    if (ex instanceof ZodError)
      console.warn(format_zod_error(ex.message))
    else
      console.warn(get_error(ex).message)

  }
  return {}
  
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
      ans[dir]=parse_watchers(pkgPath,pkgJson)
      const {workspaces} = pkgJson
      if (!Array.isArray(workspaces))
        continue
      for (const workspace of workspaces)
        if (typeof workspace==='string')
          await f([path.join(dir,workspace)])

    }
  }
  await f(dirs)
  await mkdir_write_file('generated/packages.json',JSON.stringify(ans,null,2))
  return ans
}
