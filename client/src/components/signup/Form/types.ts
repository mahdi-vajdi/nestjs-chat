
interface loginInputsTypes {
    name: string,
    password: string
}

interface loginError {
    status?: number;
    data?: any;
}

interface loginSuccess {
    access_token: string;
    message: string;
    username: string;
}


export type { loginInputsTypes, loginError, loginSuccess }