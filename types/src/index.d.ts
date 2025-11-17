interface Watcher {
    cmd: string;
    watch?: string[] | string;
    env?: Record<string, string | number>;
    filter?: string;
}
export type Watchers = Record<string, Watcher> | {
    watch: string[];
};
export declare function read_package_json(dirs: string[]): Promise<Record<string, object>>;
export {};
