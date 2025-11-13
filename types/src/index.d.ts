import { z } from "zod";
export declare const WatchersSchema: z.ZodRecord<z.ZodString, z.ZodObject<{
    cmd: z.ZodString;
    watch: z.ZodArray<z.ZodString>;
    env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    filter: z.ZodOptional<z.ZodString>;
}, z.core.$strict>>;
export type Watchers = z.infer<typeof WatchersSchema>;
export declare function read_package_json(dirs: string[]): Promise<Record<string, object>>;
