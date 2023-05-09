// For documentation purposes. 
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Night Assist API',
            version: '1.0.0',
            description: 'API for data transfer between database and webserver of Night Assist application',
        },
        servers: [
            {
                url: 'https://miror.serveo.net/api-docs/', // temporary for testing use command: ssh -R 80:localhost:3000 serveo.net to generate
                description: 'development server',
            },
            {
                url: 'http://localhost:3000',
                description: 'local server',
            },
        ],
        components: {
            securitySchemas: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                },
            },
            schemas: {
                Citizen: {
                    type: 'object',
                    properties: {
                        _id: {
                            type: 'string',
                            format: 'uuid',
                            description: 'Unique identifier for the citizen',
                        },
                        birthdate: {
                            type: 'string',
                            format: 'date',
                            description: 'Birthdate of the citizen',
                        },
                        name: {
                            type: 'string',
                            description: 'Name of the citizen',
                        },
                        address: {
                            type: 'object',
                            description: 'Address of the citizen',
                            properties: {
                                postal: {
                                    type: 'integer',
                                    description: 'Postal code',
                                },
                                street: {
                                    type: 'string',
                                    description: 'Street name',
                                },
                                city: {
                                    type: 'string',
                                    description: 'City name',
                                },
                            },
                            required: ['postal', 'street', 'city'],
                        },
                        phone: {
                            type: 'string',
                            description: 'Phone number of the citizen',
                            pattern: '^(\+45|0045|\(45\))?\s?[2-9](\s?\d){7}$',
                        },
                        email: {
                            type: 'string',
                            description: 'Email address of the citizen',
                            pattern: '^(?:[a-z0-9!#$%&\'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&\'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$',
                        },
                        password: {
                            type: 'string',
                            description: 'Password of the citizen',
                        },
                    },
                    required: ['birthdate', 'name', 'address', 'email', 'password'],
                },
                Timestamp: {
                    type: 'object',
                    properties: {
                        _id: {
                            type: 'string',
                            format: 'uuid',
                            description: 'Unique identifier for the timestamp',
                        },
                        positionID: {
                            type: 'integer',
                            description: 'Position identifier',
                            minimum: 0,
                            maximum: 4,
                        },
                        startTime: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Start time of the timestamp',
                        },
                        endTime: {
                            type: 'string',
                            format: 'date-time',
                            description: 'End time of the timestamp',
                        },
                        citizen: {
                            type: 'string',
                            format: 'uuid',
                            description: 'Citizen ID associated with the timestamp',
                        },
                    },
                    required: ['positionID', 'startTime', 'endTime', 'citizen'],
                },
                Admin: {
                    type: 'object',
                    properties: {
                        _id: {
                            type: 'string',
                            format: 'uuid',
                            description: 'Unique identifier for the admin',
                        },
                        username: {
                            type: 'string',
                            description: 'Username of the admin',
                        },
                        password: {
                            type: 'string',
                            description: 'Password of the admin',
                        },
                    },
                    required: ['username', 'password'],
                },
            },
        },
    },
    apis: ['./api/routes/*.js', './api/controller/*.js'], // path to route files.
}
const swaggerDocs = swaggerJsdoc(swaggerOptions);

const express = require('express')
const app = express()
const morgan = require('morgan') // <--- we want all requests to be funneled through morgan to log it. 
const bodyParser = require('body-parser') // <--- parse the body of incoming requests, othwerwise not nicely formatted
const mongoose = require('mongoose')

const cors = require('cors');
const corsOptions = {
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'Access-Control-Allow-Credentials'],
  credentials: true,
};

const adminRoutes = require('./api/routes/admin')
const citizenRoutes = require('./api/routes/citizen')
const timestampRoutes = require('./api/routes/timestamps')

// 
mongoose.connect('mongodb+srv://nightassist:' + 
                process.env.MONGO_ATLAS_PW + 
                '@nightassist.ifgd2oi.mongodb.net/?retryWrites=true&w=majority')


// middleware below, sequential flow
app.use(cors(corsOptions));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.use(morgan('dev')); // <-- log

// Not sure if we want images so this middleware can potentially be deleted as well as the package
// make folder publically available to get access to images. There are other ways of doing this, e.g. by introducing new routes.
app.use('/uploads', express.static('uploads')) // first parameter ensures we only parse requests to the '/uploads' path.

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())



// Routes which should handle requests
app.use('/citizen', citizenRoutes)
app.use('/timestamps', timestampRoutes)
app.use('/admin', adminRoutes)



// If we get down here the request is different from what we want to / can handle. 
// We handle every request that reaches this line. 
app.use((req, res, next) => {
    const error = new Error('Not found');
    error.status = 404;
    next(error); // forward request (error request instead of original one)
})

// error handling from above but also errors from anywhere else in the application (i.e. database operations might fail, 500 erorrs)
app.use((error, req, res, next) => {
    res.status(error.status || 500)
    res.json({
        error: {
            message: error.message
        }
    })
})

module.exports = app
