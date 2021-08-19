const request = require('supertest');
const app = require('../../app');
const { mongoConnect, mongoDisconnect } = require('../../services/mongo');
const { loadPlanetsData } = require('../../models/planets.model');

describe('Launches API', () => {
  beforeAll(async () => {
    await mongoConnect();
    await loadPlanetsData();
  });

  afterAll(async () => {
    await mongoDisconnect();
  });

  describe('Test GET /launches', () => {
    test('It should respond with 200 success', async () => {
      const response = await request(app)
        .get('/v1/launches')
        .expect('Content-Type', /json/)
        .expect(200);
      expect(response.statusCode).toBe(200);
    });
  });

  describe('Test POST /launch', () => {
    const completeLaunchDate = {
      mission: 'USS',
      rocket: 'NCC',
      target: 'Kepler-452 b',
      launchDate: 'September 14, 2030',
    };

    const completeLaunchWithoutDate = {
      mission: 'USS',
      rocket: 'NCC',
      target: 'Kepler-452 b',
    };

    const completeLaunchInvalidDate = {
      mission: 'USS',
      rocket: 'NCC',
      target: 'Kepler-452 b',
      launchDate: 'z',
    };
    test('It should respond with 200 success', async () => {
      const response = await request(app)
        .post('/v1/launches')
        .send(completeLaunchDate)
        .expect('Content-Type', /json/)
        .expect(201);

      const requestDate = new Date(completeLaunchDate.launchDate).valueOf();
      const responseDate = new Date(response.body.launchDate).valueOf();
      expect(requestDate).toEqual(responseDate);
      expect(response.body).toMatchObject(completeLaunchWithoutDate);
    });

    test('It should catch missing required properties', async () => {
      const response = await request(app)
        .post('/v1/launches')
        .send(completeLaunchWithoutDate)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toStrictEqual({
        error: 'Missing required launch property',
      });
    });

    test('It should catch invalid date', async () => {
      const response = await request(app)
        .post('/v1/launches')
        .send(completeLaunchInvalidDate)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toStrictEqual({
        error: 'Invalid launch date',
      });
    });
  });
});
