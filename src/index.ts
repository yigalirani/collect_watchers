import * as path from "path";
import {is_object,get_error,mkdir_write_file,read_json_object ,s2u,reset,green} from "@yigal/base_types";
interface Watcher{
  cmd:string,
  watch?:string[]|string  
  env?:Record<string,string|number>
  filter?:string
}
export type Watchers =Record<string,Watcher>|{
  watch:string[] 
}
interface Runner {
  name:string 
  cmd:string
  full_filename: string; //where the packahe.json is 
  env:Record<string,string>
  filter?:string
}
function is_valid_watch(a:unknown){
  if (a==null)
    return true
  if (typeof a === 'string')
    return true
  if (!Array.isArray(a))
    return false
  for (const x of a)
    if (typeof x!=='string')
      return false
  return true
}
function is_valid_watcher(a:unknown){
  if (!is_object(a))
    return "expecting object"
  if (!is_valid_watch(a.watch)){
    return 'watch: expecting string or array of strings'
  }
  if (typeof a.cmd!=='string')
    return "cmd is mandatory of string type"
  for (const k of Object.keys(a))
    if (!['watch','cmd','env','filter'].includes(k))
      return `${k}:invalid key`
  return true
}
function is_watchers2(a:unknown){
  if (!is_object(a))
    return false
  const {watch}=a
  if (!is_valid_watch(watch)){
    console.log('watch: must be string or array of string')
    return false  
  }
  for (const [k,v] of Object.entries(a)){
    if (k==='watch')
      continue
    const valid_watcher=is_valid_watcher(v)
    if (valid_watcher!==true){
      console.log(`${k}: invalid watcher:${valid_watcher}`)
      return false
    }

  }
  return true

}
function parse_watchers(filename:string,pkgJson:s2u|undefined):Watchers{
  console.warn(`${green}${filename}${reset}`)
  if (pkgJson==null)
    return{}
  const {watchers}=pkgJson
  if (watchers==null)
    return {}
  const ans=is_watchers2(watchers);
  if (ans)
    return watchers as Watchers
  console.warn(ans)
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
