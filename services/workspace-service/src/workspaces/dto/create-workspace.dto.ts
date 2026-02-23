import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateWorkspaceDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    slug: string;

    @IsUrl()
    @IsOptional()
    avatar?: string;
}
