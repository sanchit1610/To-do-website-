//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", { useNewUrlParser: true });

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  Item.find({})
    .then(foundItems => {
      if (foundItems.length === 0) {
        return Item.insertMany(defaultItems)
          .then(() => {
            console.log("Successfully saved default items to the database.");
          })
          .then(() => Item.find({}));
      } else {
        return foundItems;
      }
    })
    .then(items => {
      res.render("list", { listTitle: "Today", newListItems: items });
    })
    .catch(err => {
      console.log(err);
      res.status(500).send("Error occurred while retrieving/saving items to the database.");
    });
});

app.get("/:customerListName", function(req, res) {
  const customListName = req.params.customerListName;

  List.findOne({ name: customListName })
    .then(foundList => {
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        return list.save();
        res.redirect("/" + customListName);
      } else {
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
      }
    })
    .then(() => {
      res.redirect("/" + customListName);
    })
    .catch(err => {
      console.log(err);
      res.status(500).send("Error occurred while retrieving or saving the list.");
    });
});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (!err) {
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      function(err, foundList) {
        if (!err) {
          // Removed redundant res.redirect() statement
          // Only the redirect("/") is needed
          res.redirect("/");
        }
      }
    );
  }
});


app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;

  Item.findByIdAndRemove(checkedItemId)
    .then(() => {
      console.log("Successfully deleted checked item");
      res.redirect("/");
    })
    .catch(err => {
      console.log(err);
      res.status(500).send("Error occurred while deleting checked item.");
    });
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
