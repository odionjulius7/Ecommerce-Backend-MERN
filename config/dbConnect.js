const { default: mongoose } = require("mongoose");
// Set the strictQuery option
// mongoose.set("strictQuery", false);
const dbConnect = () => {
  try {
    const conn = mongoose.connect(process.env.MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Database Connected Successfully");
  } catch (error) {
    console.log("DAtabase error");
  }
};
module.exports = dbConnect;
