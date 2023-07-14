// @ts-ignore
import { Mutex } from 'async-mutex';
import { Result } from '../utils/result';

export enum CacheDatabaseError {
    NotFound,
    InternalError,
}

export class CacheDatabase {
    private static mutex: Mutex = new Mutex();
    private static database: Map<string|number, any> = new Map<string|number, any>();

    public static async get(key: string|number): Promise<Result<any, any>> {
        const release = await this.mutex.acquire();
        try {
            const result = this.database.get(key);
            release();
            if(result == null) {
                return Result.Err(CacheDatabaseError.NotFound);
            }
            return Result.Ok(this.database.get(key));
        } catch (error) {
            release();
            // console.error(error)
            return Result.Err(CacheDatabaseError.InternalError);
        }
    }

    public static async set(key: string|number, value: any): Promise<Result<any, any>> {
        const release = await this.mutex.acquire();
        try {
            this.database.set(key, value);
            return Result.Ok(null);
        } catch (error) {
            console.error(error);
            return Result.Err(CacheDatabaseError.InternalError);
        } finally {
            release();
        }
    }
}