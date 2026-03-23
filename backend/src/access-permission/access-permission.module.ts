import { Module } from '@nestjs/common';
import { AccessPermissionService } from './access-permission.service';
import { AccessPermissionController } from './access-permission.controller';

@Module({
    providers: [AccessPermissionService],
    controllers: [AccessPermissionController],
    exports: [AccessPermissionService],
})
export class AccessPermissionModule {}
