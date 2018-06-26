module.exports = function(robot) {
  var cents, formatCurrency, i, num, formatOrdinal;

  formatCurrency = function(num) {
    num = num.toString().replace(/\$|\,/g, '');
    if (isNaN(num)) {
      num = '0';
    }
    num = Math.floor(num * 100 + 0.50000000001);
    cents = num % 100;
    num = Math.floor(num / 100).toString();
    if (cents < 10) {
      cents = '0' + cents;
    }
    i = 0;
    while (i < Math.floor((num.length - (1 + i)) / 3)) {
      num = num.substring(0, num.length - (4 * i + 3)) + ',' + num.substring(num.length - (4 * i + 3));
      i++;
    }
    return num + '.' + cents;
  };

  formatOrdinal = function(n) {
    var s, v;
    s = ['th', 'st', 'nd', 'rd'];
    v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  robot.respond(/(.*) price/i, function(msg) {
    var symbol, url;
    symbol = msg.match[1].toUpperCase();
    url = "https://api.coinmarketcap.com/v1/ticker/?limit=1500";
    msg.http(url).headers({Accept: "application/json"}).get()(function(err, res, body) {
      var available_supply, change_1hr, change_24hr, coin, color, label, msgBody, row, total_supply, ts, _i, _len;
      if (res.statusCode !== 200) {
        msg.send("The CoinMarketCap API did not return a proper response! :rage5:");

      } else {

        res = JSON.parse(body);
        //console.log(JSON.stringify(res, null, ' '));

        coin = {};
        for (i = 0, len = res.length; i < len; i++) {
          row = res[i];
          coin[row.symbol] = {
            name: row.name,
            id: row.id,
            symbol: row.symbol,
            rank: row.rank,
            price_usd: row.price_usd,
            change_1hr: row.percent_change_1h,
            change_24hr: row.percent_change_24h,
            available_supply: row.available_supply,
            total_supply: row.total_supply
          };
        }

        if (coin[symbol] === void 0) {
          msg.send("I am unable to locate a price for that coin. Please verify that it exists on CoinMarketCap.");
        } else {
          if (coin[symbol].change_1hr > 0) {
            color = "#36a64f";
          } else {
            color = "#d8000c";
          }
          if (!coin[symbol].available_supply) {
            available_supply = 'Data Unavailable';
          } else {
            available_supply = formatCurrency(coin[symbol].available_supply);
            available_supply = available_supply.replace(/\.00$/, '');
          }
          if (!coin[symbol].total_supply) {
            total_supply = 'Data Unavailable';
          } else {
            total_supply = formatCurrency(coin[symbol].total_supply);
            total_supply = total_supply.replace(/\.00$/, '');
          }
          if (coin[symbol].change_1hr === null) {
            change_1hr = 'Data Unavailable';
          } else {
            change_1hr = coin[symbol].change_1hr + '%';
          }
          if (coin[symbol].change_24hr === null) {
            change_24hr = 'Data Unavailable';
          } else {
            change_24hr = coin[symbol].change_24hr + '%';
          }

          ts = Math.floor(new Date() / 1000);

          msgData = {
            "channel": msg.message.room,
            "attachments": [
              {
                "fallback": "Price Data for " + coin[symbol].name + " from CoinMarketCap",
                "color": color,
                "title": coin[symbol].name + " (" + symbol + ")",
                "title_link": "https://coinmarketcap.com/currencies/" + coin[symbol].id,
                "fields": [
                  {
                    "title": "Price (USD)",
                    "value": "$" + formatCurrency(coin[symbol].price_usd),
                    "short": true
                  }, {
                    "title": "Market Rank",
                    "value": formatOrdinal(coin[symbol].rank),
                    "short": true
                  }, {
                    "title": "1hr Change",
                    "value": change_1hr,
                    "short": true
                  }, {
                    "title": "24hr Change",
                    "value": change_24hr,
                    "short": true
                  }, {
                    "title": "Available Supply",
                    "value": available_supply,
                    "short": true
                  }, {
                    "title": "Total Supply",
                    "value": total_supply,
                    "short": true
                  }
                ],
                "thumb_url": "https://coincheckup.com/images/coins/" + coin[symbol].id + ".png",
                "footer": "CoinMarketCap",
                "footer_icon": "https://cdn1.iconfinder.com/data/icons/money-finance-set-3/512/11-512.png",
                "ts": ts
              }
            ]
          }
          robot.adapter.customMessage(msgData);
        }
      }
    });
  });
}