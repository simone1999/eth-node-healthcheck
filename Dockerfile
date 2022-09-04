FROM node

COPY index.js .
COPY package.json .

RUN yarn install

ENTRYPOINT ["node"]
CMD ["index.js"]