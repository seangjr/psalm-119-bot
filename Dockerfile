FROM node:14

WORKDIR /

COPY package*.json ./

RUN npm install

COPY . .

ENV BOT_TOKEN=6239662913:AAFF1rUjA2ja6Lbx2WRtJJVA-SI1Wf9jgy4

CMD ["node", "--experimental-modules", "index.mjs"]