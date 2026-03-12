import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { ReadStateService } from './read-state.service';

@Module({
    imports: [PrismaModule],
    controllers: [MessagesController],
    providers: [MessagesService, ReadStateService],
    exports: [MessagesService, ReadStateService],
})
export class MessagesModule { }
