var cors = require("cors");
const https = require("https");
const fs = require("fs");
const express = require("express");
const app = express();
const port = 3000;
const si = require("systeminformation");
app.use(cors());
app.get("/", (req, res) => {
  res.send("Reference to API ");
});
const arguments = process.argv.splice(2);
async function getMySystemInfo(valueObject) {
  try {
    const basicData = await si.get(valueObject);

    const basicResults = {
      cpu: {
        total: basicData.currentLoad.currentLoad,
        temp: basicData.cpuTemperature.main,
        cores: basicData.cpuTemperature.cores,
        max: basicData.cpuTemperature.max,
      },
      mem: {
        free: basicData.mem.free,
        used: basicData.mem.used,
        total: basicData.mem.total,
      },
    };
    // console.log({ basicResults });
    return basicResults;
  } catch (e) {
    console.log(e);
    return e;
  }
}

async function getMyNetworkStats() {
  try {
    const defaultIface = await si.networkInterfaces("default");
    const networkData = await si.networkStats();
    // console.log({ defaultIface });
    // console.log({ networkData });
    return { ...networkData[0], ...defaultIface }; // show only default network
  } catch (e) {
    console.log(e);
    return e;
  }
}

app.get("/api/all", async (req, res) => {
  const valueObject = {
    cpuTemperature: "main, cores, max",
    mem: "used, free, total",
    currentLoad: "currentLoad",
  };
  const sysInfo = await getMySystemInfo(valueObject);
  const netStats = await getMyNetworkStats();
  // console.log({ netStats });
  const info = {
    ...sysInfo,
    iface: netStats.iface,
    rx_sec: netStats.rx_sec,
    speed: netStats.speed,
    tx_sec: netStats.tx_sec,
    rx_bytes: netStats.rx_bytes,
    tx_bytes: netStats.tx_bytes,
  };
  if (info) {
    console.log({ info });
    res.send(info);
  } else {
    res.send({ error: "Can't reach server" });
  }
});

if (arguments && arguments.indexOf("--secure") !== -1) {
  // Use the following instead for self-signed certificate with https
  https
    .createServer(
      {
        key: fs.readFileSync("server.key"),
        cert: fs.readFileSync("server.cert"),
      },
      app
    )
    .listen(port, () => {
      console.log(`Example app listening at https://localhost:${port}`);
    });
} else {
  // Use the following for NON-https connection
  app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
  });
}
