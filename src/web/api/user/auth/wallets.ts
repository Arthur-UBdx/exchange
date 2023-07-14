import { SQLDatabase } from "../../../../database/sql_database";
import { Result } from "../../../../utils/result";
import { Wallet } from '../../../../database/sql_models'

const sql_database = new SQLDatabase();

export enum WalletError {
    InternalError,
}

export async function get_wallets(user_id: number): Promise<Result<Wallet[], WalletError>> {
    const result = await sql_database
        .get_row('wallets', 'owner_id', user_id).execute_queries();

    if(result.is_err()) {
        console.error(result.unwrap_err());
        return Result.Err(WalletError.InternalError);
    }
    return Result.Ok(result.unwrap()[0].rows);
}