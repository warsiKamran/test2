import multer from "multer";

//storing files in memory
const storage = multer.memoryStorage();

const singleUpload = multer({storage}).single("file");


export default singleUpload;

