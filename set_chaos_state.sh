#!/bin/bash

set -e

host=$1
username=$2
password=$3
state=$4

if [[ -z "$host" || -z "$username" || -z "$password" || -z "$state" ]]; then
  echo "Usage: $0 <HOST> <ADMIN_USERNAME> <ADMINS_PASSWORD> <TRUE/FALSE>"
  echo "Example: $0 pizza-service.jwt.com admin@jwt.com strong_password false"
  exit 1
fi

echo "Logging in as admin"
echo "Request: " '{"email":"'"$username"'", "password":"'"$password"'"}'
response=$(curl -s -X PUT $host/api/auth -d '{"email":"'"$username"'", "password":"'"$password"'"}' -H 'Content-Type: application/json')
token=$(echo $response | jq -r '.token')
echo "Response: $response"
echo

echo "Setting chaos state"
printf "Response: "
curl -X PUT "$host/api/auth/chaos/$state" -H "Authorization: Bearer $token"
printf "\n\n"

echo "Done."
