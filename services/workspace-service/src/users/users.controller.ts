import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    /**
     * GET /users/me
     * Returns the authenticated user's profile from the database.
     */
    @Get('me')
    getMe(@CurrentUser('userId') supabaseId: string) {
        return this.usersService.getMe(supabaseId);
    }
}
