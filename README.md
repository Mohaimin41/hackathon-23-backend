<p align="center"> <h2 align="center"> Vaccination System Backend </h2> </p>

This repo contains the codes for the RESTful API Backend server for our submission in the BUET CSE Fest 23 Hackathon. We used **ExpressJS** to serve a simple REST api to the Svelte frontend. There are gateways for the user to signup, login, register for vaccination and get reminders for vaccination dates. The backend database runs on an **Azure Postgresql instance.**

### CI/CD
The repo contains **github actions** ensuring continuous integration/ continuos development, with automated testing, building and deploying to **Azure web app service**. In a linux runner, the code is tested and built, then pushed to deployment.

### Monitoring and Alerts

There is a **grafana** instance running in Azure that monitors the backend server and the backend database server. The enabled alerts allow allow the administrators to be aware of alarming changes in the server metrics.

### Running app
First do ```npm install``` to install necessary packages. Then the app can be run using ```npm run server```, while testing can be done through ```npm run test```.

### API
The api opens with base url: ```https://vaccination-webapp.azurewebsites.net/```. The api gatepoints include:
  - (GET, /) empty body; returns json with status
  - (POST, /sign-up) body has user name, password hash, national id, address; returns json with status and gives session cookie
  - (POST, /login) body has user name, password; returns json with status and gives session cookie
  - (POST, /vaccine-registration) body has user name, vaccine id, date; returns json status
  - (POST, /get-user-id) body has user name; returns json with user id
  - (POST, /vaccine-taker) body has user name, vaccination date, vaccine id; returns json with status
  - (POST, /vaccination-done) body has user name, vaccination data, vaccine id, message time; returns json with status
  - (POST, /message-seen) body has user id, returns json with data
  - (POST, /message-unseen) body has user id, returns json with data


#### Best regards from Null Bots team!
