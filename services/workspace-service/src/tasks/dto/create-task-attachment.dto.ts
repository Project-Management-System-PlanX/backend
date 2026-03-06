import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateTaskAttachmentDto {
    @IsString()
    @IsNotEmpty()
    fileName: string;

    @IsString()
    @IsNotEmpty()
    fileUrl: string;

    @IsString()
    @IsOptional()
    fileType?: string;

    @IsNumber()
    @IsOptional()
    fileSize?: number;
}
