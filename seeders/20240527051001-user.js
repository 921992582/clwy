'use strict';
const bcrypt = require('bcryptjs');
const moment = require('moment/moment');
const { Op } = require('sequelize');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const users = [
      {
        email: 'admin@clwy.cn',
        username: 'admin',
        password: bcrypt.hashSync('123123', 10),
        nickname: '超厉害的管理员',
        sex: 2,
        role: 100,
        membershipExpiredAt: moment().add(1, 'year').toDate(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        email: 'user1@clwy.cn',
        username: 'user1',
        password: bcrypt.hashSync('123123', 10),
        nickname: '普通用户1',
        sex: 0,
        role: 0,
        membershipExpiredAt: moment().add(1, 'year').toDate(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        email: 'user2@clwy.cn',
        username: 'user2',
        password: bcrypt.hashSync('123123', 10),
        nickname: '普通用户2',
        sex: 0,
        role: 0,
        membershipExpiredAt: moment().add(1, 'year').toDate(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        email: 'user3@clwy.cn',
        username: 'user3',
        password: bcrypt.hashSync('123123', 10),
        nickname: '普通用户3',
        sex: 1,
        role: 1,
        membershipExpiredAt: moment().add(1, 'year').toDate(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    for (const user of users) {
      const existingUser = await queryInterface.rawSelect(
        'Users',
        {
          where: {
            email: user.email,
          },
        },
        ['id']
      );

      if (!existingUser) {
        await queryInterface.insert('Users', user);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', null, {});
  },
};
