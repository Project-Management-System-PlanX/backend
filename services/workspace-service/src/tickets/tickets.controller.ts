import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { TicketsService } from './tickets.service';

@Controller('tickets')
export class TicketsController {
    constructor(private readonly ticketsService: TicketsService) {}

    @Post()
    create(
        @CurrentUser('userId') userId: string,
        @Body() body: { workspaceId: string; title: string; description: string },
    ) {
        return this.ticketsService.create(body.workspaceId, userId, body.title, body.description);
    }

    @Get('workspace/:workspaceId')
    findByWorkspace(@Param('workspaceId') workspaceId: string) {
        return this.ticketsService.findByWorkspace(workspaceId);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() body: { status?: string; assignedTo?: string }) {
        return this.ticketsService.update(id, body);
    }
}
