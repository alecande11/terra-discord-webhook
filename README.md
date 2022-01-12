# Terra Discord Webhook
Implementation of a webook to keep the data present within a message always updated, using CloudFlare Workers.

## Realtime data
Display data such as LUNA price, LUNA and UST supply and others from columbus-5 and bombay-12

![preview](/img/realtime-data.png)

Required environment variables:
```toml
WEBHOOK_URL = discord webhook url, you can get it from the channel settings
MESSAGE_ID = id of the message you want to edit
LCD = url of the LCD (https://lcd.terra.dev)
LCD_BOMBAY = url of the bombay LCD (https://bombay-lcd.terra.dev)
```