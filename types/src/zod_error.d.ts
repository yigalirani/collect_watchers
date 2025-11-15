interface Error {
    path: string;
    message: string;
}
interface Error {
    path: string;
    message: string;
}
export declare function consolidate_errors(log: Error[]): Error[];
export declare function format_zod_error(ex: string): string;
export {};
