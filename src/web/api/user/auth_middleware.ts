import { User } from '../../../database/sql_models';
import { createHash } from 'crypto';
import { sign, verify } from 'jsonwebtoken';
import { Result } from '../../../utils/result';
import { CacheDatabase, CacheDatabaseError } from '../../../database/cache_database';

enum DecodeError {
    FailedToDecode,
}

export class AuthCookie {
    public username: string;
    public id: number;
    public expires: number;
    public password_signature: string;

    constructor(user: User, expires: number|null) {
        this.username = user.username;
        this.id = user.id;
        this.expires = expires;
        this.password_signature = createHash('sha3-256').update(`${user.password}${process.env.JWT_SECRET}`).digest('hex');
    }

    public into_token(): string {
        return sign({
            username: this.username,
            id: this.id,
            expires: this.expires,
            password_signature: this.password_signature
        }, process.env.JWT_SECRET);
    }

    public static from_token(token: string): Result<AuthCookie, DecodeError> {
        try {
            const decoded: any = verify(token, process.env.JWT_SECRET);
            return Result.Ok(decoded);
        } catch (error) {
            return Result.Err(error);
        }
    }
}

export async function token_authenticator(req, res, next) {
    console.log(req.url)
    const token = req.cookies['auth_token'];
    if(!token) {
        res.status(401).json({
            success: "false",
            message: "Unauthorized, no cookies provided",
        });
        return;
    }
    const result: Result<AuthCookie, DecodeError> = AuthCookie.from_token(token);
    if(result.is_err()) {
        res.status(401).json({
            success: "false",
            message: "Unauthorized, cookie signature invalid",
        });
        return;
    }
    const auth_cookie: AuthCookie = result.unwrap();
    const result_user: Result<User, CacheDatabaseError> = await CacheDatabase.get(auth_cookie.id);
    if(result_user.is_err()) {
        res.status(401).json({
            success: "false",
            message: "Unauthorized, user not found",
        });
        return;
    }
    const user: User = result_user.unwrap();
    const password_signature = createHash('sha3-256').update(`${user.password}${process.env.JWT_SECRET}`).digest('hex');
    if(password_signature != auth_cookie.password_signature) {
        res.status(401).json({
            success: "false",
            message: "Unauthorized, password hash invalid",
        });
        console.log(password_signature, "\n", auth_cookie.password_signature)
        return;
    }
    if(auth_cookie.expires != null && auth_cookie.expires < Date.now()) {
        res.status(401).json({
            success: "false",
            message: "Unauthorized, cookie expired",
        });
        return;
    }
    const expires = auth_cookie.expires == null ? null : Date.now() + parseInt(process.env.SESSION_EXPIRATION_TIME);
    const new_auth_cookie = new AuthCookie(user, expires);
    const new_token = new_auth_cookie.into_token();
    if(expires == null) {
        res.cookie('auth_token', new_token, { httpOnly: true});
    } else {
        res.cookie('auth_token', new_token, { maxAge: parseInt(process.env.SESSION_EXPIRATION_TIME), httpOnly: true});
    }
    req.user = user;
    next();
}