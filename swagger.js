const swaggerAutogen = require("swagger-autogen")();

const doc = {
  info: {
    title: "My Portofolio Backend",
    description: "Description",
  },
  host: "localhost:3000",
  schemes: ["http"],
};

const outputFile = "./swagger_output.json";
const endpointsFiles = ["./server.js"];

swaggerAutogen(outputFile, endpointsFiles, doc);
