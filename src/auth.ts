import express, { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';

// TODO: Move this to a DB Table
const users = [
    {
        uuid: "johndoemyman",
        birthdate: new Date("1990-01-01"),
        firstname: "john",
        lastname: "doe",
        password: hashPassword("password"),
        access: 0,
    },
    {
        uuid: "johndoemyman1",
        birthdate: new Date("1990-01-02"),
        firstname: "john2",
        lastname: "doe2",
        password: hashPassword(""),
        access: 5,
    }
];

function restricted(req: Request, res: Response, next: NextFunction) {
    if (req.session.user) {
        next();
    } else {
        console.log(req.session.user);
        req.session.messageText = "Access denied!";
        req.session.messageType = "alert-error";
        
        res.redirect('/login');
    }
}

function hashPassword(password: string) : string {
    return bcrypt.hashSync(password, 10);
};

function comparePassword(password: string, hash: string) : boolean {
    return bcrypt.compareSync(password, hash);
}

function findUsers(birthdate: Date): Array<User> {
    return users.filter(user => user.birthdate.getTime() == birthdate.getTime());
}

function authenticate(uuid: string, password: string) : boolean {
    const user = users.find(user => user.uuid === uuid);
    if (user) {
        return comparePassword(password, user.password);
    }
    return false;
}

function register(firstname: string, lastname: string, birthdate: Date, password: string): boolean {
    const user = {
        uuid: "",
        firstname,
        lastname,
        birthdate,
        password: hashPassword(password),
        access: 5
    };
    users.push(user);
    return true;
}

export default {
    findUsers,
    authenticate,
    register,
    restricted
};
