import {read_package_json} from './index.js'
import {is_object} from '@yigal/base_types'
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
async function run_tests(tests: Record<string, TestFunc>) {
  let passed = 0
  let failed = 0

  for (const [name, fn] of Object.entries(tests)) {
    try {
      const result = await resolve_maybe_promise(fn())
      
      if (result) {
        console.log(`✅ ${name}`)
        passed++
      } else {
        console.error(`❌ ${name}`)
        failed++
      }
    } catch (err) {
      console.error(`💥 ${name} threw an error:`, err)
      failed++
    }
  }
  console.log(`\nSummary: ${passed} passed, ${failed} failed.`)  
}
async function checkit(){
  const packages=await read_package_json(['.'])
  return Object.keys(packages).length===3
}
if (import.meta.main) {
  void run_tests({
    'run on self': checkit
  })
}
 
 