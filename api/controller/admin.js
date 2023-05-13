const mongoose = require("mongoose");
const Admin = require("../models/admin");

const bcrypt = require("bcrypt"); // <-- for hashing passwords
const jwt = require("jsonwebtoken"); // <-- library for json webtokens.

/**
 * @swagger
 * /admin/signup:
 *   post:
 *     summary: Sign up a new admin
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       description: Provide the admin details for sign up
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: Admin username
 *               password:
 *                 type: string
 *                 description: Admin password
 *             required:
 *               - username
 *               - password
 *     responses:
 *       201:
 *         description: Admin created successfully
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
 *                   description: Unique identifier for the created admin
 *       409:
 *         description: Conflict. Request could not be processed. Unique data already in user.
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
exports.signup = (req, res, next) => {
  Admin.find({ username: req.body.username })
    .exec()
    .then((admin) => {
      if (admin.length >= 1)
        return res.status(409).json({
          message: "admin username exists already",
        });

      // New username, hash password and attempt to
      bcrypt.hash(req.body.password, 10, (err, hash) => {
        if (err) return res.status(500).json({ error: err });

        const admin = new Admin({
          _id: new mongoose.Types.ObjectId(),
          username: req.body.username,
          password: hash,
        });

        admin
          .save()
          .then((result) => {
            return res.status(201).json({
              message: "admin created",
              id: admin._id,
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
 * /admin/login:
 *   post:
 *     summary: Log in as an admin
 *     tags: [Admin]
 *     requestBody:
 *       description: Provide the admin username and password for login
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: Admin username
 *               password:
 *                 type: string
 *                 description: Admin password
 *             required:
 *               - username
 *               - password
 *     responses:
 *       200:
 *         description: OK. Authorized successfully.
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
exports.login = (req, res, next) => {
  Admin.findOne({ username: req.body.username })
    .exec()
    .then((admin) => {
      // <--- we only want 1 admin per username, so should only see 1, hence admin.
      if (!admin)
        return res.status(401).json({ message: "Authorization failed" });
      // make sure password matches the one in database (for associated username)
      bcrypt.compare(req.body.password, admin.password, (err, result) => {
        if (err)
          return res.status(401).json({ message: "Authorization failed" }); // comparison failed, not necessarily because of wrong password

        if (result) {
          // <--- Correct password.
          const token = jwt.sign(
            {
              username: admin.username,
              adminId: admin._id,
              role: "admin",
            },
            process.env.JWT_KEY,
            {
              expiresIn: "1hr",
            }
          );
          return res
            .status(200)
            .json({ message: "Authorization successful", token: token });
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
 * /admin/{adminId}:
 *   delete:
 *     summary: Delete an admin account
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: adminId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the admin to be deleted
 *     responses:
 *       200:
 *         description: Admin account deleted successfully
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
exports.delete_admin = (req, res, next) => {
  Admin.deleteOne({ _id: req.params.adminId })
    .exec()
    .then((result) => {
      return res.status(200).json({ message: "Admin deleted" });
    })
    .catch((err) => {
      return res.status(500).json({ error: err });
    });
};

/**
 * @swagger
 * /admin/{adminId}:
 *   patch:
 *     summary: Update an admin
 *     description: Update an admin's details. Only accessible by admin users. If the password is changed, the new one will be hashed.
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: adminId
 *         schema:
 *           type: string
 *         required: true
 *         description: The id of the admin to update
 *       - in: body
 *         name: updates
 *         description: The updates to apply
 *         schema:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               propName:
 *                 type: string
 *               value:
 *                 type: string
 *     responses:
 *       200:
 *         description: Admin updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *       204:
 *         description: No content changed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: No changes
 *       400:
 *         description: Invalid propName
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
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
exports.patch_admin = async (req, res, next) => {
  const id = req.params.adminId;
  const updates = {};

  const adminSchemaKeys = Object.keys(Admin.schema.paths);

  // Find the list of changes to make.
  for (const update of req.body) {
    if (!adminSchemaKeys.includes(update.propName)) {
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

  Admin.updateOne({ _id: id }, { $set: updates })
    .exec()
    .then((result) => {
      if (result.modifiedCount == 0) {
        return res.status(204).json({
          message: "No content changed",
        });
      } else {
        return res.status(200).json({
          message: "Admin updated",
        });
      }
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({ error: err });
    });
};
