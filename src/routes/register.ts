import express, { Request, Response, NextFunction } from 'express';
import auth from '../auth';

const router = express.Router();

router.get('/', function(req: Request, res: Response, next: NextFunction) {
  res.render('register', { title: 'Express' });
});

router.post('/register', function(req: Request, res: Response, next: NextFunction) {
    const { birthdate, firstname, lastname, password } = req.body;

    if (auth.register(firstname, lastname, birthdate, password)) {
        req.session.messageText = "Registration Successful!";
        req.session.messageType = "alert-success";
        res.redirect('/login');
    } else {
        req.session.messageText = "Registration Failed!";
        req.session.messageType = "alert-error";
        res.redirect('/register');
    }
});

export default router;
