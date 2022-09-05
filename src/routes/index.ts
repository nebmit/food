import express, { Request, Response, NextFunction } from 'express';
import auth from '../auth';

const router = express.Router();

router.get('/', auth.restricted, function(req: Request, res: Response, next: NextFunction) {
  res.render('index', { title: 'recipes', user: {
    name: req.session.user?.firstname,
    access: req.session.user?.access
  }});
});

export default router;
