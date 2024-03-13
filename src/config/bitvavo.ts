const bitvavo = require("bitvavo")().options({
  ACCESSWINDOW: 10000,
  RESTURL: "https://api.bitvavo.com/v2",
  WSURL: "wss://ws.bitvavo.com/v2/",
  DEBUGGING: false,
});

bitvavo.getEmitter().on("error", (err: any) => {
  console.error(err);
});

export default bitvavo;
