import { sleep, check, group, fail } from 'k6'
import http from 'k6/http'
import jsonpath from 'https://jslib.k6.io/jsonpath/1.0.2/index.js'

export const options = {
  cloud: {
    distribution: { 'amazon:us:ashburn': { loadZone: 'amazon:us:ashburn', percent: 100 } },
    apm: [],
  },
  thresholds: {},
  scenarios: {
    LoginAndOrder: {
      executor: 'ramping-vus',
      stages: [
        { target: 5, duration: '30s' },
        { target: 15, duration: '1m' },
        { target: 10, duration: '30s' },
        { target: 0, duration: '30s' },
      ],
      gracefulStop: '30s',
      gracefulRampDown: '30s',
      exec: 'loginAndOrder',
    },
  },
}

// Scenario: LoginAndOrder (executor: ramping-vus)

export function loginAndOrder() {
  let response;

  const vars = {}

  group('page_1 - https://pizza.wheatharvest.llc/', function () {

    // Login
    response = http.put(
      'https://pizza-service.wheatharvest.llc/api/auth',
      '{"email":"testing@wheatharvest.llc","password":"ez2iBkeqwgpH32U"}',
      {
        headers: {
          accept: '*/*',
          'accept-encoding': 'gzip, deflate, br, zstd',
          'accept-language': 'en-US,en;q=0.9',
          'content-type': 'application/json',
          origin: 'https://pizza.wheatharvest.llc',
          priority: 'u=1, i',
          'sec-ch-ua': '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"macOS"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-site',
        },
      }
    )
    if (!check(response, { 'status equals 200': response => response.status.toString() === '200' })) {
      console.log(response.body);
      fail('Login was *not* 200');
    }
    vars['token1'] = jsonpath.query(response.json(), '$.token')[0];
    sleep(4.3)

    // Get Menu
    response = http.get('https://pizza-service.wheatharvest.llc/api/order/menu', {
      headers: {
        accept: '*/*',
        'accept-encoding': 'gzip, deflate, br, zstd',
        'accept-language': 'en-US,en;q=0.9',
        'content-type': 'application/json',
        'if-none-match': 'W/"3f8-Ie5TQl703DstdLfLArR1NiNP++U"',
        authorization: `Bearer ${vars['token1']}`,
        origin: 'https://pizza.wheatharvest.llc',
        priority: 'u=1, i',
        'sec-ch-ua': '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
      },
    })
    sleep(0.5)

    // Get franchises
    response = http.get('https://pizza-service.wheatharvest.llc/api/franchise', {
      headers: {
        accept: '*/*',
        authorization: `Bearer ${vars['token1']}`,
        'accept-encoding': 'gzip, deflate, br, zstd',
        'accept-language': 'en-US,en;q=0.9',
        'content-type': 'application/json',
        'if-none-match': 'W/"56-Fy3Hb9J2d/ANDBMVG44AQp8cSV0"',
        origin: 'https://pizza.wheatharvest.llc',
        priority: 'u=1, i',
        'sec-ch-ua': '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
      },
    })
    sleep(14.7)

    // Submit Order
    const order = ` {
      "items":[
        {"menuId":2,"description":"Pepperoni","price":0.0042},
        {"menuId":4,"description":"Crusty","price":0.0028},
        {"menuId":1,"description":"Veggie","price":0.0038},
        {"menuId":1,"description":"Veggie","price":0.0038},
        {"menuId":1,"description":"Veggie","price":0.0038},
        {"menuId":7,"description":"Pepperoni","price":0.0042},
        {"menuId":7,"description":"Pepperoni","price":0.0042},
        {"menuId":10,"description":"Charred Leopard","price":0.0099}
      ],
      "storeId":"1",
      "franchiseId":1
    }`;
    response = http.post(
      'https://pizza-service.wheatharvest.llc/api/order',
      order,
      {
        headers: {
          accept: '*/*',
          authorization: `Bearer ${vars['token1']}`,
          'accept-encoding': 'gzip, deflate, br, zstd',
          'accept-language': 'en-US,en;q=0.9',
          'content-type': 'application/json',
          origin: 'https://pizza.wheatharvest.llc',
          priority: 'u=1, i',
          'sec-ch-ua': '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"macOS"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-site',
        },
      }
    )
    if (!check(response, { 'status equals 200': response => response.status.toString() === '200' })) {
      console.log(response.body);
      fail('Submit order was *not* 200');
    }

    vars['jwt1'] = jsonpath.query(response.json(), '$.jwt')[0];

    sleep(3.8)

    // Verify Order
    response = http.post(
      'https://pizza-factory.cs329.click/api/order/verify',
      `{"jwt":"${vars['jwt1']}"}`,
      {
        headers: {
          accept: '*/*',
          authorization: `Bearer ${vars['token1']}`,
          'accept-encoding': 'gzip, deflate, br, zstd',
          'accept-language': 'en-US,en;q=0.9',
          'content-type': 'application/json',
          origin: 'https://pizza.wheatharvest.llc',
          priority: 'u=1, i',
          'sec-ch-ua': '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"macOS"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'cross-site',
        },
      }
    )
    if (!check(response, { 'status equals 200': response => response.status.toString() === '200' })) {
      console.log(response.body);
      fail('Verify order was *not* 200');
    }

    console.log("Successful test completion.");
  })
}
