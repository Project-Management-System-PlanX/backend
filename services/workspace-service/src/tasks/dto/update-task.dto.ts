import { PartialType } from '@nestjs/mapped-types';
import { CreateTaskDto } from './create-task.dto';
import { OmitType } from '@nestjs/mapped-types';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateTaskDto extends PartialType(
    OmitType(CreateTaskDto, ['spaceId'] as const)
) {
    title?: string;
    description?: string;
    priority?: string;
    assigneeId?: string;
    dueDate?: string;
    position?: number;
    statusId?: string;

    @IsString()
    @IsOptional()
    coverColor?: string;

    @IsString()
    @IsOptional()
    resolution?: string; // UNRESOLVED, DONE, WONT_DO, DUPLICATE

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    labels?: string[]; // Simplified: pass an array of tag strings
}
