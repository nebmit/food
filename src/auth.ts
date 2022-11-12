import { Request, Response, NextFunction } from 'express';

import { login_url } from './config.json';

function restricted(req: Request, res: Response, next: NextFunction) {
    if (req.session.user) {
        next();
    } else {
        req.session.messageText = "Access denied!";
        req.session.messageType = "alert-error";
        req.session.redirect = "http://" + req.get('host') + req.originalUrl;
        res.redirect(login_url);
    }
}

export default {
    restricted
};
