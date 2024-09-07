# Deploy fullstack app on Kubernetes

## ❗️ Notes

First of all, I want to clarify that I'm not sure if this works on Minikube. I tried it with Docker Desktop with no results. Maybe works on VirtualBox (I didn't try)

Also, I don't know if this works the same way in EKS (Amazon Elastic Kubernetes Service), AKS (Azure Kubernetes Service) or any other provider. It should, but just in case, I let you know it.
I only tested sucessfully on GKE (Google Kubernetes Engine)

## 📘 App overview

- Frontend created with React
- Backend created with NodeJS + Express

Client communicates with server trough a reverse-proxy, wich is configured in the NGINX config file

## 🔨 Creating the server

### Creating index.js

So we have a simple backend that listens in port 80 by default with three endpoints

❗️ I did not specify how to create a backend from scratch, but you can learn how to [here](https://medium.com/@dhwajgupta27/build-a-node-js-server-in-5-minutes-quick-and-easy-server-setup-6eb594e8b26)

``` javascript
const express = require('express');
require('dotenv').config()

const app = express();
app.use(express.json({ extended: false }));

app.get("/", (req, res) => {
  res.status(200).json({
    msg: "Route / in Backend"
  })
})

app.get("/api/test", (req, res) => {
  res.status(200).json({
    msg: "Route /api/test in backend"
  })
})

app.get("/api/hello", (req, res) => {
  res.status(200).json({
    msg: "Route /api/hello in backend"
  })
})

const PORT = process.env.PORT || 80;

app.listen(PORT, () => console.log(`Server started port ${PORT}`));
```

### Creating Dockerfile

❗️❗️❗️ I specified the platform's image because my computer doesn't have that architecture. If your computer has that architecture you can just write ```FROM node:18-alpine3.20```

``` docker
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
```

## 🔨 Creating the client

### Creating App.jsx

We basically have a form with one input where we write the endpoint in our backend that we want to make a HTTP GET request

❗️ I did not specify how to create a frontend from scratch, but you can learn how to [here](https://vitejs.dev/guide/)

``` javascript
import { useState } from 'react'
import './App.css'
import axios from "axios"

function App() {
  const [input, setInput] = useState("")
  const [result, setResult] = useState("")

  const changeInput = async (e) => {
    e.preventDefault()

    setInput(e.target.value)
  }

  const submitForm = async (e) => {
    e.preventDefault()

    try {
      // Did this so client will request to /api/test instead of //api/test (for example) in backend when proxy is set on NGINX
      const charIndex = input.indexOf("/", input.indexOf("/") + 1)
      const backendRequest = await axios.get(input.substring(0, charIndex) + input.substring(charIndex + 1))
      setResult(backendRequest.data.msg)
      
    } catch(err) {
      console.error(err);
      
      setResult("No matching route in backend")
    }
  }

  return (
    <main>
      <h1>Kubernetes - Demo</h1>
      <form onSubmit={ submitForm }>
        <input placeholder='Try /backend, /backend/api/test or /backend/api/hello' onChange={ changeInput } type="text" />
        <button type="submit">Search backend route</button>
      </form>

      <p>{ result }</p>
    </main>
  )
}

export default App

```

### Creating NGINX config file

``` conf
# The identifier Backend is internal to nginx, and used to name this specific upstream
upstream Backend {
    # backend is the internal DNS name used by the backend Service inside Kubernetes
    server backend;
}
server {
listen 80;

location / {
   # This would be the directory where your React app's static files are stored at
   root /usr/share/nginx/html;
   try_files $uri /index.html;
}

location /backend {
    # The following statement will proxy traffic to the upstream named Backend
    proxy_pass http://Backend/;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-NginX-Proxy true;
    proxy_ssl_session_reuse off;
    proxy_set_header Host $http_host;
    proxy_cache_bypass $http_upgrade;
    proxy_redirect off;
}
}
```

### Creating Dockerfile

❗️❗️❗️ I specified the platform's image because my computer doesn't have that architecture. If your computer has that architecture you can just write ```FROM node:18-alpine3.20```

``` docker
# Use the official Node.js runtime as the base image
FROM --platform=linux/amd64 node:18-alpine3.20 AS build

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the entire application code to the container
COPY . .

# Build the React app for production
RUN npm run build

# Use Nginx as the production server
FROM --platform=linux/amd64 nginx:alpine

# Copy the built React app to Nginx's web server directory
COPY --from=build /app/dist /usr/share/nginx/html
COPY ./nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 for the Nginx server
EXPOSE 80
```

## 🤩 Creating and pushing our Docker images to DockerHub

Perfect! __We now have our microservices ready__ to make their respective images!

Run the following command to build a Docker image

```sh
docker build -t (dockerhub-username)/(repository-name):(tag) .
```

Then run the following command to push your image to DockerHub

```sh
docker push (dockerhub-username)/(repository-name):(tag)
```

## 🤓 Creating the manifests

Great! You have your images pushed in DockerHub!

But we have to do one last thing before dealing with Kubernetes: __Creating the necessary manifests__

### Creating our deployments

> Let's create our backend deployment

> Inside `metadata` property we have:
> - `name:` Used to give a name to our deployments. It's just declarative (in deployments)
> - `labels:` Used to make our deployments easier to find when we have to use them in Services. You can write whatever you want. In this case we will be using `app: backend-app`

> Inside `spec` property we define the specifications of our deployment, such as the number of `replicas` we want, the `template` for the Pods used to create the `replicas`, and the Pods we are going to use in `selector`
>
> We define our labels within the `template` property so we can find our Pod template on the `matchLabels` property. That's how Kubernetes understands wich template has to use for making replicas

#### backend-deployment.yaml

``` yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend-deploy
  labels:
    app: backend-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend-pod
  template:
    metadata:
      name: backend-pod
      labels:
        app: backend-pod
    spec:
      containers:
      - name: backend-container
        image: your-backend-image
        ports:
        - containerPort: 80
```

> Now we create the frontend deployment (It works the same way as the backend one)

#### frontend-deployment.yaml

``` yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend-deploy
  labels:
    app: frontend-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: frontend-pod
  template:
    metadata:
      name: frontend-pod
      labels:
        app: frontend-pod
    spec:
      containers:
      - name: frontend-container
        image: your-frontend-image
        ports:
        - containerPort: 80
```

### Creating our Services

> Let's create our backend service

> This part is __IMPORTANT__ ❗️❗️
>
> As specified in the comment within `metadata` property, __the name of our Service is the DNS__ we wrote on the nginx config file
>
> This is literally the part where we enable the communication between both microservices

> In the `spec` property we define the specifications of our Service. We are not defining the `type` property, so the default value will be `ClusterIP`
>
> In the `ports` property, we set `targetPort` and `port` to 80 to enable the communication between our backend containers and our backend service
>
> Also, the NGINX web server listens on 80, thats why we expose our backend on that port

#### backend-service.yaml

``` yaml
apiVersion: v1
kind: Service
metadata:
  name: backend # DNS name to communicate with frontend
spec:
  selector:
    app: backend-pod
  ports:
    - port: 80
      targetPort: 80
```

> Now we can create the frontend service

> It works almost the same way as the backend. The only difference is that here we define the property `type` to LoadBalancer
>
> `LoadBalancer` distributes the incoming traffic across the Pods. It also provides external network access to them
>
> Kubernetes knows wich Pods have that external network access by the `selector` property. We set there our backend Pod labels

#### frontend-service.yaml

``` yaml
apiVersion: v1
kind: Service
metadata:
  name: frontend
spec:
  type: LoadBalancer
  selector:
    app: frontend-pod
  ports:
    - port: 80
      targetPort: 80
```

## 🖥️ Deploying our app on Kubernetes

We now have the necessary resources to deploy our fullstack app on Kubernetes! 🥳

> First of all, lets's verify everything is okay running `kubectl get all`. It should appear this

![kubernetes-first-preview.png](/assets/kubernetes-first-preview.png "kubernetes-first-preview.png")

> Now, to create our backend dpeloyment, lets run `kubectl apply -f backend-deployment.yaml`
>
> The output should be `deployment.apps/backend-deploy created`
>
> Run `kubectl get all` and you should see this

![kubernetes-backend-deploy.png](/assets/kubernetes-backend-deploy.png "kubernetes-backend-deploy.png")

> Great! Let's create our backend service running `kubectl apply -f backend-service.yaml`
>
> The output should be `service/backend created`
>
> Run `kubectl get all` to see the changes

![kubernetes-backend-service.png](/assets/kubernetes-backend-service.png "kubernetes-backend-service.png")

> We have our backend running perfectly! Now let's create our frontend deployment running `kubectl apply -f frontend-deployment.yaml`
>
> The output should be `deployment.apps/frontend-deploy created`

![kubernetes-frontend-deploy.png](/assets/kubernetes-frontend-deploy.png "kubernetes-frontend-deploy.png")

> Perfect! We are in the last step! Create our frontend service running `kubectl apply -f frontend-service.yaml`
>
> The output should be `service/frontend created`

![kubernetes-frontend-service.png](/assets/kubernetes-frontend-service.png "kubernetes-frontend-service.png")

> PERFECT! We have our __microservices running without problems__, and we also have our __external IP to connect__ to our frontend. Let's try it on our browser!

![frontend-preview.png](/assets/frontend-preview.png "frontend-preview.png")

> It works perfectly! Now, to __test the communication__ between client-server we are going to write something in the input *(/backend, for example)*

![backend-test.png](/assets/backend-test.png "backend-test.png")

> Great! Our client can communicate with our server without any problems 🥳
>
> Let's try the other endpoints

![backend-second-test.png](/assets/backend-second-test.png "backend-second-test.png")

![backend-third-test.png](/assets/backend-third-test.png "backend-third-test.png")

> __CONGRATULATIONS!__ 🥳
>
> You have deployed your fullstack app in Kubernetes with microservices! Remember that having your app deployed with microservices allows you scale or edit your app easily, in a more flexible way 😛
>
> I hope you find this helpful! If you want to add useful info or good practices, feel free to make a pull request 😁
>
> __HAPPY CODING!__ 🤩