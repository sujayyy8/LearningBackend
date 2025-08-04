import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken"

//use req when you want to take something 
//use res when you want to send something

const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)

        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken

        await user.save({ validateBeforeSave : false})

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500,"Somethig went wrong while Generating refresh and access token")
    }
}

const refreshAccessToken = asyncHandler(async (req,res)=> {

    const incomingRefreshToken = req.cookies.refreshToken  || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401,"unauthorized Access")
    }

    try {
        
        const decodedToken =  jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
        
        const user = User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401,"Invalid refresh Token")
        }

       if(incomingRefreshToken != user?.refreshToken){
        throw new ApiError(401,"Refresh Token used or Expired")
       }

       const options = {
        secure : true,
        httpOnly : true
       }

       const {accessToken, newRefreshToken} = generateAccessAndRefreshTokens(user._id)

       return res
       .status(200)
       .cookie("accessToken",accessToken,options)
       .cookie("accessToken",newRefreshToken,options)
       .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

const registerUser = asyncHandler(async (req,res) => {

    const {fullName, username, email, password} = req.body
    console.log("email", email)

    if(
        [fullName, username, email, password].some((field)=>
        field?.trim() === "")
    ){
        throw new ApiError(400,"All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username } , { email }]
    })

    if (existedUser){
        throw new ApiError(409,"User with email or username already exist")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"avatar file is required")
    }

    console.log("avatarLocalPath",avatarLocalPath)

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    console.log("avatar",avatar)

    if(!avatar){
        throw new ApiError(400,"Avatar file is required")
    }

    const user = await User.create({
        fullName,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        email,
        password,
        username : username.toLowerCase()
    })

    console.log("user : ",user )

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"Somethinng went wrong while creating the user")
    }

    console.log("createdUser : ",createdUser)

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered Successfully")
    )

})

const loginUser = asyncHandler( async(req,res) => {

    const {email,username,password} = req.body

    if(!username && !email){
        throw new ApiError(400,"username or email is required")
    }

    const user = await User.findOne({$or : [{username},{email}]})

    if(!user) {
        throw new ApiError(404,"User doesnt exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid){
        throw new ApiError(401,"Invalid user credentials")
    }

    const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id)


    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const option = {
        httpOnly : true, //JavaScript on the website can't see or touch this cookie.
        secure :true    //Only send this cookie if the website is using HTTPS (secure connection).
    }

    //Cookies are small pieces of data that the server sends to the client (browser), which the browser stores and automatically sends back with every future request to that server.

    

    return res
    .status(200)
    .cookie("accessToken" , accessToken,option)
    .cookie("refreshToken" , refreshToken,option)
    .json(
        new ApiResponse(
            200,
            {
                user : loggedInUser,accessToken,refreshToken
            },
            "User logged in successfully"
        )
    )
    
})

const logoutUser = asyncHandler( async (req,res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set : {
                refreshToken : undefined
            }
        },
        {
            new : true
        }
    )

    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200, {}, "user logged out"))
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}