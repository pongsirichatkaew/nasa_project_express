const axios = require('axios');
const launchesDatabase = require('./launches.mongo');
const planets = require('./planets.mongo');
// const launches = new Map();

// let latestFlightNumber = 100;

const DEFAULT_FLIGHT_NUMBER = 100;

// const launch = {
//   flightNumber: 100, // flight_number
//   mission: 'Kepler Exploration X', // name
//   rocket: 'Explorer IS1', // rocket.name
//   launchDate: new Date('December 27, 2030'), // date_local
//   target: 'Kepler-442 b', // not applicable
//   customers: ['ZTM', 'NASA'], // payload.customers for each payload
//   upcoming: true, // upcoming
//   success: true, // success
// };

// saveLaunch(launch);
// launches.set(launch.flightNumber, launch);
// launches.get(100); // it will return launch object

const SPACEX_API_URL = `https://api.spacexdata.com/v4/launches/query`;

async function populateLaunches() {
  console.log('Downloading launch data...');
  const response = await axios.post(SPACEX_API_URL, {
    query: {},
    options: {
      pagination: false,
      populate: [
        {
          path: 'rocket',
          select: {
            name: 1,
          },
        },
        {
          path: 'payloads',
          select: {
            customers: 1,
          },
        },
      ],
    },
  });

  if (response.status !== 200) {
    console.log('Problem downloading launch data!');
  }

  const launchDocs = response.data.docs;
  for (const launchDoc of launchDocs) {
    const payloads = launchDoc['payloads'];
    const customers = payloads.flatMap((payload) => {
      return payload['customers'];
    });

    const launch = {
      flightNumber: launchDoc['flight_number'],
      mission: launchDoc['name'],
      rocket: launchDoc['rocket']['name'],
      launchDate: launchDoc['date_local'],
      upcoming: launchDoc['upcoming'],
      success: launchDoc['success'],
      customers,
    };

    console.log(`${launch.flightNumber} ${launch.mission} ${launch.customers}`);

    await saveLaunch(launch);
  }
}

async function loadLaunchData() {
  const firstLaunch = await findLaunch({
    flightNumber: 1,
    rocket: 'Falcon 1',
    mission: 'FalconSat',
  });

  if (firstLaunch) {
    console.log(`Launch data already loaded`);
    return;
  } else {
    await populateLaunches();
  }
}

async function findLaunch(filter) {
  return await launchesDatabase.findOne(filter);
}

async function existsLaunchWithId(launchId) {
  return await findLaunch({ flightNumber: launchId });
}

async function getLatestFlightNumber() {
  const latestLaunch = await launchesDatabase.findOne().sort('-flightNumber');
  if (!latestLaunch) {
    return DEFAULT_FLIGHT_NUMBER;
  }
  return latestLaunch.flightNumber;
}

async function getAllLaunches(skip, limit) {
  return await launchesDatabase
    .find({}, { _id: 0, __v: 0 })
    .sort({ flightNumber: 1 }) // -1 for decending value 
    .skip(skip)
    .limit(limit);
}

async function saveLaunch(launch) {
  // mongoose not also update but also save a object in a memory WTF!!
  // await launchesDatabase.updateOne(
  //   {
  //     flightNumber: launch.flightNumber,
  //   },
  //   launch, // <===
  //   { upsert: true }
  // );
  await launchesDatabase.findOneAndUpdate(
    {
      flightNumber: launch.flightNumber,
    },
    launch, // <===
    { upsert: true }
  );
}

async function scheduleNewLaunch(launch) {
  const planet = await planets.findOne({
    keplerName: launch.target,
  });

  if (!planet) {
    throw new Error('No matching planet found');
  }

  const newFlightNumber = (await getLatestFlightNumber()) + 1;
  const newLaunch = Object.assign(launch, {
    success: true,
    upcoming: true,
    customers: ['Zero to Mastery', 'NASA'],
    flightNumber: newFlightNumber,
  });
  console.log('newLaunch', newLaunch);
  await saveLaunch(newLaunch);
}

// function addNewLaunch(launch) {
//   latestFlightNumber++;
//   launches.set(
//     latestFlightNumber,
//     Object.assign(launch, {
//       success: true,
//       upcoming: true,
//       customers: ['Zero to Mastery', 'NASA'],
//       flightNumber: latestFlightNumber,
//     })
//   );
// }

async function abortLaunchById(launchId) {
  // Reminder this is not upsert because we dont want to insert if it doesn't exist
  const aborted = await launchesDatabase.updateOne(
    {
      flightNumber: launchId,
    },
    {
      upcoming: false,
      success: false,
    }
  );

  // return aborted
  return aborted.ok === 1 && aborted.nModified === 1;
  // const aborted = launches.get(launchId);
  // aborted.upcoming = false;
  // aborted.success = false;
  // return aborted;
}

module.exports = {
  loadLaunchData,
  existsLaunchWithId,
  getAllLaunches,
  scheduleNewLaunch,
  abortLaunchById,
};
