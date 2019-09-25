const t1 = new Tag({
  tagName: 'Broker'
});

const t2 = new Tag({
  tagName: 'Cook'
});

Tag.insertMany([t1, t2], function(err){ console.log("Tag added...")});