// 56d3cfa85a5a2b3b755b1cd6

var trelloConfig = {
    "version": 1,
    "apiEndpoint": "https://api.trello.com",
    "authEndpoint": "https://trello.com",
    "intentEndpoint": "https://trello.com",
    "key": "b9ba7c2037190da4db4bc8ee0d643164"
};

var tids_shane = {
    list: '55d26f54726fb67f022db618',
    card: '56f660d3c3887f343909d4c9',
    completeList: "5403bf2888d0ac13dcc52c4a",
};

var tids_sv = {
    board: "56d311c0995b66c2c22ac80d",
    list: "56d3cfa85a5a2b3b755b1cd6",
    card: "56d3cfb92a252ac52b790831",
    label: "57059e0db0dfecc6d1ca8404",
    completeList: "56d311c0995b66c2c22ac80f",
};

module.exports = {
    connection: trelloConfig,
    // tids: tids_sv,
    tids: tids_shane,
};
