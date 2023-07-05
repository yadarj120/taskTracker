//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

 // creating schema for items
 const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  }
});

// creating a model
const Item = mongoose.model("Item", itemSchema);

// creating items
const item1 = new Item({name: "Welcome to the app"});
const item2 = new Item({name: "Add + button to add an item"});
const item3 = new Item({name: "Click checkbox to mark the item as done"});

// creating schema for list
const listSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  items: [itemSchema]
});

// creating list model
const List = mongoose.model("List", listSchema);



async function connectDB(){
  try {
    await mongoose.connect("mongodb://localhost:27017/todolistDB")
    console.log("connected successfully"); 
  } 
  catch(err) {
    console.log(err);
  }
}

async function closeDB(){
  try {
    await mongoose.connection.close();
    console.log("Connection closed successfully");
  }
  catch(err){
    console.log(err);
  }
}

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const defaultItems = [item1, item2, item3];
// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

app.get("/", async function(req, res) {
  try{
    await connectDB();
    let items = await Item.find();
    
    // adding default items if the there are no user entered items
    if(items.length === 0){
      try{
        await Item.insertMany(defaultItems);
        console.log("default items added successfully");
        items = await Item.find();
      }
      catch(err){
        console.log(err);
      }
    }

    const day = date.getDate();
    res.render("list", {listTitle: "Today", newListItems: items});
    await closeDB();
  }
  catch(err){
    console.log(err);
  }

});

app.get("/:customListName", async (req, res)=>{
  try{ await connectDB(); }
  catch(err){ console.log(err); }

  // console.log(req.params.customListName);
  // get the name of the list
  const listName=_.lowerCase(req.params.customListName);
  let list = await List.find({name: listName})

  if(list.length===0){
    const newList = new List({name: listName, items: defaultItems});
    await newList.save();
    list = await List.find({name: listName});
 
  }

  res.render("list", {listTitle: _.capitalize(list[0].name), newListItems: list[0].items})

  try{ await closeDB(); }
  catch(err){ console.log(err); }
});

app.post("/", async function(req, res){

  const itemName = req.body.newItem;
  const listName = _.lowerCase(req.body.list);

  try{ await connectDB(); }
  catch(err){ console.log(err); }
  
  const newItem = new Item({name: itemName});
  if(listName==="today"){
    await newItem.save();
    await closeDB();
    res.redirect("/");
  }
  else{
    foundList = await List.find({name: listName});
    foundList[0].items.push(newItem);
    await foundList[0].save();
    await closeDB();
    res.redirect("/"+listName);
  }
  
});

app.post("/delete", async (req, res)=>{
  const checkedItemID = req.body.checkbox;
  const listName = _.lowerCase(req.body.listName);

  try{ await connectDB(); }
  catch(err){ console.log(err); }

  if(listName === "today"){
    await Item.deleteOne({_id: checkedItemID});
    res.redirect("/");
  }
  else{
    await List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemID}}});
    res.redirect("/"+listName);
  }

  try { await closeDB(); }
  catch(err){
    console.log(err);
  }
});

app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
