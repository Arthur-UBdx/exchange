export enum RequestError {
    InternalError = 'Internal error',
    Unauthorized = 'Unauthorized',
    NotEnoughBalance = 'User has not enough balance',
    MarketNotFound = 'Market not found, find available markets at /api/platform/markets',
    OrderNotFound = 'Order not found',
    BadRequest = 'Bad request',
    CurrencyNotFound = 'Currency not found',
    WrongUsernameOrPassword = 'Wrong username or password',
    UserAlreadyExists = 'User already exists',
    EmailAlreadyExists = 'Email already exists',
}