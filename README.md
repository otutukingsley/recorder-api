# Audio Recorder API

Welcome to the Audio Recorder API project! This project is built using Node.js and Express, and it's designed to help you record and manage audio sessions. This guide will walk you through setting up and running the project on your local machine.

## Prerequisites

Before you begin, make sure you have the following installed on your system:

- Node.js (v18 or newer)
- npm (comes with Node.js)

You can download and install Node.js from [here](https://nodejs.org/).

## Installation

1. **Clone the Repository**

   First, clone this repository to your local machine using Git:

   git clone (https://github.com/otutukingsley/recorder-api.git).

   Navigate into the project directory:

   cd audio-recorder-api

   or if you have the zip skip this step.

2. **Install Dependencies**
    Inside the project directory, install the required npm packages:

    npm install

3. **Set Up Environment Variables**

    This project uses environment variables for configuration. Create a `.env` file in the root of your project directory. You can copy the template from `.env.example`.

4. **Running the project locally**

    After completing the installation steps, you can run the project on your local machine.

    npm run dev

    This command uses `nodemon` to start the server, which will automatically restart the server whenever you make changes to the files.

5. **Accessing the API**

    Once the server is running, you can access the API at:

    http://localhost:5500/api 

    Here you can manage your audio sessions. Check out the `recordSessionsRoute.js` for available endpoints and operations.