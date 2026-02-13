import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export class CreateChannelDto {
    @IsString()
    @IsNotEmpty()
    workspaceId: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEnum(['PUBLIC', 'PRIVATE'])
    @IsOptional()
    type?: string;

    @IsString()
    @IsOptional()
    description?: string;
}
