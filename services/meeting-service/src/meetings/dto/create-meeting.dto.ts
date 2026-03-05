import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class CreateMeetingDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  groupId?: string;

  @IsString()
  @IsOptional()
  channelId?: string;

  @IsString()
  @IsOptional()
  workspaceId?: string;

  @IsString()
  @IsOptional()
  @IsIn(['VIDEO', 'AUDIO'])
  type?: 'VIDEO' | 'AUDIO';
}
