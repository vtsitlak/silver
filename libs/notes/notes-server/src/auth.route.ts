
import { Request, Response } from 'express';
const userdb = require('./auth.json');

function authenticate(email, password) {
    console.log('user = ', userdb.users.find(user => user.email === email && user.password === password));
    console.log('user all = ', userdb);
    return userdb.users.find(user => user.email === email && user.password === password);
}


export function loginUser(req: Request, res: Response) {

    console.log('User login attempt ...');

    const { email, password } = req.body;

    const user = authenticate(email, password);

    if (user) {
        res.status(200).json({ id: user.id, name: user.name, email: user.email });
    } else {
        res.sendStatus(403);
    }

}

