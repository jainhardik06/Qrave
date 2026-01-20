import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { tenancyPlugin } from '../plugins/tenancy.plugin';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const mongoUri = configService.get<string>('MONGODB_URI') || 'mongodb://localhost:27017/qrave';
        console.log('Connecting to MongoDB:', mongoUri.replace(/:[^:]*@/, ':****@'));
        return {
          uri: mongoUri,
          connectionFactory: (connection) => {
            connection.plugin(tenancyPlugin);
            return connection;
          },
          serverSelectionTimeoutMS: 10000,
          socketTimeoutMS: 45000,
        };
      },
    }),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
