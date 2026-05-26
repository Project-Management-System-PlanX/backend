import { Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsDateString,
    IsNumber,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';

export class CreateTaskDto {
    @IsString()
    spaceId: string;

    @IsString()
    statusId: string;

    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    priority?: string;

    @IsOptional()
    @IsString()
    workType?: string;

    @IsOptional()
    @IsString()
    assigneeId?: string;

    @IsOptional()
    @IsDateString()
    dueDate?: string;

    @IsOptional()
    @IsDateString()
    startDate?: string;

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
}

export class BulkCreateDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateTaskDto)
    tasks: CreateTaskDto[];
}
