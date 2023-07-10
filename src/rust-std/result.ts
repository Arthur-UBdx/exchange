export class Result<T, E> {
    private success: boolean;
    private value: T;
    private error: E;
    
    private constructor(success: boolean,value, error) {
        this.success = success;
        this.value = value;
        this.error = error;
    }

    public is_ok(): boolean {
        return this.success;
    }

    public is_err(): boolean {
        return !this.success;
    }

    public unwrap(): any {
        if(!this.success) throw new Error(`Cannot unwrap an error:\n${this.error}`);
        return this.value;
    }

    public unwrap_or(default_value: any): any {
        if(!this.success) return default_value;
        return this.value;
    }

    public static Ok<T, E>(value: T): Result<T, E> {
        return new Result(true, value, null);
    }

    public static Err<T, E>(error: E): Result<T, E> {
        return new Result(false, null, error);
    }
}