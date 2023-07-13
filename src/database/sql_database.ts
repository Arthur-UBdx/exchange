import pool from './sql_database_connector';
import { QueryConfig, Pool, Client } from 'pg';
import { Result } from '../utils/result';
import { exec } from 'child_process';

export class SQLDatabase {
    private queryList: QueryConfig[];

    constructor() {
        this.queryList = [];
    }

    public async open_connection(): Promise<Result<PoolClient, any>> {
        try {
            const client: PoolClient = await pool.connect();
            return Result.Ok(client);
        }
        catch (error) {
            return Result.Err(error);
        }
    }
    
    public async close_connection(client: PoolClient): Promise<Result<null, any>> { 
        try {
            await client.release();
            return Result.Ok(null);
        } catch (error) {
            return Result.Err(error);
        }
    }

    public async execute_query_client(client: PoolClient, query: QueryConfig): Promise<Result<any, any>> {
        try {
            const result = await client.query(query);
            return Result.Ok(result);
        } catch (error) {
            return Result.Err(error);
        }
    }

    public async execute_queries(): Promise<Result<any[], any>> {
        let results: any[] = [];
        try {
            const client = await pool.connect();
            try {
                await client.query('BEGIN');
                console.log('BEGIN');
                
                for(const query of this.queryList) {
                    const result: any = await client.query(query);
                    console.log(query);
                    results.push(result);
                }
                await client.query('COMMIT');
                console.log('COMMIT');
            } catch (error) {
                await client.query('ROLLBACK');
                console.error(error);
                return Result.Err(error);
            } finally {
                client.release();
            }
        } catch (error) {
            console.error(error)
            return Result.Err(error);
        } finally {
            this.queryList = [];
            return Result.Ok(results);
        }
    }

    public insert_row(table: string, data: object): this {
        const column_names = Array.from(Object.keys(data));
        const values = Array.from(Object.values(data));
        const values_placeholder = values.map((_, index) => `$${index + 1}`);
        
        const query: QueryConfig = {
            text: `INSERT INTO ${table} (${column_names.join(', ')}) VALUES (${values_placeholder.join(', ')})`,
            values: values,
        }
        this.queryList.push(query);
        return this;
    } 

    public update_row(table: string, key_column: string, key: string|number, data: Map<string, string>): this {
        const column_names: string[] = Array.from(data.keys());
        const values: (string|number)[] = Array.from(data.values());
        const values_placeholder = values.map((_, index) => `$${index + 1}`);
        values.push(key);

        const query: QueryConfig = {
            text: `UPDATE ${table} SET (${column_names.join(', ')}) = (${values_placeholder.join(', ')}) WHERE ${key_column} = $${values.length + 1}`,
            values: values,
        }
        this.queryList.push(query);
        return this;
    }

    public remove_row(table: string, key_column: string, key: string|number): this {
        const query: QueryConfig = {
            text: `DELETE FROM ${table} WHERE ${key_column} = $1`,
            values: [key],
        }
        this.queryList.push(query);
        return this;
    }

    public get_row(table: string, key_column: string, key: string|number): this {
        const query: QueryConfig = {
            text: `SELECT * FROM ${table} WHERE ${key_column} = $1`,
            values: [key],
        }
        this.queryList.push(query);
        return this;
    }

    public new_query(text: string, values: any[]): this {
        const query: QueryConfig = {
            text: text,
            values: values,
        };
        this.queryList.push(query);
        return this;
    }
}