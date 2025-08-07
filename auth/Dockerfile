# # Use official Node.js image
FROM node:22-alpine

# # Set working directory
WORKDIR /app

# # Copy package files first for better caching
COPY package*.json ./

# # Install dependencies
RUN npm install

# # Copy all other files
COPY . .

# # Expose the port your app runs on
EXPOSE 3000

# # Command to run the application
CMD ["npm", "start"]