import pool from './sql_database_connector';
import { QueryConfig, Pool, Client } from 'pg';
import { Result } from '../utils/result';

export class SQLDatabase {
    private pool: Pool;
    private queryList: QueryConfig[];

    constructor() {
        this.pool = new pool
        this.queryList = [];
    }

    public execute(): this {
        return this
    }

    public async open_connection(): Promise<Result<Client, any>> {
        try {
            const client: Client = await this.pool.connect();
            return Result.Ok(client);
        }
        catch (error) {
            return Result.Err(error);
        }
    }
    
    public async close_connection(client: Client): Promise<Result<null, any>> { 
        try {
            await client.release();
            return Result.Ok(null);
        } catch (error) {
            return Result.Err(error);
        }
    }

    public async execute_query(client: Client, query: QueryConfig): Promise<Result<any, any>> {
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
            const client = await this.pool.connect();
            try {
                await client.query('BEGIN');
                
                for(const query of this.queryList) {
                    const result: any = await client.query(query);
                    results.push(result);
                }
                await client.query('COMMIT');
            } catch (error) {
                await client.query('ROLLBACK');
                return Result.Err(error);
            } finally {
                client.release();
            }
        } catch (error) {
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
        console.log(query);
        this.queryList.push(query);
        return this;
    } 

    public update_row(table: string, key: string, key_column: string, data: Map<string, string>): this {
        const column_names = Array.from(data.keys());
        const values = Array.from(data.values());
        const values_placeholder = values.map((_, index) => `$${index + 1}`);

        const query: QueryConfig = {
            text: `UPDATE ${table} SET (${column_names.join(', ')}) = (${values_placeholder.join(', ')}) WHERE ${key_column} = $${values.length + 1}`,
            values: values.concat(key),
        }
        console.log(query);
        this.queryList.push(query);
        return this;
    }

    public remove_row(table: string, key: string, key_column: string): this {
        const query: QueryConfig = {
            text: `DELETE FROM ${table} WHERE ${key_column} = $1`,
            values: [key],
        }
        console.log(query);
        this.queryList.push(query);
        return this;
    }

    public get_row(table: string, key: string, key_column: string): this {
        const query: QueryConfig = {
            text: `SELECT * FROM ${table} WHERE ${key_column} = $1`,
            values: [key],
        }
        console.log(query);
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