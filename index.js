var cors = require("cors");
const express = require("express");
const app = express();
const port = 3000;
const si = require("systeminformation");
app.use(cors());
app.get("/", (req, res) => {
  res.send("Reference to API ");
});

app.get("/api/all", (req, res) => {
  valueObject = {
    cpuTemperature: "main, cores, max",
    mem: "used, free, total",
    currentLoad: "currentLoad",
  };
  si.get(valueObject)
    .then((data) => {
      console.log(data);
      console.log("...");
      const results = {
        cpu: {
          total: data.currentLoad.currentLoad,
          temp: data.cpuTemperature.main,
          cores: data.cpuTemperature.cores,
          max: data.cpuTemperature.max,
        },
        mem: {
          free: data.mem.free,
          used: data.mem.used,
          total: data.mem.total,
        },
      };
      console.log(results);
      console.log("...");
      // res.send(JSON.stringify(results));
      res.send(results);
    })
    .catch((error) => {
      console.error(error);
      res.send({ error: error });
    });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
