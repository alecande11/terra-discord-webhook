

# Terra Discord Webhook
Implementation of a webook to keep the data present within a message always updated, using CloudFlare Workers.

## Realtime data
[Code available here](/realtimeData.js)

Display data such as LUNA price, LUNA and UST supply and others from columbus-5 and bombay-12

<img src="/img/realtime-data.png" width="600" />

Required environment variables:

| Variable      | Content                                                         |
| ------------- | --------------------------------------------------------------- |
| WEBHOOK_URL   | discord webhook url, you can get it from the channel settings   |
| MESSAGE_ID    | id of the message you want to edit                              |
| LCD           | url of the columbus LCD (https://lcd.terra.dev)                 |
| LCD_BOMBAY    | url of the bombay LCD (https://bombay-lcd.terra.dev)            |


## Node checker
[Code available here](/nodeChecker.js)

Display a list of LCD and RPC with current status

<img src="/img/node-checker.png" width="600" />

Required environment variables:

| Variable      | Content                                                         |
| ------------- | --------------------------------------------------------------- |
| WEBHOOK_URL   | discord webhook url, you can get it from the channel settings   |
| MESSAGE_ID    | id of the message you want to edit                              |
