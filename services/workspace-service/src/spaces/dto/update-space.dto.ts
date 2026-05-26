import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateSpaceDto } from './create-space.dto';

export class UpdateSpaceDto extends PartialType(
    OmitType(CreateSpaceDto, ['workspaceId'] as const),
) {
    name?: string;
    description?: string;
    color?: string;
    icon?: string;
    prefix?: string;
}
