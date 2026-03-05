import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class MoveTaskDto {
    @IsString()
    @IsNotEmpty()
    statusId: string;

    @IsNumber()
    @IsNotEmpty()
    position: number;
}
