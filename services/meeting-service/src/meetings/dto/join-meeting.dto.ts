import { IsOptional, IsString } from 'class-validator';

export class JoinMeetingDto {
    @IsString()
    @IsOptional()
    username?: string;
}
