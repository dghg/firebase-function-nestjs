import { Module } from '@nestjs/common';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ServeStaticModule } from '@nestjs/serve-static';
@Module({
  imports: [
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
