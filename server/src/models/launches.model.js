const launchesDatabase = require('./launches.mongo');
const planets = require('./planets.mongo');
// const launches = new Map();

// let latestFlightNumber = 100;

const DEFAULT_FLIGHT_NUMBER = 100;

const launch = {
  flightNumber: 100,
  mission: 'Kepler Exploration X',
  rocket: 'Explorer IS1',
  launchDate: new Date('December 27, 2030'),
  target: 'Kepler-442 b',
  customers: ['ZTM', 'NASA'],
  upcoming: true,
  success: true,
};

saveLaunch(launch);
// launches.set(launch.flightNumber, launch);
// launches.get(100); // it will return launch object

async function existsLaunchWithId(launchId) {
  return await launchesDatabase.findOne({ flightNumber: launchId });
}

async function getLatestFlightNumber() {
  const latestLaunch = await launchesDatabase.findOne().sort('-flightNumber');
  if (!latestLaunch) {
    return DEFAULT_FLIGHT_NUMBER;
  }
  return latestLaunch.flightNumber;
}

async function getAllLaunches() {
  return await launchesDatabase.find({}, { _id: 0, __v: 0 });
}

async function saveLaunch(launch) {
  const planet = await planets.findOne({
    keplerName: launch.target,
  });

  if (!planet) {
    throw new Error('No matching planet found');
  }

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
  existsLaunchWithId,
  getAllLaunches,
  scheduleNewLaunch,
  abortLaunchById,
};
