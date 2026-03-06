import { PartialType } from '@nestjs/mapped-types';
import { CreateTaskDto } from './create-task.dto';
import { OmitType } from '@nestjs/mapped-types';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateTaskDto extends PartialType(
    OmitType(CreateTaskDto, ['spaceId'] as const)
) {
    title?: string;
    description?: string;
    priority?: string;
    workType?: string;
    assigneeId?: string;
    dueDate?: string;
    startDate?: string;
    position?: number;
    statusId?: string;
    parentId?: string;
    teamId?: string;
    flagged?: boolean;
    restrictTo?: string;

    @IsString()
    @IsOptional()
    resolution?: string; // UNRESOLVED, DONE, WONT_DO, DUPLICATE

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    labels?: string[]; // Simplified: pass an array of tag strings
}
