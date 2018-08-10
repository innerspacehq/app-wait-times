FROM library/node:10.7.0

WORKDIR /node

COPY src/ /node/src/
COPY package.json /node/package.json
COPY package-lock.json /node/package-lock.json
COPY start-server.sh /node/start-server.sh
RUN chmod +x /node/start-server.sh
COPY app.js /node/app.js

EXPOSE 10337

ENTRYPOINT [ "/node/start-server.sh" ]