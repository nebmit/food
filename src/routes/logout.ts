import express, { Request, Response, NextFunction } from 'express';
import auth from '../auth';

const router = express.Router();

router.get('/', auth.restricted, function(req: Request, res: Response, next: NextFunction) {
    req.session.destroy((err) => {
        res.redirect('/login');
    });
});

export default router;
