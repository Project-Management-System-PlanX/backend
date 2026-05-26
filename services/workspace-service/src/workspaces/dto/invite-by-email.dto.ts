import { ArrayNotEmpty, IsArray, IsEmail, IsOptional, IsString } from 'class-validator';

export class InviteByEmailDto {
    @IsArray()
    @ArrayNotEmpty()
    @IsEmail({}, { each: true })
    emails: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    channelIds?: string[];
}
