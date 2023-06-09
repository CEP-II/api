const mongoose = require("mongoose");
const Citizen = require("../models/citizen");

const bcrypt = require("bcrypt"); // <-- for hashing passwords
const jwt = require("jsonwebtoken"); // <-- library for json webtokens.

/**
 * @swagger
 * /citizen/signup:
 *   post:
 *     summary: Sign up a new citizen
 *     tags: [Citizen]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               birthdate:
 *                 type: string
 *                 format: date
 *                 description: The birthdate of the citizen.
 *               name:
 *                 type: string
 *                 description: The name of the citizen.
 *               deviceId:
 *                 type: string
 *                 description: The unique device ID for the citizen.
 *               address:
 *                 type: object
 *                 properties:
 *                   postal:
 *                     type: number
 *                     description: The postal code of the citizen's address.
 *                   street:
 *                     type: string
 *                     description: The street name of the citizen's address.
 *                   city:
 *                     type: string
 *                     description: The city of the citizen's address.
 *               phone:
 *                 type: number
 *                 description: The phone number of the citizen.
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The email address of the citizen.
 *               password:
 *                 type: string
 *                 description: The password for the citizen's account.
 *     responses:
 *      201:
 *         description: Citizen account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *                 id:
 *                   type: string
 *                   format: uuid
 *                   description: ID of the created citizen
 *                 citizen:
 *                   $ref: '#/components/schemas/Citizen'
 *      401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *      403:
 *         description: Forbidden. Insufficient access rights.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *      409:
 *         description: Conflict. Unique data already in use
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *      500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   description: Error object
 */
exports.signup = (req, res, next) => {
  Citizen.find({
    $or: [
      { email: req.body.email },
      { phone: req.body.phone },
      { deviceId: req.body.deviceId },
    ],
  })
    .exec()
    .then((citizen) => {
      if (citizen.length >= 1)
        return res.status(409).json({
          message: "Unique data already in use.",
        });

      // New email, hash password and attempt to
      bcrypt.hash(req.body.password, 10, (err, hash) => {
        if (err) return res.status(500).json({ error: err });

        const citizen = new Citizen({
          _id: new mongoose.Types.ObjectId(),
          deviceId: req.body.deviceId,
          birthdate: req.body.birthdate,
          name: req.body.name,
          email: req.body.email,
          phone: req.body.phone,
          address: req.body.address,
          password: hash,
        });

        citizen
          .save()
          .then((result) => {
            return res.status(201).json({
              message: "citizen created",
              id: citizen._id,
              citizen: citizen,
            });
          })
          .catch((err) => {
            console.log(err);
            return res.status(500).json({ error: err });
          });
      }); // salt: random strings added to the password -> less likely to find it in dictionary tables
    });
};

/**
 * @swagger
 * /citizen/login:
 *   post:
 *     summary: Log in a citizen
 *     tags: [Citizen]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email address of the citizen
 *               password:
 *                 type: string
 *                 description: Password of the citizen
 *             required:
 *               - email
 *               - password
 *     responses:
 *       200:
 *         description: Authorization successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *                 token:
 *                   type: string
 *                   description: JWT token
 *                 id:
 *                   type: string
 *                   description: Unique id of citizen
 *
 *       401:
 *         description: Authorization failed. Incorrect email or password.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   description: Error object
 */
exports.login = (req, res, next) => {
  Citizen.findOne({ email: req.body.email })
    .exec()
    .then((citizen) => {
      // <--- we only want 1 citizen per email, so should only see 1, hence citizen.
      if (!citizen)
        return res.status(401).json({ message: "Authorization failed" });
      // make sure password matches the one in database (for associated email)
      bcrypt.compare(req.body.password, citizen.password, (err, result) => {
        if (err)
          return res.status(401).json({ message: "Authorization failed" }); // comparison failed, not necessarily because of wrong password

        if (result) {
          // <--- Correct password.
          const token = jwt.sign(
            {
              email: citizen.email,
              citizenId: citizen._id,
              role: "citizen",
            },
            process.env.JWT_KEY,
            {
              expiresIn: "1hr",
            }
          );
          return res.status(200).json({
            message: "Authorization successful",
            token: token,
            id: citizen._id,
          });
        }

        return res.status(401).json({ message: "Authorization failed" }); // <-- if we get here, password was incorrect.
      });
    })
    .catch((err) => {
      return res.status(500).json({ error: err });
    });
};

/**
 * @swagger
 * /citizen/{citizenId}:
 *   delete:
 *     summary: Delete a citizen
 *     tags: [Citizen]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: citizenId
 *         schema:
 *           type: string
 *         required: true
 *         description: Unique identifier for the citizen
 *     responses:
 *       200:
 *         description: Citizen deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *       403:
 *         description: Forbidden. Insufficient access rights.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   description: Error object
 */
