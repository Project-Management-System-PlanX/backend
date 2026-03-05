import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseAuthModule } from './auth/supabase-auth.module';
import { ChannelsModule } from './channels/channels.module';
import { GroupsModule } from './groups/groups.module';
import { MembersModule } from './members/members.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { SpacesModule } from './spaces/spaces.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env', '../../.env'],
        }),
        PrismaModule,
        UsersModule,
        SupabaseAuthModule,
        WorkspacesModule,
        ChannelsModule,
        GroupsModule,
        MembersModule,
        SpacesModule,
        TasksModule,
    ],
})
export class AppModule { }
