const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// ----------------------
// 1. Comic Schema
// ----------------------
const ComicSchema = new Schema({
   num: Number,
   view:Number
});

// ----------------------
// Mongoose CRUD operations
// ----------------------
module.exports = class classDB{
    constructor(connectionString){
        this.connectionString = connectionString;
        this.Comic = null; 
    }

    initialize(){
        return new Promise((resolve,reject)=>{
           let db = mongoose.createConnection(this.connectionString,{ useNewUrlParser: true,useUnifiedTopology: true });
            db.on('error', ()=>{
                reject();
            });
            db.once('open', ()=>{
                this.Comic = db.model("comic", ComicSchema);
                resolve();
            });
        });
    }
    async addNewView(num,view){
        let newComicView = new this.Comic({'num': num,'view': view});
        await newComicView.save();
        return `new view: ${num} successfully added`
    }
    async getViewByNum(num){
        return this.Comic.findOne({num: num}).exec();
    }
    async updateComicByNum(view, num){
        await this.Comic.updateOne({'num': num}, { $set: {view: view} }).exec();
        return `comic ${num} successfully updated`;
    }
}
