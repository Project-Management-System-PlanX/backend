import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProjectDto {
    @IsString()
    @IsNotEmpty()
    companyId: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;
}
