// Remember to add the following Environment Variables to your cloudflare worker:
// - WEBHOOK: discord webhook url
// and link a KV with name GOV

addEventListener('scheduled', (event) => {
  event.waitUntil(handleRequest(event))
})

async function getProposals() {
  const request = await fetch(
    'https://lcd.terra.dev/cosmos/gov/v1beta1/proposals?proposal_status=2'
  )

  const json = await request.json()

  const result = []

  json.proposals.forEach(async (p) => {
    const id = p['proposal_id']
    result.push({
      id,
      title: p['content']['title'],
      description: p['content']['description'],
      endTime: new Date(p['voting_end_time']).getTime(),
    })
  })

  return result
}

async function handleRequest(request) {
  const prop = await getProposals()

  const promises = prop.map(async (p) => {
    // proposal already submitted
    if (await GOV.get(p.id)) return

    const message = {
      username: 'Terra Governance',
      avatar_url: 'https://assets.candeago.dev/terra/png/terra_white_bg.png',
      content: '',
      embeds: [
        {
          author: {
            name: 'Open in Terra Station',
            url: `https://station.terra.money/proposal/${p.id}`,
            icon_url:
              'https://assets.terra.money/icon/station-extension/icon.png',
          },
          title: `Proposal #${p.id} - ${p.title}`,
          description:
            p.description +
            `\n\nVoting ends <t:${Math.round(p.endTime / 1000)}:R>`,
          color: 0x0084ff,
        },
      ],
    }

    await fetch(WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    })

    await GOV.put(p.id, 'SENT')
  })

  await Promise.all(promises)
}