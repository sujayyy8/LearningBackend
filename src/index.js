//require('dotenv').config({path : './env'})
// we are importing everything but used require for dotenv 
//feels odd right ? thats why the below is the way to use it through import 
import dotenv from 'dotenv' 
import mongoose from 'mongoose'
import { DB_NAME } from './constants.js';
//import express from 'express'
import connectDB from './db/index2.js';

dotenv.config({
    path : './env'
})

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000 , ()=>{
        console.log(`Server is runing on port ${process.env.PORT}`)
    })

    app.on((error)=>{
        console.log("ERR :",error);
    })

    //app.on("error", ...) is not an error that occurs during that try block — it's an event listener for errors that may happen later, during the lifetime of the running app.
})
.catch((err)=>{
    console.log("MONGO db connnection failed !!! ",err)
})





























//commenting the below code because i wrote it inside db folder -> index2.js || which is its better version and uses some other features to explore and to make the code clean

// const app = express()

// ;(async()=>{
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)

//         app.on("errror",(error) => {
//             console.log("ERR : ",error);
//             throw error
//         })

//         app.listen(process.env.PORT , ()=>{
//             console.log(`App is running on Port ${process.env.PORT}`)
//         } )
//     } catch (error) {
//         console.log("Error : ",error);
//         throw error;
//     }
// })()