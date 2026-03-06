import { IsArray, IsBoolean, IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateTaskDto {
    @IsString()
    spaceId: string;

    @IsString()
    title: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    priority?: string; // NONE, LOW, MEDIUM, HIGH, CRITICAL

    @IsString()
    @IsOptional()
    workType?: string; // TASK, STORY, BUG, EPIC, SUBTASK

    @IsString()
    @IsOptional()
    assigneeId?: string;

    @IsDateString()
    @IsOptional()
    dueDate?: string;

    @IsDateString()
    @IsOptional()
    startDate?: string;

    @IsNumber()
    @IsOptional()
    position?: number;

    @IsString()
    @IsOptional()
    statusId?: string;

    @IsString()
    @IsOptional()
    parentId?: string;

    @IsString()
    @IsOptional()
    teamId?: string;

    @IsBoolean()
    @IsOptional()
    flagged?: boolean;

    @IsString()
    @IsOptional()
    restrictTo?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    labels?: string[];
}
