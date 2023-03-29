import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

export default class ReportsController {
  public async bootstrap() {
    const app = await NestFactory.create(AppModule);
    await app.listen(3000);
    const data = {
      title: '届け出・証明書申請システム',
      message: 'ログインしてください',
    },
    bootstrap();
  }
}
