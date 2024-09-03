FROM --platform=linux/amd64 node:18-alpine3.20

# Set the working directory
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install the dependencies
RUN npm install

# Copy the rest of the code
COPY . .

# Expose the port that the app listens on
EXPOSE 80

# Define the command to run the app
CMD ["npm", "start"]