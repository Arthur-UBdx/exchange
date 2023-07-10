import pool from './database_connector';
import { Result } from '../rust-std/result';

export class Database {
    private static map_to_query(map: Map<any, any>): Result<string, string> {
        try {
            let query = '';
            for(const [key, value] of map) {
                query += `${key} = ${value}, `;
            }
            return Result.Ok(query.slice(0, -2)); //remove end comma and space
        } catch (error) {
            return Result.Err(error);
        }
    }

    public static async query(query: string, values: any[]): Promise<Result<any, string>> {
        try {
            const client = await pool.connect();
            const result = await client.query(query, values);
            client.release();
            return Result.Ok(result);
        } catch (error) {
            return Result.Err(error);
        }
    }

    public static async get_row(table: string, key_column: string, key: string): Promise<Result<any, string>> {
        const query = `SELECT * FROM ${table} WHERE ${key_column} = $1`;
        const values = [key];
        const result = await Database.query(query, values);
        return result
    }

    public static async update_row(table: string, key_column: string, key: string, values: Map<any, any>): Promise<Result<any, string>> {
        const values_to_query: Result<string, string> = Database.map_to_query(values);
        if(values_to_query.is_err()) return values_to_query;
        
        try {
            const query: string = `UPDATE ${table} SET ${values_to_query.unwrap()} WHERE ${key_column} = $1`;
            Database.query(query, [key]);
            return Result.Ok(null);
        } catch (error) {
            return Result.Err(error);
        }
    }

    public static async insert_row(table: string, values: Map<any, any>): Promise<Result<any, string>> {
        const values_to_query: Result<string, string> = Database.map_to_query(values);
        if(values_to_query.is_err()) return values_to_query;

        try {
            const query: string = `INSERT INTO ${table} SET ${values_to_query.unwrap()}`;
            Database.query(query, []);
            return Result.Ok(null);
        }
        catch (error) {
            return Result.Err(error);
        }
    }

    public static async delete_row(table: string, key_column: string, key: string): Promise<Result<any, string>> {
        try {
            const query: string = `DELETE FROM ${table} WHERE ${key_column} = $1`;
            Database.query(query, [key]);
            return Result.Ok(null);
        } catch (error) {
            return Result.Err(error);
        }
    }
}