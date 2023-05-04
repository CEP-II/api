const dotenv = require('dotenv');
dotenv.config({ path: './test.env' });

const mongoose = require('mongoose');
const Citizen = require('../api/models/citizen');
const Timestamp = require('../api/models/timestamp')
const Admin = require('../api/models/admin')

const chai = require('chai');
const chaiHttp = require('chai-http');
const chaiExclude = require('chai-exclude')
chai.use(chaiExclude) // to get excluding keyword.

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


describe('Citizens API', () => {

  beforeEach(async () => {
    await Citizen.deleteMany({});
  });

  describe('POST /signup', () => {
    it('should create a new citizen', async () => {

      const citizenData = {
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
        password: 'testPassword',
        deviceId: '1234',
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
      
      const citizenData = {
        birthdate: '1990-01-01',
        name: 'John Doe',
        email: 'john@example.com',
        phone: 12345678,
        address: {
          postal: 12345,
          street: 'Test Street',
          city: 'Test City',
        },
        password: 'testPassword',
        deviceId: '1234'
      };
    
      // Create a new citizen using the /citizen/signup route
      await chai.request(app).post('/citizen/signup').send(citizenData);
    
      const loginData = {
        email: 'john@example.com',
        password: 'testPassword',
      };
    
      const res = await chai.request(app).post('/citizen/login').send(loginData);
    
      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('message').eql('Authorization successful');
      res.body.should.have.property('token');
    });
  });

  describe('DELETE /:citizenId', () => {
    it('should delete a citizen by ID', async () => {
      const citizenData = {
        birthdate: '1990-01-01',
        name: 'John Doe',
        email: 'john@example.com',
        phone: 12345678,
        address: {
          postal: 12345,
          street: 'Test Street',
          city: 'Test City',
        },
        password: 'testPassword',
        deviceId: '1234'
      };

      // Create a new citizen using the /citizen/signup route
      const citizenRes = await chai.request(app).post('/citizen/signup').send(citizenData);

      const loginData = {
        email: 'john@example.com',
        password: 'testPassword',
      };
      const resToken = await chai.request(app).post('/citizen/login').send(loginData);
      const token = resToken.body.token;

      const res = await chai
        .request(app)
        .delete(`/citizen/${citizenRes.body.id}`)
        .set('Authorization', `Bearer ${token}`);

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('message').eql('Citizen deleted');
    });
  });

  describe('GET /', () => {
    it('should get all citizens', async () => {
      // Create two citizens
      const citizenData1 = {
        birthdate: '1990-01-01',
        name: 'John Doe',
        email: 'john@example.com',
        phone: 12345678,
        address: {
          postal: 12345,
          street: 'Test Street',
          city: 'Test City',
        },
        password: 'testPassword',
        deviceId: '1234'
      };
  
      const citizenData2 = {
        birthdate: '1995-01-01',
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: 12345679,
        address: {
          postal: 12346,
          street: 'Test Street 2',
          city: 'Test City 2',
        },
        password: 'testPassword2',
        deviceId: '12345'
      };
  
      await chai.request(app).post('/citizen/signup').send(citizenData1);
      await chai.request(app).post('/citizen/signup').send(citizenData2);
  
      // Log in the first citizen to get the token
      const loginData = {
        email: 'john@example.com',
        password: 'testPassword',
      };
      const resToken = await chai.request(app).post('/citizen/login').send(loginData);
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

      const citizenData1 = {
        birthdate: '1990-01-01',
        name: 'John Doe',
        email: 'john@example.com',
        phone: 12345678,
        address: {
          postal: 12345,
          street: 'Test Street',
          city: 'Test City',
        },
        password: 'testPassword',
        deviceId: '1234'
      };
  
      const citizenData2 = {
        birthdate: '1995-01-01',
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: 12345679,
        address: {
          postal: 12346,
          street: 'Test Street 2',
          city: 'Test City 2',
        },
        password: 'testPassword2',
        deviceId: '12345'
      };
  
      await chai.request(app).post('/citizen/signup').send(citizenData1);
      await chai.request(app).post('/citizen/signup').send(citizenData2);

      // Log in the first citizen to get the token
      const loginData = {
        email: 'john@example.com',
        password: 'testPassword',
      };
      const resToken = await chai.request(app).post('/citizen/login').send(loginData);
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
    const citizenData = {
      birthdate: '1990-01-01',
      name: 'John Doe',
      email: 'john@example.com',
      phone: 12345678,
      address: {
        postal: 12345,
        street: 'Test Street',
        city: 'Test City',
      },
      password: 'testPassword',
      deviceId: '1234'
    };

    // Create a new citizen using the /citizen/signup route
    const citizenRes = await chai.request(app).post('/citizen/signup').send(citizenData);
    const id = citizenRes.body.id;

    const loginData = {
      email: 'john@example.com',
      password: 'testPassword',
    };
    const resToken = await chai.request(app).post('/citizen/login').send(loginData);
    const token = resToken.body.token;

    
    const res = await chai
      .request(app)
      .get(`/citizen/${id}`)
      .set('Authorization', `Bearer ${token}`);
        
    
    res.should.have.status(200);
    res.should.be.json;
    res.body.should.be.a('object');
    res.body.should.have.property('citizen');
    res.body.citizen.should.be.a('object');
    res.body.citizen.should.have.property('_id', id);
    res.body.citizen.should.have.property('name').eql(citizenData.name)
    res.body.citizen.should.have.property('email').eql(citizenData.email);
    res.body.citizen.should.have.property('phone').eql(citizenData.phone);
    res.body.citizen.should.have.property('deviceId').eql(citizenData.deviceId);
    res.body.citizen.should.have.property('address').excluding('_id').deep.equal(citizenData.address);
  });
});



// Add this describe block for timestamps within the existing test file
describe('Timestamps API', () => {

    beforeEach(async () => {
      await Timestamp.deleteMany({});
      await Citizen.deleteMany({});
    });
  
    describe('POST /', () => {
      it('should create a new timestamp', async () => {
        const citizenData = {
          birthdate: '1990-01-01',
          name: 'John Doe',
          email: 'john@example.com',
          phone: 12345678,
          address: {
            postal: 12345,
            street: 'Test Street',
            city: 'Test City',
          },
          password: 'testPassword',
          deviceId: '1234'
        };
  
        // Create a new citizen using the /citizen/signup route
        await chai.request(app).post('/citizen/signup').send(citizenData);
  
        const timestampData = {
          startTime: '2023-04-26T09:00:00.000Z',
          endTime: '2023-04-26T17:00:00.000Z',
          deviceId: citizenData.deviceId,
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
        const citizenData = {
          birthdate: '1990-01-01',
          name: 'John Doe',
          email: 'john@example.com',
          phone: 12345678,
          address: {
            postal: 12345,
            street: 'Test Street',
            city: 'Test City',
          },
          password: 'testPassword',
          deviceId: '1234'
        };

        // Create a new citizen using the /citizen/signup route
        const citizenRes = await chai.request(app).post('/citizen/signup').send(citizenData);

        const timestampData = {
          startTime: '2023-04-26T09:00:00.000Z',
          endTime: '2023-04-26T17:00:00.000Z',
          deviceId: citizenData.deviceId,
        };

        // Push timestamp to database using the /timestamps route with post request
        const resPost = await chai.request(app).post('/timestamps').send(timestampData);
        const timestampId = resPost.body.createdTimestamp._id;

        const loginData = {
            email: 'john@example.com',
            password: 'testPassword',
          };
        const resToken = await chai.request(app).post('/citizen/login').send(loginData);
        const token = resToken.body.token;
  
        const res = await chai
            .request(app)
            .get(`/timestamps/${timestampId}`)
            .set('Authorization', `Bearer ${token}`);

  
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('timestamp');
        res.body.timestamp.should.have.property('citizen');
        res.body.timestamp.should.have.property('startTime').eql(timestampData.startTime);
        res.body.timestamp.should.have.property('endTime').eql(timestampData.endTime);
      });
    });
    
    describe('GET /', () => {
      it('should get all timestamps (pagination)', async () => {
        const citizenData = {
          birthdate: '1990-01-01',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '004512345678',
          address: {
            postal: 12345,
            street: 'Test Street',
            city: 'Test City',
          },
          password: 'testPassword',
          deviceId: '1234'
        };

        // Create a new citizen using the /citizen/signup route
        await chai.request(app).post('/citizen/signup').send(citizenData);

        const timestampData1 = {
          startTime: '2023-04-26T09:00:00.000Z',
          endTime: '2023-04-26T17:00:00.000Z',
          deviceId: citizenData.deviceId,
        };

        const timestampData2 = {
          startTime: '2023-04-27T09:00:00.000Z',
          endTime: '2023-04-27T17:00:00.000Z',
          deviceId: citizenData.deviceId,
        };

        // Create two new timestamps using the /timestamps route
        await chai.request(app).post('/timestamps').send(timestampData1);
        await chai.request(app).post('/timestamps').send(timestampData2);

        const loginData = {
          email: 'john@example.com',
          password: 'testPassword',
        };
        const resToken = await chai.request(app).post('/citizen/login').send(loginData);
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
        const citizenData = {
          birthdate: '1990-01-01',
          name: 'John Doe',
          email: 'john@example.com',
          phone: 12345678,
          address: {
            postal: 12345,
            street: 'Test Street',
            city: 'Test City',
          },
          password: 'testPassword',
          deviceId: '1234'
        };

        // Create a new citizen using the /citizen/signup route
        const citizenRes = await chai.request(app).post('/citizen/signup').send(citizenData);

        const timestampData1 = {
          startTime: '2023-04-26T09:00:00.000Z',
          endTime: '2023-04-26T17:00:00.000Z',
          deviceId: citizenData.deviceId,
        };

        const timestampData2 = {
          startTime: '2023-04-27T09:00:00.000Z',
          endTime: '2023-04-27T17:00:00.000Z',
          deviceId: citizenData.deviceId
        };

        // Create two new timestamps using the /timestamps route
        await chai.request(app).post('/timestamps').send(timestampData1);
        await chai.request(app).post('/timestamps').send(timestampData2);

        const loginData = {
          email: 'john@example.com',
          password: 'testPassword',
        };
        const resToken = await chai.request(app).post('/citizen/login').send(loginData);
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
        timestamp1.should.have.property('citizen', citizenRes.body.id);
    
        timestamp2.should.not.be.undefined;
        timestamp2.should.have.property('startTime', '2023-04-27T09:00:00.000Z');
        timestamp2.should.have.property('endTime', '2023-04-27T17:00:00.000Z');
        timestamp2.should.have.property('citizen', citizenRes.body.id);
      });
    });
  });

describe('Admin API', () => {
  beforeEach(async () => {
    await Admin.deleteMany({});
  });

  describe('POST /signup', () => {
    it('should create a new admin', async () => {
      const adminData = {
        username: 'admin',
        password: 'admin',
      };

      const res = await chai.request(app).post('/admin/signup').send(adminData);

      res.should.have.status(201);
      res.body.should.be.a('object');
      res.body.should.have.property('message').eql('admin created');
      res.body.should.have.property('id');
    });
  });

  describe('POST /login', () => {
    it('should log in the admin and return a token', async () => {
      const adminData = {
        username: 'admin',
        password: 'admin',
      };

      // Create a new admin using the /admin/signup route
      await chai.request(app).post('/admin/signup').send(adminData);

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
      const adminData = {
        username: 'admin',
        password: 'admin',
      };

      // Create a new admin using the /admin/signup route
      const resSignup = await chai.request(app).post('/admin/signup').send(adminData);
      const adminId = resSignup.body.id;

      const loginData = {
        username: 'admin',
        password: 'admin',
      };
      const resToken = await chai.request(app).post('/admin/login').send(loginData);
      const token = resToken.body.token;

      const res = await chai
        .request(app)
        .delete(`/admin/${adminId}`)
        .set('Authorization', `Bearer ${token}`);

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('message').eql('admin deleted');
    });
  });
});
