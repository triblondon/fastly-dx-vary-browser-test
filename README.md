# fastly-dx-vary-browser-test

Test of vary behaviour in browsers. This test is used as an example [here](https://www.smashingmagazine.com/2017/11/understanding-vary-header/#demonstrating-vary-behavior).

## Running locally

    git clone https://github.com/triblondon/fastly-dx-vary-browser-test.git
    cd fastly-dx-vary-browser-test
    docker run -it -v "$PWD:/app" -w /app --entrypoint=npm node:12 install
    docker run -it -v "$PWD:/app" -w /app -p 3102:3102 node:12 server/server.js
    # open browser on localhost:3102
