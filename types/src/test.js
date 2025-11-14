import { read_package_json } from './index.js';
import { run_tests } from '@yigal/base_types';
async function checkit() {
    const packages = await read_package_json(['C:\\yigal\\million_try3']);
    return Object.keys(packages).length === 3;
}
async function get_package_json_length() {
    const ans = await read_package_json(['C:\\yigal\\million_try3', '.']);
    return Object.keys(ans).length;
}
if (import.meta.main) {
    void run_tests({
        k: 'run on self',
        v: 4,
        f: get_package_json_length
    });
}
