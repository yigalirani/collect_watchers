interface Watcher {
    watch?: string[] | string;
    env?: Record<string, string | number>;
    filter?: string;
}
export type Watchers = Record<string, Watcher> | {
    $watch: string[];
};
interface Runner extends Watcher {
    cwd: string;
    name: string;
    script: string;
}
interface Folder {
    name: string;
    full_pathname: string;
    folders: Array<Folder>;
    runners: Array<Runner>;
    watchers: Watchers;
}
export declare function getCommonPrefix(paths: string[]): string;
export declare function read_package_json(full_pathnames: string[]): Promise<Folder>;
export {};
