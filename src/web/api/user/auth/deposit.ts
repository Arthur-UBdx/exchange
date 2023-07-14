import { SQLDatabase } from "../../../../database/sql_database";
import { Result } from "../../../../utils/result";
import { Wallet } from '../../../../database/sql_models'

const sql_database = new SQLDatabase();

export enum DepositError {
    InternalError,
    BadRequest,
    NotFound,
}

// export async function deposit(user_id: number, currency_id: number, amount: number): Promise<Result<Wallet, DepositError>> {
//     const result_db_client = await sql_database.open_connection();
//     if(result_db_client.is_err()) {
//         console.error(result_db_client.unwrap_err());
//         return Result.Err(DepositError.InternalError);
//     }
//     const db_client = result_db_client.unwrap();

//     if((await sql_database.execute_query_client(db_client, `BEGIN`)).is_err()) {
//         return Result.Err(DepositError.InternalError);
//     }

//     const result: Result<any, any> = await sql_database.execute_query_client(
//         db_client,
//         `SELECT * FROM wallets WHERE owner_id = $1 AND currency_id = $2`);

//     if(result.is_err()) {
//         console.error(result.unwrap_err());
//         return Result.Err(DepositError.InternalError);
//     }

//     if(result.unwrap().rowCount == 0) {
//         ;
//     }

// }