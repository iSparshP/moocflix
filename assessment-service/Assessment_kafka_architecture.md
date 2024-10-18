# Kafka Architecture for Assessment Service

## Overview

The Assessment Service is responsible for managing quizzes and assignments, including their creation, submission, and grading. It communicates with other services using Kafka for asynchronous messaging. This document outlines the Kafka architecture for the Assessment Service, including the topics, producer and consumer setup, and message handling.

## Kafka Topics

### Assessment Service Topics

- **Assessment-Creation**: Notify other services when a new assessment is created or updated.
- **Submission-Completed**: Notify other services when a student submits an assessment or assignment.
- **Grading-Completed**: Notify other services when grading is completed.

### Other Service Topics

- **User-Creation**: Notify the Assessment Service when a new user is created.
- **User-Update**: Notify the Assessment Service when a user profile is updated.
- **Course-Creation**: Notify the Assessment Service when a new course is created.
- **Course-Update**: Notify the Assessment Service when a course is updated.
- **Course-Deletion**: Notify the Assessment Service when a course is deleted.
- **Student-Enrolled**: Notify the Assessment Service when a student is enrolled in a course.
- **Transcoding-Completed**: Notify the Assessment Service when video transcoding is completed.

## Kafka Producer and Consumer Setup

### Producer Setup

The Assessment Service will produce messages to the following topics:

- `Assessment-Creation`
- `Submission-Completed`
- `Grading-Completed`

#### Producer Code Example


const kafka = require('../../configure/kafka.js');

exports.notifyStudents = async (courseId, quizId) => {
    const message = {
        topic: 'Assessment-Creation',
        messages: [{ value: JSON.stringify({ courseId, quizId }) }],
    };
    await kafka.send(message);
};


### Consumer Setup
The Assessment Service will consume messages from the following topics:

- `User-Creation`
- `User-Update`
- `Course-Creation`
- `Course-Update`
- `Course-Deletion`
- `Student-Enrolled`
- `Transcoding-Completed`

#### Consumer Code Example


const { Kafka } = require('kafkajs');
require('dotenv').config();

const kafka = new Kafka({
    clientId: 'assessment-service',
    brokers: [process.env.KAFKA_BROKER],
});

const consumer = kafka.consumer({ groupId: 'assessment-group' });

const consumeMessages = async (topics, callback) => {
    await consumer.connect();
    for (const topic of topics) {
        await consumer.subscribe({ topic, fromBeginning: true });
    }
    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            callback(topic, JSON.parse(message.value.toString()));
        },
    });
};

const handleMessage = (topic, message) => {
    switch (topic) {
        case 'User-Creation':
            // Handle user creation logic
            break;
        case 'User-Update':
            // Handle user update logic
            break;
        case 'Course-Creation':
            // Handle course creation logic
            break;
        case 'Course-Update':
            // Handle course update logic
            break;
        case 'Course-Deletion':
            // Handle course deletion logic
            break;
        case 'Student-Enrolled':
            // Handle student enrollment logic
            break;
        case 'Transcoding-Completed':
            // Handle transcoding completed logic
            break;
        default:
            console.log(`Unhandled topic: ${topic}`);
    }
};

consumeMessages([
    'User-Creation',
    'User-Update',
    'Course-Creation',
    'Course-Update',
    'Course-Deletion',
    'Student-Enrolled',
    'Transcoding-Completed',
], handleMessage);

## Message Handling

### Handling Produced Messages
The Assessment Service will produce messages when a new assessment is created, a submission is completed, or grading is completed.

### Handling Produced Messages code Example
const { notifyStudents } = require('../services/notificationService');

exports.createQuiz = async (req, res) => {
    try {
        const quizId = await saveQuiz(req.params.courseId, req.body);
        await notifyStudents(req.params.courseId, quizId);
        res.status(201).json({ quizId });
    } catch (error) {
        res.status(500).json({ message: 'Error creating quiz', error });
    }
};

exports.submitQuiz = async (req, res) => {
    try {
        const submissionId = await submitQuizAnswers(req.params.courseId, req.params.quizId, req.body);
        await notifySubmissionCompleted(req.params.courseId, req.params.quizId, submissionId);
        res.status(201).json({ submissionId });
    } catch (error) {
        res.status(500).json({ message: 'Error submitting quiz', error });
    }
};

exports.gradeQuiz = async (req, res) => {
    try {
        await gradeQuizSubmission(req.params.quizId, req.body.submissionId, req.body.grade);
        await notifyGradingCompleted(req.params.quizId, req.body.submissionId);
        res.status(200).json({ message: 'Quiz graded successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error grading quiz', error });
    }
};

### Handling Consumed Messages
The Assessment Service will consume messages from other services and handle them accordingly.

### Handling Consumed Messages code Example
const { consumeMessages } = require('./utils/kafka');

const handleMessage = (topic, message) => {
    switch (topic) {
        case 'User-Creation':
            // Handle user creation logic
            break;
        case 'User-Update':
            // Handle user update logic
            break;
        case 'Course-Creation':
            // Handle course creation logic
            break;
        case 'Course-Update':
            // Handle course update logic
            break;
        case 'Course-Deletion':
            // Handle course deletion logic
            break;
        case 'Student-Enrolled':
            // Handle student enrollment logic
            break;
        case 'Transcoding-Completed':
            // Handle transcoding completed logic
            break;
        default:
            console.log(`Unhandled topic: ${topic}`);
    }
};

consumeMessages([
    'User-Creation',
    'User-Update',
    'Course-Creation',
    'Course-Update',
    'Course-Deletion',
    'Student-Enrolled',
    'Transcoding-Completed',
], handleMessage);