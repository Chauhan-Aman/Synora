import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(body: any): Promise<{
        access_token: string;
        userId: string;
        email: string;
    }>;
    login(body: any): Promise<{
        access_token: string;
        userId: string;
        email: string;
    }>;
}
