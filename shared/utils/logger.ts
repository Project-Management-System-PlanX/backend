import { Logger as NestLogger } from '@nestjs/common';

export class Logger {
    private logger: NestLogger;

    constructor(context: string) {
        this.logger = new NestLogger(context);
    }

    log(message: string, ...args: unknown[]) {
        this.logger.log(message, ...args);
    }

    error(message: string, trace?: string, ...args: unknown[]) {
        this.logger.error(message, trace, ...args);
    }

    warn(message: string, ...args: unknown[]) {
        this.logger.warn(message, ...args);
    }

    debug(message: string, ...args: unknown[]) {
        this.logger.debug(message, ...args);
    }

    verbose(message: string, ...args: unknown[]) {
        this.logger.verbose(message, ...args);
    }
}
