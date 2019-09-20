'use strict';

const PORT = 8080;
const HOST = '0.0.0.0';

const jwt = require('jsonwebtoken');
const express = require('express');
const session = require('express-session');
const exphbs = require('express-handlebars');
const Keycloak = require('keycloak-connect');

const app = express();

app.engine('hbs', exphbs({
    extname: 'hbs',
    defaultLayout: 'main.hbs',
    relativeTo: __dirname
}));
app.set('view engine', 'hbs');

const memoryStore = new session.MemoryStore();
const keycloak = new Keycloak({ store: memoryStore })

app.use(session({
    secret: 'SESSION_SECRET',
    resave: false,
    saveUninitialized: true,
    store: memoryStore
}));

app.use(keycloak.middleware());

app.get('/', keycloak.protect(), function (req, res) {
    const content = req.kauth.grant.access_token.content;
    const jitsiSecret = "JITSI_SECRET";

    res.render('home', {
        showTitle: true,
        given_name: content.given_name,
        family_name: content.family_name,
        email: content.email,
        default_room: "DEFAULT_ROOM",
        jitsiUrl: "JITSI_URL",

        helpers: {
            jwt: function () {
                const token = jwt.sign({
                    "context": {
                        "user": {
                            "name": content.given_name + " " + content.family_name,
                            "email": content.email
                        }
                    },
                    "aud": "jitsi",
                    "iss": "jitsi",
                    "sub": "JITSI_SUB",
                    "room": "*"
                }, jitsiSecret);
                return token;
            }
        }
    });
});

app.use(keycloak.middleware({ logout: '/' }));

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);