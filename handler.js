"use strict";

const AWS = require("aws-sdk");
const { v4: uuid } = require("uuid");

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

module.exports.createToken = async (event) => {
  try {
    const timestamp = new Date().getTime();

    const token = uuid();

    await dynamoDb
      .put({
        ...params,
        Item: {
          partitionKey: `USER#${token}`,
          sortKey: `USER#${token}`,
          name: "Guilherme",
          created_at: timestamp,
          updated_at: timestamp,
        },
      })
      .promise();

    return {
      statusCode: 201,
      body: JSON.stringify({
        token: token,
      }),
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
