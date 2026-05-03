import {
    IsBoolean,
    IsDateString,
    IsNumber,
    IsOptional,
    IsString,
    ValidateIf,
} from 'class-validator';

export class UpdateTaskDto {
    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    statusId?: string;

    @IsOptional()
    @IsString()
    priority?: string;

    @IsOptional()
    @IsString()
    workType?: string;

    @IsOptional()
    @ValidateIf((_obj, value) => value !== null)
    @IsString()
    assigneeId?: string | null;

    @IsOptional()
    @IsDateString()
    dueDate?: string;

    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsString()
    resolution?: string;

    @IsOptional()
    @IsNumber()
    position?: number;

    @IsOptional()
    @IsString()
    parentId?: string;

    @IsOptional()
    @IsString()
    teamId?: string;

    @IsOptional()
    @IsBoolean()
    flagged?: boolean;

    @IsOptional()
    @IsString()
    restrictTo?: string;
}
