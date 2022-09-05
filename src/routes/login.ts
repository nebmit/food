import express, { Request, Response, NextFunction } from 'express';
import auth from '../auth';

const router = express.Router();

router.get('/', function(req: Request, res: Response, next: NextFunction) {
  res.render('login', { title: 'login' });
});

router.post('/', function(req: Request, res: Response, next: NextFunction) {
  var birthdate = new Date(req.body.dateInput);
  var password = req.body.pwdInput;
  console.log("Received login request for " + birthdate + " with password " + password);
  if(!(birthdate instanceof Date && !isNaN(birthdate.getTime())) || password == null) {
    req.session.messageText = "internal error";
    req.session.messageType = "alert-error";
    res.redirect('/login');
    return;
  }

  var users = auth.findUsers(birthdate);
  if (users.length == 1) {
    if (auth.authenticate(users[0].uuid, password)) {
      req.session.user = users[0];
      console.log("Logged in and Ready to go!");
      res.redirect('/');
    } else {
      req.session.messageText = "invalid";
      req.session.messageType = "alert-error";
      res.redirect('/login');
    }
  } else {
    req.session.messageText = "invalid";
    req.session.messageType = "alert-error";
    res.redirect('/login');
  }
});

router.get('/userwithbirthdate', function(req: Request, res: Response, next: NextFunction) {
  var birthdate = req.query.birthdate;
  
  if (typeof birthdate === 'string') {
    var date = new Date(birthdate);

    if(date instanceof Date && !isNaN(date.getTime())) {
      var users = auth.findUsers(date);
      let isUserExist = users.length == 1;
      let isPasswordRequired = isUserExist ? users[0].access < 4 : false;
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({
        exist: isUserExist,
        pwd: isPasswordRequired,
        error: null
      }));
    } else {
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({
        exist: false,
        pwd: false,
        error: "invalid date"
      }));
    }
  } else {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({
      exist: false,
      pwd: false,
      error: "no date provided"
    }));
  }
});

export default router;
