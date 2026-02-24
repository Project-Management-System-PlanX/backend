import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClerkAuthModule } from './auth/clerk-auth.module';
import { ChannelsModule } from './channels/channels.module';
import { GroupsModule } from './groups/groups.module';
import { ProjectMembersModule } from './project-members/project-members.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env', '../../.env'], // Service .env first, fallback to root
        }),
        UsersModule,
        ClerkAuthModule,
        ProjectsModule,
        ChannelsModule,
        GroupsModule,
        ProjectMembersModule,
    ],
})
export class AppModule { }
