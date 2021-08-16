const request = require('supertest');
const app = require('../../app');
describe('Test GET /launches', () => {
  test('It should respond with 200 success', async () => {
    const response = await request(app)
      .get('/launches')
      .expect('Content-Type', /json/)
      .expect(200);
    expect(response.statusCode).toBe(200);
  });
});

describe('Test POST /launch', () => {
  const completeLaunchDate = {
    mission: 'USS',
    rocket: 'NCC',
    target: 'Kepler',
    launchDate: 'September 14, 2030',
  };

  const completeLaunchWithoutDate = {
    mission: 'USS',
    rocket: 'NCC',
    target: 'Kepler',
  };

  const completeLaunchInvalidDate = {
    mission: 'USS',
    rocket: 'NCC',
    target: 'Kepler',
    launchDate: 'z',
  };
  test('It should respond with 200 success', async () => {
    const response = await request(app)
      .post('/launches')
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
      .post('/launches')
      .send(completeLaunchWithoutDate)
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toStrictEqual({
      error: 'Missing required launch property',
    });
  });

  test('It should catch invalid date', async () => {
    const response = await request(app)
      .post('/launches')
      .send(completeLaunchInvalidDate)
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toStrictEqual({
      error: 'Invalid launch date',
    });
  });
});
