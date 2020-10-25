export interface IError {
    name: string,
    message: string,
    description?: string,
    number?: number,
    stack?: string
}