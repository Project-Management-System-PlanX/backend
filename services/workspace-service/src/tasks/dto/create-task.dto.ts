import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

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
    assigneeId?: string;

    @IsDateString()
    @IsOptional()
    dueDate?: string;

    @IsNumber()
    @IsOptional()
    position?: number;

    @IsString()
    @IsOptional()
    statusId?: string;
}
