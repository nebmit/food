import express, { Express, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import logger from 'morgan';
import createError, { HttpError } from 'http-errors';
import * as session from 'express-session';
import express_mysql_session from 'express-mysql-session';

import config from './config.json';
import indexRouter from './routes/index';
import loginRouter from './routes/login';
import registerRouter from './routes/register';
import logoutRouter from './routes/logout';

declare module "express-session" {
  interface SessionData {
    user: User;
    messageText: string | null;
    messageDetails: string | null;
    messageType: 'alert-error' | 'alert-success' | 'alert-neutral' | 'alert-info' | null;
  }
}

dotenv.config();


const app: Express = express();
const MySQLStore = express_mysql_session(session);
const port = process.env.PORT;

const sessionStore = new MySQLStore(config.sessionStoreDbOptions);


app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, '../public')));
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, authorization");
  res.header("Access-Control-Allow-Methods", "GET,POST,DELETE,PUT,OPTIONS");
  next();
});

app.use(session.default({
  secret: 'WJyx6874#!#ic!$5c*8wsr^o44MDqM^',
  resave: true,
  saveUninitialized: false,
  // cookie:  {
  //     domain: 'timben.net',
  //     maxAge: 24 * 6 * 60 * 10000
  // },
  store: sessionStore
}));

app.use(function(req, res, next) {
  res.locals.messageText = (req.session.messageText ?? "");
  res.locals.messageDetails = (req.session.messageDetails ?? "");
  res.locals.messageType = (req.session.messageType ?? "alert-neutral");
  req.session.messageText = null;
  req.session.messageDetails = null;
  req.session.messageType = null;
  next();
});

app.use('/', indexRouter);
app.use('/login', loginRouter);
app.use('/register', registerRouter);
app.use('/logout', logoutRouter);

app.use(function(req: Request, res: Response, next: NextFunction) {
  next(createError(404));
});

app.use(function(err: HttpError, req: Request, res: Response, next: NextFunction) {
  res.locals.messageText = err.message;
  res.locals.messageType = "alert-error";
  res.locals.messageDetails = process.env.ENV === 'DEV' ? err : {};

  res.status(err.status || 500);
  res.render('error', { title: err.status || 500 });
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
