import { SQLDatabase } from "../../../database/sql_database";
import { Result } from "../../../utils/result";
import { QueryConfig } from 'pg';
import { Asset } from '../../../database/sql_models'

const sql_database = new SQLDatabase();

export async function get_currencies(): Promise<Result<Asset[], string>> {
    const query:QueryConfig = {text: `SELECT * FROM assets WHERE reserve > 0`, values: []};
    const result = await sql_database
        .new_query(query).execute_queries();

    if(result.is_err()) {
        console.error(result.unwrap_err());
        return Result.Err('Internal Error');
    }
    return Result.Ok(result.unwrap()[0].rows);
}