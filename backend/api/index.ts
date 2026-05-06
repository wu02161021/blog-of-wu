import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { AppModule } from '../dist/app.module'
import { ValidationPipe } from '@nestjs/common'

let cachedApp: any = null

async function bootstrap() {
  if (cachedApp) return cachedApp

  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  app.set('trust proxy', true)
  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN ?? '*',
    credentials: true,
  })
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  app.use((_req, res, next) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    next()
  })
  app.setGlobalPrefix('api')

  await app.init()
  cachedApp = app.getHttpAdapter().getInstance()
  return cachedApp
}

export default async function handler(req: any, res: any) {
  const expressApp = await bootstrap()
  return expressApp(req, res)
}
