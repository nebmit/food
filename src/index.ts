import express, { Express, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import logger from 'morgan';
import createError, { HttpError } from 'http-errors';

import indexRouter from './routes/index';

dotenv.config();


const app: Express = express();
const port = process.env.PORT;

app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, '../public')));

app.use('/', indexRouter);

app.use(function(req: Request, res: Response, next: NextFunction) {
  next(createError(404));
});


app.use(function(err: HttpError, req: Request, res: Response, next: NextFunction) {
  res.locals.message = err.message;
  res.locals.error = process.env.ENV === 'DEV' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

app.listen(port, () => {
  console.log(`[server]: Server is running at https://localhost:${port}`);
});
