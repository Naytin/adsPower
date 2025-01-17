# Use an official Node.js runtime as a parent image
FROM node:18.20.5

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy the rest of the project files
COPY . .

# Expose the required port (replace 3000 with your app's port if different)
# EXPOSE 3000

# Define the command to run your app
CMD ["npm", "start"]
