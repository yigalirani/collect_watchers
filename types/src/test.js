import { read_package_json } from './index.js';
import { run_tests } from '@yigal/base_types';
async function get_package_json_length() {
    const ans = await read_package_json(['c:\\yigal\\collect_watchers', 'c:\\yigal\\million_try3']);
    return Object.keys(ans).length;
}
if (import.meta.main) {
    void run_tests({
        k: 'run on self',
        v: 5,
        f: get_package_json_length
    });
}
