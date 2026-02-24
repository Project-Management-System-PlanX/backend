import {
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    async create(createProjectDto: CreateProjectDto, userId: string) {
        // Find user to verify they belong to a company
        const user = await this.prisma.user.findUnique({
            where: { clerkId: userId },
        });

        if (!user || user.companyId !== createProjectDto.companyId) {
            throw new ForbiddenException('User does not belong to the target company');
        }

        const project = await this.prisma.project.create({
            data: {
                companyId: createProjectDto.companyId,
                name: createProjectDto.name,
                description: createProjectDto.description,
            },
        });

        // Add creator as a MANAGER automatically
        await this.prisma.projectMember.create({
            data: {
                projectId: project.id,
                userId: user.id,
                role: 'MANAGER',
            },
        });

        return project;
    }

    async findAll(userId: string) {
        // Always return projects where the authenticated user is a member
        // Find internal user id first
        const user = await this.prisma.user.findUnique({ where: { clerkId: userId } });
        if (!user) return [];

        const memberships = await this.prisma.projectMember.findMany({
            where: { userId: user.id },
            include: { project: true },
        });
        return memberships.map((m) => m.project);
    }

    async findOne(id: string) {
        const project = await this.prisma.project.findUnique({
            where: { id },
            include: {
                members: true,
                channels: true,
            },
        });

        if (!project) {
            throw new NotFoundException('Project not found');
        }

        return project;
    }

    async update(id: string, updateProjectDto: UpdateProjectDto, userId: string) {
        const project = await this.prisma.project.findUnique({ where: { id } });
        if (!project) throw new NotFoundException('Project not found');

        const user = await this.prisma.user.findUnique({ where: { clerkId: userId } });
        if (!user) throw new ForbiddenException('User not found');

        // Only MANAGER can update
        const member = await this.prisma.projectMember.findUnique({
            where: { projectId_userId: { projectId: id, userId: user.id } },
        });
        if (!member || member.role !== 'MANAGER') {
            throw new ForbiddenException('Insufficient permissions to update project');
        }

        return this.prisma.project.update({
            where: { id },
            data: updateProjectDto,
        });
    }

    async remove(id: string, userId: string) {
        const project = await this.prisma.project.findUnique({ where: { id } });
        if (!project) throw new NotFoundException('Project not found');

        const user = await this.prisma.user.findUnique({ where: { clerkId: userId } });
        if (!user) throw new ForbiddenException('User not found');

        // Only MANAGER can delete
        const member = await this.prisma.projectMember.findUnique({
            where: { projectId_userId: { projectId: id, userId: user.id } },
        });
        if (!member || member.role !== 'MANAGER') {
            throw new ForbiddenException('Only the project manager can delete it');
        }

        return this.prisma.project.delete({ where: { id } });
    }
}
