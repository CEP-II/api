const dotenv = require('dotenv');
dotenv.config({ path: './test.env' });

const mongoose = require('mongoose');
const Citizen = require('../api/models/citizen');
const Timestamp = require('../api/models/timestamp')
const Admin = require('../api/models/admin')

const bcrypt = require('bcrypt')

const chai = require('chai');
const chaiHttp = require('chai-http');

const app = require('../app').listen(0); // 0 = operating system assigns available

const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

before(async () => {
  // Start the MongoMemoryServer
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  // Connect to the in-memory MongoDB instance
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // insert some mockdata:
  const admin = new Admin({
    _id: new mongoose.Types.ObjectId(),
    username: "admin",
    password: await bcrypt.hash("admin", 10),
  })
  await admin.save();  
});

after(async () => {
  // Close app and disconnect from the in-memory MongoDB instance
  app.close(() => {
    console.log('Server stopped after testing');
  });

  await mongoose.connection.close();
  await mongoServer.stop();
});

chai.use(chaiHttp);
chai.should();

const citizenId1 = new mongoose.Types.ObjectId()
const citizenId2 = new mongoose.Types.ObjectId()
const timestampId1 = new mongoose.Types.ObjectId()
const timestampId2 = new mongoose.Types.ObjectId()
const adminId1 = new mongoose.Types.ObjectId()


describe('Citizens API', () => {

  beforeEach(async () => {
    const citizenData1 = new Citizen({
      _id: citizenId1,
      birthdate: '1990-01-01',
      name: 'John Doe',
      email: 'john@example.com',
      deviceId: "1234",
      phone: 12345678,
      address: {
        postal: 12345,
        street: 'Test Street',
        city: 'Test City',
      },
      password: await bcrypt.hash('testPassword', 10),
      deviceId: '1234',
    });
    const citizenData2 = new Citizen({
      _id: citizenId2,
      birthdate: '1995-01-01',
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: 12345679,
      address: {
        postal: 12346,
        street: 'Test Street 2',
        city: 'Test City 2',
      },
      password: await bcrypt.hash('testPassword2', 10),
      deviceId: '12345'
    });

    await Citizen.deleteMany({});      
    await citizenData1.save();
    await citizenData2.save();
  });

  describe('POST /signup', () => {
    it('should create a new citizen', async () => { 
      const citizenData = {
        birthdate: '1990-01-01',
        name: 'Johny Doe',
        email: 'johny@example.com',
        deviceId: "1234",
        phone: 12344448,
        address: {
          postal: 12345,
          street: 'Test Street',
          city: 'Test City',
        },
        password: 'testPassword',
        deviceId: '123456',
      };
      const res = await chai.request(app).post('/citizen/signup').send(citizenData);

      res.should.have.status(201);
      res.body.should.be.a('object');
      res.body.should.have.property('message').eql('citizen created');
      res.body.should.have.property('id');
      res.body.should.have.property('citizen')
      res.body.citizen.should.be.a('object')
      res.body.citizen.should.have.property('deviceId').eql(citizenData.deviceId)
      res.body.citizen.should.have.property('name').eql(citizenData.name)
      res.body.citizen.should.have.property('phone').eql(citizenData.phone)
      res.body.citizen.should.have.property('email').eql(citizenData.email)
      res.body.citizen.should.have.property('address')
    });
  });

  describe('POST /login', () => {
    it('should log in the citizen and return a token', async () => {
          
      const loginData = {
        email: 'john@example.com',
        password: 'testPassword',
      };
    
      const res = await chai.request(app).post('/citizen/login').send(loginData);
    
      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('message').eql('Authorization successful');
      res.body.should.have.property('token').eql(res.body.token);
    });
  });

  describe('DELETE /:citizenId', () => {
    it('should delete a citizen by ID', async () => {
      const loginData = {
        username: 'admin',
        password: 'admin',
      };
      const resToken = await chai.request(app).post('/admin/login').send(loginData);
      const token = resToken.body.token;
      const res = await chai
        .request(app)
        .delete(`/citizen/${citizenId1}`)
        .set('Authorization', `Bearer ${token}`);

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('message').eql('Citizen deleted');
    });
  });

  describe('GET /', () => {
    it('should get all citizens', async () => {  
      const loginData = {
        username: 'admin',
        password: 'admin',
      };
      const resToken = await chai.request(app).post('/admin/login').send(loginData);
      const token = resToken.body.token;
  
      const res = await chai
        .request(app)
        .get('/citizen')
        .set('Authorization', `Bearer ${token}`);
  
      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('currentPage').eql(1);
      res.body.should.have.property('totalItems').eql(2);
      res.body.should.have.property('totalPages').eql(1);
      res.body.should.have.property('itemsPerPage').eql(2);
      res.body.should.have.property('citizens');
      res.body.citizens.should.be.a('array');
      res.body.citizens.length.should.be.eql(2);
    });
  
    it('should get citizens with pagination', async () => {
      // Log in the first citizen to get the token
      const loginData = {
        username: 'admin',
        password: 'admin',
      };
      const resToken = await chai.request(app).post('/admin/login').send(loginData);
      const token = resToken.body.token;

  
      // Request the first page with a limit of 1
      const res = await chai
        .request(app)
        .get('/citizen?page=1&limit=1')
        .set('Authorization', `Bearer ${token}`);
  
      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('currentPage').eql(1);
      res.body.should.have.property('totalItems').eql(2);
      res.body.should.have.property('totalPages').eql(2);
      res.body.should.have.property('itemsPerPage').eql(1);
      res.body.should.have.property('citizens');
      res.body.citizens.length.should.be.eql(1);
    });
  });

  it('should get citizen by ID', async () => {
    const loginData = {
      username: 'admin',
      password: 'admin',
    };
  
    const resToken = await chai.request(app).post('/admin/login').send(loginData);
    const token = resToken.body.token;

    const res = await chai
      .request(app)
      .get(`/citizen/${citizenId1}`)
      .set('Authorization', `Bearer ${token}`);
    

    res.should.have.status(200);
    res.should.be.json;
    res.body.should.be.a('object');
    res.body.should.have.property('citizen');
    res.body.citizen.should.be.a('object');
    res.body.citizen.should.have.property('_id').eql(citizenId1.toString());
    res.body.citizen.should.have.property('name')
    res.body.citizen.should.have.property('email')
    res.body.citizen.should.have.property('phone')
    res.body.citizen.should.have.property('deviceId')
    res.body.citizen.should.have.property('address')
    res.body.citizen.name.should.not.be.null.and.not.be.undefined;
    res.body.citizen.deviceId.should.not.be.null.and.not.be.undefined;
    res.body.citizen.email.should.not.be.null.and.not.be.undefined;
  });
});



