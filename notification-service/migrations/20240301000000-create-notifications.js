'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('Notifications', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            userId: {
                type: Sequelize.STRING,
                allowNull: false,
                index: true,
            },
            type: {
                type: Sequelize.ENUM('EMAIL', 'PUSH', 'SMS'),
                allowNull: false,
            },
            status: {
                type: Sequelize.ENUM('PENDING', 'SENT', 'FAILED'),
                defaultValue: 'PENDING',
                allowNull: false,
            },
            title: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            message: {
                type: Sequelize.TEXT,
                allowNull: false,
            },
            metadata: {
                type: Sequelize.JSONB,
                defaultValue: {},
            },
            retryCount: {
                type: Sequelize.INTEGER,
                defaultValue: 0,
            },
            lastRetryAt: {
                type: Sequelize.DATE,
            },
            error: {
                type: Sequelize.TEXT,
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
        });

        // Add indexes for better query performance
        await queryInterface.addIndex(
            'Notifications',
            ['userId', 'status', 'createdAt'],
            {
                name: 'notifications_user_status_date',
            }
        );

        await queryInterface.addIndex(
            'Notifications',
            ['type', 'status', 'createdAt'],
            {
                name: 'notifications_type_status_date',
            }
        );
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('Notifications');
    },
};
