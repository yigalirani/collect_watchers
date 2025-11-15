import { s2u,red,reset,yellow} from "@yigal/base_types";

function padRight(str: string, length: number, padChar: string = ' '): string {
    if (str.length >= length) return str;
    return str + padChar.repeat(length - str.length);
}
function format_message(input: string): string {


  let output = input;

  // Highlight text after "expected" and before "received"
  output = output.replace(
    /(expected)(.*?)(received)/i,
    (_, exp, mid, rec) =>
      exp + yellow + mid + reset + rec
  );

  // Highlight text after "received:"
  output = output.replace(
    /(received:)(.*)$/i,
    (_, rec, after) => rec + red + after + reset
  );

  // Highlight all occurrences of "mandatory"
  output = output.replace(/mandatory/gi, match => red + match + reset);

  return output;
}
interface Error{
  path:string
  message:string
}

interface Error {
  path: string
  message: string
}

function processGroup(group: Error[], ans: Error[]) {
  if (group.length === 1) {
    ans.push(group[0])
    return
  }

  const path = group[0].path
  const msgs = group.map(g => g.message)

  // --- Rule 1: all end with 'undefined'
  const allUndefined = msgs.every(m => m.trim().endsWith("undefined"))
  if (allUndefined) {
    ans.push({ path, message: "missing mandatory field" })
    return
  }

  // --- Rule 2:
  // Pattern: Invalid input: expected <X>, received <Y>
  const regex = /^Invalid input: expected (.+), received (.+)$/

  const expected: string[] = []
  let received: string | null = null

  for (const m of msgs) {
    const match = m.match(regex)
    if (!match) {
      // not matching consolidation rule → copy individually
      for (const g of group) ans.push(g)
      return
    }

    const exp = match[1]
    const rec = match[2]

    expected.push(exp)

    if (received === null) received = rec
    else if (received !== rec) {
      // mismatched received → can't consolidate
      for (const g of group) ans.push(g)
      return
    }
  }

  // Merge expected values
  const mergedExpected = expected.join(" or ")

  ans.push({
    path,
    message: `Invalid input: expected ${mergedExpected}, received: ${received}`
  })
}
export function consolidate_errors(log: Error[]) {
  const ans: Error[] = []

  // Group by path (using "last_path" style, without map)
  let last_path = ""
  let group: Error[] = []

  for (const e of log) {
    if (e.path !== last_path) {
      if (group.length > 0) processGroup(group, ans)
      group = [e]
      last_path = e.path
    } else {
      group.push(e)
    }
  }
  if (group.length) processGroup(group, ans)

  return ans
}




export function format_zod_error(ex:string){
  //console.log('orig',ex)
  const top=JSON.parse(ex) as Array<s2u>
  const log:Error[]=[]

  function f(ar:s2u,acum_path:string[],level:number){
    const {errors,message}=ar
    const path=ar.path as string[]
    if (Array.isArray(path)){
      acum_path=[...acum_path,...path] as string[]
    }
    if (Array.isArray(errors)){
      for (const er of errors)
          f(er as s2u,acum_path,level+1)
      return
    }
    if (Array.isArray(ar)){
      for (const er of ar)
          f(er as s2u,acum_path,level+1)
      return
    }
    //consolide_errors(log)

    log.push({path:acum_path.join('/'),message:message as string})
    
  }
  f(top[0],[],0)
  const log2=consolidate_errors(log)  
  return log2.map(x=>`${padRight(x.path,40)}:${format_message(x.message)}`).join('\n')
}