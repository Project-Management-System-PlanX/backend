import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateStatusDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    color?: string;

    @IsNumber()
    @IsOptional()
    position?: number;

    @IsBoolean()
    @IsOptional()
    isDone?: boolean;
}
