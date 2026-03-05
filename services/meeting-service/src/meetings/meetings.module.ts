import { Module } from '@nestjs/common';
import { LivekitModule } from '../livekit/livekit.module';
import { MeetingsController } from './meetings.controller';
import { MeetingsService } from './meetings.service';

@Module({
    imports: [LivekitModule],
    controllers: [MeetingsController],
    providers: [MeetingsService],
    exports: [MeetingsService],
})
export class MeetingsModule {}
