import { z } from "zod";
export declare const WatcherSchema: z.ZodObject<{
    cmd: z.ZodString;
    watch: z.ZodArray<z.ZodString>;
    env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    filter: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare const WatchersSchema: z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodObject<{
    cmd: z.ZodString;
    watch: z.ZodArray<z.ZodString>;
    env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    filter: z.ZodOptional<z.ZodString>;
}, z.core.$strict>, z.ZodString]>>;
export type Watchers = z.infer<typeof WatchersSchema>;
export declare function read_package_json(dirs: string[]): Promise<Record<string, object>>;
