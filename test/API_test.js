const dotenv = require("dotenv");
dotenv.config({ path: "./test.env" });

const mongoose = require("mongoose");
const Citizen = require("../api/models/citizen");
const Timestamp = require("../api/models/timestamp");
const Admin = require("../api/models/admin");
const Accident = require("../api/models/accident");

const bcrypt = require("bcrypt");

const chai = require("chai");
const chaiHttp = require("chai-http");
chai.use(chaiHttp);
chai.should();

const app = require("../app").listen(0); // 0 = operating system assigns available

const { MongoMemoryServer } = require("mongodb-memory-server");
let mongoServer;

const citizenId1 = new mongoose.Types.ObjectId();
const citizenId2 = new mongoose.Types.ObjectId();
const timestampId1 = new mongoose.Types.ObjectId();
const timestampId2 = new mongoose.Types.ObjectId();
const adminId1 = new mongoose.Types.ObjectId();
const accidentId1 = new mongoose.Types.ObjectId();

before(async () => {
  // If Mongoose is already connected, close the current connection first
  if (mongoose.connection.readyState) {
    await mongoose.disconnect();
  }

  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // insert some mockdata:
  const admin = new Admin({
    _id: new mongoose.Types.ObjectId(),
    username: "admin",
    password: await bcrypt.hash("admin", 10),
  });
  await admin.save();

  const accident = new Accident({
    _id: accidentId1,
    alarmTime: Date.now(),
    deviceId: "pi123",
    positionId: "1",
    citizen: citizenId1,
  });
  await accident.save();
});

