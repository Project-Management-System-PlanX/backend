import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClerkAuthModule } from './auth/clerk-auth.module';
import { ChannelsModule } from './channels/channels.module';
import { GroupsModule } from './groups/groups.module';
import { MembersModule } from './members/members.module';
import { UsersModule } from './users/users.module';
import { WorkspacesModule } from './workspaces/workspaces.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env', '../../.env'], // Service .env first, fallback to root
        }),
        UsersModule,
        ClerkAuthModule,
        WorkspacesModule,
        ChannelsModule,
        GroupsModule,
        MembersModule,
    ],
})
export class AppModule {}
