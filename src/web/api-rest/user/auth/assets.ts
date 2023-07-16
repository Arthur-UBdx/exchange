import { SQLDatabase } from "../../../../database/sql_database";
import { Result } from "../../../../utils/result";
import { Wallet } from '../../../../database/sql_models'
import { Asset } from '../../../../database/sql_models';
import { PoolClient, QueryConfig } from 'pg';

const sql_database = new SQLDatabase();

async function get_currencies_client(db_client: PoolClient): Promise<Result<Asset[], string>> {
    const query: QueryConfig = {text: `SELECT * FROM assets WHERE reserve > 0`, values: []};
    const result = await sql_database.execute_query_client(db_client, query);
    
    if(result.is_err()) {
        console.error(result.unwrap_err());
        return Result.Err('Internal Error');
    }
    
    return Result.Ok(result.unwrap().rows);
}

// get wallet

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

// deposit

export enum DepositError {
    NotEnoughReserve,
    InternalError,
    BadRequest,
    NotFound,
}

export async function deposit(user_id: number, currency_symbol: string, amount: number): Promise<Result<Wallet, DepositError>> {
    if (amount < 0) {
        return Result.Err(DepositError.BadRequest);
    }

    const result_db_client: PoolClient = await sql_database.open_connection();
    if(result_db_client.is_err()) {
        console.error(result_db_client.unwrap_err());
        return Result.Err(DepositError.InternalError);
    }
    const db_client = result_db_client.unwrap();

    const result_currencies: Result<Asset[], string> = await get_currencies_client(db_client);
    if(result_currencies.is_err()) {
        console.error(result_currencies.unwrap_err());
        sql_database.close_connection(db_client);
        return Result.Err(DepositError.InternalError);
    }

    const currencies: Asset[] = result_currencies.unwrap();
    const currency: Asset | undefined = currencies.find((currency: Asset) => currency.symbol == currency_symbol);
    if(currency == undefined || currency.reserve == undefined || currency.assigned == undefined) {
        sql_database.close_connection(db_client);
        return Result.Err(DepositError.NotFound);
    }
    
    if((await sql_database.execute_query_client(db_client, `BEGIN`)).is_err()) {
        console.error(result_currencies.unwrap_err());
        sql_database.close_connection(db_client);
        return Result.Err(DepositError.InternalError);
    }

    // adding amount to wallet and removing from reserve
    const result_wallet = await sql_database.execute_query_client(
        db_client,
        {
            text: `SELECT * FROM wallets WHERE owner_id=$1 AND currency_id=$2`,
            values: [user_id, currency.id]
        }
    ); 

    if(result_wallet.is_err()) {
        console.error(result_wallet.unwrap_err());
        await sql_database.execute_query_client(db_client, {text: 'ROLLBACK', values: []});
        sql_database.close_connection(db_client);
        return Result.Err(DepositError.InternalError);
    }

    const result_reserve = await sql_database.execute_query_client(
        db_client,
        {
            text: `UPDATE assets SET assigned = assigned + $1, reserve = reserve + $1 WHERE id = $2`,
            values: [amount, currency.id]
        }
    );

    if(result_reserve.is_err()) {
        console.error(result_reserve.unwrap_err());
        await sql_database.execute_query_client(db_client, {text: 'ROLLBACK', values: []});
        sql_database.close_connection(db_client);
        return Result.Err(DepositError.InternalError);
    }
    
    if(result_wallet.unwrap().rowCount == 0) {
        const result_insert_wallet = await sql_database.execute_query_client(
            db_client,
            {
                text: `INSERT INTO wallets(owner_id, currency_id, symbol, name, balance) VALUES($1, $2, $3, $4, $5) RETURNING *`,
                values: [user_id, currency.id, currency.symbol, currency.name, amount]
            }
        );

        if(result_insert_wallet.is_err()) {
            console.error(result_insert_wallet.unwrap_err());
            await sql_database.execute_query_client(db_client, {text: 'ROLLBACK', values: []});
            sql_database.close_connection(db_client);
            return Result.Err(DepositError.InternalError);
        }
        const wallet: Wallet = result_insert_wallet.unwrap().rows[0];
        await sql_database.execute_query_client(db_client, {text: 'COMMIT', values: []})
        sql_database.close_connection(db_client);
        return Result.Ok(wallet);
    } else {
        const result_update_wallet = await sql_database.execute_query_client(
            db_client,
            {
                text: `UPDATE wallets SET balance = balance + $1 WHERE owner_id = $2 AND currency_id = $3 RETURNING *`,
                values: [amount, user_id, currency.id]
            });
        
        if(result_update_wallet.is_err()) {
            console.error(result_update_wallet.unwrap_err());
            await sql_database.execute_query_client(db_client, {text: 'ROLLBACK', values: []});
            sql_database.close_connection(db_client);
            return Result.Err(DepositError.InternalError);
        }

        const wallet: Wallet = result_update_wallet.unwrap().rows[0];
        await sql_database.execute_query_client(db_client, {text: 'COMMIT', values: []})
        sql_database.close_connection(db_client);
        return Result.Ok(wallet);
    }

}