// Remember to add the following Environment Variables to your cloudflare worker:
// - WEBHOOK_URL: discord webhook url
// - MESSAGE_ID: id of the message you want to edit
// - LCD: url of the LCD (https://lcd.terra.dev)
// - LCD_BOMBAY: url of the bombay LCD (https://bombay-lcd.terra.dev)

addEventListener('scheduled', (event) => {
  event.waitUntil(handleRequest(event));
});

async function handleRequest() {
  const data = {
    luna: {},
    ust: {},
    terra: {
      mainnet: {},
      testnet: {},
      versions: {},
    },
  };

  // GET VERSIONS
  await (async () => {
    const response = await fetch(LCD + '/node_info');
    const response_data = await response.json();

    // get cosmwasm version from the build deps
    let cosmwasm = '';
    response_data.application_version.build_deps.forEach((dep) => {
      if (dep.includes('github.com/CosmWasm/wasmvm@')) {
        cosmwasm = dep.split('@')[1];
      }
    });

    data.terra.versions = {
      // terrad version
      terrad: response_data.application_version.version,
      // cosmos SDK version
      cosmos_sdk: response_data.application_version.cosmos_sdk_version,
      cosmwasm,
    };
  })();

  // GET SUPPLY & STAKED LUNA
  await (async () => {
    // GET SUPPLY
    let response = await fetch(LCD + '/cosmos/bank/v1beta1/supply');
    let response_data = await response.json();

    let total_luna;

    // parse the array to get LUNA and UST supply
    response_data.supply.forEach((s) => {
      if (s.denom === 'uusd')
        data.ust.supply = Math.round(parseInt(s.amount) / 1_000_000)
          .toString()
          .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      else if (s.denom === 'uluna') {
        total_luna = Math.round(parseInt(s.amount) / 1_000_000);
        data.luna.supply = total_luna.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      }
    });

    // GET STAKED LUNA
    response = await fetch(LCD + '/cosmos/staking/v1beta1/pool');
    response_data = await response.json();

    const staked = Math.round(parseInt(response_data.pool.bonded_tokens) / 1_000_000);
    data.luna.staked = staked.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    data.luna.staked_percent = ((staked / total_luna) * 100).toFixed(2);
  })();

  // GET LUNA PRICE
  await (async () => {
    const response = await fetch(LCD + '/terra/oracle/v1beta1/denoms/uusd/exchange_rate');
    const response_data = await response.json();

    data.luna.price = parseFloat(response_data.exchange_rate).toFixed(2);
  })();

  // HEIGHT
  // columbus-5
  await (async () => {
    const response = await fetch(LCD + '/blocks/latest');
    const response_data = await response.json();

    data.terra.mainnet.height = response_data.block.header.height.replace(
      /\B(?=(\d{3})+(?!\d))/g,
      ',',
    );
  })();

  // bombay-12
  await (async () => {
    const response = await fetch(LCD_BOMBAY + '/blocks/latest');
    const response_data = await response.json();

    data.terra.testnet.height = response_data.block.header.height.replace(
      /\B(?=(\d{3})+(?!\d))/g,
      ',',
    );
  })();

  const message = {
    username: 'Terra',
    avatar_url:
      'https://assets.website-files.com/611153e7af981472d8da199c/618d703ee436c52a5a5951d4_favicon_32.png',
    content: '',
    embeds: [
      {
        color: 0xffffff,
        author: {
          name: 'Take a look at my source code on GitHub',
          url: 'https://github.com/alecande11/terra-discord-webhook/blob/main/README.md#realtime-data',
          icon_url: 'https://github.githubassets.com/favicons/favicon-dark.png',
        },
      },
      {
        description: `The current LUNA price is **${data.luna.price}$** with a total supply of **${data.luna.supply} LUNA**.\n**${data.luna.staked} LUNA** are locked in staking, equivalent to the **${data.luna.staked_percent}%** of the supply`,
        color: 16766464,
        author: {
          name: 'LUNA',
          icon_url: 'https://assets.terra.money/icon/60/Luna.png',
        },
      },
      {
        description: `The total supply is **${data.ust.supply} UST**`,
        color: 5814783,
        author: {
          name: 'TerraUSD - UST',
          icon_url: 'https://assets.terra.money/icon/60/UST.png',
        },
      },
      {
        color: 0,
        fields: [
          {
            name: 'columbus-5',
            value: `The current block height is **${data.terra.mainnet.height}**.`,
          },
          {
            name: 'bombay-12',
            value: `The current block height is **${data.terra.testnet.height}**.`,
          },
          {
            name: 'Stats for nerds',
            value: `The latest terrad version is **v${data.terra.versions.terrad}**, which is using cosmos SDK **${data.terra.versions.cosmos_sdk}** and CosmWasm **${data.terra.versions.cosmwasm}**`,
          },
        ],
        author: {
          name: 'Terra Blockchain',
          icon_url:
            'https://assets.website-files.com/611153e7af981472d8da199c/61117b476d11877a9638750e_Terra%20Opengraph.png',
        },
      },
    ],
  };

  response = await fetch(WEBHOOK_URL + '/messages/' + MESSAGE_ID, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  });

  console.log(await response.json());
}
