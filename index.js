import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ServerApiVersion, ObjectId } from "mongodb";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // await client.connect();
    console.log("✅ MongoDB Connected");

    const db = client.db("recipeBookDB");
    const recipesCollection = db.collection("recipes");

    // ================= CRUD ROUTES =================

    // 1️⃣ GET all recipes OR filter by userEmail
    app.get("/recipes", async (req, res) => {
      const { userEmail } = req.query;
      const query = userEmail ? { userEmail } : {};
      const recipes = await recipesCollection.find(query).toArray();
      res.send(recipes);
    });

    // 2️⃣ GET single recipe by ID
    app.get("/recipes/:id", async (req, res) => {
      const { id } = req.params;
      const recipe = await recipesCollection.findOne({ _id: new ObjectId(id) });
      res.send(recipe);
    });

    // 3️⃣ POST - Add new recipe
    app.post("/recipes", async (req, res) => {
      const recipe = req.body;
      const result = await recipesCollection.insertOne(recipe);
      res.send({
        message: "Recipe added successfully",
        insertedId: result.insertedId,
      });
    });

    // 4️⃣ PUT - Update recipe by ID
    app.put("/recipes/:id", async (req, res) => {
      const { id } = req.params;
      const updatedRecipe = req.body;
      const result = await recipesCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedRecipe }
      );
      res.send({
        message: "Recipe updated successfully",
        modifiedCount: result.modifiedCount,
      });
    });

    // 5️⃣ DELETE - Delete recipe by ID
    app.delete("/recipes/:id", async (req, res) => {
      const { id } = req.params;
      const result = await recipesCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send({
        message: "Recipe deleted successfully",
        deletedCount: result.deletedCount,
      });
    });

    // 6️⃣ PUT - Like recipe (increment likeCount)
    app.put("/recipes/:id/like", async (req, res) => {
      const { id } = req.params;
      const { userEmail } = req.body; // Optional: prevent user liking own recipe
      const recipe = await recipesCollection.findOne({ _id: new ObjectId(id) });

      if (recipe.userEmail === userEmail) {
        return res
          .status(400)
          .send({ message: "You cannot like your own recipe" });
      }

      const result = await recipesCollection.updateOne(
        { _id: new ObjectId(id) },
        { $inc: { likeCount: 1 } }
      );
      res.send({
        message: "Recipe liked!",
        modifiedCount: result.modifiedCount,
      });
    });

    // PATCH /recipes/:id/like
    // app.patch("/recipes/:id/like", async (req, res) => {
    //   const { id } = req.params;
    //   const { userEmail } = req.body;

    //   try {
    //     const recipe = await recipesCollection.findOne({
    //       _id: new ObjectId(id),
    //     });

    //     if (!recipe)
    //       return res.status(404).send({ message: "Recipe not found" });
    //     if (recipe.userEmail === userEmail) {
    //       return res
    //         .status(400)
    //         .send({ message: "Can't like your own recipe" });
    //     }

    //     let updatedLikedBy = recipe.likedBy || [];
    //     let likeCount = recipe.likeCount || 0;

    //     if (updatedLikedBy.includes(userEmail)) {
    //       // unlike
    //       updatedLikedBy = updatedLikedBy.filter(
    //         (email) => email !== userEmail
    //       );
    //       likeCount--;
    //     } else {
    //       // like
    //       updatedLikedBy.push(userEmail);
    //       likeCount++;
    //     }

    //     await recipesCollection.updateOne(
    //       { _id: new ObjectId(id) },
    //       { $set: { likedBy: updatedLikedBy, likeCount } }
    //     );

    //     res.send({ likeCount, likedBy: updatedLikedBy });
    //   } catch (err) {
    //     console.error(err);
    //     res.status(500).send({ message: "Server error" });
    //   }
    // });
  } catch (err) {
    console.error("❌ Mongo Error:", err);
  }
}

run().catch(console.dir);

// default route
app.get("/", (req, res) => {
  res.send({ message: "Recipe Book Server Running 🚀" });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
