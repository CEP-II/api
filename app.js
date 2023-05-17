// For documentation purposes.
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Night Assist API",
      version: "1.0.0",
      description:
        "Documentation for Night Assist's API used for data transfer between database and web server. The API follows the production-standard REST principles. Each endpoint has been unit tested: both success scenarios and all but the generic 500 response in case of 'unhandled' errors have been tested. The custom middleware for authentication has also been unit tested.",
    },
    servers: [
      {
        url: "http://analogskilte.dk:3000", // temporary for testing use command: ssh -R 80:localhost:3000 serveo.net to generate
        description: "Deployment server",
      },
      {
        url: "http://localhost:3000",
        description: "local",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT used for authentication",
        },
      },
      schemas: {
        Citizen: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              format: "uuid",
              description: "Unique identifier for the citizen",
            },
            birthdate: {
              type: "string",
              format: "date",
              description: "Birthdate of the citizen",
            },
            name: {
              type: "string",
              description: "Name of the citizen",
            },
            deviceId: {
              type: "string",
              description: "Unique device identifier for the citizen",
            },
            address: {
              type: "object",
              description: "Address of the citizen",
              properties: {
                postal: {
                  type: "integer",
                  description: "Postal code",
                },
                street: {
                  type: "string",
                  description: "Street name",
                },
                city: {
                  type: "string",
                  description: "City name",
                },
              },
              required: ["postal", "street", "city"],
            },
            phone: {
              type: "string",
              description: "Phone number of the citizen",
              pattern: "^(+45|0045|(45))?s?[2-9](s?d){7}$",
            },
            email: {
              type: "string",
              description: "Email address of the citizen",
              pattern:
                "^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|\"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*\")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])).){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)])$",
            },
            password: {
              type: "string",
              description: "Password of the citizen",
            },
          },
          required: [
            "_id",
            "birthdate",
            "name",
            "deviceId",
            "address",
            "email",
            "password",
          ],
        },
        Timestamp: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              format: "uuid",
              description: "Unique identifier for the timestamp",
            },
            positionId: {
              type: "integer",
              description: "Position identifier",
              minimum: 0,
              maximum: 4,
            },
            startTime: {
              type: "string",
              format: "date-time",
              description: "Start time of the timestamp",
            },
            endTime: {
              type: "string",
              format: "date-time",
              description: "End time of the timestamp",
            },
            deviceId: {
              type: "string",
              description: "Device identifier for the timestamp",
            },
            citizen: {
              type: "string",
              format: "uuid",
              description: "Citizen ID associated with the timestamp",
            },
          },
          required: [
            "_id",
            "positionId",
            "startTime",
            "endTime",
            "deviceId",
            "citizen",
          ],
        },
        Accident: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              format: "uuid",
              description: "Unique identifier for the accident",
            },
            alarmTime: {
              type: "string",
              format: "date-time",
              description: "Time when the accident alarm was triggered",
            },
            positionId: {
              type: "integer",
              description: "Position identifier at the time of the accident",
              minimum: 0,
              maximum: 4,
            },
            deviceId: {
              type: "string",
              description:
                "Unique device identifier of the citizen reporting the accident",
            },
            citizen: {
              type: "string",
              format: "uuid",
              description:
                "Unique identifier for the citizen involved in the accident",
            },
          },
          required: ["_id", "alarmTime", "positionId", "deviceId", "citizen"],
        },
        Admin: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              format: "uuid",
              description: "Unique identifier for the admin",
            },
            username: {
              type: "string",
              description: "Username of the admin",
            },
            password: {
              type: "string",
              description: "Password of the admin",
            },
          },
          required: ["_id", "username", "password"],
        },
      },
    },
  },
  apis: ["./api/routes/*.js", "./api/controller/*.js"], // path to route files.
};
const swaggerDocs = swaggerJsdoc(swaggerOptions);

const express = require("express");
const app = express();

const morgan = require("morgan"); // <--- we want all requests to be funneled through morgan to log it.
const bodyParser = require("body-parser"); // <--- parse the body of incoming requests, othwerwise not nicely formatted
const mongoose = require("mongoose");

const cors = require("cors");
const corsOptions = {
  origin: "*", // Allow all origins
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "Access-Control-Allow-Credentials",
  ],
  credentials: true,
};

const adminRoutes = require("./api/routes/admin");
const citizenRoutes = require("./api/routes/citizen");
const timestampRoutes = require("./api/routes/timestamps");
const accidentRoutes = require("./api/routes/accident");

//
mongoose.connect(
  "mongodb+srv://nightassist:" +
    process.env.MONGO_ATLAS_PW +
    "@nightassist.ifgd2oi.mongodb.net/?retryWrites=true&w=majority"
);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// middleware below, sequential flow
app.use(cors(corsOptions));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

if (process.env.NODE_ENV !== "test") {
  // log for anything
  app.use(morgan("dev")); // <-- log
}

// Not sure if we want images so this middleware can potentially be deleted as well as the package
// make folder publically available to get access to images. There are other ways of doing this, e.g. by introducing new routes.
app.use("/uploads", express.static("uploads")); // first parameter ensures we only parse requests to the '/uploads' path.

// Routes which should handle requests
app.use("/citizen", citizenRoutes);
app.use("/timestamps", timestampRoutes);
app.use("/admin", adminRoutes);
app.use("/accident", accidentRoutes);

// If we get down here the request is different from what we want to / can handle.
// We handle every request that reaches this line.
app.use((req, res, next) => {
  const error = new Error("Not found");
  error.status = 404;
  next(error); // forward request (error request instead of original one)
});

// error handling from above but also errors from anywhere else in the application (i.e. database operations might fail, 500 erorrs)
app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message,
    },
  });
});

module.exports = app;
