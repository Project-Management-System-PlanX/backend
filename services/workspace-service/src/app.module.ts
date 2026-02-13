import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { ChannelsModule } from './channels/channels.module';
import { GroupsModule } from './groups/groups.module';
import { MembersModule } from './members/members.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        WorkspacesModule,
        ChannelsModule,
        GroupsModule,
        MembersModule,
    ],
})
export class AppModule { }
