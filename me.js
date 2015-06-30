var ovh = require('ovh')({
    endpoint: 'ovh-eu',
    appKey: 'MRwGnxxziXpcsQQt',
    appSecret: 'fEDQb7HBMEnANpSrCRjpxMVaP50kV43p',
    consumerKey: 'lqO2GbvCPPcYezyfv9coUVAgsDsAJ2DA'
});

ovh.request('GET', '/me/bill', function (err, me) {
    console.log(err || me);
});
