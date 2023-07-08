const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const storage = multer.diskStorage({
destination: function (req, file, cb) {
cb(null, path.join(\_\_dirname, "../public/images/"));
},
filename: function (req, file, cb) {
const uniquesuffix = Date.now() + "-" + Math.round(Math.random() \* 1e9);
cb(null, file.fieldname + "-" + uniquesuffix + ".jpeg");
},
});

const multerFilter = (req, file, cb) => {
if (file.mimetype.startsWith("image")) {
cb(null, true);
} else {
cb({ message: "Unsupported file format" }, false);
}
};

// Uploading photos
const uploadPhoto = multer({
storage: storage,
fileFilter: multerFilter,
limits: { fileSize: 1000000 },
});

/\* The productImgResize and blogImgResize functions are middleware functions that

- handle image resizing(with sharp) after file upload.
  \*/
  const productImgResize = async (req, res, next) => {
  // if no file continue to the next() func, e.g submit other data without file then
  if (!req.files) return next();
  await Promise.all(
  req.files.map(async (file) => {
  await sharp(file.path)
  .resize(300, 300)
  .toFormat("jpeg")
  .jpeg({ quality: 90 })
  .toFile(`public/images/products/${file.filename}`);

        // delete the file(s) from d public folder after save
        fs.unlinkSync(`public/images/products/${file.filename}`);
      })

  );
  next();
  };