// Add this describe block for timestamps within the existing test file
describe('Timestamps API', () => {

    before(async () => {
      await Timestamp.deleteMany({})
      await Citizen.deleteMany({})
    })

    beforeEach(async () => {

      const citizenData1 = new Citizen({
        _id: citizenId1,
        birthdate: '1990-01-01',
        name: 'John Doe',
        email: 'john@example.com',
        deviceId: "1234",
        phone: 12345678,
        address: {
          postal: 12345,
          street: 'Test Street',
          city: 'Test City',
        },
        password: await bcrypt.hash('testPassword', 10),
        deviceId: '1234',
      });

      const timestampData1 = new Timestamp({
        _id: timestampId1,
        citizen: citizenId1,
        startTime: '2023-04-26T09:00:00.000Z',
        endTime: '2023-04-26T17:00:00.000Z',
        deviceId: citizenData1.deviceId,
      });

      const timestampData2 = new Timestamp({
        _id: timestampId2,
        startTime: '2023-04-27T09:00:00.000Z',
        endTime: '2023-04-27T17:00:00.000Z',
        deviceId: citizenData1.deviceId,
        citizen: citizenId1
      });

      await Timestamp.deleteMany({});
      await Citizen.deleteMany({});
      await citizenData1.save();
      await timestampData1.save();
      await timestampData2.save();
    });
  
    describe('POST /', () => {
      it('should create a new timestamp', async () => {
  
        const timestampData = {
          startTime: '2023-04-26T09:00:00.000Z',
          endTime: '2023-04-26T17:00:00.000Z',
          deviceId: "1234",
        };
        const res = await chai.request(app).post('/timestamps').send(timestampData);
        res.should.have.status(201);
        res.body.should.be.a('object');
        res.body.should.have.property('message').eql('Timestamp stored');
        res.body.should.have.property('createdTimestamp');
        res.body.createdTimestamp.should.have.property('_id');
        res.body.createdTimestamp.should.have.property('startTime').eql(timestampData.startTime);
        res.body.createdTimestamp.should.have.property('endTime').eql(timestampData.endTime);
        res.body.createdTimestamp.citizen.should.not.be.null.and.not.be.undefined;
      });
    });
  
    
    describe('GET /:timestampId', () => {
      it('should get a timestamp by ID', async () => {

        const loginData = {
            username: 'admin',
            password: 'admin',
        };
        const resToken = await chai.request(app).post('/admin/login').send(loginData);
        const token = resToken.body.token;
  
        const res = await chai
            .request(app)
            .get(`/timestamps/${timestampId1}`)
            .set('Authorization', `Bearer ${token}`);

  
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('timestamp');
        res.body.timestamp.should.have.property('citizen');
        res.body.timestamp.should.have.property('_id').eql(timestampId1.toString());
        res.body.timestamp.should.have.property('startTime');
        res.body.timestamp.should.have.property('endTime');
        res.body.timestamp.startTime.should.not.be.null.and.not.be.undefined;
        res.body.timestamp.endTime.should.not.be.null.and.not.be.undefined;
      });
    });
    
    describe('GET /', () => {
      it('should get all timestamps (pagination)', async () => {
        const loginData = {
          username: 'admin',
          password: 'admin',
        };
        const resToken = await chai.request(app).post('/admin/login').send(loginData);
        const token = resToken.body.token;

        const res = await chai
          .request(app)
          .get('/timestamps?page=1&limit=2')
          .set('Authorization', `Bearer ${token}`);
    
        // console.log("Totalitems " + res.body.totalItems);
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('totalItems').eql(2);
        res.body.should.have.property('totalPages').eql(1);
        res.body.should.have.property('itemsPerPage').eql(2);
        res.body.should.have.property('timestamps');
        res.body.timestamps.length.should.be.eql(2);
      });

      it('should get all timestamps without pagination', async () => {
        const loginData = {
          username: 'admin',
          password: 'admin',
        };
        const resToken = await chai.request(app).post('/admin/login').send(loginData);
        const token = resToken.body.token;

        const res = await chai
          .request(app)
          .get('/timestamps')
          .set('Authorization', `Bearer ${token}`);
    
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object'); // Change this from 'array' to 'object'
        res.body.should.have.property('timestamps'); // Check that the 'timestamps' property exists
        res.body.timestamps.should.be.a('array'); // Check that the 'timestamps' property is an array
        res.body.timestamps.length.should.be.eql(2);

        res.body.timestamps.every(item => item.should.be.a('object'));

        const timestamp1 = res.body.timestamps.find(t => t.startTime === '2023-04-26T09:00:00.000Z');
        const timestamp2 = res.body.timestamps.find(t => t.startTime === '2023-04-27T09:00:00.000Z');
    
        timestamp1.should.not.be.undefined;
        timestamp1.should.have.property('startTime', '2023-04-26T09:00:00.000Z');
        timestamp1.should.have.property('endTime', '2023-04-26T17:00:00.000Z');
        timestamp1.should.have.property('citizen', citizenId1.toString());
    
        timestamp2.should.not.be.undefined;
        timestamp2.should.have.property('startTime', '2023-04-27T09:00:00.000Z');
        timestamp2.should.have.property('endTime', '2023-04-27T17:00:00.000Z');
        timestamp2.should.have.property('citizen', citizenId1.toString());
      });
    });
  });

