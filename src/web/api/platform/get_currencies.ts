import { SQLDatabase } from "../../../database/sql_database";
import { Result } from "../../../utils/result";
import { Wallet } from '../../../database/sql_models'

export interface Currency {
    id: number;
    symbol: string;
    name: string;
    reserve?: number;
    assigned?: number;
}

const sql_database = new SQLDatabase();

export async function get_currencies(): Promise<Result<Currency[], string>> {
    const query = `SELECT * FROM assets WHERE reserve > 0`;
    const result = await sql_database
        .new_query(query, []).execute_queries();

    if(result.is_err()) {
        console.error(result.unwrap_err());
        return Result.Err('Internal Error');
    }
    return Result.Ok(result.unwrap()[0].rows);
}