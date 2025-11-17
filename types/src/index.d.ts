import { z } from "zod";
export declare const WatcherSchema: z.ZodObject<{
    cmd: z.ZodString;
    watch: z.ZodOptional<z.ZodArray<z.ZodString>>;
    env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>>;
}, z.core.$strict>;
export declare const WatchersRecordSchema: z.ZodRecord<z.ZodString, z.ZodObject<{
    cmd: z.ZodString;
    watch: z.ZodOptional<z.ZodArray<z.ZodString>>;
    env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>>;
}, z.core.$strict>>;
export declare const WatchersSimpleSchema: z.ZodObject<{
    watch: z.ZodArray<z.ZodString>;
}, z.core.$strict>;
export declare const WatchersSchema: z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodObject<{
    cmd: z.ZodString;
    watch: z.ZodOptional<z.ZodArray<z.ZodString>>;
    env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>>;
}, z.core.$strict>>, z.ZodObject<{
    watch: z.ZodArray<z.ZodString>;
}, z.core.$strict>]>;
export type Watchers = z.infer<typeof WatchersSchema>;
export declare function read_package_json(dirs: string[]): Promise<Record<string, object>>;
