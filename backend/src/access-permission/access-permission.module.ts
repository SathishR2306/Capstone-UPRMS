import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessPermission } from './entities/access-permission.entity';
import { AccessPermissionService } from './access-permission.service';
import { AccessPermissionController } from './access-permission.controller';

@Module({
    imports: [TypeOrmModule.forFeature([AccessPermission])],
    providers: [AccessPermissionService],
    controllers: [AccessPermissionController],
    exports: [TypeOrmModule, AccessPermissionService],
})
export class AccessPermissionModule { }
