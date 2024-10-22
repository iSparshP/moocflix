# Kafka Architecture for Course Management Service

## Overview

The Course Management Service is responsible for managing courses, modules, and student enrollments. It communicates with other services using Kafka for asynchronous messaging. This document outlines the Kafka architecture for the Course Management Service, including the topics, producer and consumer setup, and message handling.

## Kafka Topics

### Course Management Service Topics

- **Course-Creation**: Notify other services when a new course is created.
- **Course-Update**: Notify other services when a course is updated.
- **Course-Deletion**: Notify other services when a course is deleted.
- **Module-Creation**: Notify other services when a new module is created.
- **Module-Update**: Notify other services when a module is updated.
- **Student-Enrolled**: Notify other services when a student is enrolled in a course.

### Other Service Topics

- **User-Creation**: Notify the Course Management Service when a new user is created.
- **User-Update**: Notify the Course Management Service when a user profile is updated.
- **Assessment-Creation**: Notify the Course Management Service when a new assessment is created.
- **Submission-Completed**: Notify the Course Management Service when a student submits an assessment.
- **Grading-Completed**: Notify the Course Management Service when grading is completed.
- **Transcoding-Completed**: Notify the Course Management Service when video transcoding is completed.

## Kafka Producer and Consumer Setup

### Producer Setup

The Course Management Service will produce messages to the following topics:

- `Course-Creation`
- `Course-Update`
- `Course-Deletion`
- `Module-Creation`
- `Module-Update`
- `Student-Enrolled`

#### Producer Code Example

javascript

const { Kafka } = require('kafkajs');
require('dotenv').config();

const kafka = new Kafka({
    clientId: 'course-management-service',
    brokers: [process.env.KAFKA_BROKER],
});

const producer = kafka.producer();

const sendMessage = async (topic, message) => {
    await producer.connect();
    await producer.send({
        topic,
        messages: [{ value: JSON.stringify(message) }],
    });
    await producer.disconnect();
};

module.exports = { sendMessage };

### Consumer Setup
The Course Management Service will consume messages from the following topics:

- `User-Creation`
- `User-Update`
- `Assessment-Creation`
- `Submission-Completed`
- `Grading-Completed`
- `Transcoding-Completed`

#### Consumer Code Example
// src/utils/kafka.js
const { Kafka } = require('kafkajs');
require('dotenv').config();

const kafka = new Kafka({
    clientId: 'course-management-service',
    brokers: [process.env.KAFKA_BROKER],
});

const consumer = kafka.consumer({ groupId: 'course-management-group' });

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

module.exports = { consumeMessages };

## Message Handling

### Handling Produced Messages

The Course Management Service will produce messages when a new course or module is created, updated, or deleted, and when a student is enrolled in a course.

#### Handling Produced Messages Code Example

const Course = require('../models/course');
const axios = require('axios');
const kafka = require('../utils/kafka');

module.exports = async (courseData, instructorId) => {
    // Validate instructor
    try {
        const userResponse = await axios.get(
            `${process.env.USER_MANAGEMENT_SERVICE_URL}/validate`,
            {
                headers: { Authorization: `Bearer ${instructorId}` },
            }
        );

        if (
            !userResponse.data.valid ||
            userResponse.data.role !== 'instructor'
        ) {
            throw new Error('Unauthorized');
        }
    } catch (error) {
        throw new Error('User validation failed');
    }

    // Create course
    const course = new Course({ ...courseData, instructor: instructorId });
    await course.save();

    // Send Kafka message
    kafka.sendMessage('Course-Creation', { courseId: course._id, courseData });

    return course;
};

### Handling Consumed Messages

The Course Management Service will consume messages from other services and handle them accordingly.


#### Handling Consumed Messages Code Example

const { consumeMessages } = require('./utils/kafka');

const handleMessage = (topic, message) => {
    switch (topic) {
        case 'User-Creation':
            // Handle user creation logic
            break;
        case 'User-Update':
            // Handle user update logic
            break;
        case 'Assessment-Creation':
            // Handle assessment creation logic
            break;
        case 'Submission-Completed':
            // Handle submission completed logic
            break;
        case 'Grading-Completed':
            // Handle grading completed logic
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
    'Assessment-Creation',
    'Submission-Completed',
    'Grading-Completed',
    'Transcoding-Completed',
], handleMessage);