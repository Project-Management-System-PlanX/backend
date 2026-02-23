import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpsertUserDto {
    @IsString()
    @IsNotEmpty()
    clerkId: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsOptional()
    firstName?: string;

    @IsString()
    @IsOptional()
    lastName?: string;

    @IsString()
    @IsOptional()
    username?: string;

    @IsString()
    @IsOptional()
    imageUrl?: string;
}
