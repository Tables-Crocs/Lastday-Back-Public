FROM node

WORKDIR ./app

COPY . .

RUN npm i

EXPOSE 8000

CMD ["npm", "run", "start:dev"]