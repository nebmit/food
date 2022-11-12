import express, { Request, Response, NextFunction } from 'express';
import auth from '../auth';
import { logout_url } from '../config.json';

const router = express.Router();

router.get('/', auth.restricted, function(req: Request, res: Response, next: NextFunction) {
  res.render('main', { title: 'recipes', logout_domain: logout_url, user: {
    name: req.session.user?.firstname,
    access: req.session.user?.access
  }});
});

export default router;
