import { PartialType } from '@nestjs/mapped-types';
import { CreateSpaceDto } from './create-space.dto';
import { OmitType } from '@nestjs/mapped-types';

export class UpdateSpaceDto extends PartialType(
    OmitType(CreateSpaceDto, ['workspaceId'] as const),
) {
    name?: string;
    description?: string;
    color?: string;
    icon?: string;
    prefix?: string;
}
