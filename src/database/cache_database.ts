// @ts-ignore
import { Mutex } from 'async-mutex';
import { Result } from '../utils/result';

export class CacheDatabase {
    private static mutex: Mutex = new Mutex();
    private static database: Map<string, any> = new Map<string, any>();

    public static async get(key: string): Promise<Result<any, any>> {
        const release = await this.mutex.acquire();
        try {
            return Result.Ok(this.database.get(key));
        } catch (error) {
            return Result.Err(error);
        } finally {
            release();
        }
    }

    public static async set(key: string, value: any): Promise<Result<any, any>> {
        const release = await this.mutex.acquire();
        try {
            this.database.set(key, value);
            return Result.Ok(null);
        } catch (error) {
            return Result.Err(error);
        } finally {
            release();
        }
    }
}