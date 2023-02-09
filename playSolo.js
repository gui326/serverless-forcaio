"use strict";

const AWS = require("aws-sdk");

const dynamodbOfflineOptions = {
  region: "localhost",
  endpoint: "http://localhost:8000",
};

const isOffline = () => process.env.IS_OFFLINE;

const dynamoDb = isOffline()
  ? new AWS.DynamoDB.DocumentClient(dynamodbOfflineOptions)
  : new AWS.DynamoDB.DocumentClient();

const params = {
  TableName: process.env.FORCAIO_TABLE,
};

const playerHaveRoom = async (token) => {
  const room = await dynamoDb
    .get({
      ...params,
      Key: { partitionKey: `USER#${token}`, sortKey: `ROOM#${token}` },
      AttributesToGet: [
        "points",
        "errors",
        "category",
        "currentLetters",
        "failLetters",
        "winLetters",
        "lengthWord",
      ],
    })
    .promise();

  console.log("sala:", room);

  if (room.Item) {
    console.log("-------------- já tem sala");

    return room;
  }

  console.log("------------------- não tem sala");

  const timestamp = new Date().getTime();

  return await dynamoDb
    .put({
      ...params,
      Item: {
        partitionKey: `USER#${token}`,
        sortKey: `ROOM#${token}`,
        points: 0,
        errors: 0,
        word: "laranja",
        category: "fruta",
        lengthWord: 7,
        currentLetters: "0a0a00a",
        failLetters: ["d", "t"],
        winLetters: ["a"],
        created_at: timestamp,
        updated_at: timestamp,
      },
      AttributesToGet: [
        "points",
        "errors",
        "category",
        "currentLetters",
        "failLetters",
        "winLetters",
        "lengthWord",
      ],
    })
    .promise();
};

module.exports.playSolo = async (event) => {
  try {
    if (!JSON.parse(event.body).token) {
      throw new Error("Token não enviado");
    }

    const room = await playerHaveRoom(JSON.parse(event.body).token);

    return {
      statusCode: 201,
      body: JSON.stringify(room.Item),
    };
  } catch (error) {
    console.log("Error", error);

    return {
      statusCode: error.statusCode ? error.statusCode : 500,
      body: JSON.stringify({
        error: error.name ? error.name : "Exception",
        message: error.message ? error.message : "Unknown error",
      }),
    };
  }
};
