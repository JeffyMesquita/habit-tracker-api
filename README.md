# Starting a API with NestJS

## Description

This is a simple API made with NestJS, a framework for NodeJS. It's a simple API that has a CRUD of users and a CRUD of habit tracker.

## Creating the project

```bash
$ npm i -g @nestjs/cli
#
$ npx nest new project-name
```

## Installation

```bash
$ npm install
# or
$ yarn install
```

## Running the app

```bash
# development
$ npm run start:dev
# or
$ yarn start:dev
```

## Generating a resource

```bash
$ npx nest generate resource 
# or
$ yarn generate resource

# Example
$ npx nest generate resource users
# or
$ yarn generate resource users
# or 
$ yarn generate resource

# Output
CREATE src/users/users.controller.spec.ts (483 bytes)
CREATE src/users/users.controller.ts (101 bytes)
CREATE src/users/users.module.ts (149 bytes)
CREATE src/users/users.service.spec.ts (387 bytes)
CREATE src/users/users.service.ts (332 bytes)
UPDATE src/app.module.ts (246 bytes)
```

## Install Prisma

```bash
$ npx prisma init
# or
$ yarn prisma init
```