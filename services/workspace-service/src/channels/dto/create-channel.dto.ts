import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateChannelDto {
    @IsString()
    @IsNotEmpty()
    projectId: string;

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
