import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseAuthModule } from './auth/supabase-auth.module';
import { ChannelsModule } from './channels/channels.module';
import { EmailModule } from './email/email.module';
import { GroupsModule } from './groups/groups.module';
import { MembersModule } from './members/members.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { SpacesModule } from './spaces/spaces.module';
import { TasksModule } from './tasks/tasks.module';
import { TeamsService } from './teams/teams.service';
import { TeamsController } from './teams/teams.controller';
import { TeamsModule } from './teams/teams.module';
import { TicketsService } from './tickets/tickets.service';
import { TicketsController } from './tickets/tickets.controller';
import { TicketsModule } from './tickets/tickets.module';
import { MessagesModule } from './messages/messages.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env', '../../.env'],
        }),
        PrismaModule,
        EmailModule,
        UsersModule,
        SupabaseAuthModule,
        WorkspacesModule,
        ChannelsModule,
        GroupsModule,
        MembersModule,
        SpacesModule,
        TasksModule,
        TeamsModule,
        TicketsModule,
        MessagesModule,
    ],
    providers: [TeamsService, TicketsService],
    controllers: [TeamsController, TicketsController],
})
export class AppModule { }
