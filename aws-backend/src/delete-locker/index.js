// index.js - Lambda handler for the /lockers POST endpoint

const service = require('./service');

exports.handler = async (event) => {
  try {
    
    console.log({ event }); // Debuging logs
    return await service.deleteLocker(event);

  } catch (error) {
    console.log("Error: ", error);
    return {
      statusCode: 500,
      body: JSON.stringify({message: "Internal Server Error"})
    };
  }
}