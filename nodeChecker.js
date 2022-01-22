// Remember to add the following Environment Variables to your cloudflare worker:
// - WEBHOOK_URL: discord webhook url
// - MESSAGE_ID: id of the message you want to edit

const nodes = {
  max_str_len: 35,
  mainnet: {
    lcd: [
      'https://lcd.terra.dev',
      'https://terra.stakesystems.io',
      'https://lcd.mcontrol.ml',
      'https://terra-lcd.easy2stake.com',
    ],
    rpc: [
      'https://terra-rpc.easy2stake.com',
      'https://terra.stakesystems.io:2053',
      'https://terra-node.mcontrol.ml',
      'http://public-node.terra.dev:26657',
    ],
  },
  testnet: {
    lcd: [
      'https://bombay-lcd.terra.dev', 
      'https://bombay.stakesystems.io',
    ],
    rpc: [
      'http://167.99.25.150:26657',
      'https://bombay.stakesystems.io:2053',
    ],
  },
};

addEventListener('scheduled', (event) => {
  event.waitUntil(handleSchedule(event.scheduledTime));
});

async function testNode(url, type) {
  switch (type) {
    case 'LCD':
      // test LCD
      return await (async () => {
        // start time
        const start = Date.now();

        const fetchPromise = fetch(url + '/syncing');
        const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 10_000));
        const result = await Promise.race([fetchPromise, timeoutPromise]);

        // end time
        const end = Date.now();

        // timeout or http error
        if (!result || !result.ok) return { color: '🔴', status: 'DOWN', time: end - start };

        // parse data
        const data = await result.json();
        if (data.syncing) return { color: '🟠', status: 'CATCHING_UP', time: end - start };
        else return { color: '🟢', status: 'UP', time: end - start };
      })();

    case 'RPC':
      // test RPC
      return await (async () => {
        // start time
        const start = Date.now();

        // can't check sync info since some RPC blocks requests on /status
        //const fetchPromise = fetch(url + '/status')
        const fetchPromise = fetch(url + '/health');
        const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 10_000));
        const result = await Promise.race([fetchPromise, timeoutPromise]);

        // end time
        const end = Date.now();

        // timeout or http error
        if (!result || !result.ok) return { color: '🔴', status: 'DOWN', time: end - start };

        // parse data
        //const data = await result.json()
        //if (data.result.sync_info.catching_up) return { color: '🟠', status: 'CATCHING_UP', time: end - start };
        return { color: '🟢', status: 'UP', time: end - start };
      })();
  }
}

async function createNodeString(url, type) {
  const result = await testNode(url, type);
  return url + ' '.repeat(nodes.max_str_len - url.length) + ` | ${result.color} | ${result.time}ms`;
}

async function handleSchedule(scheduledDate) {
  const mainnetLcd = [];
  const mainnetRpc = [];
  const testnetLcd = [];
  const testnetRpc = [];

  nodes.mainnet.lcd.forEach((url) => {
    mainnetLcd.push(createNodeString(url, 'LCD'));
  });
  nodes.mainnet.rpc.forEach((url) => {
    mainnetRpc.push(createNodeString(url, 'RPC'));
  });
  nodes.testnet.lcd.forEach((url) => {
    testnetLcd.push(createNodeString(url, 'LCD'));
  });
  nodes.testnet.rpc.forEach((url) => {
    testnetRpc.push(createNodeString(url, 'RPC'));
  });

  const resultMainLcd = (await Promise.all(mainnetLcd)).reduce((a, b) => a + '\n' + b);
  const resultMainRpc = (await Promise.all(mainnetRpc)).reduce((a, b) => a + '\n' + b);
  const resultTestLcd = (await Promise.all(testnetLcd)).reduce((a, b) => a + '\n' + b);
  const resultTestRpc = (await Promise.all(testnetRpc)).reduce((a, b) => a + '\n' + b);

  const message = {
    content: '',
    embeds: [
      {
        author: {
          name: 'Take a look at my source code on GitHub',
          url: 'https://github.com/alecande11/terra-discord-webhook/blob/main/README.md#node-checker',
          icon_url: 'https://github.githubassets.com/favicons/favicon-dark.png',
        },
        type: 'rich',
        title: '**Public LCD and RPC**',
        description:
          'This is a list with all public LCDs and RPCs, if you know others please contact <@514341581554319361> to add them here\n\n' +
          '**columbus-5:**\n```\n' +
          'LCD:\n' +
          resultMainLcd +
          '\nRPC:\n' +
          resultMainRpc +
          '\n```\n**bombay-12:**\n```' +
          'LCD:\n' +
          resultTestLcd +
          '\nRPC:\n' +
          resultTestRpc +
          '\n```\n🟢 = ONLINE, 🟠 = NOT SYNCHRONIZED, 🔴 = OFFLINE, ❓ = UNKNOWN\n' +
          `\nUpdated <t:${Math.round(Date.now() / 1000)}:R>`,
        color: 34047,
      },
    ],
  };

  const response = await fetch(WEBHOOK_URL + '/messages/' + MESSAGE_ID, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  });

  console.log(await response.json());
}
