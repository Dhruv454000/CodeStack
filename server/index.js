const express = require('express');
const app = express();
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const Question=require('./QAModel.js');
const mongoose = require('mongoose');
const SignUpObject = require('./Modals/SignUpModal');
const { encrypt, decrypt } = require('./cryptionHandler');
const { Encrypt, Decrypt } = require('./cryptionHandler1');
const fetch = require('node-fetch');
const WIKIPEDIA = require('wikipedia');
const axios = require('axios');
const solenolyrics = require("solenolyrics");
const schedule = require('node-schedule');
require('dotenv').config();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    },
});

const url = process.env.MongoDB_Database_Url;
mongoose.connect(url)
    .then(() => {
        console.log("Conneected.");
    })

io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.id}`);

    socket.on("askingQuestion",(object)=>{
        const Model=new Question({
            Questioner:object.Questioner,
            Question:object.Question
        })
        Model.save();
    });
    socket.on("getQuestions",()=>{
        Question.find().then((data)=>{
            socket.emit("takeQuestions",data);
        })
    });
    socket.on("setAnswer",(data)=>{
        Question.findById(data.Id).then((object)=>{
            object.Answers.push(data);
            console.log(object);
            object.save();
        });
    });

    socket.on('signUpSubmit', (object) => {
        let Modal = new SignUpObject({
            Username: object.username,
            Email: object.email,
            Password: object.password
        })
        let a = ''
        SignUpObject.find({ "Email": Modal.Email })
            .then((data) => {
                if (data !== null && data.length !== 0) {
                    console.log('User Already Exists for the corresponding Email.');
                    a = 'User Already Exists for the corresponding Email.'
                    socket.emit('signupsubmit', a)
                }
                else {
                    SignUpObject.find({ "Username": Modal.Username })
                        .then((data) => {
                            if (data !== null && data.length !== 0) {
                                console.log('User Already Exists for the corresponding Username.');
                                a = 'User Already Exists for the corresponding Username.'
                                socket.emit('signupsubmit', a)
                            }
                            else {
                                console.log('User registered Successfully.');
                                Modal.save().then((result) => {
                                    a = 'User registered Successfully.'
                                    socket.emit('signupsubmit', a)
                                });
                            }
                        })
                }
            })
    }
    )
    socket.on('loginSubmit', (object) => {
        let status = "";
        SignUpObject.findOne({ Username: object.Username, Email: object.Email })
            .then((data) => {
                if (data === null) {
                    console.log('Invalid Username or Email.');
                    status = 'Invalid Username or Email';
                }
                else {
                    const obj = {
                        iv: data.iv,
                        password: data.Password,
                    }
                    const savedPassword = decrypt(obj);
                    if (savedPassword === object.Password) {
                        console.log('Logged in successfully.');
                        status = 'Logged in successfully.';
                    }
                    else {
                        console.log('Invalid Password.');
                        status = 'Invalid Password.';
                    }
                }
                socket.emit('loginStatus', status);
            })
    }
    )
    socket.on("disconnect", () => {
        console.log("User Disconnected", socket.id);
    });
});
server.listen(3001, () => {
    console.log("Server Running.");
});