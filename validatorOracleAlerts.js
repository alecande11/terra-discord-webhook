// Remember to add the following Environment Variables to your cloudflare worker:
// - WEBHOOK: discord webhook url
// - LCD: lcd urls, comma separated
// - VALIDATOR: validator address
// and link a KV with name STATUS

addEventListener('scheduled', (event) => {
  event.waitUntil(handleRequest(event))
})

async function getMissedOracle() {
  const LCDs = LCD.split(',')

  const requests = LCDs.map((lcd) =>
    fetch(`${lcd}/oracle/voters/${VALIDATOR}/miss`).catch(() => {
      return { error: true }
    })
  )

  const results = await Promise.all(requests)

  const json = await Promise.all(
    results.map((r) =>
      r.json().catch(() => {
        return { error: true }
      })
    )
  )

  const fileteredResults = json
    .filter((j) => !j.error)
    .sort((a, b) => parseInt(b.height) - parseInt(a.height))

  console.log(fileteredResults)

  if (fileteredResults.length === 0) return { error: true }

  return parseInt(fileteredResults[0]['result'])
}

async function handleRequest() {
  const missed = await getMissedOracle()
  const oldMissed = parseInt(await STATUS.get('missed'))

  let message

  if (missed.error) {
    message = {
      username: 'Terra Oracle Alerter',
      avatar_url: 'https://assets.candeago.dev/terra/png/terra_white_bg.png',
      content: '',
      embeds: [
        {
          title: `ERROR: Can't get data from the LCD, they are all offline`,
          color: 0xfd7c70,
        },
      ],
    }
  } else {
    if (missed > oldMissed) {
      message = {
        username: 'Terra Oracle Alerter',
        avatar_url: 'https://assets.candeago.dev/terra/png/terra_white_bg.png',
        content: '',
        embeds: [
          {
            title: `The validator has missed **${
              missed - oldMissed 
            }** oracle votes`,
            color: missed - oldMissed > 2 ? 0xfd7c70 : 0xffa651,
          },
        ],
      }
      await STATUS.put('missed', '' + missed)
    } else if (missed !== oldMissed) {
      await STATUS.put('missed', '' + missed)
    }
  }
  
  if (message) {
    await fetch(WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    })
  }
}
