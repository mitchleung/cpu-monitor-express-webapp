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
const args = process.argv.slice(2);
const networkPollIntervalMs = Number(process.env.NETWORK_POLL_INTERVAL_MS || 1000);
let lastNetworkSample = null;

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
    const defaultIfaceResponse = await si.networkInterfaces("default");
    const defaultIface = Array.isArray(defaultIfaceResponse)
      ? defaultIfaceResponse[0]
      : defaultIfaceResponse;

    const networkData = await si.networkStats();
    const selectedIfaceName = defaultIface?.iface || defaultIface?.name;
    const currentInterface =
      networkData.find((item) => item.iface === selectedIfaceName) ||
      networkData.find((item) => item.iface !== "lo") ||
      networkData[0];

    if (!currentInterface) {
      return {
        iface: selectedIfaceName || "unknown",
        rx_sec: 0,
        tx_sec: 0,
        rx_bytes: 0,
        tx_bytes: 0,
        speed: defaultIface?.speed ?? null,
      };
    }

    const now = Date.now();
    let rxSec = 0;
    let txSec = 0;

    if (lastNetworkSample && lastNetworkSample.iface === currentInterface.iface) {
      const elapsedSeconds = Math.max((now - lastNetworkSample.timestamp) / 1000, 0.001);
      rxSec = Math.max(0, (currentInterface.rx_bytes - lastNetworkSample.rx_bytes) / elapsedSeconds);
      txSec = Math.max(0, (currentInterface.tx_bytes - lastNetworkSample.tx_bytes) / elapsedSeconds);
    }

    lastNetworkSample = {
      iface: currentInterface.iface,
      rx_bytes: currentInterface.rx_bytes,
      tx_bytes: currentInterface.tx_bytes,
      timestamp: now,
    };

    return {
      ...currentInterface,
      ...defaultIface,
      iface: currentInterface.iface,
      rx_sec: rxSec,
      tx_sec: txSec,
      rx_bytes: currentInterface.rx_bytes,
      tx_bytes: currentInterface.tx_bytes,
      speed: defaultIface?.speed ?? currentInterface.speed ?? null,
    };
  } catch (e) {
    console.log(e);
    return e;
  }
}

async function initializeNetworkPolling() {
  await getMyNetworkStats();
  setInterval(async () => {
    try {
      await getMyNetworkStats();
    } catch (error) {
      console.log(error);
    }
  }, networkPollIntervalMs);
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

initializeNetworkPolling();

if (args.includes("--secure")) {
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
