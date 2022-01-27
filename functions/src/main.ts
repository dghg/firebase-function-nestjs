import { NestFactory } from '@nestjs/core';
import { ExpressAdapter, NestExpressApplication } from '@nestjs/platform-express';
import { TypeormStore } from 'connect-typeorm/out';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import ExpressSession from 'express-session';
import { Db } from 'typeorm-static';
import express from 'express';
import * as functions from 'firebase-functions';
// import { exec } from 'child_process';

import { AppModule } from './app.module';
import { configService } from './config/config.service';
import { SessionEntity } from './model/session.entity';

const apiServer = express();
const frontServer = express();
frontServer.use(express.static('public'));
// global db connection
/*
Db.createConnection(configService.getTypeOrmConfig())
.then(() => {
  console.log('Connected to database');
})
.catch((err) => {
  console.log('Database connection error: ', err);
})
*/
const createFunction = async (expressInstance): Promise<void> => {
  const adapter = new ExpressAdapter(expressInstance);
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    adapter,
    {
      cors: {
        origin: true,
        methods: 'GET,POST,OPTIONS',
        credentials: true,
        allowedHeaders: 'Content-Type, Accept, X-Knar-1',
      }
    }
  );
  app.set('trust proxy', 1);
  app.use(helmet.hidePoweredBy());

  // Default options
  let cookie: ExpressSession.CookieOptions;
  if (configService.isProduction()) {
    // Production-only options
    cookie = {
      sameSite: 'none',
      secure: true,
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 30, // 1달
    };
  } else {
    // Development-only options
    cookie = {
      httpOnly: false,
      maxAge: 1000 * 60 * 60 * 24 * 30, // 1달
    };
  }
/*
  app.use(
    ExpressSession({
      resave: false,
      saveUninitialized: false,
      store: new TypeormStore({
        cleanupLimit: 2,
        limitSubquery: true, // false - If using MariaDB
        ttl: 1000 * 60 * 60 * 24 * 30, // 1달
      }).connect(Db.connection.getRepository(SessionEntity)),
      secret: configService.getCookieSecret(),
      cookie,
    }),
  );
  */
  app.use(cookieParser(configService.getCookieSecret()));

  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

  await app.init();
};

export const api = functions.region('asia-northeast3')
  .https.onRequest(async (request, response) => {
    await createFunction(apiServer);
    apiServer(request, response);
  });

export const page = functions.region('asia-northeast3')
  .https.onRequest(async (request, response) => {
    frontServer(request, response);
  });
