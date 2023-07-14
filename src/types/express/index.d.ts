import { User } from '../../database/sql_models';

export {};

declare global {
    namespace Express {
        export interface Request {
            user?: User;
        } 
    }
}