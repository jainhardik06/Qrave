import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/qrave';

@Module({
  imports: [MongooseModule.forRoot(mongoUri)],
  exports: [MongooseModule],
})
export class DatabaseModule {}
