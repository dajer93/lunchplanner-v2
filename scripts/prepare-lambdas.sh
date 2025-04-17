#!/usr/bin/bash

# Meals Lambda
cd src/lambda/meals
npm ci
zip -r function.zip ./*

# Ingredients Lambda
cd ../../lambda/ingredients
npm ci
zip -r function.zip ./*

# ShoppingLists Lambda
cd ../../lambda/shoppingLists
npm ci
zip -r function.zip ./*

cd ../../..

aws cloudformation package --s3-bucket lunchplannerv2-lambdas --template-file template.yaml --output-template-file gen/template-generated.yaml

aws cloudformation deploy --template-file gen/template-generated.yaml --stack-name lunchplannerv2 --capabilities CAPABILITY_IAM --region eu-central-1 --no-fail-on-empty-changeset