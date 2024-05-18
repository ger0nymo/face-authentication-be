# NestJS API for a face recognition based authentication system

I created this as part of a college project laboratory project. The project is a face recognition based authentication system.

This API is capable of handling secure user authentication, user registration, and communication with the projects [face recognition API](https://github.com/ger0nymo/face-authentication-service).

The app utilizes **NestJS**, **Prisma**, and **MongoDB**.


## Installation

```bash
$ yarn install
```

## .env file
The following environment variables are required for the app to run:

```bash
# Database connection
DATABASE_URL="<mongodb-connection-string>"
# JWT secret
JWT_SECRET="<jwt-secret"
# Face recognition (JWT) token secret
FACE_AUTH_SECRET="<face-auth-secret>"
```
## Running the app

```bash
$ yarn run start:dev
```

## Example requests
Requests that communicate with the face recognition service needs to contain an API key in the headers. Refer to the face recognition service documentation.
### Register a new user
```http request
POST /user/auth/sign-up
```

Payload type: `application/json`

```json
{
    "email": "",
    "password": ""
}
```

Expected successful result: Status code - 201 Created
```json
{
    "user": {
        "id": "new_user_id",
        "email": "new_user_email",
        "fv": []
    },
    "token": "token"
}
```
It should return the registered user data and an authorization token.

### Sign in an existing user
```http request
POST /user/auth/sign-in
```

Payload type: `application/json`

```json
{
    "email": "",
    "password": ""
}
```
Expected successful results can be of two types:

- 200: User has no embedding vector saved, hence not needed to authenticate with the face recognition service.
    ```json
    {
      "user": {
        "id": "id",
        "email": "email",
        "fv": []
      },
      "token": "authorization_token"
    }
    ```
- 210: User has an embedding vector saved, hence needs to authenticate with the face recognition service.
    ```json
    {
       "verification_token": "verification_token"
    }
    ```
  This verification token is needed when sending requests to the `/user/faces/compare-faces` endpoint.

### Disable the face verification requirement for a user
```http request
POST /user/disable-face-verification
```
This request needs to have the authorization token acquired from the `/user/auth/sign-in` endpoint in its headers.


Expected successful result: Status code - 200

It should set the `fv` field of the user to an empty array in the database.

### Register a new face embedding vector for a user
```http request
POST /user/image/image-embedding
```
This request needs to have the authorization token acquired from the `/user/auth/sign-in` endpoint in its headers.

Payload type: `form-data`

```typescript
{
    file: File // image file to be possibly embedded
}
```

Expected successful result: Status code - 200
```json
{
    "fv": [...]
}
```

### Compare an image with the users registered face embedding vector
```http request
POST /user/image/compare-faces
```
This request needs to have the verification token acquired from the `/user/auth/sign-in` endpoint in its headers.

Payload type: `form-data`

```typescript
{
    file: File // image file to be possibly embedded
}
```

Expected successful result: Status code - 200
```json
{
    "cosine_similarity": "0.812312"
}
```
