# CPU Monitor Express Server

This is a server patching the CPU temperature and usage to JSON API calling from webapp counterpart.

Generate your local self-signed certificate via

openssl req -nodes -new -x509 -keyout server.key -out server.cert

If you are not sure how to do so, please read [this article](https://timonweb.com/javascript/running-expressjs-server-over-https/)
## Project setup
```
npm install
```

### Customize configuration
Read more on [Configuration Reference on System Information](https://systeminformation.io).

Read more on [Expressjs Reference](http://expressjs.com).

### Run with HTTP
```
npm run start

```

### Run with HTTPS
```
npm run startSecure
```

Nothing to build

With HTTPS running already, you can go to <https://cpu-monitor-vue.vercel.app>
Go to the Settings page and update the protocol as https and local host IP of your machine, e.g. 192.168.0.2

### License
MIT License &copy; Mitch Leung