describe('Admin API', () => {
  beforeEach(async () => {
    const admin = new Admin({
      _id: adminId1,
      username: "adminxyz",
      password: await bcrypt.hash("adminxyz", 10),
    })
    await Admin.deleteOne({_id: adminId1})
    await admin.save()
  })

  describe('POST /signup', () => {
    it('should create a new admin', async () => {
      const loginData = {
        username: "admin",
        password: "admin",
      }
      const resToken = await chai.request(app).post('/admin/login').send(loginData);
      const token = resToken.body.token;

      const adminData = {
        username: 'admin2',
        password: 'admin2',
      };

      const res = await chai.request(app)
        .post('/admin/signup')
        .set("Authorization", `Bearer ${token}`)
        .send(adminData);

      res.should.have.status(201);
      res.body.should.be.a('object');
      res.body.should.have.property('message').eql('admin created');
      res.body.should.have.property('id');
    });
  });

  describe('POST /login', () => {
    it('should log in the admin and return a token', async () => {

      const loginData = {
        username: 'admin',
        password: 'admin',
      };

      const res = await chai.request(app).post('/admin/login').send(loginData);

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('message').eql('Authorization successful');
      res.body.should.have.property('token');
    });
  });

  describe('DELETE /:adminId', () => {
    it('should delete an admin by ID', async () => {
      const loginData = {
        username: 'admin',
        password: 'admin',
      };

      const resToken = await chai.request(app).post('/admin/login').send(loginData);
      const token = resToken.body.token;

      const res = await chai
        .request(app)
        .delete(`/admin/${adminId1}`)
        .set('Authorization', `Bearer ${token}`);

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('message').eql('admin deleted');
    });
  });
});