after(async () => {
  app.close(() => {
    console.log("Server stopped after testing");
  });

  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("Citizen API", () => {
  beforeEach(async () => {
    const citizenData1 = new Citizen({
      _id: citizenId1,
      birthdate: "1990-01-01",
      name: "John Doe",
      email: "john@example.com",
      phone: 12345678,
      address: {
        postal: 12345,
        street: "Test Street",
        city: "Test City",
      },
      password: await bcrypt.hash("testPassword", 10),
      deviceId: "1234",
    });
    const citizenData2 = new Citizen({
      _id: citizenId2,
      birthdate: "1995-01-01",
      name: "Jane Doe",
      email: "jane@example.com",
      phone: 12345679,
      address: {
        postal: 12346,
        street: "Test Street 2",
        city: "Test City 2",
      },
      password: await bcrypt.hash("testPassword2", 10),
      deviceId: "12345",
    });

    await Citizen.deleteMany({});
    await citizenData1.save();
    await citizenData2.save();
  });

  describe("POST /signup", () => {
    it("should create a new citizen", async () => {
      const citizenData = {
        birthdate: "1990-01-01",
        name: "Johny Doe",
        email: "johny@example.com",
        phone: 12344448,
        address: {
          postal: 12345,
          street: "Test Street",
          city: "Test City",
        },
        password: "testPassword",
        deviceId: "123456",
      };
      const res = await chai
        .request(app)
        .post("/citizen/signup")
        .send(citizenData);

      res.should.have.status(201);
      res.body.should.be.a("object");
      res.body.should.have.property("message").eql("citizen created");
      res.body.should.have.property("id");
      res.body.should.have.property("citizen");
      res.body.citizen.should.be.a("object");
      res.body.citizen.should.have
        .property("deviceId")
        .eql(citizenData.deviceId);
      res.body.citizen.should.have.property("name").eql(citizenData.name);
      res.body.citizen.should.have.property("phone").eql(citizenData.phone);
      res.body.citizen.should.have.property("email").eql(citizenData.email);
      res.body.citizen.should.have.property("address");
    });

    it("should not create a new citizen (unique data in use)", async () => {
      const citizenData = {
        birthdate: "1990-01-01",
        name: "Some random guy",
        email: "random@org.com",
        deviceId: "random device Id",
        phone: 12345678, //this number already exists
        address: {
          postal: 12345,
          street: "Test Street",
          city: "Test City",
        },
        password: "testPassword",
      };
      const res = await chai
        .request(app)
        .post("/citizen/signup")
        .send(citizenData);

      res.should.have.status(409);
    });
  });

  describe("POST /login", () => {
    it("should log in the citizen and return a token", async () => {
      const loginData = {
        email: "john@example.com",
        password: "testPassword",
      };

      const res = await chai
        .request(app)
        .post("/citizen/login")
        .send(loginData);

      res.should.have.status(200);
      res.body.should.be.a("object");
      res.body.should.have.property("message").eql("Authorization successful");
      res.body.should.have.property("token").eql(res.body.token);
    });

    it("should not log in the citizen (incorrect credentials/password)", async () => {
      const loginData = {
        email: "john@example.com",
        password: "wrong password",
      };

      const res = await chai
        .request(app)
        .post("/citizen/login")
        .send(loginData);

      res.should.have.status(401);
    });
  });

  describe("DELETE /:citizenId", () => {
    it("should delete a citizen by ID", async () => {
      const loginData = {
        username: "admin",
        password: "admin",
      };
      const resToken = await chai
        .request(app)
        .post("/admin/login")
        .send(loginData);
      const token = resToken.body.token;
      const res = await chai
        .request(app)
        .delete(`/citizen/${citizenId1}`)
        .set("Authorization", `Bearer ${token}`);

      res.should.have.status(200);
      res.body.should.be.a("object");
      res.body.should.have.property("message").eql("Citizen deleted");
    });
  });

  describe("GET /", () => {
    it("should get all citizens", async () => {
      const loginData = {
        username: "admin",
        password: "admin",
      };
      const resToken = await chai
        .request(app)
        .post("/admin/login")
        .send(loginData);
      const token = resToken.body.token;

      const res = await chai
        .request(app)
        .get("/citizen")
        .set("Authorization", `Bearer ${token}`);

      res.should.have.status(200);
      res.body.should.be.a("object");
      res.body.should.have.property("currentPage").eql(1);
      res.body.should.have.property("totalItems").eql(2);
      res.body.should.have.property("totalPages").eql(1);
      res.body.should.have.property("itemsPerPage").eql(2);
      res.body.should.have.property("citizens");
      res.body.citizens.should.be.a("array");
      res.body.citizens.length.should.be.eql(2);
    });

    it("should get citizens with pagination", async () => {
      // Log in the first citizen to get the token
      const loginData = {
        username: "admin",
        password: "admin",
      };
      const resToken = await chai
        .request(app)
        .post("/admin/login")
        .send(loginData);
      const token = resToken.body.token;

      // Request the first page with a limit of 1
      const res = await chai
        .request(app)
        .get("/citizen?page=1&limit=1")
        .set("Authorization", `Bearer ${token}`);

      res.should.have.status(200);
      res.body.should.be.a("object");
      res.body.should.have.property("currentPage").eql(1);
      res.body.should.have.property("totalItems").eql(2);
      res.body.should.have.property("totalPages").eql(2);
      res.body.should.have.property("itemsPerPage").eql(1);
      res.body.should.have.property("citizens");
      res.body.citizens.length.should.be.eql(1);
    });
  });

  describe("GET /:citizenId", () => {
    it("should get citizen by ID", async () => {
      const loginData = {
        username: "admin",
        password: "admin",
      };

      const resToken = await chai
        .request(app)
        .post("/admin/login")
        .send(loginData);
      const token = resToken.body.token;

      const res = await chai
        .request(app)
        .get(`/citizen/${citizenId1}`)
        .set("Authorization", `Bearer ${token}`);

      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a("object");
      res.body.should.have.property("citizen");
      res.body.citizen.should.be.a("object");
      res.body.citizen.should.have.property("_id").eql(citizenId1.toString());
      res.body.citizen.should.have.property("name");
      res.body.citizen.should.have.property("email");
      res.body.citizen.should.have.property("phone");
      res.body.citizen.should.have.property("deviceId");
      res.body.citizen.should.have.property("address");
      res.body.citizen.name.should.not.be.null.and.not.be.undefined;
      res.body.citizen.deviceId.should.not.be.null.and.not.be.undefined;
      res.body.citizen.email.should.not.be.null.and.not.be.undefined;
    });
    it("should not get a citizen (no such id)", async () => {
      const loginData = {
        username: "admin",
        password: "admin",
      };

      const resToken = await chai
        .request(app)
        .post("/admin/login")
        .send(loginData);
      const token = resToken.body.token;

      const res = await chai
        .request(app)
        .get(`/citizen/${new mongoose.Types.ObjectId()}`)
        .set("Authorization", `Bearer ${token}`);

      res.should.have.status(404);
    });
  });

  describe("PATCH /", () => {
    it("should update a citizen by id", async () => {
      const loginData = {
        username: "admin",
        password: "admin",
      };
      const resToken = await chai
        .request(app)
        .post("/admin/login")
        .send(loginData);
      const token = resToken.body.token;

      const updates = [
        {
          propName: "deviceId",
          value: "monkeyLover123",
        },
      ];

      const res = await chai
        .request(app)
        .patch(`/citizen/${citizenId2}`)
        .set("Authorization", `Bearer ${token}`)
        .send(updates);

      res.should.have.status(200);
      res.body.should.be.a("object");
      res.body.should.have.property("message").eql("Citizen updated");
    });
    it("should not update a citizen by its id (no updates, same values)", async () => {
      const loginData = {
        username: "admin",
        password: "admin",
      };
      const resToken = await chai
        .request(app)
        .post("/admin/login")
        .send(loginData);
      const token = resToken.body.token;

      const updates = [
        {
          propName: "email",
          value: "john@example.com",
        },
      ];

      const res = await chai
        .request(app)
        .patch(`/citizen/${citizenId1}`)
        .set("Authorization", `Bearer ${token}`)
        .send(updates);

      res.should.have.status(204);
    });
    it("should not update an admin by its id (wrong propname)", async () => {
      const loginData = {
        username: "admin",
        password: "admin",
      };
      const resToken = await chai
        .request(app)
        .post("/admin/login")
        .send(loginData);
      const token = resToken.body.token;

      const updates = [
        {
          propName: "wrong propName that does not exist",
          value: "some arbitrary value that does not matter",
        },
      ];

      const res = await chai
        .request(app)
        .patch(`/citizen/${citizenId1}`)
        .set("Authorization", `Bearer ${token}`)
        .send(updates);

      res.should.have.status(400);
    });
  });
});

// Add this describe block for timestamps within the existing test file
describe("Timestamps API", () => {
  before(async () => {
    await Timestamp.deleteMany({});
    await Citizen.deleteMany({});
  });

  beforeEach(async () => {
    const citizenData1 = new Citizen({
      _id: citizenId1,
      birthdate: "1990-01-01",
      name: "John Doe",
      email: "john@example.com",
      deviceId: "1234",
      phone: 12345678,
      address: {
        postal: 12345,
        street: "Test Street",
        city: "Test City",
      },
      password: await bcrypt.hash("testPassword", 10),
      deviceId: "1234",
    });

    const timestampData1 = new Timestamp({
      _id: timestampId1,
      citizen: citizenId1,
      startTime: "2023-04-26T09:00:00.000Z",
      endTime: "2023-04-26T17:00:00.000Z",
      deviceId: citizenData1.deviceId,
      positionId: 1,
    });

    const timestampData2 = new Timestamp({
      _id: timestampId2,
      startTime: "2023-04-27T09:00:00.000Z",
      endTime: "2023-04-27T17:00:00.000Z",
      deviceId: citizenData1.deviceId,
      citizen: citizenId1,
      positionId: 1,
    });

    await Timestamp.deleteMany({});
    await Citizen.deleteMany({});
    await citizenData1.save();
    await timestampData1.save();
    await timestampData2.save();
  });

  describe("POST /", () => {
    it("should create a new timestamp", async () => {
      const timestampData = {
        startTime: "2023-04-26T09:00:00.000Z",
        endTime: "2023-04-26T17:00:00.000Z",
        deviceId: "1234",
        positionId: 1,
      };
      const res = await chai
        .request(app)
        .post("/timestamps")
        .send(timestampData);

      res.should.have.status(201);
      res.body.should.be.a("object");
      res.body.should.have.property("message").eql("Timestamp stored");
      res.body.should.have.property("createdTimestamp");
      res.body.createdTimestamp.should.have
        .property("positionId")
        .eql(timestampData.positionId);
      res.body.createdTimestamp.should.have.property("_id");
      res.body.createdTimestamp.should.have
        .property("startTime")
        .eql(timestampData.startTime);
      res.body.createdTimestamp.should.have
        .property("endTime")
        .eql(timestampData.endTime);
      res.body.createdTimestamp.citizen.should.not.be.null.and.not.be.undefined;
    });

    it("should not create a new timestamp (no such device Id)", async () => {
      const timestampData = {
        startTime: Date.now(),
        endTime: Date.now(),
        deviceId: "non existent deviceId",
        positionId: 1,
      };
      const res = await chai
        .request(app)
        .post("/timestamps")
        .send(timestampData);
      res.should.have.status(404);
    });
  });

  describe("GET /:timestampId", () => {
    it("should get a timestamp by ID", async () => {
      const loginData = {
        username: "admin",
        password: "admin",
      };
      const resToken = await chai
        .request(app)
        .post("/admin/login")
        .send(loginData);
      const token = resToken.body.token;

      const res = await chai
        .request(app)
        .get(`/timestamps/${timestampId1}`)
        .set("Authorization", `Bearer ${token}`);

      res.should.have.status(200);
      res.body.should.be.a("object");
      res.body.should.have.property("timestamp");
      res.body.timestamp.should.have.property("citizen");
      res.body.timestamp.should.have
        .property("_id")
        .eql(timestampId1.toString());
      res.body.timestamp.should.have.property("startTime");
      res.body.timestamp.should.have.property("endTime");
      res.body.timestamp.startTime.should.not.be.null.and.not.be.undefined;
      res.body.timestamp.endTime.should.not.be.null.and.not.be.undefined;
    });
    it("should not get a timestamp by id (no such id)", async () => {
      const loginData = {
        username: "admin",
        password: "admin",
      };
      const resToken = await chai
        .request(app)
        .post("/admin/login")
        .send(loginData);
      const token = resToken.body.token;

      const res = await chai
        .request(app)
        .get(`/timestamps/${new mongoose.Types.ObjectId()}`)
        .set("Authorization", `Bearer ${token}`);

      res.should.have.status(404);
    });
  });

  describe("GET /timestamps/by-citizen/:citizenId", () => {
    it("should get all timestamps for a citizen by citizenId", async () => {
      const loginData = {
        username: "admin",
        password: "admin",
      };
      const resToken = await chai
        .request(app)
        .post("/admin/login")
        .send(loginData);
      const token = resToken.body.token;

      const res = await chai
        .request(app)
        .get(`/timestamps/by-citizen/${citizenId1}`)
        .set("Authorization", `Bearer ${token}`);

      res.should.have.status(200);
      res.body.should.be.a("object");
      res.body.should.have.property("timestamps");
      res.body.timestamps.should.be.a("array");
      res.body.timestamps.length.should.be.at.least(1);
      res.body.timestamps.length.should.be.eql(2);

      const firstTimestamp = res.body.timestamps[0];
      firstTimestamp.should.have.property("citizen");
      firstTimestamp.should.have.property("_id");
      firstTimestamp.should.have.property("startTime");
      firstTimestamp.should.have.property("endTime");
      firstTimestamp.startTime.should.not.be.null.and.not.be.undefined;
      firstTimestamp.endTime.should.not.be.null.and.not.be.undefined;
    });

    it("should get timestamps from citizenId (paginated)", async () => {
      const loginData = {
        username: "admin",
        password: "admin",
      };
      const resToken = await chai
        .request(app)
        .post("/admin/login")
        .send(loginData);
      const token = resToken.body.token;

      const res = await chai
        .request(app)
        .get(`/timestamps/by-citizen/${citizenId1}?page=1&limit=1`)
        .set("Authorization", `Bearer ${token}`);

      res.should.have.status(200);
      res.body.should.be.a("object");
      res.body.should.have.property("totalItems").eql(2);
      res.body.should.have.property("totalPages").eql(2);
      res.body.should.have.property("itemsPerPage").eql(1);
      res.body.should.have.property("timestamps");
      res.body.timestamps.length.should.be.eql(1);
    });
  });

  describe("GET /", () => {
    it("should get all timestamps (pagination)", async () => {
      const loginData = {
        username: "admin",
        password: "admin",
      };
      const resToken = await chai
        .request(app)
        .post("/admin/login")
        .send(loginData);
      const token = resToken.body.token;

      const res = await chai
        .request(app)
        .get("/timestamps?page=1&limit=2")
        .set("Authorization", `Bearer ${token}`);

      // console.log("Totalitems " + res.body.totalItems);
      res.should.have.status(200);
      res.body.should.be.a("object");
      res.body.should.have.property("totalItems").eql(2);
      res.body.should.have.property("totalPages").eql(1);
      res.body.should.have.property("itemsPerPage").eql(2);
      res.body.should.have.property("timestamps");
      res.body.timestamps.length.should.be.eql(2);
    });

    it("should get all timestamps without pagination", async () => {
      const loginData = {
        username: "admin",
        password: "admin",
      };
      const resToken = await chai
        .request(app)
        .post("/admin/login")
        .send(loginData);
      const token = resToken.body.token;

      const res = await chai
        .request(app)
        .get("/timestamps")
        .set("Authorization", `Bearer ${token}`);

      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a("object"); // Change this from 'array' to 'object'
      res.body.should.have.property("timestamps"); // Check that the 'timestamps' property exists
      res.body.timestamps.should.be.a("array"); // Check that the 'timestamps' property is an array
      res.body.timestamps.length.should.be.eql(2);

      res.body.timestamps.every((item) => item.should.be.a("object"));

      const timestamp1 = res.body.timestamps.find(
        (t) => t.startTime === "2023-04-26T09:00:00.000Z"
      );
      const timestamp2 = res.body.timestamps.find(
        (t) => t.startTime === "2023-04-27T09:00:00.000Z"
      );

      timestamp1.should.not.be.undefined;
      timestamp1.should.have.property("startTime", "2023-04-26T09:00:00.000Z");
      timestamp1.should.have.property("endTime", "2023-04-26T17:00:00.000Z");
      timestamp1.should.have.property("citizen", citizenId1.toString());

      timestamp2.should.not.be.undefined;
      timestamp2.should.have.property("startTime", "2023-04-27T09:00:00.000Z");
      timestamp2.should.have.property("endTime", "2023-04-27T17:00:00.000Z");
      timestamp2.should.have.property("citizen", citizenId1.toString());
    });
  });
});

describe("Admin API", () => {
  beforeEach(async () => {
    const admin = new Admin({
      _id: adminId1,
      username: "adminxyz",
      password: await bcrypt.hash("adminxyz", 10),
    });
    await Admin.deleteOne({ _id: adminId1 });
    await admin.save();
  });

  describe("PATCH /", () => {
    it("should update an admin by its id", async () => {
      const loginData = {
        username: "admin",
        password: "admin",
      };
      const resToken = await chai
        .request(app)
        .post("/admin/login")
        .send(loginData);
      const token = resToken.body.token;

      const updates = [
        {
          propName: "username",
          value: "admin patched",
        },
      ];

      const res = await chai
        .request(app)
        .patch(`/admin/${adminId1}`)
        .set("Authorization", `Bearer ${token}`)
        .send(updates);

      res.should.have.status(200);
      res.body.should.be.a("object");
      res.body.should.have.property("message").eql("Admin updated");
    });

    it("should not update an admin by its id (no updates, same values)", async () => {
      const loginData = {
        username: "adminxyz",
        password: "adminxyz",
      };
      const resToken = await chai
        .request(app)
        .post("/admin/login")
        .send(loginData);
      const token = resToken.body.token;

      const updates = [
        {
          propName: "username",
          value: "adminxyz",
        },
      ];

      const res = await chai
        .request(app)
        .patch(`/admin/${adminId1}`)
        .set("Authorization", `Bearer ${token}`)
        .send(updates);

      res.should.have.status(204);
    });
    it("should not update an admin by its id (wrong propname)", async () => {
      const loginData = {
        username: "admin",
        password: "admin",
      };
      const resToken = await chai
        .request(app)
        .post("/admin/login")
        .send(loginData);
      const token = resToken.body.token;

      const updates = [
        {
          propName: "wrong propName that does not exist",
          value: "some arbitrary value that does not matter",
        },
      ];

      const res = await chai
        .request(app)
        .patch(`/admin/${adminId1}`)
        .set("Authorization", `Bearer ${token}`)
        .send(updates);

      res.should.have.status(400);
    });
  });

  describe("POST /signup", () => {
    it("should create a new admin", async () => {
      const loginData = {
        username: "admin",
        password: "admin",
      };
      const resToken = await chai
        .request(app)
        .post("/admin/login")
        .send(loginData);
      const token = resToken.body.token;

      const adminData = {
        username: "admin2",
        password: "admin2",
      };

      const res = await chai
        .request(app)
        .post("/admin/signup")
        .set("Authorization", `Bearer ${token}`)
        .send(adminData);

      res.should.have.status(201);
      res.body.should.be.a("object");
      res.body.should.have.property("message").eql("admin created");
      res.body.should.have.property("id");
    });

    it("should not create a new admin (username in use already)", async () => {
      const loginData = {
        username: "admin",
        password: "admin",
      };
      const resToken = await chai
        .request(app)
        .post("/admin/login")
        .send(loginData);
      const token = resToken.body.token;

      const adminData = {
        username: "admin",
        password: "admin",
      };

      const res = await chai
        .request(app)
        .post("/admin/signup")
        .set("Authorization", `Bearer ${token}`)
        .send(adminData);

      res.should.have.status(409);
    });
  });

  describe("POST /login", () => {
    it("should log in the admin and return a token", async () => {
      const loginData = {
        username: "admin",
        password: "admin",
      };
      const res = await chai.request(app).post("/admin/login").send(loginData);
      res.should.have.status(200);
      res.body.should.be.a("object");
      res.body.should.have.property("message").eql("Authorization successful");
      res.body.should.have.property("token");
    });
    it("should not log in the admin (wrong password)", async () => {
      const loginData = {
        username: "admin",
        password: "wrong password for admin user",
      };
      const res = await chai.request(app).post("/admin/login").send(loginData);
      res.should.have.status(401);
    });
  });

  describe("DELETE /:adminId", () => {
    it("should delete an admin by ID", async () => {
      const loginData = {
        username: "admin",
        password: "admin",
      };

      const resToken = await chai
        .request(app)
        .post("/admin/login")
        .send(loginData);
      const token = resToken.body.token;

      const res = await chai
        .request(app)
        .delete(`/admin/${adminId1}`)
        .set("Authorization", `Bearer ${token}`);

      res.should.have.status(200);
      res.body.should.be.a("object");
      res.body.should.have.property("message").eql("Admin deleted");
    });
  });
});

describe("Accident API", () => {
  before(async () => {
    const citizen = new Citizen({
      _id: new mongoose.Types.ObjectId(),
      deviceId: "testId",
      birthdate: Date.now(),
      address: {
        street: "test",
        city: "test",
        postal: 8000,
      },
      name: "test",
      phone: "87568294",
      email: "test@test.com",
      password: "test123", // unhashed password but does not matter for our accident test suite.
    });
    await citizen.save();
  });

  describe("GET /", () => {
    it("should get all accidents (without pagination)", async () => {
      const loginData = {
        username: "admin",
        password: "admin",
      };

      const resToken = await chai
        .request(app)
        .post("/admin/login")
        .send(loginData);
      const token = resToken.body.token;

      const res = await chai
        .request(app)
        .get(`/accident`)
        .set("Authorization", `Bearer ${token}`);

      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a("object"); // Change this from 'array' to 'object'
      res.body.should.have.property("accidents"); // Check that the 'accidents' property exists
      res.body.accidents.should.be.a("array"); // Check that the 'accidents' property is an array
      res.body.accidents.length.should.be.eql(1); // one at top level.

      res.body.accidents.every((item) => item.should.be.a("object"));

      const accident1 = res.body.accidents[0];

      accident1.should.not.be.undefined;
      accident1.should.have.property("alarmTime");
      accident1.should.have.property("positionId");
      accident1.should.have.property("citizen");
    });
    it("should get accidents (with pagination)", async () => {
      const loginData = {
        username: "admin",
        password: "admin",
      };
      const resToken = await chai
        .request(app)
        .post("/admin/login")
        .send(loginData);
      const token = resToken.body.token;

      const page = 1;
      const limit = 5;

      const res = await chai
        .request(app)
        .get(`/accident?page=${page}&limit=${limit}`)
        .set("Authorization", `Bearer ${token}`);

      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a("object");
      res.body.should.have.property("accidents");
      res.body.accidents.should.be.a("array");

      res.body.should.have.property("currentPage").eql(page);
      res.body.should.have.property("totalPages");
      res.body.should.have.property("itemsPerPage").eql(limit);

      res.body.accidents.length.should.be.at.most(limit); // The number of items should be less than or equal to the limit

      res.body.accidents.every((item) => item.should.be.a("object"));

      const accident1 = res.body.accidents[0];

      accident1.should.not.be.undefined;
      accident1.should.have.property("alarmTime");
      accident1.should.have.property("positionId");
      accident1.should.have.property("citizen");
    });
  });

  // Not testing SMS functionality in this.
  describe("POST /", () => {
    it("should report an accident", async () => {
      const accident = {
        deviceId: "testId",
        positionId: 0,
        alarmTime: Date.now(),
      };

      const res = await chai.request(app).post("/accident").send(accident);
      res.should.have.status(201);
      res.body.should.be.a("object");
      res.body.should.have.property("message").eql("Accident stored");
    });
    it("should not report an accident (no deviceId found)", async () => {
      const accident = {
        deviceId: "Non-existent deviceId",
        positionId: 0,
        alarmTime: Date.now(),
      };

      const res = await chai.request(app).post("/acicdent").send(accident);
      res.should.have.status(404);
    });
  });

  describe("DELETE /:accidentId", () => {
    it("should delete an accident by its Id", async () => {
      const loginData = {
        username: "admin",
        password: "admin",
      };
      const resToken = await chai
        .request(app)
        .post("/admin/login")
        .send(loginData);
      const token = resToken.body.token;

      const res = await chai
        .request(app)
        .delete(`/accident/${accidentId1}`)
        .set("Authorization", `Bearer ${token}`);

      res.should.have.status(200);
      res.body.should.be.a("object");
      res.body.should.have.property("message").eql("Accident deleted");
    });
  });
});

describe("Middleware for API", () => {
  before(async () => {
    await Citizen.deleteMany({});
    const citizen = new Citizen({
      _id: new mongoose.Types.ObjectId(),
      deviceId: "testId",
      birthdate: Date.now(),
      address: {
        street: "test",
        city: "test",
        postal: 8000,
      },
      name: "test",
      phone: "87568294",
      email: "test@test.com",
      password: await bcrypt.hash("test123", 10),
    });
    await citizen.save();
  });

  it("should not authorize user (no token)", async () => {
    const res = await chai.request(app).get("/timestamps");
    res.should.have.status(401);
  });

  it("should not authorize user (with token)", async () => {
    const loginData = {
      email: "test@test.com",
      password: "test123",
    };

    const resToken = await chai
      .request(app)
      .post("/citizen/login")
      .send(loginData);
    const token = resToken.body.token;

    const res = await chai
      .request(app)
      .get("/citizen")
      .set("Authorization", `Bearer ${token}`);
    res.should.have.status(403);
  });
});
