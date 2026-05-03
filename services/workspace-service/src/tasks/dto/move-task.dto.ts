import { IsNumber, IsOptional, IsString } from 'class-validator';

export class MoveTaskDto {
    @IsString()
    statusId: string;

    @IsNumber()
    position: number;

    @IsString()
    @IsOptional()
    parentId?: string | null;
}

export class BulkPositionDto {
    updates: Array<{
        id: string;
        statusId: string;
        position: number;
    }>;
}
