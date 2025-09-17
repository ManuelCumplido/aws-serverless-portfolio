exports.handler = async (event) => {
  console.log("Event received:", JSON.stringify(event));

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: "Hello from create-locker Lambda!",
        input: event,
      },
      null,
      2
    ),
  };
};