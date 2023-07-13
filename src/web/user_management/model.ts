import { SQLDatabase } from '../../database/sql_database';
import { Result } from '../../utils/result';
import { createHash, timingSafeEqual, randomBytes } from 'crypto';

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

export class UserBase {
    public static async create_user(username: string, email: string, password: string): Promise<Result<null, RegisterError>> {    
        const email_regex = new RegExp('^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$');
        const password_regex = new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})');
        
        //format test
        if(!email_regex.test(email) ||
            !password_regex.test(password) ||
            password.length > 64 ||
            username.length > 64 ||
            email.length > 64 ||
            username.length < 4 ||
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
        if(result_existing_user.unwrap()[0].rows != null || result_existing_user.unwrap()[1].rows != null) {
            return Result.Err(RegisterError.UsernameOrEmailTaken);
        }
        //

        //create user
        const salt: string = randomBytes(64).toString('hex');
        const hashed_password = createHash('sha3-256').update(password + salt).digest('hex');
        
        const result: Result<any, any> = await sql_database
            .insert_row('users', {username: username, email: email, password: hashed_password, salt: salt, auth_level: 0, status: 0})
            .execute_queries()
        //

        if(result.is_err()) {
                console.error(result.unwrap_err());
                return Result.Err(RegisterError.InternalError);
        } else {
            return Result.Ok(null);
        }
    }

    public static async login_user(username: string, password: string): Promise<Result<number, LoginError>> {
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
        const rows = result.unwrap().rows;
        let user: any;
        if(rows.length === 0) {
            user = {salt: "", password: ""};
        } else {
            user = rows[0];
        }
        const salt: string = user.salt;
        const hashed_password: string = user.password;  
        const hash = createHash('sha256').update(password + salt).digest('hex');
        const is_password_correct: boolean = await timingSafeEqual(Buffer.from(hash), Buffer.from(hashed_password));
        //

        if(is_password_correct) {
            return Result.Ok(user.id);
        } else {
            return Result.Err(LoginError.BadCredentials);
        }
    }

    public static async logoff_user(user_id: string): Promise<Result<null, any>> {
        return Result.Ok(null);
    }
}