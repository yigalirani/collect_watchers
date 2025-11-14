import {read_package_json} from './index.js'
import {is_object,Atom} from '@yigal/base_types'
export function is_promise<T=void>(value: unknown): value is Promise<T> { ///ts(2677)
  if (!is_object(value))
    return false

  const ans=typeof (value.then)==='function'
  return ans
}
type MaybePromise<T>=T|Promise<T>
async function resolve_maybe_promise<T>(a:MaybePromise<T>){
  if (is_promise(a))
    return await a
  return a
}
      
type TestFunc=()=>MaybePromise<boolean>
interface Test{
  k:string,
  v?:Atom,
  f:()=>MaybePromise<Atom>
}

async function run_tests(...tests: Test[]) {
  let passed = 0
  let failed = 0

  for (const {k,v,f} of tests) {
    try {
      const ret=f()
      const effective_v=v??false
      const resolved = await resolve_maybe_promise(ret)
      if (resolved===effective_v){
        console.log(`✅ ${k}:${effective_v}`)
        passed++
      } else {
        console.error(`❌ ${k}:${v}=>${resolved}`)
        failed++
      }
    } catch (err) {
      console.error(`💥 ${k} threw an error:`, err)
      failed++
    }
  }
  console.log(`\nSummary: ${passed} passed, ${failed} failed.`)  
}
async function checkit(){
  const packages=await read_package_json(['C:\\yigal\\million_try3'])
  return Object.keys(packages).length===3
}
async function get_package_json_length(){
  const ans=await read_package_json(['C:\\yigal\\million_try3'])
  return Object.keys(ans).length
}
if (import.meta.main) {
  void run_tests({
    k:'run on self',
    v:3,
    f:get_package_json_length
  })
}
 
 