import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateGroupDto {
    @IsString()
    @IsNotEmpty()
    channelId: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;
}
