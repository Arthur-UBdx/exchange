import { SQLDatabase } from '../../database/sql_database';
import { CacheDatabase } from '../../database/cache_database';
import { Result } from '../../utils/result';
import { Client } from 'pg';
import { createHash, timingSafeEqual, randomBytes } from 'crypto';

const sql_database = new SQLDatabase();
const cache_database = new CacheDatabase();

class Userbase {
    public static async create_user(username: string, email: string, password: string, remember_me: boolean): Promise<Result<string, any>> {    
        const session_id: string|null = remember_me ? randomBytes(64).toString('hex') : null;
        const salt: string = randomBytes(64).toString('hex');
        const hashed_password = createHash('sha3-256').update(password + salt).digest('hex');
        const result: Result<any, any> = await sql_database.execute()
            .insert_row('users', {username: username, email: email, password: hashed_password, salt: salt, auth_level: 0, status: 0, session_id: session_id})
            .execute_queries()

        if(result.is_err()) {
            return Result.Err(result.unwrap_err());
        } else {
            return Result.Ok(session_id);
        }
    }

    public static async login_user(username: string, password: string): Promise<Result<string, any>> {
        const db_client = await sql_database.open_connection();
        const query = 'SELECT * FROM users WHERE username = $1 OR email = $2';
        const values = [username, username];
        const result = await sql_database.execute_query(db_client, {text: query, values: values});
    
        if(result.is_err()) {
            return Result.Err(result.unwrap_err());
        }
    
        const rows = result.unwrap().rows;
        if(rows.length === 0) {
            sql_database.close_connection(db_client);
            return Result.Ok(null);
        }

        const now: Date = new Date();

        const user = rows[0];
        const salt: string = user.salt;
        const hashed_password: string = user.password;    
        const hash = createHash('sha256').update(password + salt).digest('hex');

        if(timingSafeEqual(Buffer.from(hash), Buffer.from(hashed_password))) {
            sql_database.close_connection(db_client);
            return Result.Ok(user.session_id);
        }
    }

    public static async logoff_user(session_id: string): Promise<Result<null, any>> {
        const text = 'UPDATE users SET session_id = NULL WHERE session_id = $1';
        const values = [session_id];

        const result: Result<any, any> = await sql_database.execute().new_query(text, values).execute_queries();
        if(result.is_err()) {
            return Result.Err(result.unwrap_err());
        }
        return Result.Ok(null);
    }
}