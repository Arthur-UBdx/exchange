import { SQLDatabase } from '../../../../database/sql_database';
import { Result } from '../../../../utils/result';
import { createHash, timingSafeEqual, randomBytes } from 'crypto';
import { User } from '../../../../database/sql_models'

const sql_database = new SQLDatabase();

export enum RegisterError {
    UsernameOrEmailTaken,
    BadFormat,
    InternalError,
}

export enum LoginError {
    BadCredentials,
    InternalError,
}

export async function create_user(username: string, email: string, password: string): Promise<Result<User, RegisterError>> {    
    const email_regex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g;
    const password_regex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,64}$/gm;
    
    //format test
    if(!email_regex.test(email) ||
        !password_regex.test(password) ||
        password.length > 64 ||
        username.length > 64 ||
        email.length > 64 ||
        username.length < 3 ||
        password.length < 8) {
            return Result.Err(RegisterError.BadFormat);
    }
    //

    //check if username or email is taken
    const result_existing_user = await sql_database
        .get_row('users', 'username', username)
        .get_row('users', 'email', email).execute_queries();
    
    if(result_existing_user.is_err()) {
        console.error(result_existing_user.unwrap_err());
        return Result.Err(RegisterError.InternalError);
    }
    if(result_existing_user.unwrap()[0].rowCount != 0 || result_existing_user.unwrap()[1].rowCount != 0) {
        return Result.Err(RegisterError.UsernameOrEmailTaken);
    }
    //

    //create user
    const salt: string = randomBytes(8).toString('hex');
    const hashed_password = createHash('sha3-256').update(password + salt).digest('hex');

    const result: Result<any, any> = await sql_database
        .insert_row('users', {username: username, email: email, password: hashed_password, salt: salt, auth_level: 0, status: 0})
        .get_row('users', 'username', username)
        .execute_queries()
    //

    if(result.is_err()) {
            console.error(result.unwrap_err());
            return Result.Err(RegisterError.InternalError);
    } else {
        return Result.Ok(result.unwrap()[1].rows[0]);
    }
}

export async function login_user(username: string, password: string): Promise<Result<User, LoginError>> {
    //check if user exists
    const query = 'SELECT * FROM users WHERE username = $1 OR email = $2';
    const values = [username, username];
    const result = await sql_database.new_query(query, values).execute_queries();

    if(result.is_err()) {
        console.error(result.unwrap_err());
        return Result.Err(LoginError.InternalError);
    }
    //
    
    //check if password is correct
    const rows = result.unwrap()[0].rows;
    let user: User;
    if(rows.length === 0) {
        user = {id: -1, email: "", username: "", password: "", salt: "", auth_level:-1, status: -1};
    } else {
        user = rows[0];
    }
    const salt: string = user.salt;
    const hashed_password: string = user.password;  
    const hash = createHash('sha3-256').update(password + salt).digest('hex');
    const is_password_correct: boolean = await timingSafeEqual(Buffer.from(hash), Buffer.from(hashed_password));
    //
    
    if(is_password_correct) {
        return Result.Ok(user);
    } else {
        return Result.Err(LoginError.BadCredentials);
    }
}