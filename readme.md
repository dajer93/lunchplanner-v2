## Lunchplanner

Lunchplanner is a simple app that allows the user to describe meals with a list of their ingredients. The user can generate a shopping list by selecting the desired meals to cook. 

### Quickstart

Prerequisites: 
- aws-sam-cli installed
- docker installed and running
- npm & node installed

```
## Install all dependencies
npm run install:all

## Start the local sam architecture:
npm run start:local:lambda

## Start the local development server:
npm start
```

### Project Structure

The app relies on a SAM (Serverless Architecture Model) backend. 

```
lunchplanner-v2/
├── src/
│   ├── client/
│   │   ├── public/
│   │   └── src/
│   │       ├── assets/
│   │       ├── components/
│   │       │   ├── Ingredients/
│   │       │   ├── Meals/
│   │       │   └── ShoppingLists/
│   │       ├── contexts/
│   │       ├── services/
│   │       └── types/
│   └── lambda/
│       ├── ingredients/
│       ├── meals/
│       └── shoppingLists/
```