exports.delete = (req, res, next) => {
  Citizen.deleteOne({ _id: req.params.citizenId })
    .exec()
    .then((result) => {
      return res.status(200).json({ message: "Citizen deleted" });
    })
    .catch((err) => {
      return res.status(500).json({ error: err });
    });
};

/**
 * @swagger
 * /citizen:
 *   get:
 *     summary: Get all citizens
 *     tags: [Citizen]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination (optional)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page for pagination (optional)
 *     responses:
 *       200:
 *         description: A list of citizens
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 currentPage:
 *                   type: integer
 *                   description: Current page number
 *                 totalItems:
 *                   type: integer
 *                   description: Total number of citizens
 *                 totalPages:
 *                   type: integer
 *                   description: Total number of pages
 *                 itemsPerPage:
 *                   type: integer
 *                   description: Number of items per page
 *                 citizens:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Citizen'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *       403:
 *         description: Forbidden. Insufficient access rights.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   description: Error object
 */
exports.get_all_citizens = (req, res, next) => {
  const { page, limit } = req.query;
  let query = {};

  if (page && limit) {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    query = { limit: parseInt(limit), skip };
  }

  Citizen.find({}, null, query)
    .then((citizens) => {
      if (page && limit) {
        return Citizen.countDocuments().then((totalItems) => {
          const response = {
            currentPage: parseInt(page),
            totalItems,
            totalPages: Math.ceil(totalItems / parseInt(limit)),
            itemsPerPage: parseInt(limit),
            citizens: citizens,
          };
          return res.status(200).send(response);
        });
      } else {
        const response = {
          currentPage: 1,
          totalItems: citizens.length,
          totalPages: 1,
          itemsPerPage: citizens.length,
          citizens: citizens,
        };
        return res.status(200).send(response);
      }
    })
    .catch((error) => {
      return res.status(500).send(error);
    });
};

/**
 * @swagger
 * /citizen/{citizenId}:
 *   get:
 *     summary: Get citizen by ID
 *     tags: [Citizen]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: citizenId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the citizen to retrieve
 *     responses:
 *       200:
 *         description: Citizen details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 citizen:
 *                   $ref: '#/components/schemas/Citizen'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *       403:
 *         description: Forbidden. Insufficient access rights.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *       404:
 *         description: Citizen not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   description: Error object
 */
exports.get_citizen = (req, res, next) => {
  Citizen.findById(req.params.citizenId)
    .exec()
    .then((citizen) => {
      if (!citizen) {
        // <-- if citizen is null.
        return res.status(404).json({ message: "Citizen not found" });
      }
      return res.status(200).json({
        citizen: citizen,
      });
    })
    .catch((err) => {
      return res.status(500).json({
        error: err,
      });
    });
};

/**
 * @swagger
 * /citizen/{citizenId}:
 *   patch:
 *     summary: Updates a citizen's information
 *     description: Updates a citizen's information by citizenId. Requires admin authorization. Id fields cannot be updated.
 *     tags: [Citizen]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: citizenId
 *         required: true
 *         description: Unique ID of the citizen
 *         schema:
 *           type: string
 *     consumes:
 *       - application/json
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 propName:
 *                   type: string
 *                 value:
 *                   type: string
 *     responses:
 *       200:
 *         description: Citizen updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Citizen updated
 *       204:
 *         description: No content changed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: No content changed
 *       400:
 *         description: Invalid propName or attempt to update id
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid propName
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *       403:
 *         description: Forbidden. Insufficient access rights.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       default:
 *         description: Unexpected error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 */
exports.patch_citizen = async (req, res, next) => {
  const id = req.params.citizenId;
  const updates = {};

  const citizenSchemaKeys = Object.keys(Citizen.schema.paths);

  let updatesArray = [];

  // Find the list of changes to make.
  if (Array.isArray(req.body)) {
    updatesArray = req.body;
  } else if (typeof req.body === "object" && req.body !== null) {
    updatesArray = Object.entries(req.body).map(([propName, value]) => ({
      propName,
      value,
    }));
  } else {
    return res.status(400).json({
      message: "Invalid request body. It should be an array or object",
    });
  }

  for (const update of updatesArray) {
    if (
      !citizenSchemaKeys.includes(update.propName) ||
      update.propName === "id" ||
      update.propName === "_id"
    ) {
      return res.status(400).json({
        message: "Invalid propName",
      });
    }
    if (update.propName === "password") {
      updates[update.propName] = await bcrypt.hash(update.value, 10);
    } else {
      updates[update.propName] = update.value;
    }
  }

  Citizen.updateOne({ _id: id }, { $set: updates })
    .exec()
    .then((result) => {
      if (result.modifiedCount == 0) {
        return res.status(204).json({
          message: "No content changed",
        });
      } else {
        return res.status(200).json({
          message: "Citizen updated",
        });
      }
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({ error: err });
    });
};
