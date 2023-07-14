import { Router } from 'express';
import { RegisterError, LoginError, User , create_user, login_user } from './model';
import { Result } from '../../../utils/result';
import { AuthCookie, token_authenticator } from './auth';
import { CacheDatabase } from '../../../database/cache_database';

const router_user_handling = Router();

router_user_handling.get('/login', async (req, res) => {
    res.status(200).sendFile('user_management/login.html', {root: './web/'});
});

router_user_handling.get('/api/login', async (req, res) => {
    if(req.body.username == null || req.body.password == null || req.body.remember_me == null) {
        res.status(400).send('Bad request');
        return;
    }

    const remember_me: boolean = req.body.remember_me;
    const result: Result<User, LoginError> = await login_user(req.body.username, req.body.password);
    const expires: number|null = remember_me ? null : Date.now() + parseInt(process.env.SESSION_EXPIRATION_TIME);

    if(result.is_err()) {
        switch(result.unwrap_err()) {
            case LoginError.BadCredentials:
                res.status(401).json({
                    success: "false",
                    message: "Wrong username or password",
                });
                break;
            case LoginError.InternalError:
                res.status(500).json({
                    success: "false",
                    message: "Internal server error",
                });
                break;
        }
        return;
    }

    const user: User = result.unwrap();
    const auth_cookie = new AuthCookie(user, expires);
    const token = auth_cookie.into_token();

    CacheDatabase.set(user.id, user);

    if(remember_me) {
        res.cookie('auth_token', token, { httpOnly: true}); //TODO : add 'secure: true' when https is set up
    } else {
        res.cookie('auth_token', token, { maxAge: parseInt(process.env.SESSION_EXPIRATION_TIME), httpOnly: true});
    }
    res.status(200).json({success:"true", message:"User logged in successfully"});
})

router_user_handling.get('/register', async (req, res) => {
    res.status(200).sendFile('user_management/register.html', {root: './web/'});
});

router_user_handling.post('/api/register', async (req, res) => {
    // check if body exists
    if(req.body.username == null || req.body.password == null || req.body.email == null || req.body.remember_me == null) {
        res.status(400).send('Bad request');
        return;
    }
    const remember_me: boolean = req.body.remember_me;
    const result: Result<User, RegisterError> = await create_user(req.body.username, req.body.email, req.body.password);
    const expires: number|null = remember_me ? null : Date.now() + parseInt(process.env.SESSION_EXPIRATION_TIME);

    if(result.is_err()) {
        switch(result.unwrap_err()) {
            case RegisterError.BadFormat:
                res.status(400).json({
                    success: "false",
                    message: "Bad format",
                    accepted_format: {
                        username: "between 3 and 64 characters",
                        password: "between 8 and 64 characters, at least one uppercase, one lowercase, one number and one special character (!@#$%^&*_-)",
                        email: "valid email address",
                    }
                });
                break;
            case RegisterError.UsernameOrEmailTaken:
                res.status(409).json({
                    success: "false",
                    message: "Username or email already taken",
                });
                break;
            case RegisterError.InternalError:
                res.status(500).json({
                    success: "false",
                    message: "Internal server error",
                });
                break;
        }
        return;
    }
    const user: User = result.unwrap();
    const auth_cookie = new AuthCookie(user, expires);
    const token = auth_cookie.into_token();

    CacheDatabase.set(user.id, user);
    
    if(remember_me) {
        res.cookie('auth_token', token, { httpOnly: true}); //TODO : add 'secure: true' when https is set up
    } else {
        res.cookie('auth_token', token, { maxAge: parseInt(process.env.SESSION_EXPIRATION_TIME), httpOnly: true});
    }
    res.status(200).json({success:"true", message:"User created"});
});

// remove the user in the session cache and clear the cookie
router_user_handling.get('/logout', token_authenticator, async (req, res) => {
    CacheDatabase.set(req.user.id, null);
    res.clearCookie('auth_token');
    res.status(200).json({success:"true", message:"User logged out"});
});


module.exports = router_user_handling;