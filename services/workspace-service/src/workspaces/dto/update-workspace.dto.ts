import { IsString, IsOptional, IsUrl } from 'class-validator';

export class UpdateWorkspaceDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsUrl()
    @IsOptional()
    avatar?: string;
}
