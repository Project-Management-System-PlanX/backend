import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateChannelDto {
    @IsString()
    @IsNotEmpty()
    workspaceId: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEnum(['PUBLIC', 'PRIVATE', 'DIRECT_MESSAGE'])
    @IsOptional()
    type?: string;

    @IsString()
    @IsOptional()
    description?: string;
}
