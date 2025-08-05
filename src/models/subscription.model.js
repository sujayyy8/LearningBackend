import mongoose,{Schema} from 'mongoose'
import { User } from './user.model'

const subscriptionSchema = new Schema(
    {
        subscriber : {
            type : Schema.Types.ObjectId,       // this will have id
            ref : "User"
        },                                      // this is just to understand, it doesnt work like this
        channel : {
            type : Schema.Types.ObjectId,       // this will have name
            ref : "User"
        }
    },
    {
        timestamps : true
    }
)

export const Subscription = mongoose.model("Subscription",subscriptionSchema)